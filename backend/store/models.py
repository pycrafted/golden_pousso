from django.core.exceptions import ValidationError
from django.db import models

from .imaging import VarianteWebMixin
from django.utils.text import slugify

from goldenpousso_backend.video_storage import video_storage


class CategorieQuerySet(models.QuerySet):
    """Refuse la suppression en masse d'un rayon structurel.

    Le garde-fou doit vivre ICI et pas seulement sur le modèle : un
    `Category.objects.filter(...).delete()` ne passe jamais par
    `Model.delete()`, il émet un DELETE en base directement. Sans cette
    surcharge, l'action « supprimer les objets sélectionnés » de l'admin
    contournerait la protection sans rien signaler.
    """

    def delete(self, *args, **kwargs):
        verrouilles = [c.slug for c in self if c.est_structurelle]
        if verrouilles:
            raise ValidationError(
                "Rayons structurels, suppression refusée : %s. Ils sont "
                "attendus par la page d'accueil, qui porte leur photo et leur "
                "ordre. Pour en retirer un de l'affichage, décocher « actif » "
                "plutôt que le supprimer." % ', '.join(verrouilles)
            )
        return super().delete(*args, **kwargs)


class Category(VarianteWebMixin):
    SOURCE_IMAGE = 'image'
    DOSSIER_WEB = 'categories/web'

    #: Les cinq rayons de la maison. Ils existent toujours : la grille de la
    #: page d'accueil est bâtie sur cette liste côté frontend
    #: (frontend/src/constants/rayons.js), qui porte aussi leur photo.
    #:
    #: Le NOM reste librement modifiable — c'est la seule chose que le frontend
    #: lise encore de la base pour ces rayons, avec le nombre de pièces. Le
    #: SLUG, lui, est la clé qui relie un rayon à sa photo : le changer casse
    #: le lien, il est donc verrouillé en admin.
    SLUGS_STRUCTURELS = frozenset({
        'boubous', 'chaussures', 'sacs', 'bijoux', 'cosmetique',
    })

    objects = CategorieQuerySet.as_manager()

    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)

    class Meta:
        verbose_name = 'Catégorie'
        verbose_name_plural = 'Catégories'
        ordering = ['order', 'name']

    def __str__(self):
        return self.name

    @property
    def est_structurelle(self):
        return self.slug in self.SLUGS_STRUCTURELS

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        if self.est_structurelle:
            raise ValidationError(
                "Rayon structurel, suppression refusée : %s. Il est attendu "
                "par la page d'accueil, qui porte sa photo et son ordre. Pour "
                "le retirer de l'affichage, décocher « actif » plutôt que le "
                "supprimer." % self.slug
            )
        return super().delete(*args, **kwargs)


class Product(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='products')
    description = models.TextField(blank=True)
    video = models.FileField(
        upload_to='products/videos/', storage=video_storage, blank=True, null=True,
        verbose_name='Vidéo du produit',
        help_text="Optionnel. Si une vidéo est envoyée, c'est elle qui s'affiche sur la carte "
                  "produit, à la place de la photo. Les photos restent visibles sur la fiche produit.",
    )
    price = models.DecimalField(max_digits=10, decimal_places=0)
    old_price = models.DecimalField(max_digits=10, decimal_places=0, null=True, blank=True)
    stock = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    is_new = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Produit'
        verbose_name_plural = 'Produits'
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        was_out_of_stock = False
        if self.pk:
            was_out_of_stock = Product.objects.filter(pk=self.pk, stock=0).exists()
        super().save(*args, **kwargs)
        if was_out_of_stock and self.stock > 0:
            from .emails import send_stock_alert_emails
            send_stock_alert_emails(self)

    @property
    def video_url(self):
        return self.video.url if self.video else None

    @property
    def primary_image(self):
        img = self.images.filter(is_primary=True).first()
        if not img:
            img = self.images.first()
        return img.image.url if img else None

    @property
    def discount_percent(self):
        if self.old_price and self.old_price > self.price:
            return int(((self.old_price - self.price) / self.old_price) * 100)
        return None


class ProductImage(VarianteWebMixin):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    DOSSIER_WEB = 'products/web'

    image = models.ImageField(upload_to='products/', verbose_name='Photo (original)')
    alt_text = models.CharField(max_length=200, blank=True)
    is_primary = models.BooleanField(default=False)
    order = models.IntegerField(default=0)

    class Meta:
        verbose_name = 'Image produit'
        verbose_name_plural = 'Images produit'
        ordering = ['order']

    def __str__(self):
        return f"Image de {self.product.name}"



class ProductVariant(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    size = models.CharField(max_length=20, blank=True, null=True)
    color = models.CharField(max_length=50, blank=True, null=True)
    stock = models.IntegerField(default=0)
    price_adjustment = models.DecimalField(max_digits=10, decimal_places=0, default=0)

    class Meta:
        verbose_name = 'Variante'
        verbose_name_plural = 'Variantes'

    def __str__(self):
        parts = [self.product.name]
        if self.size:
            parts.append(f"Taille: {self.size}")
        if self.color:
            parts.append(f"Couleur: {self.color}")
        return ' — '.join(parts)


# ─────────────────────────────────────────
# Commandes
# ─────────────────────────────────────────

class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('confirmed', 'Confirmée'),
        ('processing', 'En préparation'),
        ('shipped', 'Expédiée'),
        ('delivered', 'Livrée'),
        ('cancelled', 'Annulée'),
    ]
    PAYMENT_CHOICES = [
        ('orange_money', 'Orange Money'),
        ('wave', 'Wave'),
        ('free_money', 'Free Money'),
        ('cash_on_delivery', 'Paiement à la livraison'),
        ('card', 'Carte bancaire'),
    ]
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('paid', 'Payé'),
        ('failed', 'Échoué'),
    ]
    DELIVERY_ZONE_CHOICES = [
        ('dakar_centre', 'Dakar Centre'),
        ('dakar_banlieue', 'Dakar Banlieue / Pikine'),
        ('thies', 'Thiès et environs'),
        ('pickup', 'Retrait en boutique'),
    ]

    order_number = models.CharField(max_length=20, unique=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    customer_name = models.CharField(max_length=200)
    customer_phone = models.CharField(max_length=20)
    customer_email = models.EmailField(blank=True)
    delivery_address = models.TextField(blank=True)
    delivery_zone = models.CharField(max_length=20, choices=DELIVERY_ZONE_CHOICES, default='dakar_centre')
    delivery_fee = models.DecimalField(max_digits=10, decimal_places=0, default=0)
    subtotal = models.DecimalField(max_digits=10, decimal_places=0)
    total = models.DecimalField(max_digits=10, decimal_places=0)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_CHOICES, default='cash_on_delivery')
    payment_status = models.CharField(max_length=10, choices=PAYMENT_STATUS_CHOICES, default='pending')
    paydunya_token = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    DELIVERY_FEES = {
        'dakar_centre': 1500,
        'dakar_banlieue': 1000,
        'thies': 3000,
        'pickup': 0,
    }

    class Meta:
        verbose_name = 'Commande'
        verbose_name_plural = 'Commandes'
        ordering = ['-created_at']

    def __str__(self):
        return self.order_number

    def save(self, *args, **kwargs):
        if not self.order_number:
            import datetime
            year = datetime.date.today().year
            last = Order.objects.filter(order_number__startswith=f'GP-{year}-').count()
            self.order_number = f'GP-{year}-{str(last + 1).zfill(5)}'
        super().save(*args, **kwargs)


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    variant = models.ForeignKey(ProductVariant, on_delete=models.SET_NULL, null=True, blank=True)
    product_name = models.CharField(max_length=200)
    product_price = models.DecimalField(max_digits=10, decimal_places=0)
    quantity = models.IntegerField()
    line_total = models.DecimalField(max_digits=10, decimal_places=0)

    class Meta:
        verbose_name = 'Article commandé'
        verbose_name_plural = 'Articles commandés'

    def __str__(self):
        return f"{self.quantity}x {self.product_name} (Commande {self.order.order_number})"



class HeroBanner(VarianteWebMixin):
    SOURCE_IMAGE = 'image'
    DOSSIER_WEB = 'hero/web'

    image = models.ImageField(upload_to='hero/')
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Bannière Hero'
        verbose_name_plural = 'Bannières Hero'

    def __str__(self):
        return f"Hero {'(actif)' if self.is_active else '(inactif)'} — {self.updated_at.strftime('%d/%m/%Y') if self.updated_at else ''}"

    def save(self, *args, **kwargs):
        if self.is_active:
            HeroBanner.objects.exclude(pk=self.pk).update(is_active=False)
        super().save(*args, **kwargs)


class AtelierImage(VarianteWebMixin):
    SOURCE_IMAGE = 'image'
    DOSSIER_WEB = 'atelier/web'

    EMPLACEMENTS = [
        ('apropos',   'Page À propos — section « Notre Histoire »'),
        ('accueil',   'Page d’accueil — section « Notre savoir-faire »'),
        ('promotion', 'Page d’accueil — fond de la bande promotionnelle'),
    ]

    image = models.ImageField(upload_to='atelier/')
    # Deux endroits du site montrent l'atelier, avec des besoins différents :
    # une seule photo sur À propos, deux en paire décalée sur l'accueil. Sans
    # ce champ, les deux emplacements puisaient dans le même tas et on ne
    # pouvait pas choisir laquelle allait où.
    emplacement = models.CharField(
        max_length=10, choices=EMPLACEMENTS, default='apropos',
        verbose_name='Emplacement',
    )
    is_active = models.BooleanField(default=True, verbose_name='Affichée')
    order = models.IntegerField(
        default=0, verbose_name='Ordre',
        help_text="Ordre d’affichage à l’intérieur de l’emplacement choisi.",
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Image Atelier'
        verbose_name_plural = 'Images Atelier'
        ordering = ['order', '-updated_at']

    def __str__(self):
        return f"Atelier — {self.get_emplacement_display()}"


class Review(models.Model):
    RATING_CHOICES = [(i, str(i)) for i in range(1, 6)]

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    customer = models.ForeignKey('accounts.Customer', on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveSmallIntegerField(choices=RATING_CHOICES)
    comment = models.TextField()
    photo = models.ImageField(upload_to='reviews/', blank=True, null=True)
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Avis client'
        verbose_name_plural = 'Avis clients'
        ordering = ['-created_at']
        unique_together = [('product', 'customer')]

    def __str__(self):
        return f"{self.customer} — {self.product.name} ({self.rating}★)"


class StockAlert(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stock_alerts')
    email = models.EmailField()
    notified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Alerte de réassort'
        verbose_name_plural = 'Alertes de réassort'
        ordering = ['-created_at']
        unique_together = [('product', 'email')]

    def __str__(self):
        return f"{self.email} — {self.product.name}"


class ShowcaseVideo(models.Model):
    title = models.CharField(max_length=200, blank=True, help_text="Repère interne, non affiché sur le site")
    # ── Deux façons de fournir la séquence ────────────────────────────────
    # Un LIEN, ou un FICHIER. Le lien passe en premier quand les deux sont là.
    #
    # Le lien est la voie normale en production : le propriétaire dépose sa
    # vidéo dans Cloudflare depuis son navigateur et colle l'adresse ici. Le
    # fichier ne traverse alors jamais notre serveur — ce qu'il n'arrivait de
    # toute façon pas à faire, l'instance Render s'endormant au bout de quinze
    # minutes et son proxy ne retenant pas des dizaines de mégaoctets le temps
    # du réveil.
    video_lien = models.URLField(
        max_length=500, blank=True,
        verbose_name='Lien de la vidéo',
        help_text="Adresse publique du fichier, déposé sur Cloudflare. "
                  "C'est la façon recommandée : rien ne transite par le site.",
    )
    # L'envoi de fichier reste en place — c'est ce qui sert en développement,
    # et les séquences déjà publiées ainsi continuent de fonctionner.
    #
    # `storage=video_storage` comme `Product.video` : sans lui, la séquence
    # partait sur le stockage PAR DÉFAUT, qui n'est pas celui des vidéos.
    # En développement, R2 configuré, cela voulait dire le disque local — d'où
    # des vidéos qui marchaient en local et nulle part ailleurs.
    video = models.FileField(upload_to='videos/', storage=video_storage, blank=True)
    # Image affichée avant que la vidéo ne démarre. Sans elle, la tuile reste
    # vide le temps du chargement — très visible sur connexion lente.
    poster = models.ImageField(
        upload_to='videos/posters/', blank=True, null=True,
        verbose_name='Affiche',
        help_text="Image fixe montrée avant lecture. Recommandée : format vertical 9/16.",
    )
    # Facultatif : rattache la séquence à une pièce du catalogue. Quand il est
    # renseigné, une carte cliquable (photo, nom, prix) s'affiche en pied de
    # tuile sur la page d'accueil — la vidéo montre, la carte vend.
    product = models.ForeignKey(
        'Product', on_delete=models.SET_NULL, blank=True, null=True,
        related_name='showcase_videos',
        verbose_name='Pièce présentée',
        help_text="Facultatif. Affiche une carte produit cliquable sur la vidéo.",
    )
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Vidéo — Univers visuel'
        verbose_name_plural = 'Vidéos — Univers visuel'
        ordering = ['order', '-created_at']

    def __str__(self):
        return self.title or f"Vidéo #{self.pk}"


class SectionTexte(models.Model):
    """
    Les intitulés des sections du site, modifiables sans toucher au code.

    Chaque section porte une `cle` technique que le frontend interroge. Si la
    clé n'existe pas en base, le composant retombe sur le texte écrit en dur :
    une section ne disparaît jamais parce qu'une ligne manque ici.

    Les clés ne sont pas modifiables depuis l'admin — les changer casserait le
    lien avec le composant qui les lit.
    """

    cle = models.SlugField(
        max_length=60, unique=True, verbose_name='Clé technique',
        help_text="Ne pas modifier : c'est ce qui relie le texte à sa section.",
    )
    zone = models.CharField(
        max_length=120, verbose_name='Emplacement',
        help_text="Où ce texte apparaît, en clair.",
    )
    surtitre = models.CharField(
        max_length=120, blank=True, verbose_name='Sur-titre',
        help_text="La petite ligne au-dessus du titre. Laisser vide s'il n'y en a pas.",
    )
    titre = models.CharField(max_length=200, verbose_name='Titre')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Titre de section'
        verbose_name_plural = 'Titres de sections'
        ordering = ['zone']

    def __str__(self):
        return f"{self.zone} — {self.titre}"


class ContactMessage(models.Model):
    name = models.CharField(max_length=100, verbose_name='Nom')
    contact = models.CharField(max_length=200, verbose_name='Email / Téléphone')
    subject = models.CharField(max_length=200, verbose_name='Sujet')
    message = models.TextField(verbose_name='Message')
    is_read = models.BooleanField(default=False, verbose_name='Lu')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Message de contact'
        verbose_name_plural = 'Messages de contact'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} — {self.subject}"


class HeroPromotion(models.Model):
    """Une campagne affichée dans le hero, à la place du message d'accueil.

    ── Pourquoi ce modèle existe ───────────────────────────────────────────────
    L'offre vivait dans deux constantes en tête de `Hero.jsx`. Changer une date
    ou un pourcentage demandait donc de toucher au code et de redéployer, ce
    qu'un propriétaire de boutique ne fait pas. Une promotion se programme
    maintenant depuis l'admin, et le hero la prend sans qu'on y touche.

    ── Ce que le hero affiche par défaut ───────────────────────────────────────
    Aucune promotion en cours : le hero montre son message d'accueil. Ce
    message est écrit dans le frontend et n'a pas besoin d'être ici — il ne
    change pas d'une saison à l'autre, contrairement à une campagne.

    ── La fenêtre de diffusion ─────────────────────────────────────────────────
    `debut` et `fin` sont des dates, pas des cases à cocher : c'est ce qui
    permet de PROGRAMMER une campagne à l'avance et de l'oublier. Passée `fin`,
    le hero revient seul à l'accueil — personne n'a à débrancher quoi que ce
    soit le lendemain de la Tabaski.

    `fin` est incluse : une promotion qui finit le 31 mai court jusqu'au bout
    du 31 mai.
    """

    titre = models.CharField(
        max_length=60, verbose_name='Titre',
        help_text="Le grand mot en tête, par exemple « Promotion ».",
    )
    offre = models.CharField(
        max_length=80, verbose_name='Occasion',
        help_text="Ce qui motive l'offre, par exemple « Bientôt la Tabaski ».",
    )
    accroche = models.CharField(
        max_length=80, verbose_name='Offre',
        help_text="Le rabais lui-même, par exemple « −15 % sur tous nos articles ».",
    )
    lien = models.CharField(
        max_length=200, default='/recherche', verbose_name='Destination du bouton',
        help_text="Chemin interne. « /recherche » pour toute la boutique, "
                  "« /categorie/boubous » pour un seul rayon.",
    )
    libelle_lien = models.CharField(
        max_length=40, default='Voir la boutique', verbose_name='Texte du bouton',
    )
    debut = models.DateField(
        verbose_name='Début', help_text="Premier jour d'affichage.",
    )
    fin = models.DateField(
        verbose_name='Fin', help_text="Dernier jour d'affichage, inclus.",
    )
    is_active = models.BooleanField(
        default=True, verbose_name='Activée',
        help_text="Décocher suspend la campagne sans la supprimer.",
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Promotion du hero'
        verbose_name_plural = 'Promotions du hero'
        ordering = ['-debut']

    def __str__(self):
        return f"{self.offre} ({self.debut:%d/%m/%Y} → {self.fin:%d/%m/%Y})"

    def clean(self):
        if self.debut and self.fin and self.fin < self.debut:
            raise ValidationError({'fin': "La fin ne peut pas précéder le début."})

    @classmethod
    def en_cours(cls):
        """La campagne du jour, ou None.

        `first()` sur un tri par début décroissant : si deux campagnes se
        chevauchent — ce que rien n'interdit — c'est la plus récemment
        commencée qui l'emporte. Une seule peut s'afficher, il faut donc une
        règle, et celle-ci est la moins surprenante.
        """
        from django.utils import timezone
        aujourd_hui = timezone.localdate()
        return (cls.objects
                .filter(is_active=True, debut__lte=aujourd_hui, fin__gte=aujourd_hui)
                .order_by('-debut')
                .first())
