import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import apiClient from '../api/client';
import CldImg from '../components/CldImg';
import useSettingsStore, { formatPrice } from '../store/settingsStore';

/* ─── Constants ─────────────────────────────────────────── */
const SORT_OPTIONS = [
  { value: '-created_at', label: 'Nouveautés' },
  { value: 'price',       label: 'Prix croissant' },
  { value: '-price',      label: 'Prix décroissant' },
  { value: 'name',        label: 'Nom A–Z' },
];

/* ─── PLPCard ────────────────────────────────────────────── */
const PLPCard = ({ product, index }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const currency = useSettingsStore((s) => s.currency);
  const goToProduct = () => navigate(`/produit/${product.slug}`);

  const discountPercent =
    product.old_price && product.old_price > product.price
      ? Math.round(((product.old_price - product.price) / product.old_price) * 100)
      : null;
  const outOfStock = product.stock === 0;
  const hasSecondary = Boolean(product.secondary_image);

  return (
    <article
      className="plp-card"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => !outOfStock && goToProduct()}
      style={{
        cursor: outOfStock ? 'default' : 'pointer',
        opacity: outOfStock ? 0.55 : 1,
        animation: `fadeUp 0.55s ease both`,
        animationDelay: `${0.06 * index}s`,
      }}
    >
      {/* Image container */}
      <div style={{
        position: 'relative',
        aspectRatio: '3/4',
        overflow: 'hidden',
        marginBottom: '1.6rem',
        background: '#F0E8D8',
      }}>

        {/* Badges */}
        {product.is_new && (
          <span style={{
            position: 'absolute', top: '1.2rem', left: '1.2rem', zIndex: 10,
            background: '#B8960A', color: '#FAF6EE',
            fontSize: '1rem', fontFamily: 'Inter, sans-serif',
            textTransform: 'uppercase', letterSpacing: '0.2em',
            padding: '0.4rem 1.2rem', fontWeight: 600,
          }}>
            Nouveauté
          </span>
        )}
        {discountPercent && (
          <span style={{
            position: 'absolute',
            top: product.is_new ? '4.2rem' : '1.2rem',
            left: '1.2rem', zIndex: 10,
            background: '#C2662D', color: '#1A1208',
            fontSize: '1rem', fontFamily: 'Inter, sans-serif',
            padding: '0.4rem 1.2rem', fontWeight: 600, letterSpacing: '0.05em',
          }}>
            −{discountPercent}%
          </span>
        )}

        {/* Image principale */}
        {product.primary_image ? (
          <CldImg
            src={product.primary_image}
            alt={product.name}
            eager={index < 3}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            widths={[300, 600]}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%', objectFit: 'cover',
              transition: 'transform 0.7s ease, opacity 0.7s ease',
              transform: hovered ? 'scale(1.05)' : 'scale(1)',
              opacity: hovered && hasSecondary ? 0 : 1,
            }}
          />
        ) : (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#F0E8D8',
          }}>
            <span style={{
              fontSize: '1.1rem', color: 'rgba(255,255,255,0.15)',
              letterSpacing: '0.2em', textTransform: 'uppercase',
              fontFamily: 'Inter, sans-serif',
            }}>
              Photo bientôt
            </span>
          </div>
        )}

        {/* Image secondaire au hover */}
        {hasSecondary && (
          <CldImg
            src={product.secondary_image}
            alt={product.name}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            widths={[300, 600]}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%', objectFit: 'cover',
              transition: 'opacity 0.7s ease',
              opacity: hovered ? 1 : 0,
            }}
          />
        )}

        {/* Overlay sombre au hover */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(10,10,10,0.22)',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }} />

        {/* Bouton œil Quick Shop */}
        {!outOfStock && (
          <div
            onClick={(e) => { e.stopPropagation(); goToProduct(); }}
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

        {/* Bouton ADD TO CART en bas */}
        {!outOfStock && (
          <button
            onClick={(e) => { e.stopPropagation(); goToProduct(); }}
            style={{
              position: 'absolute', bottom: '1.6rem', left: '1.6rem', right: '1.6rem',
              background: '#1A1208', color: '#FAF6EE', border: 'none',
              padding: '1.2rem',
              fontSize: '1rem', fontFamily: 'Inter, sans-serif',
              textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 600,
              cursor: 'pointer',
              opacity: hovered ? 1 : 0,
              transform: hovered ? 'translateY(0)' : 'translateY(10px)',
              transition: 'opacity 0.25s ease, transform 0.3s ease, background 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#B8960A'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#1A1208'; }}
          >
            Voir le produit
          </button>
        )}

        {/* Badge épuisé */}
        {outOfStock && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(26,26,26,0.78)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{
              background: '#F0E8D8', color: '#7A6A50', border: '1px solid #CEC0A0',
              padding: '0.7rem 2rem', fontSize: '1.2rem', letterSpacing: '0.1em',
              fontFamily: 'Inter, sans-serif', textTransform: 'uppercase',
            }}>
              Épuisé
            </span>
          </div>
        )}
      </div>

      {/* Infos produit */}
      <div style={{ paddingLeft: '0.2rem' }}>
        <h3 style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: '1.4rem', color: '#1A1208',
          marginBottom: '0.6rem', lineHeight: 1.35,
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {product.name}
        </h3>
        <p style={{ fontSize: '1.3rem', fontFamily: 'Inter, sans-serif', color: '#B8960A' }}>
          {formatPrice(product.price, currency)}
          {product.old_price && (
            <span style={{ color: '#7A6A50', marginLeft: '0.8rem', textDecoration: 'line-through', fontSize: '1.2rem' }}>
              {formatPrice(product.old_price, currency)}
            </span>
          )}
        </p>
      </div>
    </article>
  );
};

/* ─── Skeleton ───────────────────────────────────────────── */
const SkeletonCard = () => (
  <div>
    <div style={{ aspectRatio: '3/4', background: '#E8DCC8', marginBottom: '1.6rem', animation: 'shimmer 1.6s ease-in-out infinite' }} />
    <div style={{ height: '1.5rem', background: '#E8DCC8', marginBottom: '0.8rem', width: '72%', animation: 'shimmer 1.6s ease-in-out infinite' }} />
    <div style={{ height: '1.2rem', background: '#E8DCC8', width: '38%', animation: 'shimmer 1.6s ease-in-out infinite' }} />
  </div>
);

/* ─── BoutiquePage ───────────────────────────────────────── */
const BoutiquePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories]     = useState([]);
  const [products, setProducts]         = useState([]);
  const [totalCount, setTotalCount]     = useState(0);
  const [nextUrl, setNextUrl]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [loadingMore, setLoadingMore]   = useState(false);

  const [openSections, setOpenSections] = useState([]);
  const toggleSection = (key) =>
    setOpenSections((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );

  const selectedCategory = searchParams.get('category') || '';
  const minPrice         = searchParams.get('min_price') || '';
  const maxPrice         = searchParams.get('max_price') || '';
  const searchQuery      = searchParams.get('search') || '';
  const ordering         = searchParams.get('ordering') || '-created_at';

  const updateFilter = (key, value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value); else p.delete(key);
    p.delete('page');
    setSearchParams(p);
  };
  const resetFilters = () => setSearchParams({});
  const activeCount = [selectedCategory, minPrice, maxPrice, searchQuery].filter(Boolean).length;

  const fetchProducts = useCallback(async (reset = true) => {
    reset ? setLoading(true) : setLoadingMore(true);
    try {
      const params = {};
      if (selectedCategory) params.category = selectedCategory;
      if (minPrice) params.min_price = minPrice;
      if (maxPrice) params.max_price = maxPrice;
      if (searchQuery) params.search = searchQuery;
      if (ordering) params.ordering = ordering;
      const res = await apiClient.get('/products/', { params });
      const data = res.data;
      const results = data.results ?? data;
      setTotalCount(data.count ?? results.length);
      setNextUrl(data.next ?? null);
      reset ? setProducts(results) : setProducts((p) => [...p, ...results]);
    } catch { if (reset) setProducts([]); }
    finally { reset ? setLoading(false) : setLoadingMore(false); }
  }, [selectedCategory, minPrice, maxPrice, searchQuery, ordering]);

  useEffect(() => { fetchProducts(true); }, [fetchProducts]);
  useEffect(() => {
    apiClient.get('/categories/').then((r) => setCategories(r.data.results ?? r.data)).catch(() => {});
  }, []);

  const loadMore = async () => {
    if (!nextUrl) return;
    setLoadingMore(true);
    try {
      const res = await apiClient.get(nextUrl.replace(/^https?:\/\/[^/]+/, ''));
      const data = res.data;
      setProducts((p) => [...p, ...(data.results ?? data)]);
      setNextUrl(data.next ?? null);
    } finally { setLoadingMore(false); }
  };

  const categoryLabel = selectedCategory
    ? (categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory)
    : null;

  const activeChips = [
    categoryLabel && { key: 'category', label: categoryLabel },
    searchQuery    && { key: 'search',   label: `"${searchQuery}"` },
    minPrice       && { key: 'min_price', label: `≥ ${Number(minPrice).toLocaleString('fr-FR')} FCFA` },
    maxPrice       && { key: 'max_price', label: `≤ ${Number(maxPrice).toLocaleString('fr-FR')} FCFA` },
  ].filter(Boolean);

  return (
    <>
      <SEOHead
        title="Boutique"
        description="Découvrez toutes nos créations : boubous africains, bijoux, sacs et chaussures — confectionnés dans notre atelier de Pikine, Dakar."
        url="/boutique"
      />

      <div style={{ background: '#FAF6EE', minHeight: '100vh', color: '#1A1208' }}>

        {/* ── Hero ── */}
        <section className="boutique-section" style={{ padding: '10rem 4rem 0', maxWidth: '130rem', margin: '0 auto' }}>
          <div className="boutique-title" style={{ marginBottom: '5rem', paddingLeft: 'calc(28rem + 5rem)' }}>
            <p style={{
              fontSize: '1.1rem', fontFamily: 'Inter, sans-serif',
              textTransform: 'uppercase', letterSpacing: '0.3em',
              color: '#B8960A', marginBottom: '1.6rem',
            }}>
              Boutique
            </p>
            <h1 style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 'clamp(3rem, 6vw, 6rem)',
              color: '#1A1208', textTransform: 'uppercase',
              letterSpacing: '0.02em', lineHeight: 1.1,
              marginBottom: '2rem',
            }}>
              Élégance Africaine
            </h1>

          </div>
        </section>

        {/* ── Layout principal : produits + filtre sticky ── */}
        <div className="boutique-layout" style={{
          maxWidth: '130rem', margin: '0 auto',
          padding: '4rem 4rem 12rem',
          display: 'grid',
          gridTemplateColumns: '28rem 1fr',
          gap: '5rem',
          alignItems: 'start',
        }}>

          {/* ── Filtre sidebar sticky ── */}
          <aside style={{
            position: 'sticky',
            top: '9rem',
            alignSelf: 'start',
          }}>
            {/* Header */}
            <div style={{ paddingBottom: '2rem', borderBottom: '1px solid #E0D0B8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '2rem', color: '#B8960A', margin: 0, letterSpacing: '0.04em', fontWeight: 400 }}>
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

            {/* Catégorie */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[{ slug: '', name: 'Toutes les catégories' }, ...categories].map((cat) => {
                const active = selectedCategory === cat.slug;
                return (
                  <button key={cat.slug} onClick={() => updateFilter('category', cat.slug)}
                    style={{ display: 'flex', alignItems: 'center', gap: '1.4rem', padding: '1.1rem 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid rgba(42,42,42,0.06)' }}>
                    <span style={{ width: '1.5rem', height: '1.5rem', border: `1px solid ${active ? '#B8960A' : '#CEC0A0'}`, background: active ? '#B8960A' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                      {active && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#1A1208" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>}
                    </span>
                    <span style={{ fontSize: '1.3rem', fontFamily: 'Inter, sans-serif', color: active ? '#1A1208' : '#7A6A50', transition: 'color 0.2s' }}>
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>

          </aside>

          {/* ── Colonne produits ── */}
          <div>
            {/* Chips filtres actifs */}
            {activeChips.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.8rem', marginBottom: '2.4rem', animation: 'fadeDown 0.3s ease both' }}>
                {activeChips.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => updateFilter(key, '')}
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
                    {label} <span style={{ color: '#7A6A50', fontSize: '1.5rem', lineHeight: 1 }}>×</span>
                  </button>
                ))}
                <button
                  onClick={resetFilters}
                  style={{ fontSize: '1.05rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#C2662D', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#1A1208'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#C2662D'}
                >
                  Tout effacer
                </button>
              </div>
            )}

            {/* Grille produits */}
            {loading ? (
              <div className="boutique-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4rem 2.8rem' }}>
                {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '10rem 2rem' }}>
                <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '2.6rem', color: '#1A1208', marginBottom: '1.2rem' }}>Aucune pièce trouvée</p>
                <p style={{ fontSize: '1.4rem', fontFamily: 'Inter, sans-serif', color: '#7A6A50', marginBottom: '4rem', lineHeight: 1.7 }}>
                  Essayez d&apos;autres filtres pour découvrir nos créations.
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
              <div className="boutique-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4rem 2.8rem' }}>
                {products.map((p, i) => <PLPCard key={p.id} product={p} index={i} />)}
              </div>
            )}

            {/* Load more */}
            {nextUrl && !loading && (
              <div style={{ textAlign: 'center', marginTop: '9rem' }}>
                <p style={{ fontSize: '1.2rem', fontFamily: 'Inter, sans-serif', color: '#7A6A50', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '3rem' }}>
                  {products.length} sur {totalCount} pièces
                </p>
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '1rem',
                    padding: '1.5rem 5.5rem', background: 'transparent',
                    color: loadingMore ? '#7A6A50' : '#B8960A',
                    border: `1px solid ${loadingMore ? '#CEC0A0' : '#B8960A'}`,
                    fontSize: '1.1rem', fontFamily: 'Inter, sans-serif',
                    textTransform: 'uppercase', letterSpacing: '0.2em',
                    cursor: loadingMore ? 'not-allowed' : 'pointer', transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => { if (!loadingMore) { e.currentTarget.style.background = '#B8960A'; e.currentTarget.style.color = '#FAF6EE'; } }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = loadingMore ? '#7A6A50' : '#B8960A'; }}
                >
                  {loadingMore ? 'Chargement…' : 'Charger plus'}
                  {!loadingMore && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="6 9 12 15 18 9"/></svg>}
                </button>
              </div>
            )}
          </div>


        </div>
      </div>

      <style>{`
        @keyframes fadeUp   { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shimmer  { 0%,100% { opacity:0.35; } 50% { opacity:0.7; } }
        @keyframes expandLine { from { transform:scaleX(0); } to { transform:scaleX(1); } }
        @keyframes slideUp  { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }

        .hero-title   { animation: slideUp 0.7s ease 0.1s both; }
        .hero-line    { animation: expandLine 0.9s ease 0.3s both; transform-origin: center; }
        .toolbar-anim { animation: slideUp 0.6s ease 0.2s both; }


        @media (max-width: 1100px) {
          .boutique-layout { grid-template-columns: 1fr 24rem !important; gap: 3rem !important; }
          .boutique-grid   { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 860px) {
          .boutique-layout { grid-template-columns: 1fr !important; padding: 3rem 3rem 8rem !important; }
          .boutique-layout aside { position: static !important; max-height: none !important; }
          .boutique-title { padding-left: 0 !important; }
        }
        @media (max-width: 640px) {
          .boutique-section { padding-left: 2rem !important; padding-right: 2rem !important; }
        }
        @media (max-width: 560px) {
          .boutique-grid { grid-template-columns: 1fr !important; }
        }
        select option { background: #141414 !important; }
      `}</style>
    </>
  );
};

/* ─── AccordionSection ───────────────────────────────────── */
const AccordionSection = ({ title, sectionKey, open, onToggle, children }) => {
  const contentRef = useRef(null);

  return (
    <div style={{ borderBottom: '1px solid #E0D0B8' }}>
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
          stroke="rgba(250,246,238,0.6)" strokeWidth="1.5"
          style={{ transition: 'transform 0.25s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      <div
        ref={contentRef}
        style={{
          overflow: 'hidden',
          maxHeight: open ? '60rem' : '0',
          transition: 'max-height 0.35s ease',
        }}
      >
        <div style={{ padding: '0 3rem 2.5rem' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

/* ─── Styles partagés ────────────────────────────────────── */
const inputStyle = {
  width: '100%', padding: '1rem 0',
  background: 'transparent', border: 'none',
  borderBottom: '1px solid #CEC0A0',
  color: '#1A1208', fontSize: '1.3rem', fontFamily: 'Inter, sans-serif',
  outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};

export default BoutiquePage;
