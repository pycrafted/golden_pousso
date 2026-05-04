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

/* ── Carte image collection ── */
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
            widths={[300, 600]}
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

/* ── AccordionSection ── */
const AccordionSection = ({ title, sectionKey, open, onToggle, children }) => (
  <div>
    <button
      onClick={() => onToggle(sectionKey)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', padding: '1.8rem 3rem',
        background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
      }}
    >
      <span style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#1A1208' }}>
        {title}
      </span>
      <svg
        width="12" height="12" viewBox="0 0 24 24" fill="none"
        stroke="#8A8A8A" strokeWidth="1.5"
        style={{ transition: 'transform 0.25s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
      >
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </button>
    <div style={{ overflow: 'hidden', maxHeight: open ? '80rem' : '0', transition: 'max-height 0.35s ease' }}>
      <div style={{ padding: '0 3rem 2.5rem' }}>
        {children}
      </div>
    </div>
  </div>
);

/* ── Page principale ── */
const CollectionsPage = () => {
  const [collections, setCollections]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [quickShopSlug, setQuickShopSlug] = useState(null);
  const [activeSlug, setActiveSlug]     = useState(null);
  const [currentPage, setCurrentPage]   = useState(1);
  const [openSections, setOpenSections] = useState(['collections']);

  const PAGE_SIZE = 3;

  const toggleSection = (key) =>
    setOpenSections((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );

  useEffect(() => {
    apiClient.get('/collections/')
      .then((res) => setCollections(res.data.results ?? res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredCollections = activeSlug
    ? collections.filter((c) => c.slug === activeSlug)
    : collections;

  const allImages = filteredCollections.flatMap((c) => {
    const year   = c.date ? new Date(c.date).getFullYear() : '';
    const images = c.product_images?.length ? c.product_images : (c.cover_image ? [c.cover_image] : []);
    return images.map((img, imgIdx) => ({
      key: `${c.slug}-${imgIdx}`,
      image: img,
      name: c.name,
      year,
      description: null,
      slug: c.slug,
      onClick: () => { setActiveSlug(prev => prev === c.slug ? null : c.slug); setCurrentPage(1); },
    }));
  });

  const skeletonItems = Array.from({ length: 9 }).map((_, i) => ({
    key: `sk-${i}`, image: null, name: '', year: '', description: null, onClick: () => {},
  }));

  const totalPages       = Math.ceil(allImages.length / PAGE_SIZE);
  const pageImages       = allImages.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const goToPage = (p) => {
    setCurrentPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeCollection = activeSlug ? collections.find((c) => c.slug === activeSlug) : null;
  const activeCount      = activeSlug ? 1 : 0;
  const resetFilters     = () => { setActiveSlug(null); setCurrentPage(1); };

  return (
    <>
      <SEOHead
        title="Collections"
        description="Découvrez les défilés et collections saisonnières de Golden Pousso — Haute couture africaine à Dakar, Sénégal."
        url="/collections"
      />
      <div style={{ background: '#FAF6EE', minHeight: '100vh', color: '#1A1208' }}>

        {/* ── En-tête ── */}
        <section style={{ padding: '10rem 4rem 0', maxWidth: '130rem', margin: '0 auto' }}>
          <div style={{ marginBottom: '5rem', paddingLeft: 'calc(28rem + 5rem)' }}>
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
          </div>
        </section>

        {/* ── Layout : sidebar + grille ── */}
        <div className="collections-layout" style={{
          maxWidth: '130rem', margin: '0 auto',
          padding: '4rem 4rem 12rem',
          display: 'grid',
          gridTemplateColumns: '28rem 1fr',
          gap: '5rem',
          alignItems: 'start',
        }}>

          {/* ── Sidebar filtre ── */}
          <aside style={{ position: 'sticky', top: '9rem', alignSelf: 'start' }}>
            {/* Header filtres */}
            <div style={{
              paddingBottom: '2rem',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '0.4rem',
            }}>
              <h3 style={{
                fontFamily: 'Aclonica, serif', fontSize: '2rem',
                color: '#B8960A', margin: 0, letterSpacing: '0.04em', fontWeight: 400,
              }}>
                Filtres
              </h3>
              {activeCount > 0 && (
                <button
                  onClick={resetFilters}
                  style={{ fontSize: '1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#C2662D', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#1A1208'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#C2662D'}
                >
                  Tout effacer ({activeCount})
                </button>
              )}
            </div>

            {/* Collections */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                {[{ slug: null, name: 'Toutes les collections' }, ...collections].map((col) => {
                  const active = activeSlug === col.slug;
                  return (
                    <button
                      key={col.slug ?? 'all'}
                      onClick={() => { setActiveSlug(col.slug); setCurrentPage(1); }}
                      style={{ display: 'flex', alignItems: 'center', gap: '1.4rem', padding: '1.1rem 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid rgba(42,42,42,0.06)' }}
                    >
                      <span style={{
                        width: '1.5rem', height: '1.5rem',
                        border: `1px solid ${active ? '#B8960A' : '#CEC0A0'}`,
                        background: active ? '#B8960A' : 'transparent',
                        flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s',
                      }}>
                        {active && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>}
                      </span>
                      <span style={{ fontSize: '1.3rem', fontFamily: 'Inter, sans-serif', color: active ? '#1A1208' : '#7A6A50', transition: 'color 0.2s' }}>
                        {col.name}
                        {col.slug && col.date && (
                          <span style={{ display: 'block', fontSize: '1.05rem', color: '#B8960A', letterSpacing: '0.08em' }}>
                            {new Date(col.date).getFullYear()}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
            </div>


          </aside>

          {/* ── Colonne grille ── */}
          <div>
            {/* Chip filtre actif */}
            {activeCollection && (
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.8rem', marginBottom: '2.4rem', animation: 'fadeDown 0.3s ease both' }}>
                <button
                  onClick={() => setActiveSlug(null)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
                    padding: '0.55rem 1.4rem',
                    border: '1px solid #CEC0A0', background: 'none',
                    fontSize: '1.05rem', fontFamily: 'Inter, sans-serif',
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                    color: '#1A1208', cursor: 'pointer', transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#B8960A'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#CEC0A0'}
                >
                  {activeCollection.name}
                  <span style={{ color: '#7A6A50', fontSize: '1.5rem', lineHeight: 1 }}>×</span>
                </button>
              </div>
            )}

            {/* Grille */}
            {loading ? (
              <MasonryGrid items={skeletonItems} />
            ) : allImages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '10rem 2rem' }}>
                <p style={{ fontFamily: 'Aclonica, serif', fontSize: '2.6rem', color: '#1A1208', marginBottom: '1.2rem' }}>
                  Aucune collection trouvée
                </p>
                <button
                  onClick={resetFilters}
                  style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#C2662D', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid #C2662D', paddingBottom: '0.25rem', transition: 'color 0.2s, border-color 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#1A1208'; e.currentTarget.style.borderBottomColor = '#1A1208'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#C2662D'; e.currentTarget.style.borderBottomColor = '#C2662D'; }}
                >
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              <MasonryGrid key={`${activeSlug ?? 'all'}-${currentPage}`} items={pageImages} />
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', marginTop: '6rem' }}>
                {/* Précédent */}
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    width: '4rem', height: '4rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'none', border: '1px solid #CEC0A0', cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    color: currentPage === 1 ? '#CEC0A0' : '#1A1208', transition: 'border-color 0.2s, color 0.2s',
                  }}
                  onMouseEnter={(e) => { if (currentPage !== 1) { e.currentTarget.style.borderColor = '#B8960A'; e.currentTarget.style.color = '#B8960A'; } }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#CEC0A0'; e.currentTarget.style.color = currentPage === 1 ? '#CEC0A0' : '#1A1208'; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="15 18 9 12 15 6"/></svg>
                </button>

                {/* Suivant */}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{
                    width: '4rem', height: '4rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'none', border: '1px solid #CEC0A0', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    color: currentPage === totalPages ? '#CEC0A0' : '#1A1208', transition: 'border-color 0.2s, color 0.2s',
                  }}
                  onMouseEnter={(e) => { if (currentPage !== totalPages) { e.currentTarget.style.borderColor = '#B8960A'; e.currentTarget.style.color = '#B8960A'; } }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#CEC0A0'; e.currentTarget.style.color = currentPage === totalPages ? '#CEC0A0' : '#1A1208'; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            )}
          </div>
        </div>

        <style>{`
          @keyframes fadeDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }

          .stagger-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1.6rem;
            align-items: start;
          }
          @media (max-width: 1100px) {
            .collections-layout { grid-template-columns: 1fr 24rem !important; gap: 3rem !important; }
          }
          @media (max-width: 860px) {
            .collections-layout { grid-template-columns: 1fr !important; padding: 3rem 3rem 8rem !important; }
            .collections-layout aside { position: static !important; }
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
