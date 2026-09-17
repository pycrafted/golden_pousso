"""Découpe la silhouette du hero mobile depuis un tableau du hero.

Le hero du téléphone ne montre qu'UNE pièce, en pied (voir « .hero-silhouette »
dans `frontend/src/components/Hero.jsx`). Elle est tirée d'un tableau du défilé,
`frontend/public/images/hero/hero-N.jpg` : ces compositions portent déjà des
silhouettes détourées, posées sur un `#161B2D` EXACT et uniforme — le fond du
hero.

Pourquoi un détourage et non un simple recadrage : le hero mobile pose un halo
de laiton derrière le buste. Un rectangle opaque d'indigo le masquerait à
l'intérieur de ses bords et le laisserait paraître autour, dessinant une couture
rectangulaire autour de la pièce.

La méthode : le fond est reconnu par PROPAGATION DEPUIS LES BORDS, jamais par
la seule couleur. Les cheveux et les ombres du tissu approchent l'indigo ; jugés
au pixel, ils se troueraient. Un pixel n'est du fond que s'il est proche du fond
ET relié au bord de l'image par une chaîne de pixels proches du fond.

Les pixels de la frontière reçoivent une opacité partielle (l'anticrénelage du
détourage d'origine, plus le bruit JPEG), et leur couleur est « démêlée » du
fond : sans cela, un liseré indigo resterait autour de la silhouette dès qu'elle
se pose sur autre chose que l'indigo.

    python outils/exporter_silhouette_hero.py

Refaire tourner après tout changement de tableau. La sortie est versionnée.
"""

from collections import deque
from pathlib import Path

from PIL import Image

RACINE = Path(__file__).resolve().parent.parent
SOURCE = RACINE / 'frontend/public/images/hero/hero-1.jpg'
SORTIE = RACINE / 'frontend/public/images/hero/femme-blanche.webp'

# Le fond des tableaux : l'indigo du chrome, #161B2D.
FOND = (22, 27, 46)

# La moitié du tableau où chercher la silhouette — « gauche » ou « droite ».
COTE = 'gauche'

# Écarts au fond (somme des trois canaux) : en dessous de SEUIL_FOND, le pixel
# est du fond s'il est relié au bord ; au-dessus de SEUIL_PLEIN, il est
# pleinement opaque ; entre les deux, l'opacité monte linéairement.
SEUIL_FOND = 14
SEUIL_PLEIN = 60

# L'air laissé autour de la silhouette, en pixels du tableau.
MARGE = 6


def ecart(pixel):
    return (
        abs(pixel[0] - FOND[0]) + abs(pixel[1] - FOND[1]) + abs(pixel[2] - FOND[2])
    )


def main():
    tableau = Image.open(SOURCE).convert('RGB')
    largeur, hauteur = tableau.size
    milieu = largeur // 2
    x_depart, x_fin = (0, milieu) if COTE == 'gauche' else (milieu, largeur)
    image = tableau.crop((x_depart, 0, x_fin, hauteur))
    l, h = image.size
    px = image.load()

    # ── Le fond, par propagation depuis les bords ────────────────────────────
    ecarts = [[ecart(px[x, y]) for x in range(l)] for y in range(h)]
    fond = [[False] * l for _ in range(h)]
    file = deque()
    for x in range(l):
        for y in (0, h - 1):
            if ecarts[y][x] <= SEUIL_FOND and not fond[y][x]:
                fond[y][x] = True
                file.append((x, y))
    for y in range(h):
        for x in (0, l - 1):
            if ecarts[y][x] <= SEUIL_FOND and not fond[y][x]:
                fond[y][x] = True
                file.append((x, y))
    while file:
        x, y = file.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            vx, vy = x + dx, y + dy
            if 0 <= vx < l and 0 <= vy < h and not fond[vy][vx]:
                if ecarts[vy][vx] <= SEUIL_FOND:
                    fond[vy][vx] = True
                    file.append((vx, vy))

    # ── L'opacité, et la couleur démêlée du fond ─────────────────────────────
    sortie = Image.new('RGBA', (l, h), (0, 0, 0, 0))
    dest = sortie.load()
    x0, y0, x1, y1 = l, h, 0, 0
    for y in range(h):
        for x in range(l):
            if fond[y][x]:
                continue
            d = ecarts[y][x]
            if d >= SEUIL_PLEIN:
                a = 1.0
            else:
                a = max(0.0, (d - SEUIL_FOND) / (SEUIL_PLEIN - SEUIL_FOND))
            if a <= 0:
                continue
            r, v, b = px[x, y]
            if a < 1.0:
                # observé = a × vraie + (1 − a) × fond
                r = min(255, max(0, round((r - (1 - a) * FOND[0]) / a)))
                v = min(255, max(0, round((v - (1 - a) * FOND[1]) / a)))
                b = min(255, max(0, round((b - (1 - a) * FOND[2]) / a)))
            dest[x, y] = (r, v, b, round(a * 255))
            x0, y0, x1, y1 = min(x0, x), min(y0, y), max(x1, x), max(y1, y)

    boite = (
        max(0, x0 - MARGE),
        max(0, y0 - MARGE),
        min(l, x1 + 1 + MARGE),
        min(h, y1 + 1 + MARGE),
    )
    decoupe = sortie.crop(boite)
    SORTIE.parent.mkdir(parents=True, exist_ok=True)
    decoupe.save(SORTIE, 'WEBP', quality=88, method=6)
    print(f'{SORTIE.relative_to(RACINE)} — {decoupe.width} x {decoupe.height}')


if __name__ == '__main__':
    main()
