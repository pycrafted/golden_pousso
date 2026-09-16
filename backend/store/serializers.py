from rest_framework import serializers
from django.db import transaction
from django.db.models import Q
from .models import Category, Product, ProductImage, ProductVariant, Order, OrderItem, ContactMessage, StockAlert, ShowcaseVideo, SectionTexte, HeroPromotion, Coordonnees


def cld(url, transform='f_auto,q_auto'):
    """Inject Cloudinary transformation params (WebP + compression) into a Cloudinary URL."""
    if not url or 'res.cloudinary.com' not in url:
        return url
    return url.replace('/upload/', f'/upload/{transform}/', 1)


class CategorySerializer(serializers.ModelSerializer):
    """Nom, slug, parent et nombre de pièces — rien d'autre.

    La photo (`image`, `image_url`), la description et l'ordre ont été retirés
    à la demande. La photo d'un rayon de la maison vient du frontend
    (constants/rayons.js) ; `parent` est vide pour une catégorie principale,
    et c'est ce qui la distingue d'une sous-catégorie côté frontend.
    """
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'parent', 'product_count']

    def get_product_count(self, obj):
        """Pièces du rayon ET de ses sous-catégories : la page d'un rayon les
        montre toutes (voir `ProductFilter.filtre_rayon`).

        Lit l'annotation posée par la vue quand elle existe ; retombe sur un
        comptage direct pour les autres appels."""
        compte = getattr(obj, 'nb_produits', None)
        if compte is not None:
            return compte
        return Product.objects.filter(Q(category=obj) | Q(category__parent=obj)).count()


class ProductImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'is_primary', 'order']

    def get_image(self, obj):
        request = self.context.get('request')
        if not obj.image:
            return None
        # `fichier_web` : la variante 1800 px si elle existe, l'original sinon.
        # L'original peut peser 25 Mo — il n'a rien à faire dans un navigateur.
        fichier = obj.fichier_web
        url = request.build_absolute_uri(fichier.url) if request else fichier.url
        return cld(url, 'w_1200,f_auto,q_auto,c_limit')


class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ['id', 'size', 'color', 'stock', 'price_adjustment']


class ProductListSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    primary_image = serializers.SerializerMethodField()
    secondary_image = serializers.SerializerMethodField()
    discount_percent = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'category', 'price', 'old_price',
            'primary_image', 'secondary_image',
            'discount_percent', 'stock',
        ]

    def get_primary_image(self, obj):
        request = self.context.get('request')
        img = obj.images.filter(is_primary=True).first() or obj.images.first()
        if img and request:
            return cld(request.build_absolute_uri(img.fichier_web.url), 'w_600,f_auto,q_auto,c_limit')
        return None

    def get_secondary_image(self, obj):
        request = self.context.get('request')
        primary = obj.images.filter(is_primary=True).first() or obj.images.first()
        if primary:
            img = obj.images.exclude(pk=primary.pk).order_by('order').first()
        else:
            img = None
        if img and request:
            return cld(request.build_absolute_uri(img.fichier_web.url), 'w_600,f_auto,q_auto,c_limit')
        return None

    def get_discount_percent(self, obj):
        return obj.discount_percent


class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    primary_image = serializers.SerializerMethodField()
    discount_percent = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'category', 'description',
            'price', 'old_price', 'discount_percent', 'stock',
            'primary_image', 'images', 'variants',
            'created_at', 'updated_at'
        ]

    def get_primary_image(self, obj):
        request = self.context.get('request')
        img = obj.images.filter(is_primary=True).first() or obj.images.first()
        if img and request:
            return cld(request.build_absolute_uri(img.fichier_web.url), 'w_1200,f_auto,q_auto,c_limit')
        return None

    def get_discount_percent(self, obj):
        return obj.discount_percent



# ── Commandes ──

class OrderItemInputSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    variant_id = serializers.IntegerField(required=False, allow_null=True)
    quantity = serializers.IntegerField(min_value=1)


class OrderCreateSerializer(serializers.Serializer):
    customer_name = serializers.CharField(max_length=200)
    customer_phone = serializers.CharField(max_length=20)
    customer_email = serializers.EmailField(required=False, allow_blank=True)
    delivery_address = serializers.CharField(required=False, allow_blank=True)
    delivery_zone = serializers.ChoiceField(choices=Order.DELIVERY_ZONE_CHOICES)
    # Plus de `payment_method` à choisir : toute commande se paie par PayDunya,
    # à la demande (voir Order.PAYMENT_CHOICES). Un champ envoyé est ignoré.
    notes = serializers.CharField(required=False, allow_blank=True)
    items = OrderItemInputSerializer(many=True)

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        zone = validated_data['delivery_zone']
        delivery_fee = Order.DELIVERY_FEES.get(zone, 1500)

        with transaction.atomic():
            subtotal = 0
            order_items = []
            for item_data in items_data:
                product = Product.objects.get(pk=item_data['product_id'])
                variant = None
                unit_price = product.price
                if item_data.get('variant_id'):
                    variant = ProductVariant.objects.get(pk=item_data['variant_id'])
                    unit_price += variant.price_adjustment
                    if variant.stock < item_data['quantity']:
                        raise serializers.ValidationError(
                            f"Stock insuffisant pour {product.name} (variante {variant})."
                        )
                    variant.stock -= item_data['quantity']
                    variant.save()
                else:
                    if product.stock < item_data['quantity']:
                        raise serializers.ValidationError(f"Stock insuffisant pour {product.name}.")
                    product.stock -= item_data['quantity']
                    product.save()

                line_total = unit_price * item_data['quantity']
                subtotal += line_total
                order_items.append(OrderItem(
                    product=product,
                    variant=variant,
                    product_name=product.name,
                    product_price=unit_price,
                    quantity=item_data['quantity'],
                    line_total=line_total,
                ))

            order = Order.objects.create(
                **validated_data,
                payment_method='paydunya',
                delivery_fee=delivery_fee,
                subtotal=subtotal,
                total=subtotal + delivery_fee,
            )
            for oi in order_items:
                oi.order = order
            OrderItem.objects.bulk_create(order_items)

        return order


class OrderItemOutputSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['product_name', 'product_price', 'quantity', 'line_total']


class OrderOutputSerializer(serializers.ModelSerializer):
    items = OrderItemOutputSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'order_number', 'status', 'customer_name', 'customer_phone',
            'customer_email', 'delivery_address', 'delivery_zone',
            'delivery_fee', 'subtotal', 'total',
            'payment_method', 'payment_status', 'notes',
            'items', 'created_at',
        ]


class ShowcaseVideoSerializer(serializers.ModelSerializer):
    video_url = serializers.SerializerMethodField()
    poster_url = serializers.SerializerMethodField()

    class Meta:
        model = ShowcaseVideo
        fields = ['id', 'video_url', 'poster_url']

    def _absolu(self, fichier):
        """URL absolue si la requête est dans le contexte, relative sinon.

        L'ancienne version renvoyait `None` quand le contexte manquait : la
        vidéo disparaissait silencieusement au lieu de tomber sur une URL
        relative, qui fonctionne parfaitement puisque l'API et les médias sont
        servis sur le même hôte."""
        if not fichier:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(fichier.url) if request else fichier.url

    def get_video_url(self, obj):
        # Un lien Cloudflare, déjà public et complet : rien à reconstruire.
        return obj.video_lien

    def get_poster_url(self, obj):
        return self._absolu(obj.poster)


class SectionTexteSerializer(serializers.ModelSerializer):
    class Meta:
        model = SectionTexte
        fields = ['cle', 'surtitre', 'titre']


class CoordonneesSerializer(serializers.ModelSerializer):
    """Les coordonnées telles que la bande les affiche.

    `telephone_lien` est calculé par le modèle et non saisi : deux champs pour
    un même numéro finiraient par se contredire, et c'est le lien — invisible —
    qui serait faux.
    """
    telephone_lien = serializers.CharField(read_only=True)
    whatsapp = serializers.CharField(read_only=True)

    class Meta:
        model = Coordonnees
        fields = ['adresse', 'telephone', 'telephone_lien', 'whatsapp', 'email']


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ['name', 'contact', 'subject', 'message']


class HeroPromotionSerializer(serializers.ModelSerializer):
    """Ce que le hero a besoin de savoir, et rien de plus.

    `fin` est expose parce que le frontend en tire le decompte des derniers
    jours. `debut` et `is_active` restent en base : la fenetre est deja
    tranchee par HeroPromotion.en_cours(), le navigateur n'a pas a la
    reevaluer.
    """

    class Meta:
        model = HeroPromotion
        fields = ['titre', 'offre', 'accroche', 'lien', 'libelle_lien', 'fin']


# ── Alertes de réassort ──

class StockAlertCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockAlert
        fields = ['email']
