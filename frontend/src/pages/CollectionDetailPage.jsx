import { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import apiClient from '../api/client';
import useSettingsStore, { formatPrice } from '../store/settingsStore';
import CldImg from '../components/CldImg';

const useInView = () => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.08, rootMargin: '-40px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
};

const ProductCard = ({ product, index }) => {
  const currency = useSettingsStore((s) => s.currency);
  const navigate = useNavigate();
  const [ref, visible] = useInView();
  const [hovered, setHovered] = useState(false);
  const delay = (index % 4) * 0.07;
  const outOfStock = product.stock === 0;

  return (
    <>
    <div
      ref={ref}
      onClick={() => !outOfStock && navigate(`/produit/${product.slug}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: outOfStock ? 'default' : 'pointer',
        opacity: visible ? (outOfStock ? 0.55 : 1) : 0,
        transform: visible
          ? (hovered && !outOfStock ? 'translateY(-4px)' : 'translateY(0)')
          : 'translateY(28px)',
        transition: `opacity 0.55s ease ${delay}s, transform 0.55s ease ${delay}s`,
      }}
    >
      <div style={{
        position: 'relative',
        aspectRatio: '3/4',
        overflow: 'hidden',
        marginBottom: '1.4rem',
        background: '#E8DCC8',
        borderRadius: '2px',
      }}>
        {product.primary_image ? (
          <>
            <CldImg
              src={product.primary_image}
              alt={product.name}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
              widths={[300, 600]}
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%', objectFit: 'cover',
                opacity: hovered && product.secondary_image ? 0 : 1,
                transform: hovered && !product.secondary_image ? 'scale(1.06)' : 'scale(1)',
                transition: 'opacity 0.6s ease, transform 0.6s ease',
              }}
            />
            {product.secondary_image && (
              <CldImg
                src={product.secondary_image}
                alt={product.name}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
                widths={[300, 600]}
                style={{
                  position: 'absolute', inset: 0,
                  width: '100%', height: '100%', objectFit: 'cover',
                  opacity: hovered ? 1 : 0,
                  transition: 'opacity 0.6s ease',
                }}
              />
            )}
          </>
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: '1.1rem', color: '#7A6A50', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Photo bientôt
            </span>
          </div>
        )}

        {outOfStock && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(26,18,8,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{
              fontFamily: 'Inter, sans-serif', fontSize: '1rem',
              fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase',
              color: '#FAF6EE', background: '#1A1208',
              padding: '0.6rem 1.6rem',
            }}>
              Épuisé
            </span>
          </div>
        )}

        <button
          onClick={e => { e.stopPropagation(); if (!outOfStock) navigate(`/produit/${product.slug}`); }}
          style={{
            position: 'absolute', bottom: '1.6rem', left: '1.6rem', right: '1.6rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            background: '#B8960A', color: '#FAF6EE',
            border: 'none', borderRadius: '2px',
            padding: '1.2rem',
            fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', fontWeight: 600,
            letterSpacing: '0.2em', textTransform: 'uppercase',
            cursor: 'pointer',
            opacity: hovered && !outOfStock ? 1 : 0,
            transform: hovered && !outOfStock ? 'translateY(0)' : 'translateY(10px)',
            transition: 'opacity 0.25s ease, transform 0.25s ease, background 0.2s ease',
            zIndex: 2,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#96780A'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#B8960A'; }}
        >
          Voir le produit
        </button>
      </div>

      <h3 style={{
        fontFamily: 'Inter, sans-serif', fontSize: '1.4rem',
        fontWeight: 500, color: '#1A1208', marginBottom: '0.4rem',
      }}>
        {product.name}
      </h3>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.4rem', color: '#B8960A' }}>
        {formatPrice(product.price, currency)}
      </p>
    </div>
    </>
  );
};

const CollectionDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiClient.get(`/collections/${slug}/`)
      .then((res) => setCollection(res.data))
      .catch((err) => {
        if (err.response?.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const year = collection?.date ? new Date(collection.date).getFullYear() : '';

  if (notFound) {
    return (
      <div style={{ background: '#FAF6EE', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', color: '#7A6A50', fontSize: '1.4rem' }}>
            Collection introuvable.
          </p>
          <button
            onClick={() => navigate('/collections')}
            style={{ marginTop: '2rem', background: 'none', border: '1px solid #B8960A', color: '#B8960A', padding: '1rem 2.4rem', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontSize: '1.1rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}
          >
            ← Retour aux collections
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {collection && (
        <SEOHead
          title={collection.name}
          description={collection.description || `Découvrez la collection ${collection.name} de Golden Pousso.`}
          url={`/collections/${slug}`}
        />
      )}

      <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
        {/* En-tête */}
        <div className="col-detail-header" style={{ maxWidth: '110rem', margin: '0 auto' }}>

          {/* Fil d'Ariane */}
          <div style={{ marginBottom: '3rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => navigate('/collections')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', fontSize: '1.1rem',
                color: '#7A6A50', letterSpacing: '0.15em', textTransform: 'uppercase',
                display: 'flex', alignItems: 'center', gap: '0.6rem',
                transition: 'color 0.2s',
                padding: 0,
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#B8960A'}
              onMouseLeave={e => e.currentTarget.style.color = '#7A6A50'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Collections
            </button>
            <span style={{ color: '#C8B896', fontSize: '1.1rem' }}>/</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.1rem', color: '#1A1208', letterSpacing: '0.1em' }}>
              {loading ? '…' : collection?.name}
            </span>
          </div>

          {loading ? (
            <div style={{ height: '12rem' }} />
          ) : (
            <div style={{ marginBottom: '6rem' }}>
              {year && (
                <p style={{
                  fontSize: '1.1rem', fontFamily: 'Inter, sans-serif',
                  textTransform: 'uppercase', letterSpacing: '0.3em',
                  color: '#B8960A', marginBottom: '1.2rem',
                }}>
                  {year}
                </p>
              )}
              <h1 style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 'clamp(3rem, 6vw, 5.6rem)',
                color: '#1A1208', textTransform: 'uppercase',
                letterSpacing: '0.02em', lineHeight: 1.1,
                marginBottom: collection?.description ? '2rem' : '0',
              }}>
                {collection?.name}
              </h1>
              {collection?.description && (
                <p style={{
                  fontFamily: 'Inter, sans-serif', fontSize: '1.5rem',
                  color: '#7A6A50', lineHeight: 1.7, maxWidth: '60rem',
                }}>
                  {collection.description}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Grille de produits */}
        <div className="col-detail-body" style={{ maxWidth: '110rem', margin: '0 auto' }}>
          {loading ? (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2.4rem',
            }} className="col-detail-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ aspectRatio: '3/4', background: '#EDE5D5', borderRadius: '2px', animation: 'shimmer 1.4s ease-in-out infinite' }} />
              ))}
            </div>
          ) : !collection?.products?.length ? (
            <p style={{ textAlign: 'center', color: '#7A6A50', fontFamily: 'Inter, sans-serif', padding: '6rem 0', fontSize: '1.4rem' }}>
              Aucun produit dans cette collection pour le moment.
            </p>
          ) : (
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2.4rem',
            }} className="col-detail-grid">
              {collection.products.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          )}
        </div>

        <style>{`
          .col-detail-grid {
            align-items: start;
          }
          @keyframes shimmer {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          @media (max-width: 1023px) {
            .col-detail-grid { grid-template-columns: repeat(2, 1fr) !important; }
          }
          @media (max-width: 639px) {
            .col-detail-grid { grid-template-columns: 1fr !important; }
          }
          .col-detail-header { padding: 10rem 6rem 0; }
          .col-detail-body { padding: 0 6rem 10rem; }
          @media (max-width: 768px) {
            .col-detail-header { padding: 8rem 2.4rem 0; }
            .col-detail-body { padding: 0 2.4rem 8rem; }
          }
        `}</style>
      </div>
    </>
  );
};

export default CollectionDetailPage;
