/**
 * Les tableaux du défilé du hero.
 * ---------------------------------------------------------------------------
 * Servis par le front, comme les photos de rayons — et pour les mêmes raisons.
 *
 * ── Pourquoi ils ne sont plus dans le back-office ───────────────────────────
 * Ils y ont vécu : publiés dans l'Espace Gestion, stockés sur Cloudflare R2,
 * lus par le hero via /atelier-image/. Deux choses n'allaient pas.
 *
 * D'abord le service. Sans domaine personnalisé, R2 ne sert que par son
 * adresse `r2.dev`, que Cloudflare bride volontairement et annonce comme
 * réservée aux tests. Un tableau sur cinq n'arrivait pas, et le hero affichait
 * un carré cassé en pleine page d'accueil.
 *
 * Ensuite la nature de ces images. Ce ne sont pas des photos de marchandise
 * que le propriétaire remplace au fil des saisons : ce sont des compositions
 * — deux silhouettes détourées, posées à 22 % et 80 %, le milieu laissé libre
 * pour la parole. Les fabriquer demande de découper, mettre à l'échelle et
 * composer. Les confier à un formulaire de téléversement laissait croire
 * qu'une photo quelconque y ferait l'affaire, alors qu'une photo mal cadrée
 * met du tissu sous le texte et le rend illisible.
 *
 * ── Changer le défilé ───────────────────────────────────────────────────────
 * Composer l'image au format attendu — 2400 × 1037, sujets à gauche et à
 * droite, milieu vide — la déposer dans `frontend/public/images/hero/` sous le
 * nom `hero-N.jpg`, et l'ajouter à la liste ci-dessous. C'est tout : pas de
 * base de données, pas de stockage distant, pas de déploiement du backend.
 *
 * L'ordre de ce tableau est l'ordre du défilé.
 */
export const TABLEAUX_HERO = [
  '/images/hero/hero-1.jpg',
  '/images/hero/hero-2.jpg',
  '/images/hero/hero-3.jpg',
  '/images/hero/hero-4.jpg',
  '/images/hero/hero-5.jpg',
];

/**
 * Une seule largeur, et c'est suffisant.
 *
 * Le hero est pleine largeur en desktop — 2400 px couvre les grands écrans —
 * et le calque photo est MASQUÉ sous 768 px : sur un téléphone, un recadrage
 * `cover` n'en garderait que la colonne centrale, celle qu'on a justement
 * laissée vide. Il n'y a donc pas de petit écran à servir, et pas de `srcset`
 * à construire.
 */
export const LARGEUR_TABLEAU = 2400;
