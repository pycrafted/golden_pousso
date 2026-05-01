import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import useCartStore from '../store/cartStore';
import useSettingsStore, { formatPrice } from '../store/settingsStore';
import CldImg from './CldImg';

const QuickShopModal = ({ slug, onClose }) => {
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);
  const currency = useSettingsStore((s) => s.currency);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    apiClient.get(`/products/${slug}/`)
      .then((res) => { setProduct(res.data); setSelectedImage(0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  /* Escape + lock scroll */
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const images = product?.images ?? [];
  const variants = product?.variants ?? [];
  const sizes = [...new Set(variants.map((v) => v.size).filter(Boolean))];
  const colors = [...new Set(variants.map((v) => v.color).filter(Boolean))];

  /* Trouver la variante correspondant à taille + couleur sélectionnées */
  const matchedVariant = variants.find((v) =>
    (sizes.length === 0 || v.size === selectedSize) &&
    (colors.length === 0 || v.color === selectedColor)
  ) ?? null;

  const outOfStock = product?.stock === 0;

  const handleAddToCart = () => {
    if (!product || outOfStock) return;
    addItem(product, matchedVariant, qty);
    setAdded(true);
    setTimeout(() => { setAdded(false); onClose(); }, 900);
  };

  const modal = (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(10,8,5,0.78)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem',
        backdropFilter: 'blur(3px)',
      }}
    >
      <div className="qs-grid" style={{
        background: '#FAF6EE',
        width: '100%', maxWidth: '88rem',
        maxHeight: '90vh', overflowY: 'auto',
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
      }}>

        {/* ── Bouton fermer ── */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '1.6rem', right: '1.6rem', zIndex: 10,
            background: 'none', border: '1px solid #E0D0B8', cursor: 'pointer',
            width: '3.6rem', height: '3.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#1A1208', fontSize: '2rem', lineHeight: 1,
            transition: 'border-color 0.2s, color 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#B8960A'; e.currentTarget.style.color = '#B8960A'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E0D0B8'; e.currentTarget.style.color = '#1A1208'; }}
        >
          ×
        </button>

        {/* ── Colonne gauche : galerie ── */}
        <div style={{ display: 'flex', gap: '1rem', padding: '3.2rem' }}>

          {/* Miniatures verticales */}
          {images.length > 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', flexShrink: 0 }}>
              {images.map((img, i) => (
                <div
                  key={img.id}
                  onClick={() => setSelectedImage(i)}
                  style={{
                    width: '5.6rem', aspectRatio: '3/4', overflow: 'hidden', cursor: 'pointer',
                    border: `2px solid ${selectedImage === i ? '#B8960A' : '#E0D0B8'}`,
                    transition: 'border-color 0.2s', flexShrink: 0,
                  }}
                >
                  <CldImg src={img.image} alt="" sizes="90px" widths={[90, 180]}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}

          {/* Image principale */}
          <div style={{ flex: 1, aspectRatio: '3/4', overflow: 'hidden', background: '#E8DCC8' }}>
            {loading ? (
              <div style={{ width: '100%', height: '100%', background: '#E8DCC8', animation: 'qs-shimmer 1.4s ease-in-out infinite' }} />
            ) : images[selectedImage] ? (
              <CldImg
                src={images[selectedImage].image}
                alt={product?.name}
                eager
                sizes="(max-width: 768px) 100vw, 44vw"
                widths={[500, 800]}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#7A6A50', fontFamily: 'Inter, sans-serif', fontSize: '1.2rem' }}>Photo bientôt</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Colonne droite : infos ── */}
        <div style={{ padding: '3.2rem 3.2rem 3.2rem 0', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {loading ? (
            /* Skeleton */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.6rem', paddingTop: '0.4rem' }}>
              {[70, 40, 30].map((w, i) => (
                <div key={i} style={{ height: i === 0 ? '3.2rem' : '2rem', width: `${w}%`, background: '#E8DCC8', animation: 'qs-shimmer 1.4s ease-in-out infinite', animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          ) : product ? (
            <>
              {/* Statut stock */}
              <p style={{
                fontFamily: 'Inter, sans-serif', fontSize: '1.1rem',
                textTransform: 'uppercase', letterSpacing: '0.25em',
                color: outOfStock ? '#ef4444' : '#22c55e',
              }}>
                {outOfStock ? 'Épuisé' : 'En stock'}
              </p>

              {/* Nom */}
              <h2 style={{
                fontFamily: 'Aclonica, sans-serif',
                fontSize: 'clamp(2rem, 3vw, 3rem)',
                color: '#1A1208', lineHeight: 1.1, marginBottom: '0',
              }}>
                {product.name}
              </h2>

              {/* Prix */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '1.2rem' }}>
                <span style={{ fontFamily: 'Aclonica, sans-serif', fontSize: '2.4rem', color: '#B8960A' }}>
                  {formatPrice(product.price, currency)}
                </span>
                {product.old_price && (
                  <span style={{ fontSize: '1.6rem', color: '#7A6A50', textDecoration: 'line-through', fontFamily: 'Inter, sans-serif' }}>
                    {formatPrice(product.old_price, currency)}
                  </span>
                )}
              </div>

              {/* Tailles */}
              {sizes.length > 0 && (
                <div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#7A6A50', marginBottom: '1rem' }}>
                    Taille
                  </p>
                  <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                    {sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        style={{
                          padding: '0.8rem 1.6rem', cursor: 'pointer',
                          border: `1px solid ${selectedSize === size ? '#B8960A' : '#E0D0B8'}`,
                          background: selectedSize === size ? '#B8960A' : 'transparent',
                          color: selectedSize === size ? '#FAF6EE' : '#1A1208',
                          fontFamily: 'Inter, sans-serif', fontSize: '1.2rem', fontWeight: 500,
                          transition: 'all 0.2s',
                        }}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Couleurs */}
              {colors.length > 0 && (
                <div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#7A6A50', marginBottom: '1rem' }}>
                    Couleur
                  </p>
                  <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                    {colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        style={{
                          padding: '0.8rem 1.6rem', cursor: 'pointer',
                          border: `1px solid ${selectedColor === color ? '#B8960A' : '#E0D0B8'}`,
                          background: selectedColor === color ? '#B8960A' : 'transparent',
                          color: selectedColor === color ? '#FAF6EE' : '#1A1208',
                          fontFamily: 'Inter, sans-serif', fontSize: '1.2rem', fontWeight: 500,
                          transition: 'all 0.2s',
                        }}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantité */}
              <div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#7A6A50', marginBottom: '1rem' }}>
                  Quantité
                </p>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #E0D0B8', width: 'fit-content' }}>
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))}
                    style={{ width: '4rem', height: '4rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.8rem', color: '#1A1208' }}>
                    −
                  </button>
                  <span style={{ width: '4rem', textAlign: 'center', fontFamily: 'Inter, sans-serif', fontSize: '1.4rem', color: '#1A1208' }}>
                    {qty}
                  </span>
                  <button onClick={() => setQty((q) => q + 1)}
                    style={{ width: '4rem', height: '4rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.8rem', color: '#1A1208' }}>
                    +
                  </button>
                </div>
              </div>

              {/* Bouton panier */}
              <button
                onClick={handleAddToCart}
                disabled={outOfStock}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem',
                  background: added ? '#22c55e' : (outOfStock ? '#C8B896' : '#B8960A'),
                  color: '#FAF6EE', border: 'none', padding: '1.8rem', width: '100%',
                  fontFamily: 'Inter, sans-serif', fontSize: '1.3rem',
                  fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
                  cursor: outOfStock ? 'not-allowed' : 'pointer',
                  transition: 'background 0.25s',
                }}
                onMouseEnter={(e) => { if (!outOfStock && !added) e.currentTarget.style.background = '#96780A'; }}
                onMouseLeave={(e) => { if (!outOfStock && !added) e.currentTarget.style.background = '#B8960A'; }}
              >
                {added ? '✓ Ajouté !' : '+ Ajouter au panier'}
              </button>

              {/* Voir la page produit */}
              <button
                onClick={() => { onClose(); navigate(`/produit/${product.slug}`); }}
                style={{
                  background: 'none', border: '1px solid #E0D0B8',
                  color: '#7A6A50', padding: '1.4rem', width: '100%',
                  fontFamily: 'Inter, sans-serif', fontSize: '1.2rem',
                  letterSpacing: '0.15em', textTransform: 'uppercase',
                  cursor: 'pointer', transition: 'border-color 0.2s, color 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#B8960A'; e.currentTarget.style.color = '#B8960A'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E0D0B8'; e.currentTarget.style.color = '#7A6A50'; }}
              >
                Voir la page produit →
              </button>

              {/* Description courte */}
              {product.description && (
                <p style={{
                  fontFamily: 'Inter, sans-serif', fontSize: '1.3rem',
                  color: '#7A6A50', lineHeight: 1.7,
                  borderTop: '1px solid #E0D0B8', paddingTop: '2rem',
                }}>
                  {product.description.length > 220
                    ? product.description.slice(0, 220) + '…'
                    : product.description}
                </p>
              )}
            </>
          ) : (
            <p style={{ fontFamily: 'Inter, sans-serif', color: '#7A6A50' }}>Produit introuvable.</p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes qs-shimmer { 0%,100% { opacity: 1; } 50% { opacity: 0.45; } }
        @media (max-width: 700px) {
          .qs-grid { grid-template-columns: 1fr !important; }
          .qs-grid > div:first-child { padding: 2.4rem 2.4rem 0 !important; }
          .qs-grid > div:last-child { padding: 2.4rem !important; }
        }
      `}</style>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
};

export default QuickShopModal;
