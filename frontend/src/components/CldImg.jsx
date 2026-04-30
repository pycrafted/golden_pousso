/**
 * CldImg — image Cloudinary optimisée
 * - Génère automatiquement un srcset multi-résolution
 * - Ajoute loading="lazy" par défaut (eager pour les images above-the-fold)
 * - Fonctionne aussi avec les URLs locales (dev) sans srcset
 */

const cldVariant = (url, width) => {
  if (!url?.includes('res.cloudinary.com')) return url;
  if (url.includes('w_')) return url.replace(/w_\d+/, `w_${width}`);
  return url.replace('/upload/', `/upload/w_${width},f_auto,q_auto,c_limit/`);
};

const CldImg = ({
  src,
  alt = '',
  style,
  sizes = '100vw',
  widths = [400, 800, 1200],
  eager = false,
  ...props
}) => {
  const srcSet = src?.includes('res.cloudinary.com')
    ? widths.map(w => `${cldVariant(src, w)} ${w}w`).join(', ')
    : undefined;

  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      style={style}
      {...props}
    />
  );
};

export default CldImg;
