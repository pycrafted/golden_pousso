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
    class Meta:
        model = ShowcaseVideo
        fields = ['id', 'title', 'video', 'poster', 'product', 'order', 'is_active', 'created_at']
        extra_kwargs = {'video': {'required': False}}


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
