import django_filters
from .models import Product


class ProductFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(field_name='category__slug')
    collection = django_filters.CharFilter(field_name='collection__slug')
    min_price = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='price', lookup_expr='lte')
    is_featured = django_filters.BooleanFilter(field_name='is_featured')
    is_new = django_filters.BooleanFilter(field_name='is_new')
    color = django_filters.CharFilter(field_name='variants__color', lookup_expr='icontains')
    size = django_filters.CharFilter(field_name='variants__size', lookup_expr='iexact')

    class Meta:
        model = Product
        fields = ['category', 'collection', 'min_price', 'max_price', 'is_featured', 'is_new']
