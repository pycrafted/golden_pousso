import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLORS, RADIUS, FONT_BODY } from '../theme';

const formatFCFA = (price) =>
  new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';

/**
 * Card produit unique — fond clair ou sombre selon `dark`, mais palette,
 * rayon et typographie identiques dans les deux cas (design tokens theme.js).
 */
const ProductCard = ({ product, showBadge = true, dark = false }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  const discountPercent =
    product.old_price && product.old_price > product.price
      ? Math.round(((product.old_price - product.price) / product.old_price) * 100)
      : null;

  const outOfStock = product.stock === 0;
  const hasSecondary = Boolean(product.secondary_image);

  const bg = dark ? '#111' : '#F4EFE4';
  const text = dark ? COLORS.cream : COLORS.ink;
  const muted = dark ? COLORS.mutedOnDark : COLORS.mutedOnLight;
  const cardBg = dark ? '#161310' : '#F4EFE4';

  return (
    <div
      onClick={() => !outOfStock && navigate(`/produit/${product.slug}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
          cursor: outOfStock ? 'default' : 'pointer',
          background: cardBg,
          borderRadius: RADIUS,
          overflow: 'hidden',
          opacity: outOfStock ? 0.6 : 1,
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          transform: hovered && !outOfStock ? 'translateY(-4px)' : 'none',
          boxShadow: hovered && !outOfStock ? '0 16px 48px rgba(0,0,0,0.18)' : '0 2px 16px rgba(0,0,0,0.06)',
        }}
      >
        {/* Zone image */}
        <div style={{ position: 'relative', overflow: 'hidden', aspectRatio: '3/4', background: bg }}>
          {product.primary_image ? (
            <img
              src={product.primary_image}
              alt={product.name}
              loading="lazy"
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%', objectFit: 'cover',
                opacity: hovered && hasSecondary ? 0 : 1,
                transform: hovered && !hasSecondary ? 'scale(1.05)' : 'scale(1)',
                transition: hasSecondary ? 'opacity 0.7s ease' : 'opacity 0.7s ease, transform 0.6s ease',
              }}
            />
          ) : (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: bg,
            }}>
              <i className="bx bx-image-alt" style={{ fontSize: '3.5rem', color: muted, marginBottom: '0.5rem' }}></i>
              <span style={{ fontFamily: FONT_BODY, fontSize: '1.1rem', color: muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Photo bientôt</span>
            </div>
          )}

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

          {showBadge && (
            <div style={{ position: 'absolute', top: '1.2rem', left: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', zIndex: 2 }}>
              {product.is_new && (
                <span style={{
                  fontFamily: FONT_BODY,
                  background: COLORS.gold, color: dark ? '#000' : COLORS.cream,
                  padding: '0.3rem 0.9rem', fontSize: '0.9rem', fontWeight: 700,
                  letterSpacing: '0.12em', textTransform: 'uppercase', borderRadius: RADIUS,
                }}>Nouveau</span>
              )}
              {discountPercent && (
                <span style={{
                  fontFamily: FONT_BODY,
                  background: COLORS.terracotta, color: COLORS.cream,
                  padding: '0.3rem 0.9rem', fontSize: '0.9rem', fontWeight: 700,
                  letterSpacing: '0.05em', borderRadius: RADIUS,
                }}>−{discountPercent}%</span>
              )}
            </div>
          )}

          {outOfStock && (
            <div style={{
              position: 'absolute', inset: 0, background: dark ? 'rgba(17,17,17,0.82)' : 'rgba(244,239,228,0.85)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3,
            }}>
              <span style={{
                fontFamily: FONT_BODY,
                background: cardBg, color: muted,
                padding: '0.7rem 1.8rem', fontSize: '1.2rem', fontWeight: 600,
                letterSpacing: '0.08em', border: `1px solid ${muted}`, borderRadius: RADIUS,
              }}>Épuisé</span>
            </div>
          )}

          {!outOfStock && (
            <div
              style={{
                position: 'absolute', bottom: '1.2rem', left: '1.2rem', right: '1.2rem',
                zIndex: 2,
                opacity: hovered ? 1 : 0,
                transform: hovered ? 'translateY(0)' : 'translateY(10px)',
                transition: 'opacity 0.25s ease, transform 0.25s ease',
              }}
            >
              <div
                onMouseEnter={(e) => { e.currentTarget.style.background = COLORS.terracotta; e.currentTarget.style.color = COLORS.cream; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = COLORS.gold; e.currentTarget.style.color = dark ? '#000' : COLORS.cream; }}
                style={{
                  fontFamily: FONT_BODY,
                  background: COLORS.gold,
                  color: dark ? '#000' : COLORS.cream,
                  padding: '1rem',
                  textAlign: 'center',
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  borderRadius: RADIUS,
                  transition: 'background 0.2s ease, color 0.2s ease',
                }}
              >
                Voir le produit
              </div>
            </div>
          )}
        </div>

        {/* Infos */}
        <div style={{ padding: '1.2rem 1.4rem 1.4rem' }}>
          <p style={{ fontFamily: FONT_BODY, fontSize: '1.1rem', color: muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.4rem', fontWeight: 500 }}>
            {product.category?.name || 'Golden Pousso'}
          </p>
          <h3 style={{
            fontFamily: FONT_BODY,
            fontSize: '1.4rem', fontWeight: 500, color: text,
            marginBottom: '0.8rem', lineHeight: 1.35,
            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          }}>
            {product.name}
          </h3>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.8rem' }}>
            <span style={{ fontFamily: FONT_BODY, fontSize: '1.4rem', fontWeight: 600, color: COLORS.gold }}>
              {formatFCFA(product.price)}
            </span>
            {product.old_price && (
              <span style={{ fontFamily: FONT_BODY, fontSize: '1.2rem', color: muted, textDecoration: 'line-through' }}>
                {formatFCFA(product.old_price)}
              </span>
            )}
          </div>
        </div>
      </div>
  );
};

export default ProductCard;
