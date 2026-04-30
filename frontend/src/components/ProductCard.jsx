import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const formatFCFA = (price) =>
  new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';

/* ── Variante sombre (homepage featured/new) ── */
const ProductCardDark = ({ product, showBadge = true }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const [btnHovered, setBtnHovered] = useState(false);

  const discountPercent =
    product.old_price && product.old_price > product.price
      ? Math.round(((product.old_price - product.price) / product.old_price) * 100)
      : null;

  const outOfStock = product.stock === 0;
  const hasSecondary = Boolean(product.secondary_image);

  return (
    <div
      onClick={() => !outOfStock && navigate(`/produit/${product.slug}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setBtnHovered(false); }}
      style={{
        cursor: outOfStock ? 'default' : 'pointer',
        background: '#1A1A1A',
        borderRadius: '0.3rem',
        overflow: 'hidden',
        opacity: outOfStock ? 0.6 : 1,
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        transform: hovered && !outOfStock ? 'translateY(-4px)' : 'none',
        boxShadow: hovered && !outOfStock ? '0 16px 48px rgba(0,0,0,0.5)' : '0 2px 16px rgba(0,0,0,0.3)',
      }}
    >
      {/* Zone image */}
      <div style={{ position: 'relative', overflow: 'hidden', aspectRatio: '3/4', background: '#111' }}>

        {/* Image principale */}
        {product.primary_image ? (
          <img
            src={product.primary_image}
            alt={product.name}
            loading="lazy"
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%', objectFit: 'cover',
              opacity: hovered && hasSecondary ? 0 : 1,
              transition: 'opacity 0.7s ease',
            }}
          />
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: '#111',
          }}>
            <i className="bx bx-image-alt" style={{ fontSize: '3.5rem', color: '#333', marginBottom: '0.5rem' }}></i>
            <span style={{ fontSize: '1.1rem', color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Photo bientôt</span>
          </div>
        )}

        {/* Image secondaire (cross-fade) */}
        {hasSecondary && (
          <img
            src={product.secondary_image}
            alt={product.name}
            loading="lazy"
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%', objectFit: 'cover',
              opacity: hovered ? 1 : 0,
              transition: 'opacity 0.7s ease',
            }}
          />
        )}

        {/* Badges */}
        {showBadge && (
          <div style={{ position: 'absolute', top: '1.2rem', left: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', zIndex: 2 }}>
            {product.is_new && (
              <span style={{
                background: '#D4AF37', color: '#000',
                padding: '0.3rem 0.9rem', fontSize: '0.9rem', fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
              }}>Nouveau</span>
            )}
            {discountPercent && (
              <span style={{
                background: '#C2662D', color: '#F5F0EB',
                padding: '0.3rem 0.9rem', fontSize: '0.9rem', fontWeight: 700,
                letterSpacing: '0.05em',
              }}>−{discountPercent}%</span>
            )}
          </div>
        )}

        {/* Rupture */}
        {outOfStock && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(26,26,26,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3,
          }}>
            <span style={{
              background: '#1A1A1A', color: '#8A8A8A',
              padding: '0.7rem 1.8rem', fontSize: '1.2rem', fontWeight: 600,
              letterSpacing: '0.08em', border: '1px solid #333',
            }}>Épuisé</span>
          </div>
        )}

        {/* CTA — glisse vers le haut */}
        {!outOfStock && (
          <div
            onMouseEnter={() => setBtnHovered(true)}
            onMouseLeave={() => setBtnHovered(false)}
            style={{
              position: 'absolute', bottom: '1.2rem', left: '1.2rem', right: '1.2rem',
              zIndex: 2,
              opacity: hovered ? 1 : 0,
              transform: hovered ? 'translateY(0)' : 'translateY(10px)',
              transition: 'opacity 0.25s ease, transform 0.25s ease',
            }}
          >
            <div style={{
              background: btnHovered ? '#C2662D' : '#D4AF37',
              color: btnHovered ? '#F5F0EB' : '#000',
              padding: '1rem',
              textAlign: 'center',
              fontSize: '1.2rem',
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              borderRadius: '0.2rem',
              transition: 'background 0.2s ease, color 0.2s ease',
            }}>
              Voir le produit
            </div>
          </div>
        )}
      </div>

      {/* Infos */}
      <div style={{ padding: '1.2rem 1.4rem 1.4rem' }}>
        <p style={{ fontSize: '1.1rem', color: '#8A8A8A', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.4rem', fontWeight: 500 }}>
          {product.category?.name || 'Golden Pousso'}
        </p>
        <h3 style={{
          fontSize: '1.4rem', fontWeight: 500, color: '#F5F0EB',
          marginBottom: '0.8rem', lineHeight: 1.35,
          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          fontFamily: 'Inter, sans-serif',
        }}>
          {product.name}
        </h3>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.8rem' }}>
          <span style={{ fontSize: '1.4rem', fontWeight: 600, color: '#D4AF37' }}>
            {formatFCFA(product.price)}
          </span>
          {product.old_price && (
            <span style={{ fontSize: '1.2rem', color: '#555', textDecoration: 'line-through' }}>
              {formatFCFA(product.old_price)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Variante claire (boutique, etc.) ── */
const ProductCardLight = ({ product, showBadge = true }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  const discountPercent =
    product.old_price && product.old_price > product.price
      ? Math.round(((product.old_price - product.price) / product.old_price) * 100)
      : null;

  const outOfStock = product.stock === 0;
  const hasSecondary = Boolean(product.secondary_image);

  return (
    <div
      onClick={() => !outOfStock && navigate(`/produit/${product.slug}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: outOfStock ? 'default' : 'pointer',
        background: '#F7F5F2',
        borderRadius: '0.8rem',
        overflow: 'hidden',
        opacity: outOfStock ? 0.7 : 1,
        transition: 'box-shadow 0.25s, transform 0.25s',
        boxShadow: hovered && !outOfStock ? '0 12px 40px rgba(13,13,13,0.12)' : '0 2px 12px rgba(13,13,13,0.05)',
        transform: hovered && !outOfStock ? 'translateY(-3px)' : 'none',
      }}
    >
      <div style={{ position: 'relative', overflow: 'hidden', aspectRatio: '2/3', background: '#F7F5F2' }}>
        {product.primary_image ? (
          <>
            {/* Image principale */}
            <img
              src={product.primary_image}
              alt={product.name}
              loading="lazy"
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                opacity: hovered && hasSecondary ? 0 : 1,
                transform: hovered && !hasSecondary ? 'scale(1.06)' : 'scale(1)',
                transition: hasSecondary ? 'opacity 0.7s ease' : 'transform 0.5s ease',
              }}
            />
            {/* Image survol (cross-fade) */}
            {hasSecondary && (
              <img
                src={product.secondary_image}
                alt={product.name}
                loading="lazy"
                style={{
                  position: 'absolute', inset: 0,
                  width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                  opacity: hovered ? 1 : 0,
                  transition: 'opacity 0.7s ease',
                }}
              />
            )}
          </>
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, #f0ede8, #e8e3dc)',
            color: '#C9A84C',
          }}>
            <i className="bx bx-image-alt" style={{ fontSize: '3.5rem', marginBottom: '0.5rem', opacity: 0.5 }}></i>
            <span style={{ fontSize: '1.1rem', color: '#bbb', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Photo bientôt</span>
          </div>
        )}

        {showBadge && (
          <div style={{ position: 'absolute', top: '1.2rem', left: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {product.is_new && (
              <span style={{
                background: '#C9A84C', color: '#fff',
                padding: '0.35rem 1rem', fontSize: '0.95rem', fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
              }}>Nouveau</span>
            )}
            {discountPercent && (
              <span style={{
                background: '#1a1a1a', color: '#C9A84C',
                padding: '0.35rem 1rem', fontSize: '0.95rem', fontWeight: 700,
                letterSpacing: '0.05em',
              }}>−{discountPercent}%</span>
            )}
          </div>
        )}

        {outOfStock && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(247,245,242,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{
              background: '#fff', color: '#555', padding: '0.7rem 1.8rem',
              fontSize: '1.2rem', fontWeight: 600, letterSpacing: '0.05em',
              border: '1px solid #ddd',
            }}>Épuisé</span>
          </div>
        )}

        {!outOfStock && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'rgba(13,13,13,0.88)',
            padding: '1.2rem', textAlign: 'center',
            transform: hovered ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 0.3s ease',
          }}>
            <span style={{ color: '#C9A84C', fontSize: '1.3rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Découvrir
            </span>
          </div>
        )}
      </div>

      <div style={{ padding: '1rem 1.2rem 1.2rem' }}>
        <p style={{ fontSize: '1.1rem', color: '#C9A84C', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.4rem', fontWeight: 500 }}>
          {product.category?.name || 'Golden Pousso'}
        </p>
        <h3 style={{
          fontSize: '1.5rem', fontWeight: 600, color: '#0D0D0D',
          marginBottom: '1rem', lineHeight: 1.3,
          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {product.name}
        </h3>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
          <span style={{ fontSize: '1.6rem', fontWeight: 700, color: '#0D0D0D' }}>
            {formatFCFA(product.price)}
          </span>
          {product.old_price && (
            <span style={{ fontSize: '1.3rem', color: '#bbb', textDecoration: 'line-through' }}>
              {formatFCFA(product.old_price)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const ProductCard = ({ product, showBadge = true, dark = false }) =>
  dark
    ? <ProductCardDark product={product} showBadge={showBadge} />
    : <ProductCardLight product={product} showBadge={showBadge} />;

export default ProductCard;
