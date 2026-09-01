import django_filters
from django.db.models import Exists, F, OuterRef, Q

from .models import Product, ProductImage

# ── Le média que montre la carte ────────────────────────────────────────────
# Une carte produit joue la vidéo si elle en a une, et n'affiche la photo que
# sinon (voir le help_text de `Product.video`). Les deux Q ci-dessous disent
# donc ce que le VISITEUR voit, pas ce que la pièce possède : une pièce qui a
# une vidéo ET des photos est une carte vidéo, et rien d'autre.
#
# Écrit en « sans vidéo » puis nié, et non l'inverse : le champ est à la fois
# `blank` (chaîne vide) et `null`, et les deux cas doivent tomber du même côté.
SANS_VIDEO = Q(video='') | Q(video__isnull=True)
AVEC_VIDEO = ~SANS_VIDEO


def a_une_photo():
    """Sous-requête d'existence, et non une jointure sur `images`.

    Un `filter(images__isnull=False)` multiplierait les lignes du produit par
    son nombre de photos : le compte des facettes deviendrait faux, et la
    liste rendrait des doublons. `Exists` répond en booléen sans toucher au
    cardinal du résultat.
    """
    return Exists(ProductImage.objects.filter(product=OuterRef('pk')))


class ProductFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(field_name='category__slug')
    min_price = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='price', lookup_expr='lte')
    is_featured = django_filters.BooleanFilter(field_name='is_featured')
    is_new = django_filters.BooleanFilter(field_name='is_new')
    color = django_filters.CharFilter(field_name='variants__color', lookup_expr='icontains')
    size = django_filters.CharFilter(field_name='variants__size', lookup_expr='iexact')
    in_stock = django_filters.BooleanFilter(method='filtre_en_stock')
    on_sale = django_filters.BooleanFilter(method='filtre_en_promo')
    media = django_filters.ChoiceFilter(
        choices=[('video', 'Vidéo'), ('photo', 'Photo')],
        method='filtre_media',
    )

    class Meta:
        model = Product
        fields = [
            'category', 'min_price', 'max_price',
            'is_featured', 'is_new', 'in_stock', 'on_sale', 'media',
        ]

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

    def filtre_media(self, queryset, name, value):
        """Média de la carte. Absent : tout le rayon, vidéos et photos mêlées.

        Les deux valeurs se partagent exactement le rayon — moins les pièces
        qui n'ont ni vidéo ni photo, qui n'appartiennent à aucun des deux :
        leur carte ne montre qu'un cadre vide, la ranger sous « Photo »
        promettrait une image qui n'existe pas.
        """
        if value == 'video':
            return queryset.filter(AVEC_VIDEO)
        if value == 'photo':
            return queryset.filter(SANS_VIDEO).filter(a_une_photo())
        return queryset
