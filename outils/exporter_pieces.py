"""
Exporte les pièces détourées des tuiles de rayon.

Les tuiles de « Notre catalogue » montrent des pièces découpées posées sur un
aplat indigo, et non des photographies de la boutique. Ce script fabrique ces
découpes à partir des originaux déposés à la racine du dépôt et les écrit dans
frontend/public/images/catalogue/, d'où les lit
frontend/src/constants/rayonsDetoures.js.

    python outils/exporter_pieces.py

── Pourquoi un script ─────────────────────────────────────────────────────
La recette était écrite en commentaire dans rayonsDetoures.js et refaite à la
main à chaque pièce. La plupart des étapes ne se voient qu'une fois la pièce
en place sur l'indigo — un liseré clair oublié se lit comme une auréole, une
hauteur différente donne deux grains côte à côte dans la même tuile. Mieux
vaut les tenir en un seul endroit.

── Deux sortes d'originaux ────────────────────────────────────────────────
Ce qui décide de la découpe, c'est ce qu'il y a AUTOUR de la pièce dans le
fichier reçu. Deux cas, et le champ `fond` de la table dit lequel :

`fond='noir'` — la pièce est posée sur un noir plat. Le détourage a bien eu
lieu en amont, mais la couche alpha n'a pas survécu à l'aplatissement. On la
retrouve en partant des bords de l'image et en propageant sur les pixels
sombres. Un remplissage par contiguïté, et non un seuil global, pour qu'un
noir INTERNE à la pièce (le cuir d'une bride, l'ombre sous un couvercle)
reste opaque. `seuil` est la luminance sous laquelle un pixel est du fond.

`fond='halo'` — la pièce baigne dans une lueur cuite dans l'image, un dégradé
qui monte du noir des coins jusqu'à 250 au contact de la silhouette. Aucun
seuil de luminance ne marche : posé bas il garde une auréole large, posé haut
il suit une isoligne du halo — un contour qui bave là où la lueur est forte
et se déchire en dents de scie là où elle passe près du seuil.

  Ce qui sépare les deux, ce n'est pas la clarté mais la NETTETÉ. La lueur est
  lisse, son gradient est proche de zéro ; le bord de la pièce est une marche.
  On propage donc le fond depuis les bords de l'image sur les zones lisses
  (`gradient < seuil`) : la propagation traverse toute la lueur et vient buter
  contre le contour, où qu'il soit dans le dégradé. `seuil` est ici un niveau
  de gradient, pas de luminance — d'où des valeurs sans rapport d'un fond à
  l'autre.

  La propagation se fait en connectivité 4 : un contour en diagonale suffit
  alors à l'arrêter, là où la connectivité 8 se serait faufilée entre deux
  pixels posés en escalier.

── Les corrections communes ───────────────────────────────────────────────
Le liseré. Certains outils de détourage laissent un contour de sélection vif,
rouge sur le flacon de parfum : quinze pixels de (255, 0, 0) tout autour de la
silhouette. Il passe le seuil du fond, donc il faut le nommer. On le retire,
on garde la plus grande masse restante, puis on rebouche — le rouge de
l'étiquette, lui, est à l'intérieur et revient.

La fermeture. Un contour n'est net que là où la pièce tranche sur son fond.
Sur la chaussure, l'arrière du talon est doré clair sur lueur dorée claire :
il n'y a pas de marche, et la propagation s'engouffre dans ces échancrures en
laissant des rubans de fond à l'intérieur de la silhouette. Une fermeture les
comble sans déplacer le contour là où il est franc — c'est ce qu'une
fermeture fait, elle ne bouge pas un bord droit. `fermeture` est le rayon du
disque, en pixels : il doit dépasser la largeur des rubans à combler.

Le retrait. Le ré-encodage laisse un ourlet d'un ou deux pixels mélangés avec
le fond. Sur l'indigo il se lirait comme un trait clair : on rogne.

La hauteur. Toutes les pièces sortent à la même hauteur — deux pièces dans la
même tuile doivent avoir le même grain, et c'est la hauteur qui décide
puisqu'elles sont posées sur une ligne de sol commune. Une pièce COUCHÉE (une
chaussure de profil, plus large que haute) redescend sous le plafond de
largeur : à hauteur pleine elle sortirait à 1500 px pour une tuile qui n'en
affiche jamais 700, et le poids du fichier est le seul à y gagner.
"""
import os

import numpy as np
from PIL import Image
from scipy import ndimage

RACINE = os.path.join(os.path.dirname(__file__), '..')
SORTIE = os.path.join(RACINE, 'frontend', 'public', 'images', 'catalogue')

# La hauteur commune. 900 px : celle des découpes déjà en place.
HAUTEUR = 900

# Aucune pièce ne sort plus large que ça, même si la hauteur commune l'y
# emmènerait. 900 px aussi : la valeur des découpes déjà en place.
LARGEUR_MAX = 900

# Le lissage appliqué avant de mesurer le gradient, pour les fonds à halo.
# Assez pour que le grain du cuir et le bruit de compression ne comptent pas
# comme des bords, assez peu pour que le contour reste à sa place.
FLOU_GRADIENT = 1.5

PIECES = [
    dict(source='parfum_sans_background.png', sortie='parfum-abraj.webp',
         fond='noir', seuil=45, liseret_rouge=True, retrait=7),
    dict(source='savon_sans_background.png', sortie='savon-noir.webp',
         fond='noir', seuil=45, retrait=2),
    # La chaussure arrive avec sa lueur, d'où la découpe par netteté. Le seuil
    # de 6 est un niveau de gradient : rien à voir avec les 45 ci-dessus.
    dict(source='shoes-now.png', sortie='chaussures.webp',
         fond='halo', seuil=6, fermeture=16, retrait=2),
]


def disque(rayon):
    y, x = np.ogrid[-rayon:rayon + 1, -rayon:rayon + 1]
    return x * x + y * y <= rayon * rayon


def une_seule_masse(piece):
    """Ne garde que la plus grosse tache, rebouchée. Une pièce est UN objet.

    Ce qui reste autour est du bruit : des îlots de fond trop clairs pour le
    seuil, quelques dizaines de pixels chacun. Invisibles, mais ils comptent
    dans le cadrage — un point perdu dans un coin écarte le bord de la découpe
    et décale la pièce dans sa tuile.
    """
    piece = ndimage.binary_fill_holes(piece)
    taches, n = ndimage.label(piece)
    if n < 2:
        return piece
    tailles = ndimage.sum(piece, taches, range(1, n + 1))
    return ndimage.binary_fill_holes(taches == int(np.argmax(tailles)) + 1)


def depuis_les_bords(fond, connectivite=2):
    """La pièce, c'est tout ce que le fond n'atteint pas depuis les bords."""
    etiquettes, _ = ndimage.label(
        fond, structure=ndimage.generate_binary_structure(2, connectivite))
    dehors = (set(etiquettes[0]) | set(etiquettes[-1])
              | set(etiquettes[:, 0]) | set(etiquettes[:, -1]))
    dehors.discard(0)
    return ndimage.binary_fill_holes(~np.isin(etiquettes, list(dehors)))


def masque(rgb, fond, seuil, liseret_rouge=False, fermeture=0, retrait=0):
    """La couche alpha : vrai sur la pièce, faux sur le fond."""
    if fond == 'halo':
        # Le fond est ce qui est LISSE, pas ce qui est sombre.
        lueur = ndimage.gaussian_gradient_magnitude(
            rgb.max(axis=2).astype(float), FLOU_GRADIENT)
        piece = depuis_les_bords(lueur < seuil, connectivite=1)
    else:
        piece = depuis_les_bords(rgb.max(axis=2) < seuil)

    if liseret_rouge:
        r, v, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
        rouge = (r > 150) & (v < 80) & (b < 80) & ((r - np.maximum(v, b)) > 100)
        # Le rebouchage rend à la pièce le rouge de son étiquette, qui n'était
        # pas relié au contour.
        piece = une_seule_masse(piece & ~rouge)

    if fermeture:
        piece = ndimage.binary_closing(piece, structure=disque(fermeture))
    piece = une_seule_masse(piece)

    if retrait:
        piece = une_seule_masse(ndimage.binary_erosion(piece, iterations=retrait))
    return piece


def exporter(source, sortie, fond, seuil, liseret_rouge=False, fermeture=0, retrait=0):
    chemin = os.path.join(RACINE, source)
    rgb = np.asarray(Image.open(chemin).convert('RGB'))
    piece = masque(rgb.astype(int), fond, seuil, liseret_rouge, fermeture, retrait)
    alpha = np.where(piece, 255, 0).astype(np.uint8)

    # Pas de prémultiplication à faire avant la réduction : Pillow pondère
    # déjà les canaux de couleur par l'alpha, la couleur du fond ne déteint
    # donc pas sur les pixels de bord.
    im = Image.fromarray(np.dstack([rgb, alpha]), 'RGBA')
    im = im.crop(im.split()[3].getbbox())
    facteur = min(HAUTEUR / im.height, LARGEUR_MAX / im.width)
    im = im.resize((max(1, round(im.width * facteur)), max(1, round(im.height * facteur))), Image.LANCZOS)

    os.makedirs(SORTIE, exist_ok=True)
    dest = os.path.join(SORTIE, sortie)
    im.save(dest, 'WEBP', quality=90, method=6)
    print(f'{sortie:24} {im.width} x {im.height}   {os.path.getsize(dest) // 1024} Ko')


if __name__ == '__main__':
    for piece in PIECES:
        exporter(**piece)
