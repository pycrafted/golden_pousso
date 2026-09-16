import django_filters
from django.db.models import F, Q

from .models import Product

# Plus de filtre `media` (vidéo / photo) : la vidéo de produit a été retirée,
# front et back, à la demande. Une carte montre toujours sa photo.


class ProductFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(method='filtre_rayon')
    min_price = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='price', lookup_expr='lte')
    color = django_filters.CharFilter(field_name='variants__color', lookup_expr='icontains')
    size = django_filters.CharFilter(field_name='variants__size', lookup_expr='iexact')
    in_stock = django_filters.BooleanFilter(method='filtre_en_stock')
    on_sale = django_filters.BooleanFilter(method='filtre_en_promo')

    class Meta:
        model = Product
        fields = [
            'category', 'min_price', 'max_price',
            'in_stock', 'on_sale',
        ]

    def filtre_rayon(self, queryset, name, value):
        """Un rayon et ses sous-catégories.

        La page d'une catégorie principale montre aussi les pièces rangées
        dans ses sous-catégories ; celle d'une sous-catégorie, les siennes
        seulement (elle n'a pas d'enfants : l'arbre n'a qu'un niveau).
        """
        if not value:
            return queryset
        return queryset.filter(Q(category__slug=value) | Q(category__parent__slug=value))

    def filtre_en_stock(self, queryset, name, value):
        """Disponibilité. `in_stock=false` garde les pièces épuisées."""
        if value is None:
            return queryset
        return queryset.filter(stock__gt=0) if value else queryset.filter(stock__lte=0)

    def filtre_en_promo(self, queryset, name, value):
        """En solde.

        Un `old_price` renseigné ne suffit pas : il reste parfois en base
        après un réalignement du prix. La comparaison avec le prix courant est
        donc explicite — une remise n'existe que si l'ancien prix est plus
        haut que celui qu'on paye aujourd'hui.
        """
        if value is None:
            return queryset
        remise = Q(old_price__isnull=False, old_price__gt=F('price'))
        return queryset.filter(remise) if value else queryset.exclude(remise)
