"""
Avis de démonstration — pour voir la section « Avis Clients » de la page
d'accueil, qui se masque tant qu'aucun avis approuvé n'existe.

⚠ DONNÉES FICTIVES. Ce ne sont pas de vrais retours clients. Publier de faux
avis sur une boutique en ligne est trompeur pour l'acheteur et illégal dans
plusieurs juridictions. Cette commande est un outil de développement :

    python manage.py seed_demo_reviews            # crée
    python manage.py seed_demo_reviews --delete   # supprime tout

Tout ce qu'elle crée est reconnaissable au préfixe `demo-review-` sur le
`username` des clients, ce qui rend la suppression sûre et complète. Rien
d'autre dans la base ne porte ce préfixe.

Refuse de s'exécuter si DEBUG est faux : cette commande n'a rien à faire en
production.
"""

from django.core.management.base import BaseCommand, CommandError
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction

from store.models import Product, Review

PREFIXE = 'demo-review-'

# Rédigés comme de vrais retours : une pièce, une occasion, un détail concret.
# Une note de 4 parmi les 5 — un mur de 5 étoiles ne trompe personne.
AVIS = [
    {
        'prenom': 'Aminata', 'nom': 'Fall', 'note': 5,
        'texte': "Commandé le lundi, livré le mercredi à Sacré-Cœur. La coupe "
                 "tombe exactement comme sur la photo et le tissu ne gratte "
                 "pas du tout. Je l'ai portée toute la journée sans y penser.",
    },
    {
        'prenom': 'Bineta', 'nom': 'Sarr', 'note': 5,
        'texte': "Le boubou a fait son effet à la Tabaski. Trois personnes "
                 "m'ont demandé où je l'avais trouvé. Les finitions sont "
                 "propres jusqu'à l'intérieur des coutures.",
    },
    {
        'prenom': 'Khady', 'nom': 'Ba', 'note': 4,
        'texte': "Très belle pièce, la broderie est fine. Il m'a fallu une "
                 "retouche à la taille — faite à l'atelier en deux jours, sans "
                 "discussion. Juste un peu d'attente sur ma taille.",
    },
    {
        'prenom': 'Fatou', 'nom': 'Ndiaye', 'note': 5,
        'texte': "J'hésitais sur la taille, j'ai écrit sur WhatsApp et on m'a "
                 "répondu dans l'heure avec les mesures exactes. Commandé "
                 "ensuite les yeux fermés, c'était juste.",
    },
    {
        'prenom': 'Awa', 'nom': 'Diop', 'note': 5,
        'texte': "La couleur est encore plus belle en vrai qu'à l'écran. "
                 "Emballage soigné, et le livreur a appelé avant de passer "
                 "comme annoncé.",
    },
    {
        'prenom': 'Mariama', 'nom': 'Cissé', 'note': 4,
        'texte': "Deuxième commande. Qualité constante, c'est ce que je "
                 "cherchais. Le paiement par Wave a fonctionné du premier coup.",
    },
]


class Command(BaseCommand):
    help = "Crée (ou supprime) des avis clients FICTIFS pour le développement."

    def add_arguments(self, parser):
        parser.add_argument(
            '--delete', action='store_true',
            help='Supprime les avis et les clients de démonstration.',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError(
                "DEBUG est faux : refus de créer de faux avis sur une base de "
                "production. Cette commande est réservée au développement."
            )

        Customer = get_user_model()
        demo = Customer.objects.filter(username__startswith=PREFIXE)

        if options['delete']:
            # Review a un on_delete=CASCADE sur customer : supprimer les
            # clients emporte leurs avis.
            n = demo.count()
            demo.delete()
            self.stdout.write(self.style.SUCCESS(
                f"{n} client(s) de démonstration supprimé(s), avis compris."
            ))
            return

        produits = list(Product.objects.filter(is_active=True)[:len(AVIS)])
        if not produits:
            raise CommandError("Aucun produit actif : rien à commenter.")

        crees = 0
        for i, avis in enumerate(AVIS[:len(produits)]):
            client, _ = Customer.objects.get_or_create(
                username=f"{PREFIXE}{i}",
                defaults={
                    'first_name': avis['prenom'],
                    'last_name': avis['nom'],
                    # Compte inutilisable : pas de mot de passe exploitable et
                    # connexion refusée. Un jeu de démonstration ne doit jamais
                    # ouvrir une porte d'entrée.
                    'is_active': False,
                },
            )
            client.set_unusable_password()
            client.save(update_fields=['password'])

            # unique_together (product, customer) : get_or_create évite le
            # doublon si la commande est relancée.
            _, nouveau = Review.objects.get_or_create(
                product=produits[i],
                customer=client,
                defaults={
                    'rating': avis['note'],
                    'comment': avis['texte'],
                    'is_approved': True,
                },
            )
            crees += int(nouveau)

        self.stdout.write(self.style.SUCCESS(
            f"{crees} avis de démonstration créé(s) sur {len(produits)} produit(s).\n"
            f"Pour tout retirer : python manage.py seed_demo_reviews --delete"
        ))
