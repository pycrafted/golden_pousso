import re

import requests as http_requests
from django.conf import settings as django_settings
from django.db import transaction
from rest_framework import generics, filters, status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.throttling import AnonRateThrottle


class ContactRateThrottle(AnonRateThrottle):
    scope = 'contact'
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, F, Max, Min, Q
from django.shortcuts import get_object_or_404
from .models import Category, Product, Order, ContactMessage, HeroBanner, HeroPromotion, AtelierImage, Review, StockAlert, ShowcaseVideo, SectionTexte
from .serializers import (
    CategorySerializer,
    ProductListSerializer, ProductDetailSerializer,
    OrderCreateSerializer, OrderOutputSerializer, ContactMessageSerializer,
    HeroBannerSerializer, HeroPromotionSerializer, AtelierImageSerializer,
    ReviewSerializer, ReviewCreateSerializer, StockAlertCreateSerializer,
    ShowcaseVideoSerializer,
)
from .filters import AVEC_VIDEO, SANS_VIDEO, ProductFilter, a_une_photo
from .emails import send_order_confirmation_email as _send_order_confirmation_email


class CategoryListView(generics.ListAPIView):
    # Le compte est annoté plutôt que calculé par le sérialiseur : sinon
    # chaque rayon déclenche sa propre requête de comptage.
    queryset = (
        Category.objects
        .filter(is_active=True)
        .annotate(nb_produits=Count('products', filter=Q(products__is_active=True)))
        # L'annotation fait perdre le tri du Meta : sans ce order_by
        # explicite, la pagination renvoie des résultats instables.
        .order_by('order', 'name')
    )
    serializer_class = CategorySerializer



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
            .select_related('category')
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
            .select_related('category')
        )


@api_view(['GET'])
def product_facets(request):
    """Ce qu'il y a à filtrer dans un rayon — avant que le moindre filtre ne soit posé.

    La barre de filtres de la page catégorie n'affiche que des contrôles qui
    trouveront quelque chose. Elle a donc besoin de savoir, pour le rayon
    demandé, entre quels prix il vend et combien de pièces sont épuisées, en
    solde ou nouvelles. Sans ces nombres, la seule façon de le deviner côté
    navigateur serait de rapatrier tout le catalogue pour le compter : une
    agrégation SQL le dit en une requête.

    Deux points qui ne sont pas de détail :

    — les bornes de prix décrivent le rayon ENTIER, jamais la sélection
      courante. Les recalculer sur le résultat filtré ferait rétrécir le
      curseur à chaque geste, et l'utilisateur ne pourrait plus revenir aux
      pièces qu'il vient d'exclure ;
    — un compte à zéro n'est pas une erreur, c'est la réponse. Le frontend
      s'en sert pour ne PAS dessiner la bascule correspondante : ce rayon-là
      n'a rien en solde, la proposer serait promettre une page vide.
    """
    qs = Product.objects.filter(is_active=True)
    slug = request.query_params.get('category')
    if slug:
        qs = qs.filter(category__slug=slug)

    remise = Q(old_price__isnull=False, old_price__gt=F('price'))
    # `video` et `photo` comptent ce que MONTRE la carte, pas ce que la pièce
    # possède : une pièce qui a une vidéo et des photos est comptée une seule
    # fois, du côté vidéo. Leur somme peut donc être inférieure au total —
    # une pièce sans aucun média ne tombe dans ni l'un ni l'autre.
    agg = qs.annotate(a_photo=a_une_photo()).aggregate(
        total=Count('id'),
        prix_min=Min('price'),
        prix_max=Max('price'),
        en_stock=Count('id', filter=Q(stock__gt=0)),
        epuise=Count('id', filter=Q(stock__lte=0)),
        en_promo=Count('id', filter=remise),
        nouveautes=Count('id', filter=Q(is_new=True)),
        # Alias en français, comme `en_stock` et `en_promo` — et surtout PAS
        # `video` : un alias d'agrégat qui porte le nom d'un champ du modèle
        # le masque, et le `Q(video='')` du filtre se retrouve comparé au
        # Count au lieu du fichier.
        avec_video=Count('id', filter=AVEC_VIDEO),
        avec_photo=Count('id', filter=SANS_VIDEO & Q(a_photo=True)),
    )

    # Rayon vide : les bornes sont nulles et non 0. Un curseur de 0 à 0 se
    # dessine, un curseur absent se comprend.
    prix_min, prix_max = agg['prix_min'], agg['prix_max']
    return Response({
        'total': agg['total'],
        'price_min': int(prix_min) if prix_min is not None else None,
        'price_max': int(prix_max) if prix_max is not None else None,
        'in_stock': agg['en_stock'],
        'out_of_stock': agg['epuise'],
        'on_sale': agg['en_promo'],
        'is_new': agg['nouveautes'],
        'video': agg['avec_video'],
        'photo': agg['avec_photo'],
    })


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


def _neuf_derniers_chiffres(valeur):
    """Le numéro réduit à ses neuf derniers chiffres.

    Les commandes enregistrent le téléphone tel qu'il a été saisi : tantôt
    « 773520776 », tantôt « +221773520776 ». Le compte client, lui, garde la
    forme locale. Comparer les deux à l'identique ne trouve rien une fois sur
    deux ; on compare donc la partie qui ne change jamais — les neuf chiffres
    de l'abonné, sans indicatif ni séparateur.
    """
    chiffres = re.sub(r'\D', '', valeur or '')
    return chiffres[-9:] if len(chiffres) >= 9 else ''


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_orders(request):
    """Les commandes du client connecté.

    ⚠ CE FILTRE A ÉTÉ UNE FUITE DE DONNÉES. Il s'écrivait
    `filter(customer_email=request.user.email)`. Or le site identifie ses
    clients par TÉLÉPHONE, pas par e-mail : plus de la moitié des comptes ont
    un e-mail vide. La requête devenait `customer_email=''` et renvoyait à ces
    clients-là toutes les commandes passées sans e-mail — nom, téléphone,
    adresse et contenu du panier de quelqu'un d'autre.

    D'où les deux règles ci-dessous :

    — on cherche d'abord par téléphone, la clé réelle du compte ;
    — une valeur VIDE n'entre jamais dans le filtre. Sans cette précaution,
      n'importe quel champ vide rouvre exactement le même trou.

    Sans téléphone ni e-mail, la réponse est une liste vide : mieux vaut ne
    rien montrer que montrer ce qui n'est pas à soi.
    """
    from .models import Order

    critere = Q()
    trouve = False

    tel = _neuf_derniers_chiffres(request.user.phone)
    if tel:
        critere |= Q(customer_phone__endswith=tel)
        trouve = True

    email = (request.user.email or '').strip()
    if email:
        critere |= Q(customer_email__iexact=email)
        trouve = True

    if not trouve:
        return Response([])

    orders = (Order.objects
              .filter(critere)
              .prefetch_related('items')
              .order_by('-created_at'))
    return Response(OrderOutputSerializer(orders, many=True).data)


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


_IPN_KEY_PART = re.compile(r'[^\[\]]+')


def _unflatten_bracket_keys(flat):
    """Reconstruit l'arbre derrière des clés du type data[invoice][token].

    PayDunya poste ses notifications en x-www-form-urlencoded avec la notation
    PHP des tableaux imbriqués. Django lit ces clés littéralement — crochets
    compris — au lieu de les déplier, d'où ce recollage.
    """
    tree = {}
    for key, value in flat.items():
        parts = _IPN_KEY_PART.findall(key)
        if not parts:
            continue
        node = tree
        for part in parts[:-1]:
            child = node.get(part)
            if not isinstance(child, dict):
                child = {}
                node[part] = child
            node = child
        node[parts[-1]] = value
    return tree


def _paydunya_ipn_payload(request):
    """Les données de la notification, qu'elles arrivent en JSON ou en formulaire."""
    body = request.data

    # JSON : la structure est déjà imbriquée sous « data »
    if isinstance(body, dict):
        nested = body.get('data')
        if isinstance(nested, dict):
            return nested

    # Formulaire : les clés portent encore leurs crochets
    if hasattr(body, 'items'):
        rebuilt = _unflatten_bracket_keys({k: body[k] for k in body})
        nested = rebuilt.get('data')
        if isinstance(nested, dict):
            return nested
        return rebuilt

    return {}


def _restore_order_stock(order):
    """Remet en rayon les articles d'une commande qui n'aboutira pas."""
    with transaction.atomic():
        for item in order.items.select_related('product', 'variant').all():
            if item.variant:
                item.variant.stock += item.quantity
                item.variant.save(update_fields=['stock'])
            else:
                item.product.stock += item.quantity
                item.product.save(update_fields=['stock'])


@api_view(['POST'])
@permission_classes([AllowAny])
def paydunya_initiate(request):
    serializer = OrderCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    order = serializer.save()

    frontend_url = django_settings.FRONTEND_URL
    backend_url = django_settings.BACKEND_URL

    # La facture PayDunya affiche ce qu'on lui donne : sans « items », le client
    # ne voit qu'un montant nu au moment de taper son code secret. Ces montants
    # sont purement décoratifs — PayDunya facture sur « total_amount ».
    items = {}
    for i, item in enumerate(order.items.select_related('variant').all()):
        details = []
        if item.variant:
            if item.variant.size:
                details.append(f'Taille {item.variant.size}')
            if item.variant.color:
                details.append(item.variant.color)
        items[f'item_{i}'] = {
            'name': item.product_name,
            'quantity': item.quantity,
            'unit_price': str(int(item.product_price)),
            'total_price': str(int(item.line_total)),
            'description': ' · '.join(details),
        }

    taxes = {}
    if order.delivery_fee:
        taxes['tax_0'] = {
            'name': f'Livraison — {order.get_delivery_zone_display()}',
            'amount': int(order.delivery_fee),
        }

    payload = {
        'invoice': {
            'items': items,
            'taxes': taxes,
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
        _restore_order_stock(order)
        order.delete()
        return Response({'detail': 'Erreur de connexion PayDunya. Réessayez.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    if data.get('response_code') != '00':
        _restore_order_stock(order)
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
    data = _paydunya_ipn_payload(request)
    invoice_data = data.get('invoice') if isinstance(data.get('invoice'), dict) else {}
    custom_data = data.get('custom_data') if isinstance(data.get('custom_data'), dict) else {}

    # PayDunya ajoute aussi ?token=… à l'URL, dernier recours si le corps déçoit
    token = invoice_data.get('token') or request.GET.get('token', '')
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
        _restore_order_stock(order)

    return Response({'detail': 'OK'})


# ── Avis clients ──────────────────────────────────────────────


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def product_reviews(request, slug):
    product = get_object_or_404(Product, slug=slug, is_active=True)

    if request.method == 'GET':
        reviews = product.reviews.filter(is_approved=True).select_related('customer').order_by('-created_at')
        return Response(ReviewSerializer(reviews, many=True, context={'request': request}).data)

    if not request.user.is_authenticated:
        return Response({'detail': 'Connectez-vous pour laisser un avis.'}, status=status.HTTP_401_UNAUTHORIZED)

    if Review.objects.filter(product=product, customer=request.user).exists():
        return Response({'detail': 'Vous avez déjà laissé un avis pour ce produit.'}, status=status.HTTP_400_BAD_REQUEST)

    serializer = ReviewCreateSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(product=product, customer=request.user)
        return Response({'detail': 'Merci pour votre avis ! Il sera visible après modération.'}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def recent_reviews(request):
    """Derniers avis approuvés, tous produits confondus — pour la section « Avis Clients » de la homepage."""
    reviews = (
        Review.objects
        .filter(is_approved=True)
        .select_related('product', 'customer')
        .order_by('-created_at')[:8]
    )
    return Response(ReviewSerializer(reviews, many=True, context={'request': request}).data)


# ── Alertes de réassort ───────────────────────────────────────


@api_view(['POST'])
@permission_classes([AllowAny])
def stock_alert_create(request, slug):
    product = get_object_or_404(Product, slug=slug)
    serializer = StockAlertCreateSerializer(data=request.data)
    if serializer.is_valid():
        StockAlert.objects.get_or_create(product=product, email=serializer.validated_data['email'])
        return Response(
            {'detail': 'Vous serez averti(e) dès que ce produit sera de nouveau disponible.'},
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def hero_promotion(request):
    """La campagne du jour, ou un objet vide.

    Deux choix qui ne sont pas de détail :

    — un 200 et non un 404. L'absence de promotion est l'état NORMAL du hero,
      pas une erreur : un 404 obligerait le frontend à traiter un cas d'échec
      pour une situation ordinaire, et remplirait la console du navigateur
      tous les jours de l'année sauf pendant les campagnes ;
    — un objet VIDE et non `None`. `Response(None)` rend un corps vide, que le
      client reçoit comme une chaîne — pas comme `null`. Un `{}` se teste
      d'une seule façon des deux côtés.
    """
    promo = HeroPromotion.en_cours()
    return Response(HeroPromotionSerializer(promo).data if promo else {})


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
    """
    Les images de l'atelier, groupées par emplacement.

    `image_url` reste la première image de la page À propos : tout code
    existant continue de fonctionner sans changement.
    """
    images = AtelierImage.objects.filter(is_active=True)

    def serialise(emplacement):
        lot = [i for i in images if i.emplacement == emplacement]
        return AtelierImageSerializer(lot, many=True, context={'request': request}).data

    apropos = serialise('apropos')
    return Response({
        'image_url': apropos[0]['image_url'] if apropos else None,
        'apropos': apropos,
        'accueil': serialise('accueil'),
        'promotion': serialise('promotion'),
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def textes_sections(request):
    """
    Les intitulés de sections, indexés par clé.

    Un objet plutôt qu'une liste : le frontend interroge une clé précise, il
    n'a jamais besoin de parcourir l'ensemble.
    """
    textes = SectionTexte.objects.all()
    return Response({
        t.cle: {'surtitre': t.surtitre, 'titre': t.titre}
        for t in textes
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def showcase_videos(request):
    # select_related sur la pièce + prefetch sur ses images : sans ça, chaque
    # vidéo rattachée à un produit coûte deux requêtes de plus pour peupler sa
    # carte (le produit, puis sa photo principale).
    videos = (
        ShowcaseVideo.objects
        .filter(is_active=True)
        .select_related('product')
        .prefetch_related('product__images')
    )
    return Response(ShowcaseVideoSerializer(videos, many=True, context={'request': request}).data)


