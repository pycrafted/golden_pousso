import CldImg from './CldImg';

/**
 * Zone média d'une carte produit — à poser dans un conteneur `position: relative`
 * (la carte garde ses propres calques : badges, prix, voile « Épuisé »…).
 *
 * Photo principale, qui bascule vers la photo secondaire au survol.
 *
 * La carte jouait la vidéo du produit quand il en avait une, à la place des
 * photos. La vidéo de produit a été retirée, front et back, à la demande.
 */
const ProductCardMedia = ({
  product,
  hovered = false,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw',
  widths = [300, 600],
  eager = false,
  placeholder = 'Photo bientôt',
}) => {
  if (!product.primary_image) return <Placeholder label={placeholder} />;

  const secondary = product.secondary_image;
  return (
    <>
      <CldImg
        src={product.primary_image}
        alt={product.name}
        eager={eager}
        sizes={sizes}
        widths={widths}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%', objectFit: 'cover',
          opacity: hovered && secondary ? 0 : 1,
          transform: hovered && !secondary ? 'scale(1.06)' : 'scale(1)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}
      />
      {secondary && (
        <CldImg
          src={secondary}
          alt={product.name}
          sizes={sizes}
          widths={widths}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%', objectFit: 'cover',
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.7s ease',
          }}
        />
      )}
    </>
  );
};

/* ── Placeholder « Photo bientôt » ── */
const Placeholder = ({ label }) => (
  <div style={{
    position: 'absolute', inset: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    <span style={{
      fontSize: '1.1rem', fontFamily: 'var(--font-body)', color: '#7A6A50',
      textTransform: 'uppercase', letterSpacing: '0.1em',
    }}>
      {label}
    </span>
  </div>
);

export default ProductCardMedia;
