/**
 * Les pièces détourées des tuiles de rayon — essai de rendu.
 * ===========================================================================
 * Une tuile de « Notre catalogue » montre normalement une photographie de la
 * boutique, découpée au ratio exact de la tuile par `outils/exporter_rayons.py`
 * et posée en `cover`. Ici on essaie l'inverse : une pièce DÉTOURÉE, entière,
 * sur un aplat indigo.
 *
 * ── Ce que ça change ────────────────────────────────────────────────────────
 * Les photos actuelles montrent le lieu autant que l'article — portants,
 * comptoir, sol brillant, enseigne. C'est du reportage : on comprend où l'on
 * est, moins ce qui est vendu. Un détourage ne montre que la marchandise, et
 * le même fond d'une tuile à l'autre remplace cinq lumières différentes par
 * une seule.
 *
 * Ce que ça coûte : le lieu disparaît, et avec lui la preuve qu'il existe une
 * vraie boutique derrière le site. D'où l'essai avant la décision.
 *
 * ── L'état de l'essai ───────────────────────────────────────────────────────
 * Les cinq rayons. La cosmétique a longtemps gardé sa photographie faute de
 * découpe disponible ; elle montre maintenant ses deux familles côte à côte,
 * le parfum et le soin.
 *
 * `chaussures` ne montre plus qu'UNE chaussure. Sa première découpe portait
 * une mule et un sac doré, le sac occupant la moitié de la tuile : la tuile
 * voisine vend déjà les sacs, et celle-ci en annonçait un de plus, dans une
 * cinquième couleur, sous l'étiquette « chaussures ». Une tuile de rayon
 * montre ce que le rayon vend, et rien d'autre.
 *
 * ── Comment revenir en arrière ──────────────────────────────────────────────
 * Passer `RAYONS_DETOURES` à `false` : les cinq tuiles retrouvent leur
 * photographie. Rien d'autre à toucher.
 *
 * ── Comment compléter ───────────────────────────────────────────────────────
 * Déposer l'original détouré à la racine du dépôt, l'ajouter à `PIECES` dans
 * `outils/exporter_pieces.py`, lancer le script, puis ajouter le slug ici. Un
 * rayon absent de cette table garde simplement sa photo.
 *
 * Le script porte la recette : reconstruction de la couche alpha par
 * contiguïté depuis les bords, retrait du liseré de sélection s'il y en a un,
 * rognage de l'ourlet de ré-encodage — invisible sur blanc, il se lit comme
 * une auréole sur l'indigo — et mise à l'échelle sur 900 px de haut, pour que
 * deux pièces côte à côte aient le même grain.
 *
 * Il découpe de deux façons selon ce qu'il y a autour de la pièce dans le
 * fichier reçu : sur un noir plat, par la luminance ; sur une lueur cuite
 * dans l'image, par la netteté, parce qu'aucun niveau de gris ne sépare un
 * dégradé de ce qu'il entoure. Le champ `fond` de la table le dit, et le seuil
 * n'a pas la même unité dans les deux cas. Si le contour d'une nouvelle pièce
 * bave ou se déchire en dents de scie, c'est la voie qui est en cause, pas le
 * réglage.
 */

/** L'interrupteur. `false` rend aux tuiles leurs photographies. */
export const RAYONS_DETOURES = true;

/**
 * Slug du rayon vers ses pièces. Un rayon absent garde sa photo.
 *
 * La valeur est TOUJOURS un tableau : une tuile peut montrer une pièce ou
 * deux, et un seul format évite d'avoir à tester le type à l'affichage.
 *
 * `boubou-africain` occupe la grande tuile, deux fois plus haute et deux fois plus
 * large que les autres : elle a la place de montrer une PAIRE — une tenue de
 * femme et une tenue d'homme, toutes deux en blanc brodé d'or, posées sur la
 * même ligne de sol. Le rayon a porté le nom « Yéré jiguen », qui ne dit que
 * le féminin alors qu'il habille les deux ; il s'appelle « Boubou africain »
 * en base, et c'est ce nom que la tuile affiche.
 *
 * L'homme est à GAUCHE parce que sa tête est tournée vers la droite : placé à
 * droite, il regarderait hors de la tuile. La femme regarde l'objectif, elle
 * tient les deux côtés.
 *
 * `accessoire` porte l'autre paire, dans une tuile simple cette fois : le
 * flacon de parfum et le pot de savon noir. Le rayon vend deux choses qui
 * n'ont rien à voir l'une avec l'autre, et la nature morte qu'il montrait
 * jusqu'ici — une dizaine de pots empilés sur un fond doré — ne disait ni
 * l'une ni l'autre. Le flacon est étroit, le pot large : à hauteur égale, ils
 * remplissent la tuile presque exactement.
 *
 * Le parfum est à GAUCHE, le plus petit objet en premier : posés dans l'autre
 * sens, le pot mangeait le côté par lequel on entre dans la tuile.
 */
export const PIECES_RAYON = {
  'boubou-africain': ['/images/catalogue/homme-blanc.webp', '/images/catalogue/boubou-blanc.webp'],
  chaussures: ['/images/catalogue/chaussures.webp'],
  sac: ['/images/catalogue/sacs.webp'],
  bijou: ['/images/catalogue/parure-longue.webp'],
  accessoire: ['/images/catalogue/parfum-abraj.webp', '/images/catalogue/savon-noir.webp'],
};

/** Le fond des tuiles détourées. Le même indigo que la barre et le pied. */
export const FOND_RAYON = '#161B2D';

/**
 * Le rattrapage de cadrage des pièces COUCHÉES. Un rayon absent n'en prend
 * aucun, et c'est le cas normal.
 *
 * La tuile est en portrait, et « contain » cale la pièce sur la dimension qui
 * manque le plus. Une pièce debout ou carrée est limitée par la HAUTEUR : elle
 * garde de l'air sur les côtés toute seule et vient se poser au bas de sa
 * tuile. Une pièce couchée est limitée par la LARGEUR : elle touche les deux
 * bords, et il lui reste au-dessus d'elle une hauteur qu'elle n'occupe pas.
 * Les mêmes règles ne donnent donc pas du tout le même cadrage aux deux.
 *
 * `reserve` — retrait latéral supplémentaire, en pourcentage de la largeur de
 * la tuile. La chaussure fait presque deux fois plus large que haut : elle
 * occupait 93 % de la largeur de sa tuile quand le sac et la parure en
 * occupent le tiers de moins. Ce n'est pas une échelle mais une réserve : la
 * pièce ne décolle pas en rétrécissant.
 *
 * `assise` — où la pièce se pose, en pourcentage de la course verticale qui
 * lui reste. 100 signifie tout en bas, contre la réserve de l'étiquette, et
 * c'est ce que fait une pièce sans réglage. Une pièce couchée y était collée
 * à l'étiquette avec tout le vide au-dessus d'elle.
 *
 * ⚠ Remonter une pièce la sort de la ligne de sol commune aux tuiles — le
 * parti pris expliqué plus bas dans le CSS de `UniversGrid`. C'est voulu et
 * réservé aux pièces couchées, qui ne tenaient pas cette ligne de toute façon :
 * posées au fond, elles laissaient une tuile à moitié vide.
 */
export const CADRAGE_PIECE = {
  chaussures: { reserve: 4, assise: 70 },
};
