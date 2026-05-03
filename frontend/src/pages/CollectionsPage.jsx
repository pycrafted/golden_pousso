import { useRef, useState, useEffect } from 'react';
import SEOHead from '../components/SEOHead';
import apiClient from '../api/client';
import CldImg from '../components/CldImg';
import QuickShopModal from '../components/QuickShopModal';

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

/* ── Carte générique — image + overlay nom + animation ── */
const GalleryCard = ({ image, name, year, description, index, colIndex, onClick }) => {
  const [ref, visible] = useInView();
  const [hovered, setHovered] = useState(false);
  const delay = colIndex * 0.1 + (index % 3) * 0.05;

  return (
    <div
      ref={ref}
      onClick={onClick}
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
        {image ? (
          <CldImg
            src={image}
            alt={name}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            widths={[400, 800, 1200]}
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover', display: 'block',
              transform: hovered ? 'scale(1.06)' : 'scale(1)',
              transition: 'transform 0.7s ease',
            }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#2A2218' }} />
        )}

        <div style={{
          position: 'absolute', inset: 0,
          background: hovered
            ? 'linear-gradient(to top, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.2) 55%, transparent 100%)'
            : 'linear-gradient(to top, rgba(10,10,10,0.85) 0%, rgba(10,10,10,0.1) 50%, transparent 100%)',
          transition: 'background 0.4s ease',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'flex-end',
          padding: '2.4rem',
        }}>
          <div style={{ textAlign: 'center' }}>
            {year && (
              <p style={{
                fontSize: '1rem', fontFamily: 'Inter, sans-serif',
                textTransform: 'uppercase', letterSpacing: '0.3em',
                color: '#D4AF37', marginBottom: '0.8rem',
              }}>
                {year}
              </p>
            )}
            <h3 style={{
              fontFamily: 'Aclonica, sans-serif',
              fontSize: 'clamp(1.6rem, 2vw, 2.2rem)',
              color: '#F5F0EB', textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: description ? '1.2rem' : '0',
              lineHeight: 1.2,
            }}>
              {name}
            </h3>
            {description && (
              <p style={{
                fontSize: '1rem', fontFamily: 'Inter, sans-serif',
                color: '#E0D0B8', lineHeight: 1.6,
                opacity: hovered ? 1 : 0,
                transform: hovered ? 'translateY(0)' : 'translateY(8px)',
                transition: 'opacity 0.3s ease 0.05s, transform 0.3s ease 0.05s',
                maxHeight: '5rem', overflow: 'hidden',
              }}>
                {description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Grille masonry 3 colonnes ── */
const MasonryGrid = ({ items }) => (
  <div className="stagger-grid">
    {[0, 1, 2].map((colIndex) => {
      const colItems = items.filter((_, i) => i % 3 === colIndex);
      return (
        <div
          key={colIndex}
          style={{
            display: 'flex', flexDirection: 'column', gap: '1.6rem',
            marginTop: colIndex === 1 ? '8rem' : '0',
          }}
        >
          {colItems.map((item, i) => (
            <GalleryCard
              key={item.key}
              image={item.image}
              name={item.name}
              year={item.year}
              description={item.description}
              index={i}
              colIndex={colIndex}
              onClick={item.onClick}
            />
          ))}
        </div>
      );
    })}
  </div>
);

const CollectionsPage = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickShopSlug, setQuickShopSlug] = useState(null);
  const [activeSlug, setActiveSlug] = useState(null);

  useEffect(() => {
    apiClient.get('/collections/')
      .then((res) => setCollections(res.data.results ?? res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const allImages = collections.flatMap((c) => {
    const year = c.date ? new Date(c.date).getFullYear() : '';
    const images = c.product_images?.length ? c.product_images : (c.cover_image ? [c.cover_image] : []);
    return images.map((img, imgIdx) => ({
      key: `${c.slug}-${imgIdx}`,
      image: img,
      name: c.name,
      year,
      description: null,
      slug: c.slug,
      onClick: () => setActiveSlug(prev => prev === c.slug ? null : c.slug),
    }));
  });

  const visibleImages = activeSlug ? allImages.filter(i => i.slug === activeSlug) : allImages;
  const activeCollection = activeSlug ? collections.find(c => c.slug === activeSlug) : null;

  const skeletonItems = Array.from({ length: 9 }).map((_, i) => ({
    key: `sk-${i}`,
    image: null, name: '', year: '', description: null, onClick: () => {},
  }));

  return (
    <>
      <SEOHead
        title="Collections"
        description="Découvrez les défilés et collections saisonnières de Golden Pousso — Haute couture africaine à Dakar, Sénégal."
        url="/collections"
      />
      <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>

        {/* En-tête */}
        <div style={{ padding: '10rem 6rem 0', maxWidth: '110rem', margin: '0 auto' }}>
          <div style={{ marginBottom: '5rem' }}>
            <p style={{
              fontSize: '1.1rem', fontFamily: 'Inter, sans-serif',
              textTransform: 'uppercase', letterSpacing: '0.3em',
              color: '#B8960A', marginBottom: '1.6rem',
            }}>
              Galerie
            </p>
            <h1 style={{
              fontFamily: 'Aclonica, sans-serif',
              fontSize: 'clamp(3rem, 6vw, 6rem)',
              color: '#1A1208', textTransform: 'uppercase',
              letterSpacing: '0.02em', lineHeight: 1.1,
            }}>
              Nos Défilés
              <br />
              <span style={{ color: '#B8960A' }}>&amp; Collections</span>
            </h1>

            {activeCollection && (
              <div style={{ marginTop: '2.4rem', display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                <span style={{
                  fontFamily: 'Inter, sans-serif', fontSize: '1.1rem',
                  textTransform: 'uppercase', letterSpacing: '0.2em',
                  color: '#7A6A50',
                }}>
                  Filtre :
                </span>
                <button
                  onClick={() => setActiveSlug(null)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.8rem',
                    background: '#1A1208', color: '#FAF6EE',
                    border: 'none', borderRadius: '2px',
                    padding: '0.6rem 1.4rem',
                    fontFamily: 'Inter, sans-serif', fontSize: '1.1rem',
                    fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >
                  {activeCollection.name}
                  <span style={{ fontSize: '1.4rem', lineHeight: 1, opacity: 0.7 }}>×</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Grille */}
        <div style={{ padding: '0 6rem 10rem', maxWidth: '110rem', margin: '0 auto' }}>
          {loading ? (
            <MasonryGrid items={skeletonItems} />
          ) : visibleImages.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#7A6A50', fontFamily: 'Inter, sans-serif', padding: '6rem 0' }}>
              Aucune collection disponible pour le moment.
            </p>
          ) : (
            <MasonryGrid key={activeSlug ?? 'all'} items={visibleImages} />
          )}
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
      {quickShopSlug && <QuickShopModal slug={quickShopSlug} onClose={() => setQuickShopSlug(null)} />}
    </>
  );
};

export default CollectionsPage;
