from rest_framework import serializers
from django.db import transaction
from .models import Category, Collection, Product, ProductImage, ProductVariant, Order, OrderItem


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'image', 'order']


class CollectionListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Collection
        fields = ['id', 'name', 'slug', 'description', 'cover_image', 'date', 'is_featured']


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'is_primary', 'order']


class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ['id', 'size', 'color', 'stock', 'price_adjustment']


class ProductListSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    primary_image = serializers.SerializerMethodField()
    discount_percent = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'category', 'price', 'old_price',
            'primary_image', 'discount_percent', 'is_new', 'is_featured', 'stock'
        ]

    def get_primary_image(self, obj):
        request = self.context.get('request')
        img = obj.images.filter(is_primary=True).first() or obj.images.first()
        if img and request:
            return request.build_absolute_uri(img.image.url)
        return None

    def get_discount_percent(self, obj):
        return obj.discount_percent


class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    collection = CollectionListSerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    primary_image = serializers.SerializerMethodField()
    discount_percent = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'category', 'collection', 'description',
            'price', 'old_price', 'discount_percent', 'stock',
            'is_active', 'is_featured', 'is_new',
            'primary_image', 'images', 'variants',
            'created_at', 'updated_at'
        ]

    def get_primary_image(self, obj):
        request = self.context.get('request')
        img = obj.images.filter(is_primary=True).first() or obj.images.first()
        if img and request:
            return request.build_absolute_uri(img.image.url)
        return None

    def get_discount_percent(self, obj):
        return obj.discount_percent


class CollectionDetailSerializer(serializers.ModelSerializer):
    products = ProductListSerializer(many=True, read_only=True)

    class Meta:
        model = Collection
        fields = ['id', 'name', 'slug', 'description', 'cover_image', 'date', 'is_featured', 'products']


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
