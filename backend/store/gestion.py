"""Espace Gestion — back-office React branché sur des API dédiées, jamais utilisées par le site public.

Accès réservé aux comptes Customer.is_staff=True (activé une fois via l'admin Django, aucun système
de rôle supplémentaire nécessaire).
"""
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import ProtectedError
from rest_framework import viewsets, mixins, status, generics
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import BasePermission
from rest_framework.response import Response

from accounts.models import Customer
from .models import (
    Category, Product, ProductImage, ProductVariant,
    Order, ShowcaseVideo, Coordonnees,
)
from .emails import send_order_status_email
# Le rendu au stock d'une commande qui n'aboutit pas vit dans views.py (chemin
# PayDunya) : la suppression d'une commande s'en sert aussi. views.py n'importe
# rien d'ici, il n'y a donc pas de cycle.
from .views import _restore_order_stock
from .gestion_serializers import (
    GestionCategorySerializer,
    GestionCoordonneesSerializer,
    GestionProductSerializer, GestionProductImageSerializer, GestionProductVariantSerializer,
    GestionOrderSerializer,
    GestionCustomerSerializer, GestionShowcaseVideoSerializer,
)


class IsStaffUser(BasePermission):
    """Autorise uniquement les comptes Customer avec is_staff=True."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


class GestionCategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.par_rang()
    serializer_class = GestionCategorySerializer
    permission_classes = [IsStaffUser]

    def destroy(self, request, *args, **kwargs):
        """Une suppression refusée se dit en clair, au lieu d'une erreur 500.

        Deux refus possibles : des pièces sont encore rangées dans la catégorie
        ou dans l'une de ses sous-catégories (`Product.category` en PROTECT), ou
        c'est l'un des cinq rayons de la maison (`Category.delete`).
        """
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {'detail': "Des pièces sont encore rangées dans cette catégorie ou "
                           "dans l'une de ses sous-catégories : déplacez-les ou "
                           "supprimez-les d'abord."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except DjangoValidationError as erreur:
            return Response({'detail': ' '.join(erreur.messages)}, status=status.HTTP_400_BAD_REQUEST)



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


class GestionOrderViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin,
                          mixins.UpdateModelMixin, mixins.DestroyModelMixin,
                          viewsets.GenericViewSet):
    # Les commandes PAYÉES seulement, à la demande : c'est le paiement qui
    # active une commande, on ne prépare pas une commande non payée. Une
    # commande dont le paiement PayDunya n'a pas abouti reste lisible dans
    # /admin/.
    queryset = Order.objects.filter(payment_status='paid').prefetch_related('items').order_by('-created_at')
    serializer_class = GestionOrderSerializer
    permission_classes = [IsStaffUser]

    def perform_update(self, serializer):
        previous_status = serializer.instance.status
        order = serializer.save()
        if order.status != previous_status:
            send_order_status_email(order)

    # Une commande jamais expédiée : ses pièces n'ont pas quitté la boutique.
    # Les supprimer sans les remettre en rayon laisserait le catalogue annoncer
    # moins de stock qu'il n'y en a — une commande d'essai effacée retiendrait
    # sa taille pour toujours. Une commande partie (« En livraison », « Livrée »)
    # ne rend rien : les pièces sont dehors.
    STATUTS_JAMAIS_PARTIE = ('confirmed', 'cancelled')

    def perform_destroy(self, instance):
        """Supprime une commande, à la demande — définitif.

        Ses lignes partent avec elle (`OrderItem.order` en CASCADE) ; le client,
        lui, n'est pas touché (la commande ne lui est liée que par téléphone).
        Rien n'est envoyé au client : une commande supprimée n'a pas de statut
        à annoncer.
        """
        if instance.status in self.STATUTS_JAMAIS_PARTIE:
            _restore_order_stock(instance)
        instance.delete()


# Les pages « Messages » et « Alertes de réassort » de l'Espace Gestion ont été
# supprimées à la demande, avec leurs API (`/gestion/messages/`,
# `/gestion/stock-alerts/`). Les deux modèles restent : le site enregistre
# toujours un message de contact et une demande de réassort, l'e-mail de retour
# en stock part toujours, et les deux listes se consultent dans /admin/.


class GestionShowcaseVideoViewSet(viewsets.ModelViewSet):
    queryset = ShowcaseVideo.objects.all()
    serializer_class = GestionShowcaseVideoSerializer
    permission_classes = [IsStaffUser]

    # Plus de `lien-envoi` (URL signée pour déposer un fichier sur R2) : une
    # vidéo se fournit par son lien Cloudflare uniquement, à la demande.


class GestionCustomerViewSet(viewsets.ModelViewSet):
    """Les comptes utilisateurs : création, modification, type (client /
    admin), désactivation et suppression, à la demande — un admin ne peut ni se
    repasser client, ni se désactiver, ni se supprimer lui-même.

    Un compte naissait uniquement de l'inscription du site ; l'Espace Gestion
    en crée maintenant (`POST`), ce qui est le seul moyen d'ouvrir l'accès à un
    second admin sans ligne de commande.

    Supprimer un compte n'efface pas ses commandes : elles ne lui sont pas
    rattachées par clé étrangère mais par téléphone (`Order.customer_phone`)."""
    queryset = Customer.objects.all().order_by('-date_joined')
    serializer_class = GestionCustomerSerializer
    permission_classes = [IsStaffUser]

    def perform_update(self, serializer):
        donnees = serializer.validated_data
        if serializer.instance.pk == self.request.user.pk:
            if 'is_staff' in donnees and not donnees['is_staff']:
                raise ValidationError("Vous ne pouvez pas vous repasser vous-même en client.")
            if 'is_active' in donnees and not donnees['is_active']:
                raise ValidationError("Vous ne pouvez pas désactiver votre propre compte.")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.pk == self.request.user.pk:
            raise ValidationError("Vous ne pouvez pas supprimer votre propre compte.")
        instance.delete()


# Le tableau de bord de l'Espace Gestion a été supprimé à la demande, avec son
# API `/gestion/dashboard/` : elle ne servait qu'à lui (commandes du jour,
# chiffre d'affaires du mois, stock faible, commandes en attente). `/gestion`
# redirige désormais vers les commandes.


class GestionCoordonneesView(generics.RetrieveUpdateAPIView):
    """Les coordonnées de la boutique — une seule ligne, donc pas de liste.

    `RetrieveUpdateAPIView` et non un ViewSet : il n'y a rien à créer ni à
    supprimer, et l'adresse de la ressource ne porte pas d'identifiant
    (/gestion/coordonnees/). `charger()` crée la ligne au premier passage :
    le formulaire s'ouvre toujours rempli, jamais sur un 404.
    """
    serializer_class = GestionCoordonneesSerializer
    permission_classes = [IsStaffUser]

    def get_object(self):
        return Coordonnees.charger()
