"""
Exporte les photos des cinq rayons vers les fichiers statiques du frontend.

Les images des rayons ne passent plus par le back-office : elles vivent dans
frontend/public/images/rayons/ et sont référencées par slug dans
frontend/src/constants/rayons.js. Ce script est la seule façon de les
régénérer — il part des originaux pleine résolution déposés dans
backend/media/categories/ et produit deux largeurs par rayon.

    python outils/exporter_rayons.py

── Pourquoi découper ici plutôt qu'en CSS ──────────────────────────────────
Les tuiles font 338 x 220 (petite) et 692 x 456 (grande), soit un ratio de
1,536 et 1,518 — 1 % d'écart, une seule découpe sert aux deux. Les photos,
elles, sont des portraits en 0,67. object-fit: cover jetait donc plus de la
moitié de la hauteur, et il fallait un object-position réglé à la main par
rayon, à refaire à chaque changement de photo. Découpées en amont au bon
ratio, elles n'ont plus besoin d'aucun réglage : cover ne rogne plus rien.

── Le réglage de chaque rayon ─────────────────────────────────────────────
`centre` est la position verticale du sujet, en fraction de la hauteur de la
photo. C'est le seul chiffre à revoir quand une photo est remplacée.

`etendre` traite le cas où le sujet ne tient pas dans le cadre : plutôt que
de le rogner, on découpe une bande plus haute et on prolonge le fond sur les
côtés jusqu'au bon ratio. Le prolongement étire la colonne de bord, qui ne
contient que le mur du studio — aucun motif n'est inventé et la jointure ne
se voit pas. À n'utiliser que sur un fond uni.
"""
import os
from PIL import Image, ImageFilter

RATIO = 338 / 220
LARGEURS = (800, 1600)
SOURCE = os.path.join(os.path.dirname(__file__), '..', 'backend', 'media', 'categories')
SORTIE = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'public', 'images', 'rayons')

RAYONS = [
    # slug,          fichier source,                centre, étendre (haut, bas) ou None
    # Source deja livree au ratio de la tuile : le centre ne rogne plus rien.
    ('boubous',    'couple-boubou-homme.jpg',       0.500, None),
    ('chaussures', 'chaussures-nature-morte.jpg',    0.500, None),
    # Source déjà livrée au ratio de la tuile : plus besoin d'étendre le fond.
    ('sacs',       'sac-orange-boutique.jpg',       0.500, None),
    ('bijoux',     'bijoux-parure-or.jpg',          0.500, None),
    ('cosmetique', 'cosmetique-nature-morte.jpg',   0.500, None),
]


def decouper(im, centre):
    """Rogne au ratio de la tuile, cadré sur le sujet."""
    l, h = im.size
    if l / h < RATIO:                      # portrait : on prend toute la largeur
        ch = int(l / RATIO)
        haut = min(max(int(centre * h - ch / 2), 0), h - ch)
        return im.crop((0, haut, l, haut + ch))
    cl = int(h * RATIO)                    # paysage : on rogne les côtés
    gauche = (l - cl) // 2
    return im.crop((gauche, 0, gauche + cl, h))


def etendre(im, haut, bas):
    """Garde le sujet entier et prolonge le fond jusqu'au ratio de la tuile."""
    l, h = im.size
    sujet = im.crop((0, int(haut * h), l, int(bas * h))).convert('RGB')
    sl, sh = sujet.size
    marge = (int(sh * RATIO) - sl) // 2
    if marge <= 0:
        return sujet
    fond = Image.new('RGB', (sl + marge * 2, sh))
    fond.paste(sujet.crop((0, 0, 2, sh)).resize((marge, sh)), (0, 0))
    fond.paste(sujet.crop((sl - 2, 0, sl, sh)).resize((marge, sh)), (marge + sl, 0))
    # Le flou n'est là que pour effacer les stries de l'étirement ; il est
    # posé avant le sujet, qui reste net.
    fond = fond.filter(ImageFilter.GaussianBlur(8))
    fond.paste(sujet, (marge, 0))
    return fond


def main():
    os.makedirs(SORTIE, exist_ok=True)
    total = 0
    for slug, fichier, centre, bande in RAYONS:
        with Image.open(os.path.join(SOURCE, fichier)) as im:
            cadre = etendre(im, *bande) if bande else decouper(im, centre).convert('RGB')
            tailles = []
            for largeur in LARGEURS:
                chemin = os.path.join(SORTIE, '%s-%d.jpg' % (slug, largeur))
                cadre.resize((largeur, int(largeur / RATIO)), Image.LANCZOS).save(
                    chemin, quality=84, optimize=True, progressive=True)
                poids = os.path.getsize(chemin)
                total += poids
                tailles.append('%d px : %.0f Ko' % (largeur, poids / 1024))
            print('%-12s %-28s %s' % (slug, fichier, ' | '.join(tailles)))
    print('total sur disque : %.1f Mo' % (total / 1048576))


if __name__ == '__main__':
    main()
