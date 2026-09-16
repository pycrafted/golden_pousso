from django.urls import path
from . import views

urlpatterns = [
    # Catégories
    path('categories/', views.CategoryListView.as_view(), name='category-list'),


    # Produits
    path('products/', views.ProductListView.as_view(), name='product-list'),
    path('products/facets/', views.product_facets, name='product-facets'),
    path('products/<slug:slug>/', views.ProductDetailView.as_view(), name='product-detail'),
    path('products/<slug:slug>/stock-alert/', views.stock_alert_create, name='stock-alert-create'),

    # Commandes
    path('orders/mes-commandes/', views.my_orders, name='my-orders'),
    path('orders/<str:order_number>/', views.order_detail, name='order-detail'),

    # Contact
    path('contact/', views.contact_create, name='contact-create'),

    # Coordonnées de la boutique (bande en tête de site)
    path('coordonnees/', views.coordonnees, name='coordonnees'),

    # PayDunya
    path('paiement/initier/', views.paydunya_initiate, name='paydunya-initiate'),
    path('paiement/callback/', views.paydunya_callback, name='paydunya-callback'),

    # Hero banner
    path('hero-promotion/', views.hero_promotion, name='hero-promotion'),

    # Atelier image

    # Vidéos — section "Nos Créations en Mouvement"
    # Titres de sections
    path('textes-sections/', views.textes_sections, name='textes-sections'),

    path('videos/', views.showcase_videos, name='showcase-videos'),
]
