"""Serializers dédiés à l'espace Gestion (back-office) — jamais utilisés par l'API publique."""
from rest_framework import serializers
from django.db.models import Sum
from accounts.models import Customer
from .models import (
    Category, Product, ProductImage, ProductVariant,
    Order, Review, ContactMessage, StockAlert, HeroBanner, AtelierImage, ShowcaseVideo,
)


class GestionCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'image', 'is_active', 'order']
        extra_kwargs = {'slug': {'required': False}}



class GestionProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'product', 'image', 'alt_text', 'is_primary', 'order']


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
            'price', 'old_price', 'stock', 'is_active', 'is_featured', 'is_new',
            'video', 'images', 'variants', 'created_at', 'updated_at',
        ]
        extra_kwargs = {'slug': {'required': False}, 'video': {'required': False}}


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
        read_only_fields = [f for f in fields if f not in ('status', 'payment_status')]


class GestionReviewSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    customer_name = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = ['id', 'product', 'product_name', 'customer_name', 'rating', 'comment', 'photo', 'is_approved', 'created_at']
        read_only_fields = ['id', 'product', 'product_name', 'customer_name', 'rating', 'comment', 'photo', 'created_at']

    def get_customer_name(self, obj):
        return obj.customer.get_full_name() or obj.customer.first_name or obj.customer.phone


class GestionContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ['id', 'name', 'contact', 'subject', 'message', 'is_read', 'created_at']
        read_only_fields = ['id', 'name', 'contact', 'subject', 'message', 'created_at']


class GestionStockAlertSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = StockAlert
        fields = ['id', 'product', 'product_name', 'email', 'notified', 'created_at']


class GestionHeroBannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = HeroBanner
        fields = ['id', 'image', 'is_active', 'updated_at']


class GestionAtelierImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AtelierImage
        fields = ['id', 'image', 'emplacement', 'is_active', 'order', 'updated_at']


class GestionShowcaseVideoSerializer(serializers.ModelSerializer):
    #: Clé d'un objet déjà déposé sur R2 par le navigateur, via l'URL signée de
    #: `lien-envoi`. Le fichier ne transite alors PAS par le serveur : on ne
    #: reçoit ici que son emplacement. Voir la vue pour le pourquoi.
    video_cle = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = ShowcaseVideo
        fields = ['id', 'title', 'video', 'video_lien', 'video_cle', 'poster', 'product', 'order', 'is_active', 'created_at']
        # Facultatif pour pouvoir MODIFIER un titre ou un ordre sans renvoyer
        # le fichier, qui pèse des dizaines de mégaoctets. Voir `validate` :
        # à la CRÉATION, il redevient obligatoire.
        extra_kwargs = {'video': {'required': False}}

    def validate(self, attrs):
        """Une séquence sans fichier n'est pas une séquence.

        `required: False` ci-dessus ne devait servir qu'aux modifications. À la
        création, il laissait enregistrer une ligne vide : elle apparaissait
        « Visible » dans l'Espace Gestion et produisait une tuile blanche sur
        la page d'accueil, sans que rien n'indique ce qui manquait. C'est
        exactement ce qui est arrivé en production.
        """
        fourni = attrs.get('video') or attrs.get('video_cle') or attrs.get('video_lien')
        if self.instance is None and not fourni:
            raise serializers.ValidationError({
                'video_lien': "Collez le lien de la vidéo, ou choisissez un "
                              "fichier : une séquence sans l'un des deux "
                              "n'apparaîtrait pas sur le site.",
            })
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
        if valeur and not valeur.startswith('https://'):
            raise serializers.ValidationError(
                "Le lien doit commencer par https:// — une adresse en http "
                "serait bloquée par le navigateur."
            )
        return valeur

    def validate_video_cle(self, valeur):
        """La clé vient du serveur, elle doit y ressembler.

        C'est le serveur qui a nommé l'objet en délivrant l'URL signée. Une clé
        qui ne commence pas par `videos/` désignerait autre chose que la vidéo
        qu'on vient de déposer — au mieux une erreur, au pire une photo du
        catalogue rattachée par mégarde à une séquence.
        """
        valeur = (valeur or '').strip()
        if valeur and not valeur.startswith('videos/'):
            raise serializers.ValidationError("Clé de dépôt invalide.")
        return valeur

    def _poser_la_cle(self, instance, cle):
        """Rattache l'objet déjà déposé, sans le relire ni le réécrire.

        Assigner `.name` plutôt que `.save()` est délibéré : le fichier est
        DÉJÀ sur le bucket. Passer par le champ le retéléchargerait pour le
        renvoyer aussitôt — exactement le trajet qu'on cherche à supprimer.
        """
        instance.video.name = cle
        instance.save(update_fields=['video'])
        return instance

    def create(self, validated_data):
        cle = validated_data.pop('video_cle', '')
        instance = super().create(validated_data)
        return self._poser_la_cle(instance, cle) if cle else instance

    def update(self, instance, validated_data):
        cle = validated_data.pop('video_cle', '')
        instance = super().update(instance, validated_data)
        return self._poser_la_cle(instance, cle) if cle else instance


# ── Clients ──

class GestionCustomerSerializer(serializers.ModelSerializer):
    order_count = serializers.SerializerMethodField()
    total_spent = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = ['id', 'first_name', 'last_name', 'phone', 'email', 'is_staff', 'date_joined', 'order_count', 'total_spent']
        read_only_fields = ['id', 'first_name', 'last_name', 'phone', 'email', 'date_joined', 'order_count', 'total_spent']

    def get_order_count(self, obj):
        if not obj.phone:
            return 0
        return Order.objects.filter(customer_phone__endswith=obj.phone).count()

    def get_total_spent(self, obj):
        if not obj.phone:
            return 0
        return Order.objects.filter(customer_phone__endswith=obj.phone, payment_status='paid').aggregate(t=Sum('total'))['t'] or 0
