"""Serializers dédiés à l'espace Gestion (back-office) — jamais utilisés par l'API publique."""
from rest_framework import serializers
from django.core.exceptions import ValidationError as DjangoValidationError
from accounts.models import Customer
from .models import (
    Category, Product, ProductImage, ProductVariant,
    Order, ShowcaseVideo, Coordonnees,
)


class GestionCategorySerializer(serializers.ModelSerializer):
    """Nom et parent, à la demande — plus de photo, de description, de statut,
    d'ordre ni de type (`structurel`, retiré à la demande avec la colonne
    « Type » de l'Espace Gestion, qui reconnaît désormais les cinq rayons par
    leur slug). Le verrou des rayons reste, lui, dans le modèle."""

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'parent']
        extra_kwargs = {'slug': {'required': False}}

    def validate(self, attrs):
        # ModelSerializer ne passe pas par Model.clean() : la règle de l'arbre
        # est rejouée ici, sur l'instance modifiée ou une catégorie neuve.
        if 'parent' in attrs:
            categorie = self.instance or Category(name=attrs.get('name', ''))
            try:
                categorie.verifier_parent(attrs['parent'])
            except DjangoValidationError as erreur:
                raise serializers.ValidationError({'parent': erreur.messages})
        return attrs



class GestionProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'product', 'image', 'is_primary', 'order']


class GestionProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ['id', 'product', 'size', 'color', 'stock', 'price_adjustment']


class GestionProductSerializer(serializers.ModelSerializer):
    images = GestionProductImageSerializer(many=True, read_only=True)
    variants = GestionProductVariantSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'category', 'category_name', 'description',
            'price', 'old_price', 'stock',
            'images', 'variants', 'created_at', 'updated_at',
        ]
        extra_kwargs = {'slug': {'required': False}}


class GestionOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order._meta.get_field('items').related_model
        fields = ['id', 'product', 'variant', 'product_name', 'product_price', 'quantity', 'line_total']


class GestionOrderSerializer(serializers.ModelSerializer):
    items = GestionOrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'status', 'customer_name', 'customer_phone', 'customer_email',
            'delivery_address', 'delivery_zone', 'delivery_fee', 'subtotal', 'total',
            'payment_method', 'payment_status', 'notes', 'items', 'created_at', 'updated_at',
        ]
        # Seul le statut se modifie. Le paiement n'est plus modifiable à la
        # main, à la demande : seul le retour de PayDunya le marque payé.
        read_only_fields = [f for f in fields if f != 'status']

    def validate_status(self, valeur):
        """Une commande payée ne revient jamais « En attente ».

        L'Espace Gestion ne liste que des commandes payées (voir la vue), que
        le retour de PayDunya a déjà passées « Payée ». « En attente »
        voulait dire « en attente de paiement » : il n'a plus de sens ici.
        """
        if valeur == 'pending':
            raise serializers.ValidationError(
                "Une commande payée ne peut pas revenir « En attente »."
            )
        return valeur


# Plus de sérialiseurs pour les messages de contact ni pour les alertes de
# réassort : leurs pages de l'Espace Gestion ont été supprimées à la demande.


class GestionShowcaseVideoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShowcaseVideo
        # Plus de `video` ni de `video_cle` : une vidéo se fournit par son
        # lien Cloudflare uniquement, à la demande.
        fields = ['id', 'video_lien', 'poster', 'order', 'created_at']

    def validate(self, attrs):
        if self.instance is None and ShowcaseVideo.objects.count() >= ShowcaseVideo.MAX:
            # Quatre au plus, à la demande : la section d'accueil les aligne
            # toutes sur une ligne.
            raise serializers.ValidationError(
                f"{ShowcaseVideo.MAX} vidéos au maximum : supprimez-en une "
                "pour en ajouter une autre."
            )
        return attrs

    def validate_video_lien(self, valeur):
        """Une adresse que le navigateur saura lire, et rien d'autre.

        Le champ est rempli à la main, en collant depuis le tableau de bord
        Cloudflare : c'est exactement le geste où l'on colle une ligne de trop
        ou l'adresse de la page au lieu de celle du fichier. Un `http://` seul
        casserait par ailleurs la lecture, le site étant servi en HTTPS — le
        navigateur bloque le contenu mixte sans rien dire.
        """
        valeur = (valeur or '').strip()
        if not valeur.startswith('https://'):
            raise serializers.ValidationError(
                "Le lien doit commencer par https:// — une adresse en http "
                "serait bloquée par le navigateur."
            )
        return valeur


# ── Clients ──

class GestionCustomerSerializer(serializers.ModelSerializer):
    """Un compte utilisateur : identité, type (client ou admin, `is_staff`) et
    état (`is_active` — un compte désactivé ne peut plus se connecter, et ses
    jetons déjà délivrés sont refusés).

    Plus de nombre de commandes ni de total dépensé, à la demande — retirés
    avec leurs colonnes de la page « Comptes utilisateurs ».

    ── Un compte se crée et se modifie ici, à la demande ───────────────────────
    L'identité (prénom, nom, téléphone, e-mail) était en lecture seule : un
    compte ne pouvait naître que sur le site, par l'inscription. L'Espace
    Gestion le crée maintenant lui-même — c'est ainsi qu'on ouvre l'accès à un
    second admin sans passer par `createsuperuser`.

    ⚠ **Le téléphone est l'identifiant de connexion** (`/auth/login/` cherche le
    compte par son numéro) : il ne peut donc pas être partagé, et il est repris
    dans `username`, comme le fait l'inscription du site. Un numéro changé ici
    change le numéro de connexion.

    Le mot de passe s'écrit, ne se lit jamais : obligatoire à la création,
    facultatif ensuite — laissé vide, il n'est pas touché. C'est le seul moyen
    de dépanner un client qui a perdu le sien, le site n'ayant pas de
    réinitialisation par e-mail.
    """

    password = serializers.CharField(
        write_only=True, required=False, allow_blank=True, min_length=6,
        style={'input_type': 'password'},
    )

    class Meta:
        model = Customer
        fields = ['id', 'first_name', 'last_name', 'phone', 'email',
                  'is_staff', 'is_active', 'date_joined', 'password']
        read_only_fields = ['id', 'date_joined']
        extra_kwargs = {
            # Un compte sans nom ni numéro ne se reconnaît dans aucune liste,
            # et ne peut pas se connecter.
            'first_name': {'required': True, 'allow_blank': False},
            'phone': {'required': True, 'allow_blank': False},
            'email': {'required': False, 'allow_blank': True},
        }

    def validate_phone(self, valeur):
        valeur = valeur.strip()
        autres = Customer.objects.all()
        if self.instance:
            autres = autres.exclude(pk=self.instance.pk)
        if autres.filter(phone=valeur).exists():
            raise serializers.ValidationError('Ce numéro est déjà associé à un compte.')
        return valeur

    def validate(self, attrs):
        if self.instance is None and not attrs.get('password'):
            raise serializers.ValidationError(
                {'password': 'Un mot de passe est requis pour créer un compte.'})
        return attrs

    @staticmethod
    def _identifiant(telephone, pk=None):
        """Le `username` tiré du numéro : ses seuls chiffres et lettres.

        Django n'accepte pas d'espace dans un `username` — le numéro s'écrit
        « 77 751 47 95 ». Le téléphone, lui, est conservé tel qu'il est saisi :
        c'est ce que le client retapera pour se connecter, et l'inscription du
        site le garde déjà ainsi.

        Deux présentations d'un même numéro donneraient le même identifiant :
        un suffixe est ajouté plutôt que de laisser la base refuser
        l'enregistrement par une erreur 500.
        """
        base = ''.join(c for c in telephone if c.isalnum()) or 'compte'
        autres = Customer.objects.exclude(pk=pk) if pk else Customer.objects.all()
        candidat, rang = base, 1
        while autres.filter(username=candidat).exists():
            rang += 1
            candidat = f'{base}-{rang}'
        return candidat

    def create(self, validated_data):
        mot_de_passe = validated_data.pop('password')
        identifiant = self._identifiant(validated_data['phone'])
        # Comme l'inscription du site (`RegisterSerializer`) : un e-mail interne
        # tient lieu de valeur par défaut — Django en attend un, le site n'en
        # demande pas.
        validated_data['email'] = validated_data.get('email') or f'{identifiant}@goldenpousso.local'
        utilisateur = Customer(username=identifiant, **validated_data)
        utilisateur.set_password(mot_de_passe)
        utilisateur.save()
        return utilisateur

    def update(self, instance, validated_data):
        mot_de_passe = validated_data.pop('password', '')
        ancien_telephone = instance.phone
        utilisateur = super().update(instance, validated_data)

        champs = []
        # Le `username` suit le numéro — mais seulement s'il le suivait déjà :
        # un compte créé par `createsuperuser` porte un nom choisi à la main,
        # qu'on ne va pas remplacer dans son dos.
        ancienne_base = ''.join(c for c in ancien_telephone if c.isalnum())
        suivait = utilisateur.username in (ancien_telephone, ancienne_base) or (
            ancienne_base and utilisateur.username.split('-')[0] == ancienne_base)
        if utilisateur.phone != ancien_telephone and ancien_telephone and suivait:
            utilisateur.username = self._identifiant(utilisateur.phone, pk=utilisateur.pk)
            champs.append('username')

        if mot_de_passe:
            utilisateur.set_password(mot_de_passe)
            champs.append('password')

        if champs:
            utilisateur.save(update_fields=champs)
        return utilisateur


class GestionCoordonneesSerializer(serializers.ModelSerializer):
    """Les trois coordonnées de la boutique, saisies dans l'Espace Gestion.

    Les trois champs sont obligatoires : une bande à laquelle il manque le
    téléphone ou l'adresse laisse un libellé sans valeur. `telephone_lien` est
    renvoyé pour que le formulaire montre le lien d'appel qu'il fabrique — il
    ne se saisit pas.
    """
    telephone_lien = serializers.CharField(read_only=True)
    whatsapp = serializers.CharField(read_only=True)

    class Meta:
        model = Coordonnees
        fields = ['adresse', 'telephone', 'telephone_lien', 'whatsapp', 'email', 'updated_at']
        read_only_fields = ['updated_at']
        extra_kwargs = {
            'adresse': {'allow_blank': False},
            'telephone': {'allow_blank': False},
        }

    def validate_telephone(self, valeur):
        if not any(c.isdigit() for c in valeur):
            raise serializers.ValidationError("Un numéro de téléphone contient des chiffres.")
        return valeur.strip()
