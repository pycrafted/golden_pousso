from django.urls import path
from . import views

urlpatterns = [
    # Catégories
    path('categories/', views.CategoryListView.as_view(), name='category-list'),

    # Collections
    path('collections/', views.CollectionListView.as_view(), name='collection-list'),
    path('collections/<slug:slug>/', views.CollectionDetailView.as_view(), name='collection-detail'),

    # Produits
    path('products/', views.ProductListView.as_view(), name='product-list'),
    path('products/featured/', views.product_featured, name='product-featured'),
    path('products/new/', views.product_new, name='product-new'),
    path('products/<slug:slug>/', views.ProductDetailView.as_view(), name='product-detail'),
    path('products/<slug:slug>/reviews/', views.product_reviews, name='product-reviews'),
    path('products/<slug:slug>/stock-alert/', views.stock_alert_create, name='stock-alert-create'),

    # Avis récents (homepage)
    path('reviews/recents/', views.recent_reviews, name='recent-reviews'),

    # Commandes
    path('orders/', views.order_create, name='order-create'),
    path('orders/mes-commandes/', views.my_orders, name='my-orders'),
    path('orders/<str:order_number>/', views.order_detail, name='order-detail'),

    # Contact
    path('contact/', views.contact_create, name='contact-create'),

    # PayDunya
    path('paiement/initier/', views.paydunya_initiate, name='paydunya-initiate'),
    path('paiement/callback/', views.paydunya_callback, name='paydunya-callback'),

    # Hero banner
    path('hero-banner/', views.hero_banner, name='hero-banner'),

    # Atelier image
    path('atelier-image/', views.atelier_image, name='atelier-image'),

    # Vidéos — section "Nos Créations en Mouvement"
    path('videos/', views.showcase_videos, name='showcase-videos'),
]
