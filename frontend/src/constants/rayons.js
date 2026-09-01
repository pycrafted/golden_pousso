/**
 * Les cinq rayons de la maison.
 * ---------------------------------------------------------------------------
 * Ce sont des rayons STRUCTURELS : ils existent toujours, dans cet ordre, et
 * le backend refuse de les supprimer (voir Category.SLUGS_STRUCTURELS). La
 * grille de la page d'accueil se construit donc à partir de cette liste et
 * non de ce que renvoie l'API — elle s'affiche complète dès le premier rendu,
 * sans attendre la réponse du serveur.
 *
 * ── Ce qui vient d'ici et ce qui vient du backend ───────────────────────────
 *   ici     : l'existence du rayon, son ordre, son slug, sa photo
 *   backend : son NOM et son nombre de pièces
 *
 * Le propriétaire renomme donc librement un rayon depuis l'Espace Gestion —
 * « Yéré jiguen » peut devenir autre chose — mais il ne peut ni le supprimer
 * ni changer sa photo. Le slug est la clé qui relie les deux : il est
 * verrouillé en admin, le changer romprait le lien avec la photo.
 *
 * ── Pourquoi les photos sont ici ────────────────────────────────────────────
 * Elles étaient téléversées depuis le back-office et recadrées en CSS, avec
 * un object-position réglé à la main pour chaque rayon — cinq valeurs à
 * recalculer dès qu'une photo changeait. Elles sont maintenant découpées en
 * amont, au ratio exact de la tuile, par outils/exporter_rayons.py. Aucun
 * réglage de cadrage ne subsiste dans le CSS.
 *
 * Pour changer une photo : déposer l'original dans backend/media/categories/,
 * l'ajouter à RAYONS dans outils/exporter_rayons.py, relancer le script.
 */
export const RAYONS = [
  { slug: 'boubous',    nom: 'Yéré jiguen' },
  { slug: 'chaussures', nom: 'Dale' },
  { slug: 'sacs',       nom: 'Sacs' },
  { slug: 'bijoux',     nom: 'Bijoux' },
  { slug: 'cosmetique', nom: 'Cosmétique' },
];

/** Les deux largeurs produites par outils/exporter_rayons.py. */
export const LARGEURS_RAYON = [800, 1600];

export const imageRayon = (slug, largeur) => `/images/rayons/${slug}-${largeur}.jpg`;

export const srcSetRayon = (slug) =>
  LARGEURS_RAYON.map((l) => `${imageRayon(slug, l)} ${l}w`).join(', ');
