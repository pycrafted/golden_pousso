/**
 * Image responsive — deux sources de variantes, un seul composant.
 *
 * En PRODUCTION les médias sont sur Cloudinary : les largeurs se demandent
 * dans l'URL (`w_600,f_auto,q_auto:good,c_limit`), le service les fabrique à
 * la volée.
 *
 * En DÉVELOPPEMENT les médias sont servis par Django depuis le disque, et
 * Cloudinary n'existe pas. Les variantes sont donc générées à l'enregistrement
 * (voir `store/imaging.py`) et nommées `<base>-web-<largeur>.jpg`. Connaissant
 * l'une d'elles, on déduit les autres en substituant le nombre — le même
 * mécanisme que pour Cloudinary, appliqué au nom de fichier.
 *
 * Sans cette seconde branche, le développement servait la plus grande variante
 * à toutes les tailles : 460 Ko pour remplir une vignette de 300 px.
 *
 * `q_auto:good` et non `q_auto:eco` : `eco` est le palier le plus agressif de
 * Cloudinary, il écrase les dégradés et ternit les aplats clairs — visible sur
 * une dentelle blanche ou un bazin. Sur une maison de couture, la photo EST le
 * produit.
 */

// Doit rester aligné sur `LARGEURS_WEB` dans `backend/store/imaging.py` :
// un `srcset` qui annonce une largeur non générée renvoie une image cassée.
const LARGEURS_LOCALES = [400, 800, 1600];
const MOTIF_LOCAL = /-web-\d+\.jpg$/i;

const estCloudinary = (url) => Boolean(url?.includes('res.cloudinary.com'));
const estVarianteLocale = (url) => MOTIF_LOCAL.test(url || '');

const varianteCloudinary = (url, largeur) => {
  if (url.includes('w_')) return url.replace(/w_\d+/, `w_${largeur}`);
  return url.replace('/upload/', `/upload/w_${largeur},f_auto,q_auto:good,c_limit/`);
};

const varianteLocale = (url, largeur) =>
  url.replace(MOTIF_LOCAL, `-web-${largeur}.jpg`);

const CldImg = ({
  src,
  alt = '',
  style,
  sizes = '100vw',
  widths = [300, 600],
  eager = false,
  ...props
}) => {
  const cloud = estCloudinary(src);
  const local = !cloud && estVarianteLocale(src);

  let source = src;
  let srcSet;

  if (cloud) {
    srcSet = widths.map((w) => `${varianteCloudinary(src, w)} ${w}w`).join(', ');
    source = varianteCloudinary(src, widths[widths.length - 1]);
  } else if (local) {
    srcSet = LARGEURS_LOCALES.map((w) => `${varianteLocale(src, w)} ${w}w`).join(', ');
    // `src` reste la variante que l'API a désignée : c'est le repli des
    // navigateurs qui ignorent `srcset`.
  }

  return (
    <img
      src={source}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      style={style}
      {...props}
    />
  );
};

export default CldImg;
