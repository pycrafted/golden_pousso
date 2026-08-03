import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Hero from '../components/Hero';
import CategoryTeaser from '../components/CategoryTeaser';
import SkeletonCard from '../components/SkeletonCard';
import SEOHead from '../components/SEOHead';
import CategoryGrid from '../components/CategoryGrid';
import FullWidthBanner from '../components/FullWidthBanner';
import apiClient from '../api/client';
import useSettingsStore, { formatPrice } from '../store/settingsStore';
import CldImg from '../components/CldImg';
import VideoCardsSection from '../components/VideoCardsSection';
import TestimonialsSection from '../components/TestimonialsSection';

/* ── Card produit — copie exacte du style "regarde" ── */
const HomeProductCard = ({ product }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const outOfStock = product.stock === 0;
  const currency = useSettingsStore((s) => s.currency);
  const goToProduct = () => !outOfStock && navigate(`/produit/${product.slug}`);

  return (
    /* Tout le card se soulève au hover, comme dans regarde */
    <div
      onClick={goToProduct}
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
          <CldImg src={product.primary_image} alt={product.name}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            widths={[300, 600]}
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
        {product.secondary_image && (
          <CldImg src={product.secondary_image} alt={product.name}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            widths={[300, 600]}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: hovered ? 1 : 0, transition: 'opacity 0.7s ease' }} />
        )}

        {/* Bouton œil Quick Shop */}
        {!outOfStock && (
          <div
            onClick={e => { e.stopPropagation(); goToProduct(); }}
            style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: hovered ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0.7)',
              opacity: hovered ? 1 : 0,
              transition: 'opacity 0.25s ease, transform 0.25s ease',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem',
              cursor: 'pointer', zIndex: 3,
            }}
          >
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

        {/* Bouton ADD TO CART slide-up */}
        <button
          onClick={e => { e.stopPropagation(); goToProduct(); }}
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
          Voir le produit
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
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [featuredRef, featuredVisible] = useInView();
  const [activeCategory, setActiveCategory] = useState(null);
  const [carouselHovered, setCarouselHovered] = useState(false);
  const [featOffset, setFeatOffset] = useState(0);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const gridRef = useRef(null);
  const COLS = 4;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const scrollFeat = (dir) => {
    const el = gridRef.current;
    if (!el) return;
    const cardW = el.scrollWidth / (featuredProducts.length || 1);
    const maxOffset = el.scrollWidth - el.parentElement.offsetWidth;
    setFeatOffset(prev => Math.max(0, Math.min(prev + dir * cardW, maxOffset)));
  };

  useEffect(() => {
    apiClient.get('/products/featured/').then((r) => setFeaturedProducts(r.data)).catch(() => {}).finally(() => setLoadingFeatured(false));
  }, []);

  const handleCategorySelect = (slug) => {
    const next = slug === activeCategory ? null : slug;
    setActiveCategory(next);
    setTimeout(() => {
      document.getElementById('nos-produits')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  return (
    <>
      <SEOHead url="/" />

      {/* ── 1. HERO ── */}
      <Hero />

      {/* ── 2. CATÉGORIES — 4 cartes éditoriales ── */}
      <CategoryTeaser onSelect={handleCategorySelect} activeSlug={activeCategory} />

      {/* ── 3. NOS PRODUITS ── */}
      <CategoryGrid categorySlug={activeCategory} />

      {/* ── 4. BANNIÈRE PLEINE LARGEUR ── */}
      <div style={{ paddingTop: '4rem', background: '#FAF6EE' }}>
        <FullWidthBanner />
      </div>

      {/* ── 5. VIDÉOS ── */}
      <VideoCardsSection />


      {/* ── 6. MEILLEURES VENTES ── */}
      <section style={{ padding: '0 0 8rem', background: '#FAF6EE' }}>
        <div className="container">

          <div ref={featuredRef} style={{
            marginBottom: '5rem', textAlign: 'center',
            opacity: featuredVisible ? 1 : 0, transform: featuredVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.8s ease, transform 0.8s ease',
          }}>
            <p style={{
              display: 'inline-block',
              fontSize: '1rem', fontFamily: 'Inter, sans-serif',
              textTransform: 'uppercase', letterSpacing: '0.4em',
              color: '#FAF6EE', background: '#B8960A',
              padding: '0.6rem 2rem', marginBottom: '1.6rem',
            }}>
              Meilleures Ventes
            </p>
            <h2 style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 'clamp(2.8rem, 4vw, 4.2rem)',
              color: '#1A1208', letterSpacing: '-0.01em', lineHeight: 1.1,
            }}>
              Nos Meilleures Ventes
            </h2>
          </div>

          {loadingFeatured ? (
            <div className="hp-feat-grid">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : featuredProducts.length > 0 ? (
            isMobile ? (
              /* Mobile — grille 2 colonnes simple */
              <div className="hp-feat-grid">
                {featuredProducts.map((p, i) => (
                  <div key={p.id} style={{
                    opacity: featuredVisible ? 1 : 0,
                    transform: featuredVisible ? 'translateY(0)' : 'translateY(20px)',
                    transition: `opacity 0.5s ease ${0.1 * i + 0.2}s, transform 0.5s ease ${0.1 * i + 0.2}s`,
                  }}>
                    <HomeProductCard product={p} />
                  </div>
                ))}
              </div>
            ) : (
              /* Desktop — carousel avec flèches */
              <div
                style={{ position: 'relative' }}
                onMouseEnter={() => setCarouselHovered(true)}
                onMouseLeave={() => setCarouselHovered(false)}
              >
                <button onClick={() => scrollFeat(-1)} aria-label="Précédent" style={{
                  position: 'absolute', left: '-5rem', top: '40%', transform: 'translateY(-50%)',
                  zIndex: 10, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
                }}>
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#B8960A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <button onClick={() => scrollFeat(1)} aria-label="Suivant" style={{
                  position: 'absolute', right: '-5rem', top: '40%', transform: 'translateY(-50%)',
                  zIndex: 10, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
                }}>
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#B8960A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
                <div style={{ overflow: 'hidden' }}>
                  <div ref={gridRef} style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${featuredProducts.length}, calc((100% - ${(COLS - 1)} * 2.4rem) / ${COLS}))`,
                    gap: '2.4rem',
                    transform: `translateX(-${featOffset}px)`,
                    transition: 'transform 0.5s ease',
                  }}>
                    {featuredProducts.map((p, i) => (
                      <div key={p.id} style={{
                        opacity: featuredVisible ? 1 : 0,
                        transform: featuredVisible ? 'translateY(0)' : 'translateY(20px)',
                        transition: `opacity 0.5s ease ${0.1 * i + 0.3}s, transform 0.5s ease ${0.1 * i + 0.3}s`,
                      }}>
                        <HomeProductCard product={p} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          ) : null}
        </div>
      </section>

      {/* ── 7. AVIS CLIENTS ── */}
      <TestimonialsSection />

      <style>{`
        .hp-feat-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2.4rem;
        }
        @media (max-width: 768px) {
          .hp-feat-grid { grid-template-columns: repeat(2, 1fr); gap: 1.6rem; }
        }
        @media (max-width: 400px) {
          .hp-feat-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
};


export default HomePage;
