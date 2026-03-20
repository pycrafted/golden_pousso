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

    # Commandes
    path('orders/', views.order_create, name='order-create'),
    path('orders/<str:order_number>/', views.order_detail, name='order-detail'),
]
