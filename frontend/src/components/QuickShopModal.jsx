import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import apiClient from '../api/client';
import useCartStore from '../store/cartStore';
import useSettingsStore, { formatPrice } from '../store/settingsStore';
import CldImg from './CldImg';

const SimilarCard = ({ product, currency, onClick }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: 'pointer' }}
    >
      <div style={{
        aspectRatio: '3/4', overflow: 'hidden',
        background: '#E8DCC8', marginBottom: '0.8rem',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'transform 0.3s ease',
      }}>
        {product.primary_image ? (
          <CldImg
            src={product.primary_image}
            alt={product.name}
            sizes="(max-width: 700px) 50vw, 20vw"
            widths={[200, 400]}
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              transform: hovered ? 'scale(1.08)' : 'scale(1)',
              transition: 'transform 0.7s ease',
            }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '1rem', color: '#7A6A50' }}>Photo bientôt</span>
          </div>
        )}
      </div>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.2rem', fontWeight: 500, color: '#1A1208', marginBottom: '0.3rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {product.name}
      </p>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.2rem', color: '#B8960A' }}>
        {formatPrice(product.price, currency)}
      </p>
    </div>
  );
};

const QuickShopModal = ({ slug, onClose }) => {
  const addItem = useCartStore((s) => s.addItem);
  const currency = useSettingsStore((s) => s.currency);

  const [activeSlug, setActiveSlug] = useState(slug);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [similar, setSimilar] = useState([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [imgZoomed, setImgZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState('50% 50%');

  const handleImgMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin(`${x}% ${y}%`);
  };

  const switchProduct = (newSlug) => {
    setActiveSlug(newSlug);
    setSelectedImage(0);
    setSelectedSize(null);
    setSelectedColor(null);
    setQty(1);
    setAdded(false);
    setImgZoomed(false);
    setZoomOrigin('50% 50%');
  };

  useEffect(() => {
    setLoading(true);
    apiClient.get(`/products/${activeSlug}/`)
      .then((res) => {
        setProduct(res.data);
        setSelectedImage(0);
        const catSlug = res.data.category?.slug;
        if (catSlug) {
          apiClient.get('/products/', { params: { category: catSlug } })
            .then((r) => {
              const all = r.data.results ?? r.data;
              setSimilar(all.filter((p) => p.slug !== activeSlug).slice(0, 4));
            })
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeSlug]);

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
      onClick={(e) => { e.stopPropagation(); onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem',
        background: 'rgba(10,8,5,0.78)',
        backdropFilter: 'blur(3px)',
      }}
    >
      {/* Contenu du modal — stopPropagation pour ne pas fermer au clic intérieur */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '88rem' }}
      >


        <div className="qs-grid" style={{
          background: '#FAF6EE',
          width: '100%',
          maxHeight: '90vh', overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
        }}>

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
          <div
            onMouseEnter={() => setImgZoomed(true)}
            onMouseLeave={() => { setImgZoomed(false); setZoomOrigin('50% 50%'); }}
            onMouseMove={handleImgMouseMove}
            style={{
              flex: 1, aspectRatio: '3/4', overflow: 'hidden', background: '#E8DCC8',
              cursor: imgZoomed ? 'crosshair' : 'default',
            }}
          >
            {loading ? (
              <div style={{ width: '100%', height: '100%', background: '#E8DCC8', animation: 'qs-shimmer 1.4s ease-in-out infinite' }} />
            ) : images[selectedImage] ? (
              <CldImg
                src={images[selectedImage].image}
                alt={product?.name}
                eager
                sizes="(max-width: 768px) 100vw, 44vw"
                widths={[500, 800]}
                style={{
                  width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                  transform: imgZoomed ? 'scale(1.8)' : 'scale(1)',
                  transformOrigin: zoomOrigin,
                  transition: imgZoomed ? 'transform 0.1s ease' : 'transform 0.35s ease',
                  willChange: 'transform',
                }}
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
                  <div style={{ position: 'relative' }}>
                    <select
                      value={selectedSize ?? ''}
                      onChange={(e) => setSelectedSize(e.target.value || null)}
                      style={{
                        width: '100%', padding: '1.1rem 3.6rem 1.1rem 1.4rem',
                        appearance: 'none', WebkitAppearance: 'none',
                        border: `1px solid ${selectedSize ? '#B8960A' : '#E0D0B8'}`,
                        background: '#FAF6EE', color: selectedSize ? '#1A1208' : '#7A6A50',
                        fontFamily: 'Inter, sans-serif', fontSize: '1.3rem', fontWeight: 500,
                        cursor: 'pointer', outline: 'none',
                        transition: 'border-color 0.2s',
                      }}
                    >
                      <option value="">Choisir une taille</option>
                      {sizes.map((size) => (
                        <option key={size} value={size}>{size}</option>
                      ))}
                    </select>
                    <svg
                      style={{ position: 'absolute', right: '1.2rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
                      width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke={selectedSize ? '#B8960A' : '#7A6A50'} strokeWidth="2" strokeLinecap="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
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

        {/* ── Pièces similaires ── */}
        {similar.length > 0 && (
          <div style={{
            gridColumn: '1 / -1',
            borderTop: '1px solid #E0D0B8',
            padding: '2.4rem 3.2rem 3.2rem',
          }}>
            <p style={{
              fontFamily: 'Inter, sans-serif', fontSize: '1rem',
              textTransform: 'uppercase', letterSpacing: '0.3em',
              color: '#7A6A50', marginBottom: '2rem',
            }}>
              Vous aimerez aussi
            </p>
            <div className="qs-similar-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '1.6rem',
            }}>
              {similar.map((p) => (
                <SimilarCard key={p.slug} product={p} currency={currency} onClick={() => switchProduct(p.slug)} />
              ))}
            </div>
          </div>
        )}
        </div>{/* fin qs-grid */}
      </div>{/* fin wrapper */}

      <style>{`
        @keyframes qs-shimmer { 0%,100% { opacity: 1; } 50% { opacity: 0.45; } }
        @media (max-width: 700px) {
          .qs-grid { grid-template-columns: 1fr !important; }
          .qs-grid > div:first-child { padding: 2.4rem 2.4rem 0 !important; }
          .qs-grid > div:nth-child(2) { padding: 2.4rem !important; }
          .qs-similar-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
};

export default QuickShopModal;
