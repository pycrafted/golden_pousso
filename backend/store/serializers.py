from rest_framework import serializers
from .models import Category, Collection, Product, ProductImage, ProductVariant


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
