import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Hero from '../components/Hero';
import CategoryTeaser from '../components/CategoryTeaser';
import SkeletonCard from '../components/SkeletonCard';
import SEOHead from '../components/SEOHead';
import CategoryGrid from '../components/CategoryGrid';
import NewsletterSection from '../components/NewsletterSection';
import FullWidthBanner from '../components/FullWidthBanner';
import apiClient from '../api/client';
import useSettingsStore, { formatPrice } from '../store/settingsStore';

/* ── Card produit — copie exacte du style "regarde" ── */
const HomeProductCard = ({ product }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const outOfStock = product.stock === 0;
  const currency = useSettingsStore((s) => s.currency);

  return (
    /* Tout le card se soulève au hover, comme dans regarde */
    <div
      onClick={() => !outOfStock && navigate(`/produit/${product.slug}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: outOfStock ? 'default' : 'pointer',
        opacity: outOfStock ? 0.55 : 1,
        transform: hovered && !outOfStock ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'transform 0.3s ease',
      }}
    >
      {/* Zone image — aspect 3/4, bg sombre, rounded-sm */}
      <div style={{
        position: 'relative',
        aspectRatio: '3/4',
        overflow: 'hidden',
        marginBottom: '1.6rem',
        background: '#E8DCC8',
        borderRadius: '2px',
      }}>
        {/* Image A — zoom si pas de secondaire, swap sinon */}
        {product.primary_image ? (
          <img src={product.primary_image} alt={product.name} loading="lazy"
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
              opacity: hovered && product.secondary_image ? 0 : 1,
              transform: hovered && !product.secondary_image ? 'scale(1.08)' : 'scale(1)',
              transition: 'opacity 0.7s ease, transform 0.7s ease',
            }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '1.1rem', color: '#7A6A50', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Photo bientôt</span>
          </div>
        )}
        {/* Image B */}
        {product.secondary_image && (
          <img src={product.secondary_image} alt={product.name} loading="lazy"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: hovered ? 1 : 0, transition: 'opacity 0.7s ease' }} />
        )}

        {/* Bouton "Ajouter" slide-up — identique regarde */}
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
            transition: 'opacity 0.25s ease, transform 0.25s ease, background 0.2s ease, color 0.2s ease',
            zIndex: 2,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#C2662D'; e.currentTarget.style.color = '#1A1208'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#B8960A'; e.currentTarget.style.color = '#FAF6EE'; }}
        >
          + Ajouter
        </button>
      </div>

      {/* Texte — copie exacte regarde */}
      <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.4rem', fontWeight: 500, color: '#1A1208', marginBottom: '0.4rem' }}>
        {product.name}
      </h3>

      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.4rem', color: '#B8960A' }}>
        {formatPrice(product.price, currency)}
      </p>
    </div>
  );
};

/* ── useInView ── */
const useInView = () => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1, rootMargin: '-60px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
};

/* ── Page ── */
const HomePage = () => {
  const [newProducts, setNewProducts] = useState([]);
  const [loadingNew, setLoadingNew] = useState(true);
  const [sectionRef, sectionVisible] = useInView();

  useEffect(() => {
    apiClient.get('/products/new/').then((r) => setNewProducts(r.data)).catch(() => {}).finally(() => setLoadingNew(false));
  }, []);

  return (
    <>
      <SEOHead url="/" />

      {/* ── 1. HERO ── */}
      <Hero />

      {/* ── 2. CATÉGORIES — 4 cartes éditoriales ── */}
      <CategoryTeaser />

      {/* ── 3. NOS PRODUITS ── */}
      <CategoryGrid />

      {/* ── 4. BANNIÈRE PLEINE LARGEUR ── */}
      <FullWidthBanner />

      {/* ── 5. NOUVEAUTÉS ── */}
      <section id="collection" style={{ padding: '0', background: '#FAF6EE' }}>
        <div className="container">

          {/* En-tête */}
          <div ref={sectionRef} style={{
            marginBottom: '5rem',
            opacity: sectionVisible ? 1 : 0, transform: sectionVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.8s ease, transform 0.8s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2.4rem' }}>
              <div style={{ width: '4.8rem', height: '1px', background: '#B8960A' }} />
              <p style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.3em', color: '#B8960A' }}>
                Nouveautés
              </p>
            </div>

          </div>

          {/* Grille 4 colonnes */}
          {loadingNew ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2.4rem' }} className="products-grid">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div
              style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2.4rem' }}
              className="products-grid"
            >
              {newProducts.slice(0, 4).map((p, i) => (
                <div
                  key={p.id}
                  style={{
                    opacity: sectionVisible ? 1 : 0,
                    transform: sectionVisible ? 'translateY(0)' : 'translateY(20px)',
                    transition: `opacity 0.5s ease ${0.1 * i + 0.3}s, transform 0.5s ease ${0.1 * i + 0.3}s`,
                  }}
                >
                  <HomeProductCard product={p} />
                </div>
              ))}
            </div>
          )}
        </div>
        <style>{`
          @media (max-width: 1023px) { .products-grid { grid-template-columns: repeat(2, 1fr) !important; } }
          @media (max-width: 479px)  { .products-grid { grid-template-columns: repeat(1, 1fr) !important; } }
        `}</style>
      </section>

      {/* ── 6. NEWSLETTER ── */}
      <NewsletterSection />

    </>
  );
};


export default HomePage;
