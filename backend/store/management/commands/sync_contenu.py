"""Aligne le contenu éditorial de la production sur celui du poste de travail.

Pourquoi cette commande existe
------------------------------
Le code voyage par git, le contenu non. `backend/media/` est ignoré par git et
la base de production est un PostgreSQL distinct du SQLite local : les images
du hero et les titres de sections réglés en développement n'atteignent jamais
le site déployé. On les recopiait à la main dans l'Espace Gestion après chaque
mise en ligne — cinq téléversements et huit champs, à refaire à chaque fois
qu'on repart d'une base vide.

Elle transporte donc, et seulement :

    — les cinq tableaux du défilé du hero, livrés dans `seed_assets/hero/` ;
    — les titres de sections, écrits ci-dessous.

Elle ne touche NI aux produits, NI aux rayons, NI aux commandes : ce sont des
données de la boutique, saisies par le propriétaire, et les écraser depuis un
poste de développement détruirait son travail.

Idempotente, et c'est la condition pour la lancer au déploiement
----------------------------------------------------------------
`build.sh` l'appelle à chaque mise en ligne. Elle doit donc pouvoir tourner
dix fois de suite sans rien abîmer :

    — un titre de section n'est écrit que s'il diffère ;
    — une image n'est envoyée que si son empreinte n'est pas déjà en base.

C'est cette empreinte qui fait tout le travail. Comparer les noms de fichiers
ne suffirait pas : le stockage renomme (`hero-1_a8Fk2.jpg`) pour éviter les
collisions, si bien qu'à chaque déploiement on croirait l'image absente et on
en publierait une copie de plus.

⚠ `--force` republie les images même si elles sont déjà là. À n'utiliser que
pour remplacer un défilé par un autre, jamais au déploiement.
"""
import hashlib
from pathlib import Path

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand

from store.models import AtelierImage, SectionTexte

DOSSIER = Path(__file__).resolve().parent.parent.parent / 'seed_assets' / 'hero'

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


def empreinte(octets):
    """Les douze premiers caractères du SHA-256 — assez pour identifier."""
    return hashlib.sha256(octets).hexdigest()[:12]


class Command(BaseCommand):
    help = "Aligne les tableaux du hero et les titres de sections sur ceux du développement."

    def add_arguments(self, parser):
        parser.add_argument(
            '--force', action='store_true',
            help="Republie les images même si elles sont déjà en ligne.",
        )

    def handle(self, *args, **options):
        self._textes()
        self._hero(force=options['force'])

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

    # ── Le défilé ─────────────────────────────────────────────────────────
    def _hero(self, force=False):
        fichiers = sorted(DOSSIER.glob('hero-*.jpg'))
        if not fichiers:
            self.stdout.write(self.style.WARNING(
                f'Aucun tableau dans {DOSSIER} — rien à publier.'
            ))
            return

        existantes = AtelierImage.objects.filter(emplacement='promotion')

        # Les empreintes déjà en ligne. On lit le contenu depuis le stockage,
        # ce qui vaut aussi bien en local (disque) qu'en production (R2).
        deja = set()
        if not force:
            for image in existantes:
                try:
                    with image.image.open('rb') as f:
                        deja.add(empreinte(f.read()))
                except (OSError, ValueError):
                    # Fichier absent du stockage : la ligne est orpheline, on
                    # la laisse tranquille mais elle ne bloque pas la suite.
                    continue

        if force:
            nb = existantes.count()
            existantes.delete()
            self.stdout.write(f'  --force : {nb} ancienne(s) image(s) retirée(s)')

        publiees = 0
        for rang, chemin in enumerate(fichiers):
            octets = chemin.read_bytes()
            if empreinte(octets) in deja:
                self.stdout.write(f'  hero   {chemin.name} déjà en ligne')
                continue
            objet = AtelierImage(emplacement='promotion', is_active=True, order=rang)
            objet.image.save(chemin.name, ContentFile(octets), save=True)
            publiees += 1
            self.stdout.write(f'  hero   {chemin.name} publié (rang {rang})')

        self.stdout.write(self.style.SUCCESS(
            f'Défilé du hero : {publiees} tableau(x) publié(s), '
            f'{len(fichiers) - publiees} déjà en ligne.'
        ))
