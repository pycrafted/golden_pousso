import requests as http_requests
from django.conf import settings as django_settings
from rest_framework import generics, filters, status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.throttling import AnonRateThrottle


class ContactRateThrottle(AnonRateThrottle):
    scope = 'contact'
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Category, Collection, Product, Order, ContactMessage, HeroBanner, AtelierImage
from .serializers import (
    CategorySerializer, CollectionListSerializer, CollectionDetailSerializer,
    ProductListSerializer, ProductDetailSerializer,
    OrderCreateSerializer, OrderOutputSerializer, ContactMessageSerializer,
    HeroBannerSerializer, AtelierImageSerializer,
)
from .filters import ProductFilter
from .emails import send_order_confirmation_email as _send_order_confirmation_email


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
        _send_order_confirmation_email(order)
        return Response(OrderOutputSerializer(order).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def order_detail(request, order_number):
    try:
        order = Order.objects.prefetch_related('items').get(order_number=order_number)
    except Order.DoesNotExist:
        return Response({'detail': 'Commande introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    # Utilisateur authentifié : doit être le propriétaire de la commande
    if request.user.is_authenticated:
        if order.customer_email and order.customer_email != request.user.email:
            return Response({'detail': 'Accès refusé.'}, status=status.HTTP_403_FORBIDDEN)
        return Response(OrderOutputSerializer(order).data)

    # Utilisateur anonyme : doit fournir email ou téléphone correspondant à la commande
    email = request.query_params.get('email', '').strip().lower()
    phone = request.query_params.get('phone', '').strip()

    email_match = email and order.customer_email and order.customer_email.lower() == email
    phone_match = phone and order.customer_phone and order.customer_phone.replace(' ', '') == phone.replace(' ', '')

    if not email_match and not phone_match:
        return Response(
            {'detail': 'Veuillez fournir votre email ou téléphone pour accéder à cette commande.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    return Response(OrderOutputSerializer(order).data)


@api_view(['GET'])
@__import__('rest_framework').decorators.permission_classes([__import__('rest_framework').permissions.IsAuthenticated])
def my_orders(request):
    from .models import Order
    orders = Order.objects.filter(customer_email=request.user.email).prefetch_related('items').order_by('-created_at')
    serializer = OrderOutputSerializer(orders, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@throttle_classes([ContactRateThrottle])
def contact_create(request):
    serializer = ContactMessageSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({'detail': 'Message envoyé avec succès.'}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def _paydunya_headers():
    return {
        'Content-Type': 'application/json',
        'PAYDUNYA-MASTER-KEY': django_settings.PAYDUNYA_MASTER_KEY,
        'PAYDUNYA-PRIVATE-KEY': django_settings.PAYDUNYA_PRIVATE_KEY,
        'PAYDUNYA-TOKEN': django_settings.PAYDUNYA_TOKEN,
    }


def _paydunya_base_url():
    if django_settings.PAYDUNYA_MODE == 'live':
        return 'https://app.paydunya.com/api/v1'
    return 'https://app.paydunya.com/sandbox-api/v1'


@api_view(['POST'])
@permission_classes([AllowAny])
def paydunya_initiate(request):
    serializer = OrderCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    order = serializer.save()

    frontend_url = django_settings.FRONTEND_URL
    backend_url = django_settings.BACKEND_URL

    payload = {
        'invoice': {
            'total_amount': int(order.total),
            'description': f'Commande {order.order_number} — Golden Pousso',
        },
        'store': {
            'name': 'Golden Pousso',
            'tagline': 'Boutique de prêt-à-porter',
            'postal_address': 'Pikine Tally Boumack, Dakar',
            'website_url': frontend_url,
        },
        'actions': {
            'cancel_url': f'{frontend_url}/commande?payment=cancel&order={order.order_number}',
            'return_url': f'{frontend_url}/commande/suivi/{order.order_number}?payment=success',
            'callback_url': f'{backend_url}/api/v1/paiement/callback/',
        },
        'custom_data': {
            'order_number': order.order_number,
        },
    }

    try:
        resp = http_requests.post(
            f'{_paydunya_base_url()}/checkout-invoice/create',
            json=payload,
            headers=_paydunya_headers(),
            timeout=15,
        )
        data = resp.json()
    except Exception:
        order.delete()
        return Response({'detail': 'Erreur de connexion PayDunya. Réessayez.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    if data.get('response_code') != '00':
        order.delete()
        return Response({'detail': data.get('response_text', 'Erreur PayDunya.')}, status=status.HTTP_400_BAD_REQUEST)

    order.paydunya_token = data['token']
    order.save(update_fields=['paydunya_token'])

    return Response({
        'order_number': order.order_number,
        'invoice_url': data['response_text'],  # PayDunya retourne l'URL dans response_text
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def paydunya_callback(request):
    body = request.data
    invoice_data = body.get('data', {}).get('invoice', body.get('invoice', {}))
    custom_data = body.get('data', {}).get('custom_data', body.get('custom_data', {}))

    token = invoice_data.get('token', '')
    order_number = custom_data.get('order_number', '')

    if not token and not order_number:
        return Response({'detail': 'Données manquantes.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        order = Order.objects.get(order_number=order_number) if order_number else Order.objects.get(paydunya_token=token)
    except Order.DoesNotExist:
        return Response({'detail': 'Commande introuvable.'}, status=status.HTTP_404_NOT_FOUND)

    # Vérification auprès de PayDunya avant de confirmer
    verify_token = order.paydunya_token or token
    try:
        verify_resp = http_requests.get(
            f'{_paydunya_base_url()}/checkout-invoice/confirm/{verify_token}',
            headers=_paydunya_headers(),
            timeout=10,
        )
        verify_data = verify_resp.json()
    except Exception:
        return Response({'detail': 'Erreur vérification PayDunya.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    confirmed_status = verify_data.get('status', '')
    if verify_data.get('response_code') == '00' and confirmed_status == 'completed':
        order.payment_status = 'paid'
        order.status = 'confirmed'
        order.save(update_fields=['payment_status', 'status'])
        _send_order_confirmation_email(order)
    elif confirmed_status in ('cancelled', 'failed') and order.payment_status != 'failed':
        order.payment_status = 'failed'
        order.save(update_fields=['payment_status'])
        # Restituer le stock de chaque article
        for item in order.items.select_related('product', 'variant').all():
            if item.variant:
                item.variant.stock += item.quantity
                item.variant.save(update_fields=['stock'])
            else:
                item.product.stock += item.quantity
                item.product.save(update_fields=['stock'])

    return Response({'detail': 'OK'})


# ── Avis clients ──────────────────────────────────────────────


@api_view(['GET'])
@permission_classes([AllowAny])
def hero_banner(request):
    banner = HeroBanner.objects.filter(is_active=True).first()
    if not banner:
        return Response({'image_url': None})
    return Response(HeroBannerSerializer(banner, context={'request': request}).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def atelier_image(request):
    image = AtelierImage.objects.filter(is_active=True).first()
    if not image:
        return Response({'image_url': None})
    return Response(AtelierImageSerializer(image, context={'request': request}).data)


