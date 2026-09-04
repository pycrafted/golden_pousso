/**
 * Les pièces détourées du catalogue — essai de rendu.
 * ===========================================================================
 * Une carte de « Notre catalogue » montre normalement la photo du produit,
 * recadrée en `cover` : le cliché remplit le cadre et déborde. Ici on essaie
 * l'inverse — une pièce DÉTOURÉE, posée entière sur un aplat indigo.
 *
 * ── Ce que ça change, et pourquoi c'est un essai ────────────────────────────
 * Une photo recadrée coupe toujours quelque chose : l'ourlet, les manches, les
 * pieds. Un détourage montre le vêtement en entier et sur un fond identique
 * d'une carte à l'autre, si bien que le rail cesse d'être une mosaïque de
 * lumières différentes pour devenir une vitrine.
 *
 * Ce que ça coûte : plus de contexte, plus de mise en scène, plus de peau —
 * juste l'objet. C'est un parti pris de catalogue de vente, pas de magazine.
 * D'où l'essai avant la décision.
 *
 * ── Comment revenir en arrière ──────────────────────────────────────────────
 * Passer `CATALOGUE_DETOURE` à `false` : les cartes retrouvent la photo du
 * produit et le recadrage `cover`. Rien d'autre à toucher.
 *
 * ── Comment en ajouter ──────────────────────────────────────────────────────
 * Déposer le PNG détouré, l'exporter en WebP dans
 * `frontend/public/images/catalogue/`, et ajouter son chemin à la liste. Les
 * pièces sont distribuées dans l'ordre et se répètent quand il y a plus de
 * produits que d'images — l'ordre du tableau est donc l'ordre du rail.
 */

/** L'interrupteur. `false` rend au catalogue les photos des produits. */
export const CATALOGUE_DETOURE = true;

/**
 * Les pièces, dans l'ordre d'affichage.
 *
 * Elles alternent volontairement les rayons — femme, homme, sacs, chaussures,
 * bijoux. Cinq boubous d'affilée donneraient l'impression que la maison ne
 * vend que ça, alors que le rail est justement là pour montrer l'étendue.
 */
export const PIECES_CATALOGUE = [
  '/images/catalogue/boubou-blanc.webp',
  '/images/catalogue/homme-bleu.webp',
  '/images/catalogue/sacs.webp',
  '/images/catalogue/boubou-peche.webp',
  '/images/catalogue/parure-longue.webp',
  '/images/catalogue/boubou-turquoise.webp',
  '/images/catalogue/chaussures.webp',
  '/images/catalogue/homme-taupe.webp',
  '/images/catalogue/parure-fleur.webp',
  '/images/catalogue/boubou-dore.webp',
];

/** Le fond des cartes en mode détouré. Le même indigo que la barre et le pied. */
export const FOND_DETOURE = '#161B2D';
