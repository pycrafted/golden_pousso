from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import gestion

router = DefaultRouter()
router.register(r'products', gestion.GestionProductViewSet, basename='gestion-product')
router.register(r'product-images', gestion.GestionProductImageViewSet, basename='gestion-product-image')
router.register(r'product-variants', gestion.GestionProductVariantViewSet, basename='gestion-product-variant')
router.register(r'categories', gestion.GestionCategoryViewSet, basename='gestion-category')
router.register(r'orders', gestion.GestionOrderViewSet, basename='gestion-order')
router.register(r'customers', gestion.GestionCustomerViewSet, basename='gestion-customer')
router.register(r'videos', gestion.GestionShowcaseVideoViewSet, basename='gestion-video')

urlpatterns = [
    # Une seule ligne en base : une adresse sans identifiant, hors routeur.
    path('coordonnees/', gestion.GestionCoordonneesView.as_view(), name='gestion-coordonnees'),
    path('', include(router.urls)),
]
