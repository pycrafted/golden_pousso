import { useEffect, useRef, useState, useCallback } from 'react';
import apiClient from '../api/client';
import useSettingsStore, { formatPrice } from '../store/settingsStore';
import CldImg from './CldImg';
import QuickShopModal from './QuickShopModal';

const SPEED = 1.0;
const GAP_REM = 2.4;
const COLS = 4;
const CONTAINER_MAX_REM = 120;
const CONTAINER_PAD_REM = 3;

const getCardWidth = () => {
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
  const gap = GAP_REM * rem;
  const containerW = Math.min(window.innerWidth, CONTAINER_MAX_REM * rem) - 2 * CONTAINER_PAD_REM * rem;
  return (containerW - (COLS - 1) * gap) / COLS;
};

const useInView = () => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
};

const ProductsCarousel = ({ categorySlug }) => {
  const currency  = useSettingsStore((s) => s.currency);
  const [quickShopSlug, setQuickShopSlug] = useState(null);

  const [carouselRef, carouselVisible] = useInView();

  const [products,        setProducts]        = useState([]);
  const [carouselHovered, setCarouselHovered] = useState(false);
  const [cardWidth,       setCardWidth]       = useState(getCardWidth);

  useEffect(() => {
    const onResize = () => setCardWidth(getCardWidth());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const trackRef    = useRef(null);
  const posRef      = useRef(0);
  const rafRef      = useRef(null);
  const pausedRef   = useRef(false);
  const momentumRef = useRef(0);
  const productsRef = useRef(products);

  useEffect(() => { productsRef.current = products; }, [products]);

  const calcCardW = useCallback(() => {
    const cardW = getCardWidth();
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const gap = GAP_REM * rem;
    return { cardW, gap, setW: productsRef.current.length * (cardW + gap) };
  }, []);

  /* ── API produits ───────────────────────────────────────── */
  useEffect(() => {
    const params = categorySlug ? { category: categorySlug } : {};
    apiClient.get('/products/', { params })
      .then((res) => {
        const data = res.data.results ?? res.data;
        posRef.current = 0;
        setProducts(categorySlug ? data : data.slice(0, 8));
      })
      .catch(() => {});
  }, [categorySlug]);

  /* ── Boucle d'animation ────────────────────────────────── */
  const tick = useCallback(() => {
    if (pausedRef.current || !trackRef.current) return;

    const { setW } = calcCardW();
    const speed = SPEED + momentumRef.current;
    momentumRef.current *= 0.9;
    if (Math.abs(momentumRef.current) < 0.1) momentumRef.current = 0;

    posRef.current += speed;
    if (posRef.current >= setW) posRef.current -= setW;
    if (posRef.current < 0)     posRef.current += setW;

    trackRef.current.style.transform = `translateX(-${posRef.current}px)`;
    rafRef.current = requestAnimationFrame(tick);
  }, [calcCardW]);

  useEffect(() => {
    if (!carouselVisible || products.length === 0) return;
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [carouselVisible, tick, products.length]);

  /* ── Flèches ─────────────────────────────────────────────── */
  const handleArrow = useCallback((direction) => {
    const { cardW, gap } = calcCardW();
    momentumRef.current = direction * (cardW + gap) * 0.18;
  }, [calcCardW]);

  /* ── Carte produit ─────────────────────────────────────── */
  const renderCard = (p, key) => {
    return (
      <div
        key={key}
        onClick={() => setQuickShopSlug(p.slug)}
        style={{ flexShrink: 0, width: `${cardWidth}px`, cursor: 'pointer' }}
      >
      <div style={{ aspectRatio: '3 / 4', position: 'relative', overflow: 'hidden' }}>
        {/* Image */}
        {p.primary_image ? (
          <CldImg
            src={p.primary_image}
            alt={p.name}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            widths={[300, 600, 900]}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'center top',
            }}
          />
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            background: '#1A1208',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#7A6A50', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Photo bientôt
            </span>
          </div>
        )}


      </div>
      <div style={{ padding: '1.2rem 0.4rem 0' }}>
        <h3 style={{
          fontFamily:   'Aclonica, serif',
          fontSize:     '1.4rem',
          color:        '#1A1208',
          lineHeight:   1.3,
          marginBottom: '0.4rem',
          whiteSpace:   'nowrap',
          overflow:     'hidden',
          textOverflow: 'ellipsis',
        }}>
          {p.name}
        </h3>
        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontSize:   '1.3rem',
          color:      '#B8960A',
          fontWeight: 500,
        }}>
          {formatPrice(p.price, currency)}
        </p>
      </div>
      </div>
    );
  };

  return (
    <section
      id="nos-produits"
      style={{ background: '#FAF6EE', paddingTop: '4rem', overflow: 'hidden' }}
    >

      {/* Titre */}
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <p style={{
          display: 'inline-block',
          fontSize: '1rem', fontFamily: 'Inter, sans-serif',
          textTransform: 'uppercase', letterSpacing: '0.4em',
          color: '#FAF6EE', background: '#B8960A',
          padding: '0.6rem 2rem', marginBottom: '1.6rem',
        }}>
          Boutique
        </p>
        <h2 style={{
          fontFamily: 'Aclonica, sans-serif',
          fontSize: 'clamp(2.8rem, 4vw, 4.2rem)',
          color: '#1A1208', letterSpacing: '-0.01em', lineHeight: 1.1,
        }}>
          Nos Produits
        </h2>
      </div>

      {/* Carousel auto-scroll */}
      <div
        style={{ position: 'relative' }}
        onMouseEnter={() => setCarouselHovered(true)}
        onMouseLeave={() => setCarouselHovered(false)}
      >
        {/* Flèche gauche */}
        <button
          onClick={() => handleArrow(-1)}
          aria-label="Précédent"
          style={{
            position: 'absolute', left: '1.6rem', top: '50%', transform: 'translateY(-50%)',
            zIndex: 10, width: '4.4rem', height: '4.4rem',
            background: '#FAF6EE', border: '1px solid #E0D0B8', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            opacity: carouselHovered ? 1 : 0,
            pointerEvents: carouselHovered ? 'auto' : 'none',
            transition: 'opacity 0.2s, background 0.2s, border-color 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#B8960A'; e.currentTarget.style.borderColor = '#B8960A'; e.currentTarget.querySelector('svg').style.stroke = '#FAF6EE'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#FAF6EE'; e.currentTarget.style.borderColor = '#E0D0B8'; e.currentTarget.querySelector('svg').style.stroke = '#1A1208'; }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1208" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'stroke 0.2s' }}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Flèche droite */}
        <button
          onClick={() => handleArrow(1)}
          aria-label="Suivant"
          style={{
            position: 'absolute', right: '1.6rem', top: '50%', transform: 'translateY(-50%)',
            zIndex: 10, width: '4.4rem', height: '4.4rem',
            background: '#FAF6EE', border: '1px solid #E0D0B8', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            opacity: carouselHovered ? 1 : 0,
            pointerEvents: carouselHovered ? 'auto' : 'none',
            transition: 'opacity 0.2s, background 0.2s, border-color 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#B8960A'; e.currentTarget.style.borderColor = '#B8960A'; e.currentTarget.querySelector('svg').style.stroke = '#FAF6EE'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#FAF6EE'; e.currentTarget.style.borderColor = '#E0D0B8'; e.currentTarget.querySelector('svg').style.stroke = '#1A1208'; }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1208" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'stroke 0.2s' }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        <div ref={carouselRef} style={{ overflow: 'hidden' }}>
          {products.length > 0 && (
            <div
              ref={trackRef}
              style={{
                display: 'flex', gap: '2.4rem',
                willChange: 'transform', paddingLeft: '2.4rem',
              }}
            >
              {products.map((p, i) => renderCard(p, `a-${i}`))}
              {products.map((p, i) => renderCard(p, `b-${i}`))}
            </div>
          )}
        </div>
      </div>
    {quickShopSlug && <QuickShopModal slug={quickShopSlug} onClose={() => setQuickShopSlug(null)} />}
    </section>
  );
};

export default ProductsCarousel;
