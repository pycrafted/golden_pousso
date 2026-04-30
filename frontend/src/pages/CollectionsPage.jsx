import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import apiClient from '../api/client';
import CldImg from '../components/CldImg';

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
  const navigate = useNavigate();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const tabRefs = useRef({});
  const [underline, setUnderline] = useState({ left: 0, width: 0 });

  const [detailProducts, setDetailProducts] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    apiClient.get('/collections/')
      .then((res) => setCollections(res.data.results ?? res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab === 'all') {
      setDetailProducts([]);
      return;
    }
    setLoadingDetail(true);
    apiClient.get(`/collections/${activeTab}/`)
      .then((res) => setDetailProducts(res.data.products ?? []))
      .catch(() => setDetailProducts([]))
      .finally(() => setLoadingDetail(false));
  }, [activeTab]);

  const tabs = [
    { key: 'all', label: 'Toutes' },
    ...collections.map(c => ({ key: c.slug, label: c.name })),
  ];

  useEffect(() => {
    const el = tabRefs.current[activeTab];
    if (el) setUnderline({ left: el.offsetLeft, width: el.offsetWidth });
  }, [activeTab, collections]);

  const isAll = activeTab === 'all';
  const activeCollection = collections.find(c => c.slug === activeTab);

  /* Aplatir toutes les product_images de toutes les collections */
  const allImages = collections.flatMap((c) => {
    const year = c.date ? new Date(c.date).getFullYear() : '';
    const images = c.product_images?.length ? c.product_images : (c.cover_image ? [c.cover_image] : []);
    return images.map((img, imgIdx) => ({
      key: `${c.slug}-${imgIdx}`,
      image: img,
      name: c.name,
      year,
      description: null,
      onClick: () => navigate(`/collections/${c.slug}`),
    }));
  });

  /* Items pour la vue collection spécifique */
  const detailItems = detailProducts.map((p) => ({
    key: `p-${p.id}`,
    image: p.primary_image,
    name: p.name,
    year: '',
    description: null,
    onClick: () => navigate(`/produit/${p.slug}`),
  }));

  const skeletonItems = Array.from({ length: 9 }).map((_, i) => ({
    key: `sk-${i}`,
    image: null, name: '', year: '', description: null, onClick: () => {},
  }));

  return (
    <>
      <SEOHead
        title={isAll ? 'Collections' : activeCollection?.name ?? 'Collections'}
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
          </div>

          {/* Tabs */}
          {!loading && collections.length > 0 && (
            <div style={{ position: 'relative', borderBottom: '1px solid #E0D0B8', marginBottom: '5rem' }}>
              <div style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
                {tabs.map(({ key, label }) => (
                  <button
                    key={key}
                    ref={el => { tabRefs.current[key] = el; }}
                    onClick={() => setActiveTab(key)}
                    style={{
                      padding: '1.2rem 3rem 1.8rem',
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: '1.3rem', fontFamily: 'Inter, sans-serif',
                      fontWeight: 500, letterSpacing: '0.12em',
                      textTransform: 'uppercase', whiteSpace: 'nowrap',
                      color: activeTab === key ? '#1A1208' : '#7A6A50',
                      transition: 'color 0.25s ease',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div style={{
                position: 'absolute', bottom: -1, height: '2px',
                background: '#B8960A',
                left: underline.left, width: underline.width,
                transition: 'left 0.3s ease, width 0.3s ease',
              }} />
            </div>
          )}
        </div>

        {/* Grille */}
        <div style={{ padding: '0 6rem 10rem', maxWidth: '110rem', margin: '0 auto' }}>
          {loading ? (
            <MasonryGrid items={skeletonItems} />
          ) : isAll ? (
            allImages.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#7A6A50', fontFamily: 'Inter, sans-serif', padding: '6rem 0' }}>
                Aucune collection disponible pour le moment.
              </p>
            ) : (
              <MasonryGrid key="all" items={allImages} />
            )
          ) : (
            loadingDetail ? (
              <MasonryGrid key={`${activeTab}-loading`} items={skeletonItems} />
            ) : detailItems.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#7A6A50', fontFamily: 'Inter, sans-serif', padding: '6rem 0', fontSize: '1.4rem' }}>
                Aucun produit dans cette collection pour le moment.
              </p>
            ) : (
              <MasonryGrid key={activeTab} items={detailItems} />
            )
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
    </>
  );
};

export default CollectionsPage;
