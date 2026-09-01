from rest_framework import serializers
from django.db import transaction
from django.db.models import Avg
from .models import Category, Product, ProductImage, ProductVariant, Order, OrderItem, ContactMessage, HeroBanner, AtelierImage, Review, StockAlert, ShowcaseVideo, SectionTexte, HeroPromotion


def cld(url, transform='f_auto,q_auto'):
    """Inject Cloudinary transformation params (WebP + compression) into a Cloudinary URL."""
    if not url or 'res.cloudinary.com' not in url:
        return url
    return url.replace('/upload/', f'/upload/{transform}/', 1)


class CategorySerializer(serializers.ModelSerializer):
    """Une seule des quatre catégories a une image propre. `image_url` retombe
    donc sur la photo d'un produit du rayon : une tuile sans visuel casse la
    grille de la page d'accueil, et l'admin ne peut pas toujours fournir une
    image dédiée pour chaque rayon."""
    image_url = serializers.SerializerMethodField()
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'image', 'image_url',
                  'product_count', 'order']

    def get_product_count(self, obj):
        """Nombre de pièces en ligne dans le rayon.

        Lit l'annotation posée par la vue quand elle existe ; retombe sur un
        comptage direct pour les autres appels (détail produit, admin…)."""
        compte = getattr(obj, 'nb_produits', None)
        return compte if compte is not None else obj.products.filter(is_active=True).count()

    def get_image_url(self, obj):
        request = self.context.get('request')

        def absolu(url):
            return request.build_absolute_uri(url) if request else url

        if obj.image:
            return absolu(obj.fichier_web.url)

        produit = (
            obj.products
            .filter(is_active=True, images__isnull=False)
            .prefetch_related('images')
            .first()
        )
        if produit:
            image = produit.images.first()
            if image:
                return absolu(image.fichier_web.url)
        return None


def video_url(product, request):
    if not product.video:
        return None
    return request.build_absolute_uri(product.video.url) if request else product.video.url


class ProductImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'is_primary', 'order']

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
    video_url = serializers.SerializerMethodField()
    discount_percent = serializers.SerializerMethodField()
    rating_avg = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'category', 'price', 'old_price',
            'primary_image', 'secondary_image', 'video_url',
            'discount_percent', 'is_new', 'is_featured', 'stock',
            'rating_avg', 'review_count',
        ]

    def get_video_url(self, obj):
        return video_url(obj, self.context.get('request'))

    def get_rating_avg(self, obj):
        avg = obj.reviews.filter(is_approved=True).aggregate(avg=Avg('rating'))['avg']
        return round(avg, 1) if avg else None

    def get_review_count(self, obj):
        return obj.reviews.filter(is_approved=True).count()

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
    video_url = serializers.SerializerMethodField()
    discount_percent = serializers.SerializerMethodField()
    rating_avg = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'category', 'description',
            'price', 'old_price', 'discount_percent', 'stock',
            'is_active', 'is_featured', 'is_new',
            'primary_image', 'video_url', 'images', 'variants',
            'rating_avg', 'review_count',
            'created_at', 'updated_at'
        ]

    def get_primary_image(self, obj):
        request = self.context.get('request')
        img = obj.images.filter(is_primary=True).first() or obj.images.first()
        if img and request:
            return cld(request.build_absolute_uri(img.fichier_web.url), 'w_1200,f_auto,q_auto,c_limit')
        return None

    def get_video_url(self, obj):
        return video_url(obj, self.context.get('request'))

    def get_discount_percent(self, obj):
        return obj.discount_percent

    def get_rating_avg(self, obj):
        avg = obj.reviews.filter(is_approved=True).aggregate(avg=Avg('rating'))['avg']
        return round(avg, 1) if avg else None

    def get_review_count(self, obj):
        return obj.reviews.filter(is_approved=True).count()



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
    payment_method = serializers.ChoiceField(choices=Order.PAYMENT_CHOICES)
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


class ShowcaseVideoProductSerializer(serializers.ModelSerializer):
    """Strict minimum pour la carte posée sur la vidéo : photo, nom, prix."""
    primary_image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'slug', 'price', 'primary_image']

    def get_primary_image(self, obj):
        image = obj.images.first()
        if not image:
            return None
        request = self.context.get('request')
        url = image.fichier_web.url
        return request.build_absolute_uri(url) if request else url


class ShowcaseVideoSerializer(serializers.ModelSerializer):
    video_url = serializers.SerializerMethodField()
    poster_url = serializers.SerializerMethodField()
    product = ShowcaseVideoProductSerializer(read_only=True)

    class Meta:
        model = ShowcaseVideo
        fields = ['id', 'video_url', 'poster_url', 'product']

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
        return self._absolu(obj.video)

    def get_poster_url(self, obj):
        return self._absolu(obj.poster)


class SectionTexteSerializer(serializers.ModelSerializer):
    class Meta:
        model = SectionTexte
        fields = ['cle', 'surtitre', 'titre']


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


class HeroBannerSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = HeroBanner
        fields = ['id', 'image_url']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return cld(request.build_absolute_uri(obj.fichier_web.url), 'w_1920,f_auto,q_auto,c_limit')
        return None


class AtelierImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = AtelierImage
        # `order` place la photo : 0 à gauche, 1 à droite. Sans lui, le
        # frontend ne pourrait que les empiler dans l'ordre reçu — et une
        # seule photo publiée à droite atterrirait à gauche.
        fields = ['id', 'image_url', 'order']

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return cld(request.build_absolute_uri(obj.fichier_web.url), 'w_1200,f_auto,q_auto,c_limit')
        return None


# ── Avis clients ──

class ReviewSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    photo = serializers.SerializerMethodField()
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_slug = serializers.CharField(source='product.slug', read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'customer_name', 'rating', 'comment', 'photo', 'product_name', 'product_slug', 'created_at']

    def get_customer_name(self, obj):
        return obj.customer.get_full_name() or obj.customer.first_name or 'Client Golden Pousso'

    def get_photo(self, obj):
        request = self.context.get('request')
        if obj.photo and request:
            return cld(request.build_absolute_uri(obj.photo.url), 'w_400,f_auto,q_auto,c_limit')
        return None


class ReviewCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['rating', 'comment', 'photo']


# ── Alertes de réassort ──

class StockAlertCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockAlert
        fields = ['email']
