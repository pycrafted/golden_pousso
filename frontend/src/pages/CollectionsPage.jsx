import { useRef, useState, useEffect } from 'react';
import SEOHead from '../components/SEOHead';
import apiClient from '../api/client';

const useInView = () => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.08, rootMargin: '-60px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
};

/* ── Collections ── */
const TABS = [
  { key: 'all',      label: 'Toutes' },
  { key: 'tabaski',  label: 'Tabaski 2026' },
  { key: 'noel',     label: 'Noël 2025' },
  { key: 'resort',   label: 'Resort 2026' },
];

// Métadonnées fixes — les images sont remplacées dynamiquement par l'API
const ITEMS_META = [
  { id: 1, alt: 'Boubou royal or — Collection Tabaski 2026',             collection: 'Tabaski 2026', season: 'Haute Couture', tab: 'tabaski', format: 'portrait' },
  { id: 2, alt: 'Headwrap or et blanc — Collection Tabaski 2026',         collection: 'Tabaski 2026', season: 'Haute Couture', tab: 'tabaski', format: 'square'   },
  { id: 3, alt: 'Trio mannequins rouge et or — Collection Noël 2025',     collection: 'Noël 2025',    season: 'Festive',       tab: 'noel',    format: 'square'   },
  { id: 4, alt: 'Robe sculpturale ivoire — Collection Tabaski 2026',      collection: 'Tabaski 2026', season: 'Haute Couture', tab: 'tabaski', format: 'portrait' },
  { id: 5, alt: 'Boubou avant-garde noir et or — Collection Noël 2025',   collection: 'Noël 2025',    season: 'Festive',       tab: 'noel',    format: 'portrait' },
  { id: 6, alt: 'Coulisses du défilé — Collection Noël 2025',             collection: 'Noël 2025',    season: 'Backstage',     tab: 'noel',    format: 'square'   },
  { id: 7, alt: 'Robe émeraude et or — Collection Resort 2026',           collection: 'Resort 2026',  season: 'Resort',        tab: 'resort',  format: 'portrait' },
  { id: 8, alt: 'Tenues resort terracotta — Collection Resort 2026',      collection: 'Resort 2026',  season: 'Resort',        tab: 'resort',  format: 'square'   },
  { id: 9, alt: 'Robe drapée ivoire et or — Collection Resort 2026',      collection: 'Resort 2026',  season: 'Resort',        tab: 'resort',  format: 'portrait' },
];

// Images de secours (si l'API ne renvoie rien)
const FALLBACK_IMAGES = [
  '/images/poster-1.png', '/images/poster-2.png', '/images/poster-3.png',
  '/images/product-1.png', '/images/product-2.png', '/images/product-3.png',
  '/images/product-4.png', '/images/product-5.png', '/images/product-6.png',
];

/* ── Item galerie ── */
const GalleryItem = ({ item, index, colIndex }) => {
  const [ref, visible] = useInView();
  const [hovered, setHovered] = useState(false);
  const delay = colIndex * 0.1 + (index % 3) * 0.05;

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(36px)',
        transition: `opacity 0.65s ease ${delay}s, transform 0.65s ease ${delay}s`,
      }}
    >
      <div style={{ position: 'relative', width: '100%', aspectRatio: '2/3' }}>
        <img
          src={item.image}
          alt={item.alt}
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover', display: 'block',
            transform: hovered ? 'scale(1.06)' : 'scale(1)',
            transition: 'transform 0.7s ease',
          }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: hovered
            ? 'linear-gradient(to top, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.2) 55%, rgba(10,10,10,0) 100%)'
            : 'linear-gradient(to top, rgba(10,10,10,0.85) 0%, rgba(10,10,10,0.1) 50%, rgba(10,10,10,0) 100%)',
          transition: 'background 0.4s ease',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'flex-end',
          padding: '2.4rem',
        }}>
          <div style={{
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.3em', color: '#D4AF37', marginBottom: '1rem' }}>
              {item.season}
            </p>
            <h3 style={{ fontFamily: 'Aclonica, sans-serif', fontSize: 'clamp(1.6rem, 2vw, 2.2rem)', color: '#F5F0EB', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2rem', lineHeight: 1.2 }}>
              {item.collection}
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Page ── */
const CollectionsPage = () => {
  const [activeTab, setActiveTab] = useState('all');
  const tabRefs = useRef({});
  const [underline, setUnderline] = useState({ left: 0, width: 0 });
  const [items, setItems] = useState(
    ITEMS_META.map((m, i) => ({ ...m, image: FALLBACK_IMAGES[i] }))
  );

  // Récupère les mêmes photos que la boutique
  useEffect(() => {
    apiClient.get('/products/', { params: { ordering: '-created_at' } })
      .then((res) => {
        const products = res.data.results ?? res.data;
        if (!products.length) return;
        setItems(
          ITEMS_META.map((meta, i) => ({
            ...meta,
            image: products[i % products.length].primary_image || FALLBACK_IMAGES[i],
          }))
        );
      })
      .catch(() => {}); // garde le fallback en cas d'erreur
  }, []);

  useEffect(() => {
    const el = tabRefs.current[activeTab];
    if (el) setUnderline({ left: el.offsetLeft, width: el.offsetWidth });
  }, [activeTab]);

  const filtered = activeTab === 'all' ? items : items.filter(i => i.tab === activeTab);

  return (
    <>
      <SEOHead
        title="Collections"
        description="Découvrez les défilés et collections saisonnières de Golden Pousso — Haute couture africaine à Dakar, Sénégal."
        url="/collections"
      />
      <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>

        {/* ── En-tête + navigation ── */}
        <div style={{ padding: '10rem 6rem 0', maxWidth: '110rem', margin: '0 auto' }}>
          {/* Titre */}
          <div style={{ marginBottom: '5rem' }}>
            <p style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.3em', color: '#B8960A', marginBottom: '1.6rem' }}>
              Galerie
            </p>
            <h1 style={{ fontFamily: 'Aclonica, sans-serif', fontSize: 'clamp(3rem, 6vw, 6rem)', color: '#1A1208', textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1.1 }}>
              Nos Défilés
              <br />
              <span style={{ color: '#B8960A' }}>& Collections</span>
            </h1>
          </div>

          {/* Tabs de navigation */}
          <div style={{ position: 'relative', borderBottom: '1px solid #E0D0B8', marginBottom: '5rem' }}>
            <div style={{ display: 'flex', gap: '0' }}>
              {TABS.map(({ key, label }) => (
                <button
                  key={key}
                  ref={el => tabRefs.current[key] = el}
                  onClick={() => setActiveTab(key)}
                  style={{
                    padding: '1.2rem 3rem 1.8rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.3rem',
                    fontFamily: 'Inter, sans-serif',
                    fontWeight: 500,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: activeTab === key ? '#1A1208' : '#7A6A50',
                    transition: 'color 0.25s ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            {/* Underline glissant */}
            <div style={{
              position: 'absolute',
              bottom: -1,
              height: '2px',
              background: '#B8960A',
              left: underline.left,
              width: underline.width,
              transition: 'left 0.3s ease, width 0.3s ease',
            }} />
          </div>
        </div>

        {/* ── Grille 3 colonnes décalées ── */}
        <div style={{ padding: '0 6rem 10rem', maxWidth: '110rem', margin: '0 auto' }}>
          <div key={activeTab} className="stagger-grid">
            {[0, 1, 2].map((colIndex) => {
              const OFFSETS = ['0rem', '8rem', '0rem'];
              const colItems = filtered.filter((_, i) => i % 3 === colIndex);
              return (
                <div
                  key={colIndex}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.6rem',
                    marginTop: OFFSETS[colIndex],
                  }}
                >
                  {colItems.map((item, i) => (
                    <GalleryItem key={item.id} item={item} index={i} colIndex={colIndex} />
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        <style>{`
          .stagger-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1.6rem;
            align-items: start;
          }
          @media (max-width: 1023px) {
            .stagger-grid { grid-template-columns: repeat(2, 1fr) !important; }
            .stagger-grid > div:nth-child(3) { display: none; }
          }
          @media (max-width: 639px) {
            .stagger-grid { grid-template-columns: 1fr !important; }
            .stagger-grid > div { margin-top: 0 !important; }
            .stagger-grid > div:nth-child(3) { display: flex; }
          }
        `}</style>
      </div>
    </>
  );
};

export default CollectionsPage;
