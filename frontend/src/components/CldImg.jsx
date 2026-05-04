const cldVariant = (url, width) => {
  if (!url?.includes('res.cloudinary.com')) return url;
  if (url.includes('w_')) return url.replace(/w_\d+/, `w_${width}`);
  return url.replace('/upload/', `/upload/w_${width},f_auto,q_auto:eco,c_limit/`);
};

const CldImg = ({
  src,
  alt = '',
  style,
  sizes = '100vw',
  widths = [300, 600],
  eager = false,
  ...props
}) => {
  const isCld = src?.includes('res.cloudinary.com');
  const srcSet = isCld
    ? widths.map(w => `${cldVariant(src, w)} ${w}w`).join(', ')
    : undefined;

  return (
    <img
      src={isCld ? cldVariant(src, widths[widths.length - 1]) : src}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      style={style}
      {...props}
    />
  );
};

export default CldImg;
