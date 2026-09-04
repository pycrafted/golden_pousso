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
 * Quatre rayons sur cinq. Il n'existe aucune découpe de cosmétique dans le
 * fonds — les images de pots et de tubes n'ont jamais eu de couche alpha. Ce
 * rayon garde donc sa photographie, ce qui montre au passage à quoi ressemble
 * un mélange des deux partis.
 *
 * ── Comment revenir en arrière ──────────────────────────────────────────────
 * Passer `RAYONS_DETOURES` à `false` : les cinq tuiles retrouvent leur
 * photographie. Rien d'autre à toucher.
 *
 * ── Comment compléter ───────────────────────────────────────────────────────
 * Déposer le PNG détouré, l'exporter en WebP dans
 * `frontend/public/images/catalogue/`, et ajouter son slug ici. Un rayon absent
 * de cette table garde simplement sa photo.
 */

/** L'interrupteur. `false` rend aux tuiles leurs photographies. */
export const RAYONS_DETOURES = true;

/**
 * Slug du rayon vers sa pièce. Un rayon absent garde sa photo.
 *
 * `boubous` occupe la grande tuile, deux fois plus haute que les autres : elle
 * reçoit la pièce la plus élancée du fonds, qui y tient sans être réduite à
 * une vignette.
 */
export const PIECES_RAYON = {
  boubous: '/images/catalogue/boubou-blanc.webp',
  chaussures: '/images/catalogue/chaussures.webp',
  sacs: '/images/catalogue/sacs.webp',
  bijoux: '/images/catalogue/parure-longue.webp',
  // cosmetique : aucune découpe disponible, la photo est conservée.
};

/** Le fond des tuiles détourées. Le même indigo que la barre et le pied. */
export const FOND_RAYON = '#161B2D';
