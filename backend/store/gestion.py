"""Espace Gestion — back-office React branché sur des API dédiées, jamais utilisées par le site public.

Accès réservé aux comptes Customer.is_staff=True (activé une fois via l'admin Django, aucun système
de rôle supplémentaire nécessaire).
"""
import os
import uuid
from datetime import date

from django.conf import settings
from django.core.files.storage import storages
from django.db.models import Sum
from rest_framework import viewsets, mixins, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import BasePermission
from rest_framework.response import Response

from accounts.models import Customer
from .models import (
    Category, Product, ProductImage, ProductVariant,
    Order, Review, ContactMessage, StockAlert, HeroBanner, AtelierImage, ShowcaseVideo,
)
from .emails import send_order_status_email
from .gestion_serializers import (
    GestionCategorySerializer,
    GestionProductSerializer, GestionProductImageSerializer, GestionProductVariantSerializer,
    GestionOrderSerializer, GestionReviewSerializer, GestionContactMessageSerializer,
    GestionStockAlertSerializer, GestionHeroBannerSerializer, GestionAtelierImageSerializer,
    GestionCustomerSerializer, GestionShowcaseVideoSerializer,
)


class IsStaffUser(BasePermission):
    """Autorise uniquement les comptes Customer avec is_staff=True."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


class GestionCategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all().order_by('order', 'name')
    serializer_class = GestionCategorySerializer
    permission_classes = [IsStaffUser]



class GestionProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().select_related('category').prefetch_related('images', 'variants').order_by('-created_at')
    serializer_class = GestionProductSerializer
    permission_classes = [IsStaffUser]


class GestionProductImageViewSet(viewsets.ModelViewSet):
    queryset = ProductImage.objects.all().order_by('order')
    serializer_class = GestionProductImageSerializer
    permission_classes = [IsStaffUser]

    def get_queryset(self):
        qs = super().get_queryset()
        product_id = self.request.query_params.get('product')
        return qs.filter(product_id=product_id) if product_id else qs


class GestionProductVariantViewSet(viewsets.ModelViewSet):
    queryset = ProductVariant.objects.all()
    serializer_class = GestionProductVariantSerializer
    permission_classes = [IsStaffUser]

    def get_queryset(self):
        qs = super().get_queryset()
        product_id = self.request.query_params.get('product')
        return qs.filter(product_id=product_id) if product_id else qs


class GestionOrderViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet):
    queryset = Order.objects.all().prefetch_related('items').order_by('-created_at')
    serializer_class = GestionOrderSerializer
    permission_classes = [IsStaffUser]

    def perform_update(self, serializer):
        previous_status = serializer.instance.status
        order = serializer.save()
        if order.status != previous_status:
            send_order_status_email(order)


class GestionReviewViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.UpdateModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet):
    queryset = Review.objects.all().select_related('product', 'customer').order_by('-created_at')
    serializer_class = GestionReviewSerializer
    permission_classes = [IsStaffUser]


class GestionContactMessageViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.UpdateModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet):
    queryset = ContactMessage.objects.all().order_by('-created_at')
    serializer_class = GestionContactMessageSerializer
    permission_classes = [IsStaffUser]


class GestionStockAlertViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = StockAlert.objects.all().select_related('product').order_by('-created_at')
    serializer_class = GestionStockAlertSerializer
    permission_classes = [IsStaffUser]


class GestionHeroBannerViewSet(mixins.ListModelMixin, mixins.CreateModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet):
    queryset = HeroBanner.objects.all().order_by('-updated_at')
    serializer_class = GestionHeroBannerSerializer
    permission_classes = [IsStaffUser]


class GestionAtelierImageViewSet(mixins.ListModelMixin, mixins.CreateModelMixin, mixins.DestroyModelMixin, viewsets.GenericViewSet):
    queryset = AtelierImage.objects.all().order_by('order', '-updated_at')
    serializer_class = GestionAtelierImageSerializer
    permission_classes = [IsStaffUser]

    def get_queryset(self):
        """
        `?emplacement=accueil` isole un emplacement.

        Sans ce filtre, les deux blocs de l'Espace Gestion afficheraient le
        même tas d'images et le propriétaire ne saurait pas laquelle part où.
        """
        qs = super().get_queryset()
        emplacement = self.request.query_params.get('emplacement')
        return qs.filter(emplacement=emplacement) if emplacement else qs


class GestionShowcaseVideoViewSet(viewsets.ModelViewSet):
    queryset = ShowcaseVideo.objects.all()
    serializer_class = GestionShowcaseVideoSerializer
    permission_classes = [IsStaffUser]

    @action(detail=False, methods=['post'], url_path='lien-envoi')
    def lien_envoi(self, request):
        """Délivre une URL signée pour déposer la vidéo DIRECTEMENT sur R2.

        ── Pourquoi le fichier ne passe plus par ici ────────────────────────
        Il n'y arrivait pas. L'envoi répondait 502 Bad Gateway, et les journaux
        de Render ne montraient aucune trace de la requête : elle mourait dans
        le proxy, avant Django. L'instance gratuite s'endort au bout de quinze
        minutes d'inactivité ; au réveil, le proxy ne peut pas garder en
        mémoire des dizaines de mégaoctets le temps que le conteneur démarre.
        Une petite requête survit à ce réveil, une vidéo non.

        Et même réveillée, la route était absurde : le fichier partait de Dakar
        vers l'Oregon, puis l'Oregon le repoussait vers un bucket en Europe.
        Deux traversées de l'Atlantique pour un fichier qui doit finir à
        Cloudflare, lequel a un point de présence à Dakar même.

        Le navigateur dépose donc sur R2 par cette URL signée, puis ne poste
        ici qu'une ligne de texte : la clé de l'objet. Django n'a plus à porter
        le poids.

        ── Ce que l'URL autorise ────────────────────────────────────────────
        Une seule écriture, sur une seule clé que le serveur choisit, pendant
        une heure. Le client ne décide ni de l'emplacement ni du nom : il ne
        peut donc pas écraser un objet existant.
        """
        if not settings.R2_ENABLED:
            # Sans R2, il n'y a pas de dépôt direct possible : le formulaire
            # retombe sur l'envoi classique en multipart, qui reste en place.
            return Response({'disponible': False})

        nom = (request.data.get('nom') or 'video.mp4').strip()
        extension = os.path.splitext(nom)[1].lower() or '.mp4'
        if extension not in ('.mp4', '.webm', '.mov', '.m4v'):
            return Response(
                {'detail': f"Format non accepté : {extension}. Utilisez .mp4, .webm ou .mov."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Le serveur nomme, jamais le client : un nom venu du navigateur
        # pourrait viser une clé déjà prise, ou sortir du dossier des vidéos.
        cle = f'videos/{uuid.uuid4().hex}{extension}'
        type_mime = request.data.get('type') or 'video/mp4'

        stockage = storages['videos']
        client = stockage.connection.meta.client
        url = client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': stockage.bucket_name,
                'Key': cle,
                # Signé, donc le navigateur devra envoyer exactement cette
                # valeur. C'est elle que R2 renverra ensuite aux visiteurs :
                # sans elle, la balise <video> reçoit un octet-stream et refuse
                # de lire.
                'ContentType': type_mime,
            },
            ExpiresIn=3600,
        )
        return Response({'disponible': True, 'url': url, 'cle': cle, 'type': type_mime})


class GestionCustomerViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet):
    queryset = Customer.objects.all().order_by('-date_joined')
    serializer_class = GestionCustomerSerializer
    permission_classes = [IsStaffUser]

    def perform_update(self, serializer):
        instance = serializer.instance
        revoking_self = (
            instance.pk == self.request.user.pk
            and 'is_staff' in serializer.validated_data
            and not serializer.validated_data['is_staff']
        )
        if revoking_self:
            raise ValidationError("Vous ne pouvez pas retirer votre propre accès à l'Espace Gestion.")
        serializer.save()


@api_view(['GET'])
@permission_classes([IsStaffUser])
def dashboard_stats(request):
    today = date.today()
    month_start = today.replace(day=1)

    orders_today = Order.objects.filter(created_at__date=today).count()
    revenue_month = Order.objects.filter(
        created_at__date__gte=month_start, payment_status='paid'
    ).aggregate(total=Sum('total'))['total'] or 0
    low_stock_count = Product.objects.filter(is_active=True, stock__lte=3).count()
    pending_reviews = Review.objects.filter(is_approved=False).count()
    unread_messages = ContactMessage.objects.filter(is_read=False).count()
    pending_orders = Order.objects.filter(status='pending').count()

    return Response({
        'orders_today': orders_today,
        'revenue_month': revenue_month,
        'low_stock_count': low_stock_count,
        'pending_reviews': pending_reviews,
        'unread_messages': unread_messages,
        'pending_orders': pending_orders,
    })
