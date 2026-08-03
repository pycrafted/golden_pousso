from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string


def _order_subject(order):
    return f"Golden Pousso — Commande #{order.order_number}"


def _format_fcfa(amount):
    return f"{int(amount):,} FCFA".replace(',', ' ')


def _build_order_body(order):
    items_lines = '\n'.join(
        f"  • {item.product_name} x{item.quantity} — {_format_fcfa(item.line_total)}"
        for item in order.items.all()
    )

    payment_labels = {
        'orange_money': 'Orange Money',
        'wave': 'Wave',
        'free_money': 'Free Money',
        'cash_on_delivery': 'Paiement à la livraison',
        'card': 'Carte bancaire (PayDunya)',
    }
    zone_labels = {
        'dakar_centre': 'Dakar Centre',
        'dakar_banlieue': 'Dakar Banlieue / Pikine',
        'thies': 'Thiès et environs',
        'pickup': 'Retrait en boutique (Pikine Tally Boumack)',
    }

    return f"""Bonjour {order.customer_name},

Votre commande a bien été enregistrée chez Golden Pousso.

────────────────────────────────
  COMMANDE #{order.order_number}
────────────────────────────────

Articles :
{items_lines}

Sous-total  : {_format_fcfa(order.subtotal)}
Livraison   : {'Gratuit' if order.delivery_fee == 0 else _format_fcfa(order.delivery_fee)}
─────────────────────────────
TOTAL       : {_format_fcfa(order.total)}

Mode de paiement : {payment_labels.get(order.payment_method, order.payment_method)}
Zone de livraison : {zone_labels.get(order.delivery_zone, order.delivery_zone)}
{f'Adresse : {order.delivery_address}' if order.delivery_address else ''}

Vous pouvez suivre votre commande sur :
{settings.FRONTEND_URL}/commande/suivi/{order.order_number}?phone={order.customer_phone}

────────────────────────────────
Pour toute question, contactez-nous :
  WhatsApp / Tel : {getattr(settings, 'CONTACT_PHONE', '+221 XX XXX XX XX')}
  Email          : {getattr(settings, 'CONTACT_EMAIL', 'contact@goldenpousso.com')}

Merci pour votre confiance !
L'équipe Golden Pousso — La couture africaine autrement !
"""


def send_order_confirmation_email(order):
    """Envoie un email de confirmation au client si un email est renseigné."""
    if not order.customer_email:
        return
    try:
        send_mail(
            subject=_order_subject(order),
            message=_build_order_body(order),
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'Golden Pousso <noreply@goldenpousso.com>'),
            recipient_list=[order.customer_email],
            fail_silently=True,
        )
    except Exception:
        pass


def send_stock_alert_emails(product):
    """Notifie les clients en attente qu'un produit est de nouveau disponible."""
    from .models import StockAlert
    alerts = StockAlert.objects.filter(product=product, notified=False)
    subject = f"Golden Pousso — {product.name} est de nouveau disponible !"
    body = f"""Bonjour,

Bonne nouvelle : {product.name} est de nouveau en stock chez Golden Pousso !

Découvrez-le ici :
{settings.FRONTEND_URL}/produit/{product.slug}

L'équipe Golden Pousso
"""
    for alert in alerts:
        try:
            send_mail(
                subject=subject,
                message=body,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'Golden Pousso <noreply@goldenpousso.com>'),
                recipient_list=[alert.email],
                fail_silently=True,
            )
        except Exception:
            pass
    alerts.update(notified=True)


def send_order_status_email(order):
    """Notifie le client d'un changement de statut."""
    if not order.customer_email:
        return
    status_labels = {
        'confirmed': 'confirmée',
        'processing': 'en préparation',
        'shipped': 'expédiée',
        'delivered': 'livrée',
        'cancelled': 'annulée',
    }
    status_label = status_labels.get(order.status, order.status)
    body = f"""Bonjour {order.customer_name},

Votre commande #{order.order_number} est maintenant {status_label}.

Suivez votre commande :
{settings.FRONTEND_URL}/commande/suivi/{order.order_number}?phone={order.customer_phone}

L'équipe Golden Pousso
"""
    try:
        send_mail(
            subject=f"Golden Pousso — Commande #{order.order_number} {status_label}",
            message=body,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'Golden Pousso <noreply@goldenpousso.com>'),
            recipient_list=[order.customer_email],
            fail_silently=True,
        )
    except Exception:
        pass
