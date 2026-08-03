import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import apiClient from '../api/client';
import CldImg from '../components/CldImg';

const PAGE_SIZE = 9;

/* Récupère toutes les pages d'un endpoint paginé */
const fetchAll = async (url, params = {}) => {
  const results = [];
  let next = null;
  const first = await apiClient.get(url, { params });
  const d = first.data;
  results.push(...(d.results ?? d));
  next = d.next ?? null;
  while (next) {
    const r = await apiClient.get(next.replace(/^https?:\/\/[^/]+/, ''));
    const rd = r.data;
    results.push(...(rd.results ?? rd));
    next = rd.next ?? null;
  }
  return results;
};

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

/* ── Carte produit ── */
const GalleryCard = ({ image, name, collectionName, index, colIndex, onClick }) => {
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
        position: 'relative', overflow: 'hidden', cursor: 'pointer',
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
              width: '100%', height: '100%', objectFit: 'cover', display: 'block',
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
            {collectionName && (
              <p style={{
                fontSize: '1rem', fontFamily: 'Inter, sans-serif',
                textTransform: 'uppercase', letterSpacing: '0.3em',
                color: '#B8960A', marginBottom: '0.6rem',
              }}>
                {collectionName}
              </p>
            )}
            <h3 style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 'clamp(1.4rem, 2vw, 2rem)',
              color: '#FAF6EE', textTransform: 'uppercase',
              letterSpacing: '0.04em', lineHeight: 1.2,
            }}>
              {name}
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Grille masonry 3 colonnes ── */
const MasonryGrid = ({ items, onOpen }) => (
  <div className="stagger-grid">
    {[0, 1, 2].map((colIndex) => {
      const colItems = items.filter((_, i) => i % 3 === colIndex);
      return (
        <div
          key={colIndex}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.6rem', marginTop: colIndex === 1 ? '8rem' : '0' }}
        >
          {colItems.map((item, i) => (
            <GalleryCard
              key={item.slug}
              image={item.primary_image}
              name={item.name}
              collectionName={item.collectionName}
              index={i}
              colIndex={colIndex}
              onClick={() => onOpen(item.slug)}
            />
          ))}
        </div>
      );
    })}
  </div>
);

/* ── Skeleton ── */
const SkeletonGrid = () => (
  <div className="stagger-grid">
    {[0, 1, 2].map((col) => (
      <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: '1.6rem', marginTop: col === 1 ? '8rem' : '0' }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{ aspectRatio: '2/3', background: '#E8DCC8', animation: 'shimmer 1.6s ease-in-out infinite', animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    ))}
  </div>
);

/* ── Page principale ── */
const CollectionsPage = () => {
  const navigate = useNavigate();
  const [collections, setCollections] = useState([]);
  const [products, setProducts]       = useState([]);
  const [colLoading, setColLoading]   = useState(true);
  const [loading, setLoading]         = useState(false);
  const [activeSlug, setActiveSlug]   = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  /* Charger la liste des collections */
  useEffect(() => {
    apiClient.get('/collections/')
      .then((res) => setCollections(res.data.results ?? res.data))
      .catch(() => {})
      .finally(() => setColLoading(false));
  }, []);

  /* Charger les produits selon le filtre actif */
  useEffect(() => {
    if (colLoading) return;
    setLoading(true);

    if (activeSlug) {
      const col = collections.find((c) => c.slug === activeSlug);
      fetchAll('/products/', { collection: activeSlug })
        .then((all) => setProducts(all.map((p) => ({ ...p, collectionName: col?.name ?? '' }))))
        .catch(() => setProducts([]))
        .finally(() => setLoading(false));
    } else {
      if (collections.length === 0) { setProducts([]); setLoading(false); return; }
      Promise.all(
        collections.map((col) =>
          fetchAll('/products/', { collection: col.slug })
            .then((all) => all.map((p) => ({ ...p, collectionName: col.name })))
            .catch(() => [])
        )
      ).then((results) => {
        const flat = results.flat();
        const seen = new Set();
        setProducts(flat.filter((p) => !seen.has(p.slug) && seen.add(p.slug)));
      }).finally(() => setLoading(false));
    }
  }, [activeSlug, colLoading, collections]);

  const totalPages = Math.ceil(products.length / PAGE_SIZE);
  const pageItems  = products.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const goToPage = (p) => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const selectFilter = (slug) => { setActiveSlug(slug); setCurrentPage(1); };
  const resetFilters = () => selectFilter(null);

  const activeCollection = activeSlug ? collections.find((c) => c.slug === activeSlug) : null;

  return (
    <>
      <SEOHead
        title="Collections"
        description="Découvrez les défilés et collections saisonnières de Golden Pousso — Haute couture africaine à Dakar, Sénégal."
        url="/collections"
      />
      <div style={{ background: '#FAF6EE', minHeight: '100vh', color: '#1A1208' }}>

        {/* ── En-tête ── */}
        <section className="collections-header" style={{ padding: '10rem 4rem 0', maxWidth: '130rem', margin: '0 auto' }}>
          <div className="collections-title" style={{ marginBottom: '5rem', paddingLeft: 'calc(28rem + 5rem)' }}>
            <p style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.3em', color: '#B8960A', marginBottom: '1.6rem' }}>
              Galerie
            </p>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(3rem, 6vw, 6rem)', color: '#1A1208', textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1.1 }}>
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

          {/* ── Sidebar ── */}
          <aside style={{ position: 'sticky', top: '9rem', alignSelf: 'start' }}>
            <div style={{ paddingBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '2rem', color: '#B8960A', margin: 0, letterSpacing: '0.04em', fontWeight: 400 }}>
                Filtres
              </h3>
              {activeSlug && (
                <button
                  onClick={resetFilters}
                  style={{ fontSize: '1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#C2662D', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#1A1208'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#C2662D'}
                >
                  Tout effacer
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[{ slug: null, name: 'Toutes les collections' }, ...collections].map((col) => {
                const active = activeSlug === col.slug;
                return (
                  <button
                    key={col.slug ?? 'all'}
                    onClick={() => selectFilter(col.slug)}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '2.4rem', animation: 'fadeDown 0.3s ease both' }}>
                <button
                  onClick={resetFilters}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '0.55rem 1.4rem', border: '1px solid #CEC0A0', background: 'none', fontSize: '1.05rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#1A1208', cursor: 'pointer', transition: 'border-color 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#B8960A'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#CEC0A0'}
                >
                  {activeCollection.name}
                  <span style={{ color: '#7A6A50', fontSize: '1.5rem', lineHeight: 1 }}>×</span>
                </button>
              </div>
            )}

            {/* Grille */}
            {loading || colLoading ? (
              <SkeletonGrid />
            ) : products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '10rem 2rem' }}>
                <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '2.6rem', color: '#1A1208', marginBottom: '1.2rem' }}>
                  Aucun produit trouvé
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
              <MasonryGrid
                key={`${activeSlug ?? 'all'}-${currentPage}`}
                items={pageItems}
                onOpen={(slug) => navigate(`/produit/${slug}`)}
              />
            )}

            {/* Pagination */}
            {!loading && !colLoading && totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem', marginTop: '6rem' }}>
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{ width: '4rem', height: '4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: '1px solid #CEC0A0', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: currentPage === 1 ? '#CEC0A0' : '#1A1208', transition: 'border-color 0.2s, color 0.2s' }}
                  onMouseEnter={(e) => { if (currentPage !== 1) { e.currentTarget.style.borderColor = '#B8960A'; e.currentTarget.style.color = '#B8960A'; } }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#CEC0A0'; e.currentTarget.style.color = currentPage === 1 ? '#CEC0A0' : '#1A1208'; }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{ width: '4rem', height: '4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: '1px solid #CEC0A0', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: currentPage === totalPages ? '#CEC0A0' : '#1A1208', transition: 'border-color 0.2s, color 0.2s' }}
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
          @keyframes shimmer  { 0%,100% { opacity:0.35; } 50% { opacity:0.7; } }

          .stagger-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1.6rem;
            align-items: start;
          }
          @media (max-width: 1100px) {
            .collections-layout { grid-template-columns: 24rem 1fr !important; gap: 3rem !important; }
          }
          @media (max-width: 860px) {
            .collections-layout { grid-template-columns: 1fr !important; padding: 3rem 3rem 8rem !important; }
            .collections-layout aside { position: static !important; }
            .collections-title { padding-left: 0 !important; }
            .stagger-grid { grid-template-columns: repeat(2, 1fr) !important; }
            .stagger-grid > div:nth-child(3) { display: none; }
          }
          @media (max-width: 639px) {
            .collections-header { padding-left: 2rem !important; padding-right: 2rem !important; }
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
