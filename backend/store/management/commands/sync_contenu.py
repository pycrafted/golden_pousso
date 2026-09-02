"""Aligne les titres de sections de la production sur ceux du développement.

Le code voyage par git, le contenu non : la base de production est un
PostgreSQL distinct du SQLite local. Les titres réglés en développement
n'atteignaient donc jamais le site déployé, et il fallait les ressaisir à la
main dans l'Espace Gestion après chaque remise à zéro.

`build.sh` l'appelle à chaque mise en ligne. Elle est donc idempotente : un
titre n'est écrit que s'il diffère de celui attendu.

Elle ne touche NI aux produits, NI aux rayons, NI aux commandes : ce sont des
données de la boutique, saisies par le propriétaire, et les écraser depuis un
poste de développement détruirait son travail.

⚠ Elle a porté un temps les cinq tableaux du hero. Ils sont désormais servis
par le FRONT (frontend/public/images/hero/, listés dans constants/hero.js) :
sans domaine personnalisé, Cloudflare R2 ne sert que par son adresse r2.dev,
qu'il bride volontairement, et un tableau sur cinq n'arrivait pas.
"""

from django.core.management.base import BaseCommand

from store.models import SectionTexte

# Les titres réglés en développement. La clé est celle que lit le frontend.
TEXTES = {
    'accueil-atelier':    'L’élégance africaine',
    'accueil-avis':       'Elles Nous Font Confiance',
    'accueil-categories': 'Notre catalogue',
    'accueil-contact':    'Parlons de votre pièce',
    'accueil-creations':  'En vitrine',
    'accueil-mouvement':  'Le tissu en mouvement',
    'accueil-promotion':  'Promotion',
    'accueil-selection':  'Nos plus belles pièces',
}


class Command(BaseCommand):
    help = "Aligne les titres de sections sur ceux du développement."

    def handle(self, *args, **options):
        self._textes()

    # ── Les titres ────────────────────────────────────────────────────────
    def _textes(self):
        touches = 0
        for cle, titre in TEXTES.items():
            # update_or_create et non filter().update() : sur une base neuve,
            # la ligne n'existe pas encore et l'update ne ferait rien.
            objet, cree = SectionTexte.objects.get_or_create(
                cle=cle, defaults={'titre': titre},
            )
            if not cree and objet.titre != titre:
                objet.titre = titre
                objet.save(update_fields=['titre'])
                cree = True
            if cree:
                touches += 1
                self.stdout.write(f'  texte  {cle} : {titre}')
        self.stdout.write(self.style.SUCCESS(
            f'Titres de sections : {touches} modifié(s), {len(TEXTES) - touches} déjà à jour.'
        ))
