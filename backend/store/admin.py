import csv
from django.contrib import admin
from django.http import HttpResponse
from .models import Category, Collection, Product, ProductImage, ProductVariant, Order, OrderItem, ContactMessage, HeroBanner, AtelierImage


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
    extra = 2
    fields = ['image', 'preview', 'alt_text', 'is_primary', 'order']
    readonly_fields = ['preview']

    def preview(self, obj):
        from django.utils.html import format_html
        if obj.image:
            return format_html('<img src="{}" style="height:80px;object-fit:cover;border-radius:4px;" />', obj.image.url)
        return '—'
    preview.short_description = 'Aperçu'


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
    actions = ['marquer_confirme', 'marquer_expedie', 'marquer_livre', 'exporter_csv']

    def marquer_confirme(self, request, queryset):
        queryset.update(status='confirmed')
    marquer_confirme.short_description = 'Marquer comme Confirmées'

    def marquer_expedie(self, request, queryset):
        queryset.update(status='shipped')
    marquer_expedie.short_description = 'Marquer comme Expédiées'

    def marquer_livre(self, request, queryset):
        queryset.update(status='delivered')
    marquer_livre.short_description = 'Marquer comme Livrées'

    def exporter_csv(self, request, queryset):
        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename="commandes.csv"'
        response.write('\ufeff')  # BOM for Excel UTF-8
        writer = csv.writer(response)
        writer.writerow(['N° Commande', 'Date', 'Client', 'Téléphone', 'Email', 'Zone', 'Adresse', 'Paiement', 'Statut', 'Total (FCFA)'])
        for order in queryset.order_by('-created_at'):
            writer.writerow([
                order.order_number,
                order.created_at.strftime('%d/%m/%Y %H:%M'),
                order.customer_name,
                order.customer_phone,
                order.customer_email,
                order.get_delivery_zone_display(),
                order.delivery_address,
                order.get_payment_method_display(),
                order.get_status_display(),
                order.total,
            ])
        return response
    exporter_csv.short_description = 'Exporter en CSV'


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ['name', 'contact', 'subject', 'is_read', 'created_at']
    list_filter = ['is_read', 'created_at']
    search_fields = ['name', 'contact', 'subject', 'message']
    list_editable = ['is_read']
    readonly_fields = ['name', 'contact', 'subject', 'message', 'created_at']


@admin.register(HeroBanner)
class HeroBannerAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'is_active', 'updated_at', 'preview']
    list_editable = ['is_active']
    readonly_fields = ['updated_at', 'preview']

    def preview(self, obj):
        from django.utils.html import format_html
        if obj.image:
            return format_html('<img src="{}" style="height:120px;object-fit:cover;border-radius:4px;" />', obj.image.url)
        return '—'
    preview.short_description = 'Aperçu'


@admin.register(AtelierImage)
class AtelierImageAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'is_active', 'updated_at', 'preview']
    list_editable = ['is_active']
    readonly_fields = ['updated_at', 'preview']

    def preview(self, obj):
        from django.utils.html import format_html
        if obj.image:
            return format_html('<img src="{}" style="height:120px;object-fit:cover;border-radius:4px;" />', obj.image.url)
        return '—'
    preview.short_description = 'Aperçu'


