"""
Génération des variantes web des photos produit.

Le problème : les photos de l'atelier sortent du boîtier en 4016 × 6016 pour
22 à 28 Mo pièce. En développement rien ne les redimensionne — le navigateur
télécharge donc 22 Mo pour remplir une carte de 300 px, et l'image traverse
plusieurs passes basse résolution avant de se poser.

La réponse : à l'enregistrement, on fabrique une variante web à côté de
l'original. L'original n'est jamais modifié ni supprimé — il reste le master.
C'est la variante que l'API sert au site.

1800 px sur le grand côté : la fiche produit affiche au plus ~1200 px de large,
et le double suffit pour les écrans à forte densité. Au-delà, on transporte des
pixels que personne ne voit.
"""

from io import BytesIO
import os

from django.core.files.base import ContentFile
from django.db import models
from PIL import Image, ImageOps

# Largeurs générées, en pixels. Elles couvrent les trois emplois réels :
#   400  — carte dans un rail ou une grille sur téléphone
#   800  — carte sur grand écran, et repli par défaut
#  1600  — fiche produit, et écrans à forte densité
# C'est l'équivalent local des transformations `w_400,w_800,w_1600` que
# Cloudinary applique en production : sans elles, le navigateur télécharge en
# développement la plus grande variante pour remplir une vignette.
LARGEURS_WEB = (400, 800, 1600)

# Largeur servie en `src`, quand le navigateur ignore le `srcset`.
LARGEUR_DEFAUT = 800

# Grand côté de la variante, en pixels.
MAX_COTE = 1800

# 85 est le point où le JPEG cesse de progresser visiblement pour le
# spectateur tout en continuant de grossir sur le disque.
QUALITE = 85

# En dessous de ce poids, l'original est déjà raisonnable : on ne fabrique
# rien, ce qui évite de dégrader une image déjà optimisée.
SEUIL_OCTETS = 400 * 1024


def doit_generer(champ_image):
    """Vrai si la photo mérite une variante web."""
    if not champ_image:
        return False
    try:
        return champ_image.size > SEUIL_OCTETS
    except (OSError, ValueError):
        # Fichier absent du stockage : rien à faire, et surtout pas planter
        # l'enregistrement de l'objet pour autant.
        return False


def _chemin_variante(instance, nom_fichier):
    """Range la variante dans le sous-dossier déclaré par le modèle."""
    return f'{instance.DOSSIER_WEB}/{nom_fichier}'


class VarianteWebMixin(models.Model):
    """
    Ajoute un champ `display` généré depuis l'image d'origine.

    Chaque modèle qui l'utilise déclare :
        SOURCE_IMAGE  le nom de son champ image d'origine
        DOSSIER_WEB   le sous-dossier où ranger les variantes

    Le fichier d'origine n'est jamais modifié : il reste le master. C'est
    `fichier_web` que les sérialiseurs doivent servir.
    """

    SOURCE_IMAGE = 'image'
    DOSSIER_WEB = 'web'

    display = models.ImageField(
        upload_to=_chemin_variante, blank=True, null=True,
        verbose_name='Variante web',
        help_text="Générée automatiquement. La vider force une régénération.",
    )

    class Meta:
        abstract = True

    @property
    def source_image(self):
        return getattr(self, self.SOURCE_IMAGE)

    @property
    def fichier_web(self):
        """La variante si elle existe, l'original sinon."""
        return self.display if self.display else self.source_image

    def generer_variantes(self):
        """
        Fabrique les trois largeurs et renseigne `display`. Renvoie `True` si
        quelque chose a été écrit.
        """
        source = self.source_image
        if self.display or not doit_generer(source):
            return False

        variantes = construire_variantes(source)
        if not variantes:
            return False

        stockage = self.display.storage
        for largeur, contenu in variantes.items():
            if largeur == LARGEUR_DEFAUT:
                # Seule la largeur par défaut est référencée en base ; les
                # autres se déduisent de son nom côté frontend.
                self.display.save(contenu.name, contenu, save=False)
            else:
                chemin = f'{self.DOSSIER_WEB}/{contenu.name}'
                if not stockage.exists(chemin):
                    stockage.save(chemin, contenu)
        return True

    def save(self, *args, **kwargs):
        # L'original doit être écrit dans le stockage avant qu'on puisse le
        # relire pour en tirer la variante.
        super().save(*args, **kwargs)
        if self.generer_variantes():
            # `update_fields` : on ne repasse pas dans la génération, donc pas
            # de récursion.
            super().save(update_fields=['display'])


def nom_variante(nom_source, largeur):
    """
    `products/DSC_1324.jpg` + 800 → `DSC_1324-web-800.jpg`.

    Le motif est lisible par le frontend : connaissant une variante, il déduit
    les autres en substituant le nombre, exactement comme il le fait sur les
    URL Cloudinary. Les trois largeurs sont donc toujours générées ensemble —
    en générer une seule laisserait le `srcset` pointer vers des fichiers
    absents.
    """
    racine = os.path.splitext(os.path.basename(nom_source))[0]
    return f'{racine}-web-{largeur}.jpg'


def construire_variantes(champ_image):
    """
    Renvoie `{largeur: ContentFile}` pour chaque entrée de `LARGEURS_WEB`, ou
    un dictionnaire vide si la source est illisible.

    Une largeur supérieure à l'original n'est pas produite : agrandir une photo
    n'ajoute aucun détail, cela ne ferait que du poids.
    """
    try:
        champ_image.open('rb')
        with Image.open(champ_image.file) as source:
            source = ImageOps.exif_transpose(source)
            if source.mode not in ('RGB', 'L'):
                source = source.convert('RGB')

            sorties = {}
            for largeur in LARGEURS_WEB:
                if largeur > source.width and largeur != LARGEUR_DEFAUT:
                    continue
                img = source.copy()
                img.thumbnail((largeur, largeur * 4), Image.LANCZOS)

                tampon = BytesIO()
                img.save(tampon, format='JPEG', quality=QUALITE,
                         optimize=True, progressive=True)
                sorties[largeur] = ContentFile(
                    tampon.getvalue(), name=nom_variante(champ_image.name, largeur)
                )
    except (OSError, ValueError, Image.DecompressionBombError):
        return {}
    finally:
        champ_image.close()

    return sorties


def construire_variante(champ_image):
    """
    Renvoie un `ContentFile` JPEG redimensionné, ou `None` si la source est
    illisible. Ne touche jamais au fichier d'origine.
    """
    try:
        champ_image.open('rb')
        with Image.open(champ_image.file) as img:
            # Les appareils photo encodent l'orientation en EXIF plutôt qu'en
            # pivotant les pixels. Sans cette ligne, une photo prise à la
            # verticale ressort couchée une fois ré-encodée.
            img = ImageOps.exif_transpose(img)

            # Le JPEG ne connaît pas la transparence ; les modes à palette ou
            # à canal alpha doivent passer en RVB avant l'enregistrement.
            if img.mode not in ('RGB', 'L'):
                img = img.convert('RGB')

            img.thumbnail((MAX_COTE, MAX_COTE), Image.LANCZOS)

            tampon = BytesIO()
            img.save(
                tampon,
                format='JPEG',
                quality=QUALITE,
                optimize=True,
                # Le JPEG progressif s'affiche en montant en netteté au lieu
                # de se remplir par le haut : sur connexion lente, la pièce se
                # devine tout de suite.
                progressive=True,
            )
    except (OSError, ValueError, Image.DecompressionBombError):
        return None
    finally:
        champ_image.close()

    racine = os.path.splitext(os.path.basename(champ_image.name))[0]
    return ContentFile(tampon.getvalue(), name=f'{racine}-web.jpg')
