from django.core.exceptions import ValidationError
from django.db import models

from .imaging import VarianteWebMixin
from django.utils.text import slugify



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
                "attendus par la page d'accueil, qui porte leur photo. Ils "
                "se renomment, ils ne se suppriment pas." % ', '.join(verrouilles)
            )
        return super().delete(*args, **kwargs)

    def par_rang(self):
        """Les cinq rayons dans l'ordre du menu, puis tout le reste par nom.

        Remplace le champ `order`, retiré à la demande : l'ordre des rayons de
        la maison est celui de `Category.SLUGS_STRUCTURELS` — le même que la
        grille de la page d'accueil —, et une catégorie ajoutée se range par
        son nom.
        """
        rangs = [
            models.When(slug=slug, then=models.Value(i))
            for i, slug in enumerate(Category.SLUGS_STRUCTURELS)
        ]
        rang = models.Case(
            *rangs,
            default=models.Value(len(rangs)),
            output_field=models.IntegerField(),
        )
        return self.annotate(rang=rang).order_by('rang', 'name')


class Category(models.Model):
    """Une catégorie de pièces : un rayon principal, ou la sous-catégorie d'un
    rayon principal — un seul niveau.

    À la demande, une catégorie ne porte plus que son nom et son parent : la
    photo, la description, le statut « actif » et l'ordre d'affichage ont été
    retirés (migration 0030). On ne masque plus une catégorie : si elle ne sert
    plus, on la supprime. L'ordre vient de `CategorieQuerySet.par_rang`.
    """

    #: Les cinq rayons de la maison. Ils existent toujours : la grille de la
    #: page d'accueil est bâtie sur cette liste côté frontend
    #: (frontend/src/constants/rayons.js), qui porte aussi leur photo.
    #:
    #: Le NOM reste librement modifiable — c'est la seule chose que le frontend
    #: lise encore de la base pour ces rayons, avec le nombre de pièces. Le
    #: SLUG, lui, est la clé qui relie un rayon à sa photo : le changer casse
    #: le lien, il est donc verrouillé en admin.
    #:
    #: Un tuple et non un ensemble : son ordre EST l'ordre du menu.
    SLUGS_STRUCTURELS = ('boubous', 'chaussures', 'sacs', 'bijoux', 'cosmetique')

    objects = CategorieQuerySet.as_manager()

    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    #: Vide pour une catégorie principale. CASCADE : supprimer une catégorie
    #: emporte ses sous-catégories — et échoue en entier (ProtectedError) si
    #: l'une d'elles range encore des pièces, `Product.category` étant en
    #: PROTECT.
    parent = models.ForeignKey(
        'self', on_delete=models.CASCADE, null=True, blank=True,
        related_name='sous_categories', verbose_name='Catégorie parente',
    )

    class Meta:
        verbose_name = 'Catégorie'
        verbose_name_plural = 'Catégories'
        ordering = ['name']

    def __str__(self):
        return self.name

    @property
    def est_structurelle(self):
        return self.slug in self.SLUGS_STRUCTURELS

    def verifier_parent(self, parent):
        """Refuse un parent qui casserait l'arbre à un seul niveau.

        Appelée par `clean()` — donc par l'admin — et par le sérialiseur de
        l'Espace Gestion, qui ne passe pas par `clean()`.
        """
        if parent is None:
            return
        if self.pk and parent.pk == self.pk:
            raise ValidationError("Une catégorie ne peut pas être sa propre sous-catégorie.")
        if self.est_structurelle:
            raise ValidationError(
                "Un rayon de la maison reste une catégorie principale : la page "
                "d'accueil l'attend en tête de grille."
            )
        if parent.parent_id:
            raise ValidationError(
                "« %s » est déjà une sous-catégorie : choisissez une catégorie "
                "principale comme parente." % parent.name
            )
        if self.pk and self.sous_categories.exists():
            raise ValidationError(
                "Cette catégorie a ses propres sous-catégories : elle ne peut "
                "pas devenir une sous-catégorie à son tour."
            )

    def clean(self):
        super().clean()
        self.verifier_parent(self.parent)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        if self.est_structurelle:
            raise ValidationError(
                "« %s » est un rayon de la maison : il est attendu par la page "
                "d'accueil, qui porte sa photo. Il se renomme, il ne se "
                "supprime pas." % self.name
            )
        return super().delete(*args, **kwargs)


class Product(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='products')
    description = models.TextField(blank=True)
    # Plus de `video` : la vidéo de produit a été retirée, front et back, à la
    # demande — migration 0028. Une pièce ne se présente que par ses photos.
    price = models.DecimalField(max_digits=10, decimal_places=0)
    old_price = models.DecimalField(max_digits=10, decimal_places=0, null=True, blank=True)
    stock = models.IntegerField(default=0)
    # Plus de `is_active` : la possibilité de masquer une pièce a été retirée à
    # la demande — migration 0029, qui a supprimé les pièces alors masquées.
    # Toute pièce enregistrée est en ligne ; pour la retirer, on la supprime.
    # `is_featured` (« Vedette ») et `is_new` (« Nouveauté ») ont été retirés
    # à la demande — migration 0025.
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
        # On vend des vêtements, pas des plats : payé, livré, reçu — à la
        # demande. Plus d'étape « En préparation » (migration 0031, qui a passé
        # ces commandes à « Payée »). Les clés restent celles d'avant : l'API,
        # le retour PayDunya et l'historique s'en servent.
        ('pending', 'En attente de paiement'),
        ('confirmed', 'Payée'),
        ('shipped', 'En livraison'),
        ('delivered', 'Livrée'),
        ('cancelled', 'Annulée'),
    ]
    #: Tout paiement passe par PayDunya, à la demande : c'est le paiement qui
    #: active la commande, et seul le retour de PayDunya (`paydunya_callback`)
    #: la marque payée. PayDunya propose lui-même carte, Orange Money, Wave et
    #: Free Money sur sa page. Les autres valeurs ne servent plus qu'aux
    #: commandes passées avant ce changement : le tunnel ne les propose plus.
    PAYMENT_CHOICES = [
        ('paydunya', 'PayDunya (carte ou mobile money)'),
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
    payment_method = models.CharField(max_length=20, choices=PAYMENT_CHOICES, default='paydunya')
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
    # Facultatif, et détaché si la pièce est supprimée — à la demande, depuis
    # que les pièces ne se masquent plus : on les supprime, commandées ou non.
    # La ligne garde ce qui a été vendu (`product_name`, `product_price`,
    # `quantity`) : une commande passée reste lisible. PROTECT empêchait de
    # supprimer une pièce déjà commandée.
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True)
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



# Plus de `HeroBanner` (« Bannière Hero ») : retirée à la demande, front et
# back (migration 0032). Plus rien ne la lisait — le hero de l'accueil tient sa
# parole et ses tableaux côté frontend (Hero.jsx, constants/hero.js).


# Plus d'images de l'atelier (`AtelierImage`) : les deux photos du mot de la
# maison sont des fichiers statiques du front, à la demande — migration 0033.


# Les avis clients (`Review` : note, commentaire, photo, modération) ont été
# retirés du site à la demande — migration 0027.


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
    #: Quatre vidéos au plus, à la demande : la section « Aperçu de la
    #: boutique » les aligne toutes sur une ligne. Vérifié à la création
    #: (sérialiseur de gestion, admin) ; l'API publique n'en sert jamais plus.
    MAX = 4

    # Plus de repère interne (`title`) ni de pièce présentée (`product`), à la
    # demande (migration 0035) : ce sont des vidéos de la boutique, qui ne
    # représentent aucun produit, et la place de la tuile suffit à les
    # reconnaître.
    # ── La vidéo : un LIEN, uniquement ─────────────────────────────────────
    # À la demande, plus d'envoi de fichier (migration 0036) : le propriétaire
    # dépose sa vidéo dans Cloudflare et colle ici son adresse publique. Le
    # champ `video` (FileField) a été retiré — ses fichiers déjà publiés ont
    # été convertis en liens par la migration. Il n'arrivait de toute façon
    # pas à passer en production : l'instance Render s'endort au bout de
    # quinze minutes et son proxy ne retient pas des dizaines de mégaoctets.
    video_lien = models.URLField(
        max_length=500,
        verbose_name='Lien de la vidéo',
        help_text="Adresse publique du fichier, déposé sur Cloudflare.",
    )
    # Image affichée avant que la vidéo ne démarre. Sans elle, la tuile reste
    # vide le temps du chargement — très visible sur connexion lente.
    poster = models.ImageField(
        upload_to='videos/posters/', blank=True, null=True,
        verbose_name='Affiche',
        help_text="Image fixe montrée avant lecture. Recommandée : format vertical 9/16.",
    )
    order = models.IntegerField(default=0)
    # Plus de `is_active` : l'option « Visible sur le site » a été retirée à
    # la demande (migration 0034). Toute vidéo enregistrée est en ligne ; pour
    # la retirer, on la supprime.
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Vidéo — Univers visuel'
        verbose_name_plural = 'Vidéos — Univers visuel'
        ordering = ['order', '-created_at']

    def __str__(self):
        return f"Vidéo — place {self.order + 1}"


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


class Coordonnees(models.Model):
    """
    Les coordonnées de la maison — adresse, téléphone, e-mail.

    Le lien WhatsApp du site est fabriqué à partir du même téléphone
    (`whatsapp`) : il n'y a rien de plus à saisir.

    ── Pourquoi une ligne en base ──────────────────────────────────────────────
    Elles vivaient dans une constante du frontend (`constants/contact.js`).
    Changer un numéro demandait donc de toucher au code et de redéployer, ce
    qu'un propriétaire de boutique ne fait pas. Elles se saisissent maintenant
    depuis l'Espace Gestion, et la bande qui coiffe le site les prend sans
    qu'on y touche.

    ── Une seule ligne, jamais zéro ────────────────────────────────────────────
    Ce n'est pas une liste : il n'y a qu'une boutique. `save()` force la clé
    primaire à 1 et la suppression est refusée — un formulaire sans ligne à
    éditer n'aurait rien à afficher. `charger()` crée la ligne à la première
    lecture, avec les valeurs qui étaient écrites en dur : une base neuve
    affiche les bonnes coordonnées avant même que quiconque ouvre le
    formulaire.

    ⚠ Le frontend garde ses constantes comme REPLI : si l'API ne répond pas,
    la bande affiche les valeurs d'origine plutôt qu'un trou.
    """

    ADRESSE_DEFAUT = 'Pikine Tally Boumack'
    TELEPHONE_DEFAUT = '77 751 47 95'
    EMAIL_DEFAUT = 'contact@golden-pousso.com'

    adresse = models.CharField(
        max_length=200, verbose_name='Adresse',
        help_text="Telle qu'elle s'affiche, par exemple « Pikine Tally Boumack ».",
    )
    telephone = models.CharField(
        max_length=40, verbose_name='Téléphone',
        help_text="Dans sa présentation locale, par exemple « 77 751 47 95 ». "
                  "Le lien d'appel est fabriqué à partir de ce numéro.",
    )
    email = models.EmailField(verbose_name='Email')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Coordonnées de la boutique'
        verbose_name_plural = 'Coordonnées de la boutique'

    def __str__(self):
        return f"{self.adresse} — {self.telephone} — {self.email}"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        """Les coordonnées ne se suppriment pas : elles se corrigent."""
        raise ValidationError("Les coordonnées de la boutique ne peuvent pas être supprimées.")

    @classmethod
    def charger(cls):
        ligne, _ = cls.objects.get_or_create(pk=1, defaults={
            'adresse': cls.ADRESSE_DEFAUT,
            'telephone': cls.TELEPHONE_DEFAUT,
            'email': cls.EMAIL_DEFAUT,
        })
        return ligne

    @property
    def telephone_lien(self):
        """Le numéro au format international, seule forme qu'un téléphone
        compose de façon fiable depuis l'étranger.

        Saisi avec son indicatif (« +221 77… »), il est conservé tel quel, sans
        les espaces. Saisi en local (« 77 751 47 95 »), l'indicatif du Sénégal
        est ajouté. Vide ou illisible, pas de lien du tout : mieux vaut un
        numéro qu'on recopie qu'un lien qui compose un mauvais correspondant.
        """
        brut = (self.telephone or '').strip()
        chiffres = ''.join(c for c in brut if c.isdigit())
        if not chiffres:
            return ''
        if brut.startswith('+'):
            return f'+{chiffres}'
        if chiffres.startswith('221'):
            return f'+{chiffres}'
        return f'+221{chiffres}'

    @property
    def whatsapp(self):
        """Le même numéro au format wa.me : international, sans « + » ni espaces.

        WhatsApp est le SEUL support du site (l'icône de la barre de
        navigation, l'entrée du menu mobile, le lien des mentions légales) :
        laisser son numéro dans le code alors que le téléphone se saisit en
        base, c'était garder un numéro qui se périme tout seul. Un seul numéro
        pour les deux — c'est déjà le cas dans la maison, et une boutique qui
        publie deux numéros en fait toujours un de faux.
        """
        return self.telephone_lien.lstrip('+')
