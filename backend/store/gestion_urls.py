from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import gestion

router = DefaultRouter()
router.register(r'products', gestion.GestionProductViewSet, basename='gestion-product')
router.register(r'product-images', gestion.GestionProductImageViewSet, basename='gestion-product-image')
router.register(r'product-variants', gestion.GestionProductVariantViewSet, basename='gestion-product-variant')
router.register(r'categories', gestion.GestionCategoryViewSet, basename='gestion-category')
router.register(r'orders', gestion.GestionOrderViewSet, basename='gestion-order')
router.register(r'reviews', gestion.GestionReviewViewSet, basename='gestion-review')
router.register(r'messages', gestion.GestionContactMessageViewSet, basename='gestion-message')
router.register(r'stock-alerts', gestion.GestionStockAlertViewSet, basename='gestion-stock-alert')
router.register(r'customers', gestion.GestionCustomerViewSet, basename='gestion-customer')
router.register(r'hero-banner', gestion.GestionHeroBannerViewSet, basename='gestion-hero-banner')
router.register(r'atelier-image', gestion.GestionAtelierImageViewSet, basename='gestion-atelier-image')
router.register(r'videos', gestion.GestionShowcaseVideoViewSet, basename='gestion-video')

urlpatterns = [
    path('dashboard/', gestion.dashboard_stats, name='gestion-dashboard'),
    path('', include(router.urls)),
]
