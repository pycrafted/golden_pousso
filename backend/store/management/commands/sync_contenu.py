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


def nom_publie(chemin, octets):
    """`hero-1.jpg` + son contenu donne `hero-1.a1b2c3d4e5f6.jpg`.

    L'empreinte est écrite DANS le nom, et c'est tout le mécanisme de
    déduplication : savoir si un tableau est déjà en ligne devient une lecture
    de la base, sans un seul octet à retélécharger.

    La version précédente relisait chaque image depuis le stockage pour la
    hacher. Elle a produit des doublons en production : les fichiers d'un
    déploiement antérieur étaient introuvables — écrits quand le stockage
    préfixait encore « media/ » — la lecture échouait, la commande les croyait
    absents et republiait tout. Un nom qui porte son empreinte ne peut pas
    mentir, même quand le fichier a disparu.
    """
    return f'{chemin.stem}.{empreinte(octets)}{chemin.suffix}'


def est_un_tableau(nom):
    """Vrai si ce fichier a été publié par cette commande.

    Sert au ménage : on ne retire QUE ce qu'on a posé. Une image que le
    propriétaire aurait ajoutée lui-même dans l'Espace Gestion ne porte pas ce
    préfixe et n'est jamais touchée.
    """
    return nom.rsplit('/', 1)[-1].startswith('hero-')


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

        # Ce que le défilé DOIT contenir, nom par nom.
        attendus = {}
        for rang, chemin in enumerate(fichiers):
            octets = chemin.read_bytes()
            attendus[nom_publie(chemin, octets)] = (rang, octets)

        existantes = AtelierImage.objects.filter(emplacement='promotion')

        # ── Ménage ──
        # On retire les tableaux qui ne sont plus au programme : les orphelins
        # d'un ancien stockage, et les images d'un défilé précédent. Tout ce
        # qui ne porte pas le préfixe `hero-` appartient au propriétaire et
        # reste en place.
        retires = 0
        for image in existantes:
            nom = image.image.name.rsplit('/', 1)[-1]
            if not est_un_tableau(nom):
                continue
            if force or nom not in attendus:
                self.stdout.write(f'  hero   {nom} retire')
                image.delete()
                retires += 1

        deja = {
            i.image.name.rsplit('/', 1)[-1]
            for i in AtelierImage.objects.filter(emplacement='promotion')
        }

        publiees = 0
        for nom, (rang, octets) in attendus.items():
            if nom in deja:
                self.stdout.write(f'  hero   {nom} deja en ligne')
                continue
            objet = AtelierImage(emplacement='promotion', is_active=True, order=rang)
            # `save=True` ecrit le fichier ET la ligne. Le nom porte deja son
            # empreinte : le stockage n'a aucune raison de le renommer.
            objet.image.save(nom, ContentFile(octets), save=True)
            publiees += 1
            self.stdout.write(f'  hero   {nom} publie (rang {rang})')

        self.stdout.write(self.style.SUCCESS(
            f'Defile du hero : {publiees} publie(s), {retires} retire(s), '
            f'{len(attendus) - publiees} deja en ligne.'
        ))
