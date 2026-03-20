from rest_framework import generics, filters, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Category, Collection, Product, Order, ContactMessage
from .serializers import (
    CategorySerializer, CollectionListSerializer, CollectionDetailSerializer,
    ProductListSerializer, ProductDetailSerializer,
    OrderCreateSerializer, OrderOutputSerializer, ContactMessageSerializer,
)
from .filters import ProductFilter


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer


class CollectionListView(generics.ListAPIView):
    queryset = Collection.objects.filter(is_active=True)
    serializer_class = CollectionListSerializer


class CollectionDetailView(generics.RetrieveAPIView):
    queryset = Collection.objects.filter(is_active=True)
    serializer_class = CollectionDetailSerializer
    lookup_field = 'slug'


class ProductListView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['name', 'description']
    ordering_fields = ['price', 'created_at', 'name']
    ordering = ['-created_at']

    def get_queryset(self):
        return (
            Product.objects
            .filter(is_active=True)
            .prefetch_related('images', 'variants')
            .select_related('category', 'collection')
            .distinct()
        )


class ProductDetailView(generics.RetrieveAPIView):
    serializer_class = ProductDetailSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        return (
            Product.objects
            .filter(is_active=True)
            .prefetch_related('images', 'variants')
            .select_related('category', 'collection')
        )


@api_view(['GET'])
def product_featured(request):
    products = (
        Product.objects
        .filter(is_active=True, is_featured=True)
        .prefetch_related('images')
        .select_related('category')[:8]
    )
    serializer = ProductListSerializer(products, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
def product_new(request):
    products = (
        Product.objects
        .filter(is_active=True, is_new=True)
        .prefetch_related('images')
        .select_related('category')
        .order_by('-created_at')[:8]
    )
    serializer = ProductListSerializer(products, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
def order_create(request):
    serializer = OrderCreateSerializer(data=request.data)
    if serializer.is_valid():
        order = serializer.save()
        return Response(OrderOutputSerializer(order).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def order_detail(request, order_number):
    try:
        order = Order.objects.prefetch_related('items').get(order_number=order_number)
    except Order.DoesNotExist:
        return Response({'detail': 'Commande introuvable.'}, status=status.HTTP_404_NOT_FOUND)
    return Response(OrderOutputSerializer(order).data)


@api_view(['GET'])
@__import__('rest_framework').decorators.permission_classes([__import__('rest_framework').permissions.IsAuthenticated])
def my_orders(request):
    from .models import Order
    orders = Order.objects.filter(customer_email=request.user.email).prefetch_related('items').order_by('-created_at')
    serializer = OrderOutputSerializer(orders, many=True)
    return Response(serializer.data)


@api_view(['POST'])
def contact_create(request):
    serializer = ContactMessageSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({'detail': 'Message envoyé avec succès.'}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
