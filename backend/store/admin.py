from django.contrib import admin
from .models import Category, Collection, Product, ProductImage, ProductVariant, Order, OrderItem


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'is_active', 'order']
    list_filter = ['is_active']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}
    ordering = ['order', 'name']


@admin.register(Collection)
class CollectionAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'date', 'is_featured', 'is_active']
    list_filter = ['is_featured', 'is_active']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}
    ordering = ['-date']


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ['image', 'alt_text', 'is_primary', 'order']


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1
    fields = ['size', 'color', 'stock', 'price_adjustment']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'price', 'stock', 'is_active', 'is_featured', 'is_new', 'created_at']
    list_filter = ['is_active', 'is_featured', 'is_new', 'category']
    search_fields = ['name', 'slug', 'description']
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ['is_active', 'is_featured', 'is_new']
    ordering = ['-created_at']
    inlines = [ProductImageInline, ProductVariantInline]
    actions = ['activer_produits', 'desactiver_produits']

    def activer_produits(self, request, queryset):
        queryset.update(is_active=True)
    activer_produits.short_description = 'Activer les produits sélectionnés'

    def desactiver_produits(self, request, queryset):
        queryset.update(is_active=False)
    desactiver_produits.short_description = 'Désactiver les produits sélectionnés'


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ['product', 'alt_text', 'is_primary', 'order']
    list_filter = ['is_primary']
    search_fields = ['product__name', 'alt_text']


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ['product', 'size', 'color', 'stock', 'price_adjustment']
    list_filter = ['size', 'color']
    search_fields = ['product__name']


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['product_name', 'product_price', 'quantity', 'line_total']
    can_delete = False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'customer_name', 'customer_phone', 'total', 'status', 'payment_method', 'created_at']
    list_filter = ['status', 'payment_status', 'delivery_zone', 'payment_method']
    search_fields = ['order_number', 'customer_name', 'customer_phone', 'customer_email']
    readonly_fields = ['order_number', 'created_at', 'updated_at']
    list_editable = ['status']
    ordering = ['-created_at']
    inlines = [OrderItemInline]
    actions = ['marquer_confirme', 'marquer_expedie', 'marquer_livre']

    def marquer_confirme(self, request, queryset):
        queryset.update(status='confirmed')
    marquer_confirme.short_description = 'Marquer comme Confirmées'

    def marquer_expedie(self, request, queryset):
        queryset.update(status='shipped')
    marquer_expedie.short_description = 'Marquer comme Expédiées'

    def marquer_livre(self, request, queryset):
        queryset.update(status='delivered')
    marquer_livre.short_description = 'Marquer comme Livrées'
