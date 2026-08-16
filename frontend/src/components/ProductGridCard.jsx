import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CldImg from './CldImg';
import useSettingsStore, { formatPrice } from '../store/settingsStore';

/* ── Carte produit — grille boutique/catégorie (image 3/4 + quick actions) ── */
export const PLPCard = ({ product, index }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const currency = useSettingsStore((s) => s.currency);
  const goToProduct = () => navigate(`/produit/${product.slug}`);

  const discountPercent =
    product.old_price && product.old_price > product.price
      ? Math.round(((product.old_price - product.price) / product.old_price) * 100)
      : null;
  const outOfStock = product.stock === 0;
  const hasSecondary = Boolean(product.secondary_image);

  return (
    <article
      className="plp-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => !outOfStock && goToProduct()}
      style={{
        cursor: outOfStock ? 'default' : 'pointer',
        opacity: outOfStock ? 0.55 : 1,
        animation: `fadeUp 0.55s ease both`,
        animationDelay: `${0.06 * index}s`,
      }}
    >
      {/* Image container */}
      <div style={{
        position: 'relative',
        aspectRatio: '3/4',
        overflow: 'hidden',
        background: '#F0E8D8',
      }}>

        {/* Badges */}
        {product.is_new && (
          <span style={{
            position: 'absolute', top: '1.2rem', left: '1.2rem', zIndex: 10,
            background: '#B8960A', color: '#FAF6EE',
            fontSize: '1rem', fontFamily: 'Inter, sans-serif',
            textTransform: 'uppercase', letterSpacing: '0.2em',
            padding: '0.4rem 1.2rem', fontWeight: 600,
          }}>
            Nouveauté
          </span>
        )}
        {discountPercent && (
          <span style={{
            position: 'absolute',
            top: product.is_new ? '4.2rem' : '1.2rem',
            left: '1.2rem', zIndex: 10,
            background: '#C2662D', color: '#1A1208',
            fontSize: '1rem', fontFamily: 'Inter, sans-serif',
            padding: '0.4rem 1.2rem', fontWeight: 600, letterSpacing: '0.05em',
          }}>
            −{discountPercent}%
          </span>
        )}

        {/* Image principale */}
        {product.primary_image ? (
          <CldImg
            src={product.primary_image}
            alt={product.name}
            eager={index < 3}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            widths={[300, 600]}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%', objectFit: 'cover',
              transition: 'transform 0.7s ease, opacity 0.7s ease',
              transform: hovered ? 'scale(1.05)' : 'scale(1)',
              opacity: hovered && hasSecondary ? 0 : 1,
            }}
          />
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#F0E8D8',
          }}>
            <span style={{
              fontSize: '1.1rem', color: 'rgba(255,255,255,0.15)',
              letterSpacing: '0.2em', textTransform: 'uppercase',
              fontFamily: 'Inter, sans-serif',
            }}>
              Photo bientôt
            </span>
          </div>
        )}

        {/* Image secondaire au hover */}
        {hasSecondary && (
          <CldImg
            src={product.secondary_image}
            alt={product.name}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            widths={[300, 600]}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%', objectFit: 'cover',
              transition: 'opacity 0.7s ease',
              opacity: hovered ? 1 : 0,
            }}
          />
        )}

        {/* Overlay sombre au hover */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(10,10,10,0.22)',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }} />

        {/* Icône œil au survol */}
        {!outOfStock && (
          <div
            aria-label="Voir le produit"
            style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: hovered ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0.7)',
              opacity: hovered ? 1 : 0,
              transition: 'opacity 0.25s ease, transform 0.25s ease',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem',
            }}>
            <div style={{
              width: '5.6rem', height: '5.6rem', borderRadius: '50%',
              background: 'rgba(250,246,238,0.95)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1A1208" strokeWidth="1.8">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
            <span style={{
              fontFamily: 'Inter, sans-serif', fontSize: '1rem', fontWeight: 600,
              letterSpacing: '0.15em', textTransform: 'uppercase',
              color: '#FAF6EE', background: 'rgba(10,8,5,0.6)',
              padding: '0.3rem 1rem', borderRadius: '2px',
            }}>
              Voir le produit
            </span>
          </div>
        )}

        {/* Nom + prix — superposés sur l'image */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(to top, rgba(10,8,5,0.9) 0%, rgba(10,8,5,0.45) 55%, transparent 100%)',
          padding: '4rem 1.6rem 1.6rem',
          pointerEvents: 'none',
        }}>
          <h3 style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: '1.4rem', color: '#FAF6EE',
            marginBottom: '0.5rem', lineHeight: 1.3,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
          }}>
            {product.name}
          </h3>
          <p style={{ fontSize: '1.25rem', fontFamily: 'Inter, sans-serif', color: '#D9B54A' }}>
            {formatPrice(product.price, currency)}
            {product.old_price && (
              <span style={{ color: 'rgba(250,246,238,0.55)', marginLeft: '0.8rem', textDecoration: 'line-through', fontSize: '1.15rem' }}>
                {formatPrice(product.old_price, currency)}
              </span>
            )}
          </p>
        </div>

        {/* Badge épuisé */}
        {outOfStock && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(26,26,26,0.78)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{
              background: '#F0E8D8', color: '#7A6A50', border: '1px solid #CEC0A0',
              padding: '0.7rem 2rem', fontSize: '1.2rem', letterSpacing: '0.1em',
              fontFamily: 'Inter, sans-serif', textTransform: 'uppercase',
            }}>
              Épuisé
            </span>
          </div>
        )}
      </div>
    </article>
  );
};

/* ── Skeleton ── */
export const SkeletonCard = () => (
  <div style={{ aspectRatio: '3/4', background: '#E8DCC8', animation: 'shimmer 1.6s ease-in-out infinite' }} />
);

export const PLP_GRID_STYLES = `
  @keyframes fadeUp   { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
  @keyframes shimmer  { 0%,100% { opacity:0.35; } 50% { opacity:0.7; } }
`;

export const PLP_INPUT_STYLE = {
  width: '100%', padding: '1rem 0',
  background: 'transparent', border: 'none',
  borderBottom: '1px solid #CEC0A0',
  color: '#1A1208', fontSize: '1.3rem', fontFamily: 'Inter, sans-serif',
  outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};

/* ── Liste d'options sidebar (catégories, tri…) — case cochable + libellé ── */
export const SidebarOptionList = ({ options, activeValue, onSelect }) => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    {options.map((opt) => {
      const active = activeValue === opt.value;
      return (
        <button
          key={opt.value || 'all'}
          onClick={() => onSelect(opt.value)}
          style={{ display: 'flex', alignItems: 'center', gap: '1.4rem', padding: '1.1rem 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid rgba(42,42,42,0.06)' }}
        >
          <span style={{
            width: '1.5rem', height: '1.5rem',
            border: `1px solid ${active ? '#B8960A' : '#CEC0A0'}`,
            background: active ? '#B8960A' : 'transparent',
            flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
          }}>
            {active && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#1A1208" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>}
          </span>
          <span style={{ fontSize: '1.3rem', fontFamily: 'Inter, sans-serif', color: active ? '#1A1208' : '#7A6A50', transition: 'color 0.2s' }}>
            {opt.label}
          </span>
        </button>
      );
    })}
  </div>
);

/* ── Filtre prix (min/max FCFA) ── */
export const PriceFilter = ({ minPrice, maxPrice, onApply }) => {
  const [min, setMin] = useState(minPrice);
  const [max, setMax] = useState(maxPrice);
  useEffect(() => setMin(minPrice), [minPrice]);
  useEffect(() => setMax(maxPrice), [maxPrice]);

  const apply = () => onApply(min, max);
  const onKeyDown = (e) => { if (e.key === 'Enter') apply(); };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '1.6rem' }}>
        <input
          type="number" min="0" inputMode="numeric" placeholder="Min"
          value={min} onChange={(e) => setMin(e.target.value)} onKeyDown={onKeyDown}
          style={PLP_INPUT_STYLE}
        />
        <span style={{ color: '#CEC0A0' }}>—</span>
        <input
          type="number" min="0" inputMode="numeric" placeholder="Max"
          value={max} onChange={(e) => setMax(e.target.value)} onKeyDown={onKeyDown}
          style={PLP_INPUT_STYLE}
        />
      </div>
      <button
        onClick={apply}
        style={{
          width: '100%', padding: '1rem', background: 'none',
          border: '1px solid #B8960A', color: '#B8960A',
          fontSize: '1.05rem', fontFamily: 'Inter, sans-serif',
          textTransform: 'uppercase', letterSpacing: '0.15em',
          cursor: 'pointer', transition: 'background 0.2s, color 0.2s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#B8960A'; e.currentTarget.style.color = '#FAF6EE'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#B8960A'; }}
      >
        Appliquer
      </button>
    </div>
  );
};
