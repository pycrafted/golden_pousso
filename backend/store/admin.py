import csv
from django.contrib import admin
from django.http import HttpResponse
from .models import SectionTexte, Coordonnees, Category, Product, ProductImage, ProductVariant, Order, OrderItem, ContactMessage, HeroPromotion, StockAlert, ShowcaseVideo


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    """Les cinq rayons structurels sont renommables, pas supprimables.

    Voir Category.SLUGS_STRUCTURELS. La page d'accueil porte leur photo et
    leur ordre côté frontend et les retrouve par leur slug : supprimer un
    rayon laisserait une tuile qui pointe vers une page inexistante, en
    changer le slug la laisserait sans nom ni compteur.

    Le modèle refuse déjà la suppression. Ce qui suit n'est pas un doublon
    mais l'autre moitié du travail : faire en sorte que l'admin ne PROPOSE
    pas une action qu'il ne pourra pas mener. Un bouton qui échoue vaut moins
    qu'un bouton absent.
    """

    # Plus de statut, d'ordre, de photo ni de description, à la demande : une
    # catégorie ne porte que son nom et son parent.
    list_display = ['name', 'slug', 'parent', 'structurel']
    search_fields = ['name', 'slug']
    ordering = ['name']

    @admin.display(description='Rayon fixe', boolean=True)
    def structurel(self, obj):
        return obj.est_structurelle

    def get_readonly_fields(self, request, obj=None):
        # Le slug est la clé qui relie le rayon à sa photo dans le frontend.
        if obj is not None and obj.est_structurelle:
            return ('slug',)
        return ()

    def get_exclude(self, request, obj=None):
        # Un rayon de la maison reste une catégorie principale : le champ
        # parent n'est pas proposé (le modèle le refuserait de toute façon).
        if obj is not None and obj.est_structurelle:
            return ('parent',)
        return super().get_exclude(request, obj)

    def get_prepopulated_fields(self, request, obj=None):
        # prepopulated_fields et readonly_fields sur le même champ font planter
        # l'admin : on ne pré-remplit le slug que pour un rayon libre.
        if obj is not None and obj.est_structurelle:
            return {}
        return {'slug': ('name',)}

    def has_delete_permission(self, request, obj=None):
        if obj is not None and obj.est_structurelle:
            return False
        return super().has_delete_permission(request, obj)

    def get_actions(self, request):
        # L'action de masse ne reçoit pas d'objet : elle ne peut pas être
        # filtrée par rayon. Elle est donc retirée pour tout le monde — cinq
        # rayons sur cinq sont verrouillés, elle ne servirait qu'à échouer.
        actions = super().get_actions(request)
        actions.pop('delete_selected', None)
        return actions



class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 2
    fields = ['image', 'preview', 'is_primary', 'order']
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
    list_display = ['name', 'category', 'price', 'stock', 'created_at']
    list_filter = ['category']
    search_fields = ['name', 'slug', 'description']
    prepopulated_fields = {'slug': ('name',)}
    ordering = ['-created_at']
    inlines = [ProductImageInline, ProductVariantInline]


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ['product', 'is_primary', 'order']
    list_filter = ['is_primary']
    search_fields = ['product__name']


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
    # Plus d'action « Marquer comme Confirmées » : « Payée » (l'ancien
    # « Confirmée ») ne se pose qu'au retour de PayDunya, jamais à la main.
    actions = ['marquer_expedie', 'marquer_livre', 'exporter_csv']

    def marquer_expedie(self, request, queryset):
        queryset.update(status='shipped')
    marquer_expedie.short_description = 'Marquer comme En livraison'

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


@admin.register(StockAlert)
class StockAlertAdmin(admin.ModelAdmin):
    list_display = ['product', 'email', 'notified', 'created_at']
    list_filter = ['notified']
    search_fields = ['product__name', 'email']
    ordering = ['-created_at']


@admin.register(ShowcaseVideo)
class ShowcaseVideoAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'video_lien', 'order', 'created_at']
    list_editable = ['order']
    ordering = ['order', '-created_at']

    def has_add_permission(self, request):
        # Quatre vidéos au plus : le bouton « Ajouter » disparaît à la
        # quatrième.
        return super().has_add_permission(request) and ShowcaseVideo.objects.count() < ShowcaseVideo.MAX


@admin.register(HeroPromotion)
class HeroPromotionAdmin(admin.ModelAdmin):
    """Programmer une campagne du hero.

    Hors campagne, le hero affiche son message d'accueil : il n'y a donc rien
    à faire ici le reste de l'année, et rien à débrancher le lendemain de la
    fin — la date s'en charge.
    """

    list_display = ['offre', 'accroche', 'debut', 'fin', 'is_active', 'etat']
    list_editable = ['is_active']
    list_filter = ['is_active']
    fieldsets = [
        ("Ce que le hero affiche", {
            'fields': ['titre', 'offre', 'accroche'],
            'description': "Trois niveaux de lecture, du plus gros au plus petit.",
        }),
        ("Le bouton", {'fields': ['lien', 'libelle_lien']}),
        ("Quand", {
            'fields': ['debut', 'fin', 'is_active'],
            'description': "Les deux dates sont incluses. Passée la fin, le hero "
                           "revient seul au message d'accueil.",
        }),
    ]

    @admin.display(description='État')
    def etat(self, obj):
        from django.utils import timezone
        from django.utils.html import format_html
        a = timezone.localdate()
        if not obj.is_active:
            return format_html('<span style="color:#999">suspendue</span>')
        if obj.debut > a:
            return format_html('<span style="color:#0a7">programmée</span>')
        if obj.fin < a:
            return format_html('<span style="color:#999">terminée</span>')
        return format_html('<b style="color:#C9A84C">à l’écran</b>')


@admin.register(SectionTexte)
class SectionTexteAdmin(admin.ModelAdmin):
    list_display = ['zone', 'surtitre', 'titre', 'updated_at']
    # Modifiables directement dans la liste : c'est le seul écran où l'on veut
    # relire tous les intitulés du site d'un coup et en corriger deux ou trois.
    list_editable = ['surtitre', 'titre']
    search_fields = ['zone', 'titre', 'surtitre']
    # La clé relie le texte à son composant : la changer casserait le lien.
    readonly_fields = ['cle', 'zone', 'updated_at']

    def has_add_permission(self, request):
        # Une ligne ajoutée à la main ne serait lue par aucun composant.
        return False

    def has_delete_permission(self, request, obj=None):
        # Supprimer une ligne fait retomber la section sur son texte en dur,
        # sans prévenir : on préfère qu'elle reste modifiable.
        return False


@admin.register(Coordonnees)
class CoordonneesAdmin(admin.ModelAdmin):
    """Les coordonnées de la boutique. Elles se saisissent normalement dans
    l'Espace Gestion ; l'admin est là pour les dépanner."""

    list_display = ['adresse', 'telephone', 'email', 'updated_at']
    readonly_fields = ['updated_at']

    def has_add_permission(self, request):
        # Une seule ligne : `save()` force la clé primaire à 1, une deuxième
        # écraserait la première sans le dire.
        return Coordonnees.objects.count() == 0

    def has_delete_permission(self, request, obj=None):
        # Sans ligne, la bande retomberait sur les valeurs par défaut sans
        # prévenir : on corrige, on ne supprime pas.
        return False
