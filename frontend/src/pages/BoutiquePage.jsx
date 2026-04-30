import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import apiClient from '../api/client';
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
      onClick={() => !outOfStock && navigate(`/produit/${product.slug}`)}
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
          <img
            src={product.primary_image}
            alt={product.name}
            loading={index < 3 ? 'eager' : 'lazy'}
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
          <img
            src={product.secondary_image}
            alt={product.name}
            loading="lazy"
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

        {/* CTA Aperçu Rapide */}
        {!outOfStock && (
          <button
            style={{
              position: 'absolute', bottom: '1.6rem', left: '1.6rem', right: '1.6rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem',
              background: '#B8960A', color: '#FAF6EE',
              padding: '1.2rem',
              fontSize: '1rem', fontFamily: 'Inter, sans-serif',
              textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 600,
              border: 'none', cursor: 'pointer',
              opacity: hovered ? 1 : 0,
              transform: hovered ? 'translateY(0)' : 'translateY(10px)',
              transition: 'opacity 0.25s ease, transform 0.3s ease, background 0.2s, color 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#C2662D'; e.currentTarget.style.color = '#1A1208'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#B8960A'; e.currentTarget.style.color = '#FAF6EE'; }}
            onClick={(e) => { e.stopPropagation(); navigate(`/produit/${product.slug}`); }}
          >
            {/* Eye icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            Aperçu Rapide
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
          fontFamily: 'Aclonica, serif',
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
  const [filterOpen, setFilterOpen]     = useState(false);

  /* accordion state inside filter */
  const [openSections, setOpenSections] = useState(['category', 'price', 'sort']);
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

        {/* ── Category Hero ── */}
        <section className="boutique-section" style={{ padding: '14rem 6rem 0', maxWidth: '110rem', margin: '0 auto' }}>


          {/* Titre + sous-titre */}
          <div className="hero-title" style={{ textAlign: 'center', marginBottom: '5rem' }}>
            <h1 style={{
              fontFamily: 'Aclonica, serif',
              fontSize: 'clamp(4rem, 7vw, 7.2rem)',
              color: '#1A1208',
              letterSpacing: '0.06em',
              lineHeight: 1.05,
              textTransform: 'uppercase',
              marginBottom: '2rem',
            }}>
              Boutique
            </h1>
            <p style={{
              fontSize: '1.45rem', fontFamily: 'Inter, sans-serif',
              color: '#7A6A50', lineHeight: 1.75,
              maxWidth: '54rem', margin: '0 auto',
            }}>
              Pièces d&apos;exception confectionnées dans notre atelier de Pikine.
              L&apos;alliance parfaite entre les coupes contemporaines et la noblesse des tissus africains.
            </p>
          </div>

          {/* Ligne animée depuis le centre */}
          <div className="hero-line" style={{ height: '1px', background: '#CEC0A0', transformOrigin: 'center' }} />
        </section>

        {/* ── Toolbar ── */}
        <div className="toolbar-anim boutique-section" style={{ padding: '2.2rem 6rem', maxWidth: '110rem', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

            {/* Gauche: Filtrer */}
            <button
              className="filter-btn"
              onClick={() => setFilterOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '1.1rem', fontFamily: 'Inter, sans-serif',
                textTransform: 'uppercase', letterSpacing: '0.2em',
                color: '#1A1208',
                transition: 'color 0.2s',
                padding: 0,
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#B8960A'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#1A1208'}
            >
              {/* Sliders icon */}
              <svg className="filter-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ transition: 'transform 0.3s ease', flexShrink: 0 }}>
                <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/>
                <line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/>
                <line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/>
                <line x1="17" y1="16" x2="23" y2="16"/>
              </svg>
              Filtrer &amp; Trier
              {activeCount > 0 && (
                <span style={{
                  width: '2rem', height: '2rem', borderRadius: '50%',
                  background: '#B8960A', color: '#FAF6EE',
                  fontSize: '1rem', fontWeight: 700,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {activeCount}
                </span>
              )}
            </button>

            {/* Centre: count */}
            <p style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#7A6A50' }}>
              {loading ? '…' : `${totalCount} pièce${totalCount > 1 ? 's' : ''}`}
            </p>

            {/* Droite: tri */}
            <div style={{ position: 'relative' }}>
              <select
                value={ordering}
                onChange={(e) => updateFilter('ordering', e.target.value)}
                style={{
                  appearance: 'none', background: 'transparent', border: 'none',
                  color: '#7A6A50', fontSize: '1.1rem', fontFamily: 'Inter, sans-serif',
                  textTransform: 'uppercase', letterSpacing: '0.2em',
                  cursor: 'pointer', paddingRight: '2.2rem', outline: 'none',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#1A1208'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#7A6A50'}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} style={{ background: '#F0E8D8', color: '#1A1208' }}>
                    {o.label}
                  </option>
                ))}
              </select>
              <svg style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8A8A8A" strokeWidth="1.5">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          </div>

          {/* Chips filtres actifs */}
          {activeChips.length > 0 && (
            <div style={{
              display: 'flex', flexWrap: 'wrap', alignItems: 'center',
              gap: '0.8rem', marginTop: '1.8rem',
              animation: 'fadeDown 0.3s ease both',
            }}>
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
                    color: '#1A1208', cursor: 'pointer',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#B8960A'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#CEC0A0'}
                >
                  {label}
                  <span style={{ color: '#7A6A50', fontSize: '1.5rem', lineHeight: 1 }}>×</span>
                </button>
              ))}
              <button
                onClick={resetFilters}
                style={{ fontSize: '1.05rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#C2662D', background: 'none', border: 'none', cursor: 'pointer', marginLeft: '0.4rem', transition: 'color 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#1A1208'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#C2662D'}
              >
                Tout effacer
              </button>
            </div>
          )}
        </div>

        {/* Séparateur */}
        <div style={{ height: '1px', background: '#CEC0A0', maxWidth: '110rem', margin: '0 auto 4rem' }} />

        {/* ── Grille produits ── */}
        <div className="boutique-section" style={{ padding: '0 6rem 12rem', maxWidth: '110rem', margin: '0 auto' }}>
          {loading ? (
            <div className="boutique-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4rem 2.8rem' }}>
              {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '12rem 2rem' }}>
              <p style={{ fontFamily: 'Aclonica, serif', fontSize: '2.6rem', color: '#1A1208', marginBottom: '1.2rem' }}>
                Aucune pièce trouvée
              </p>
              <p style={{ fontSize: '1.4rem', fontFamily: 'Inter, sans-serif', color: '#7A6A50', marginBottom: '4rem', lineHeight: 1.7 }}>
                Essayez d&apos;autres filtres pour découvrir nos créations.
              </p>
              <button
                onClick={resetFilters}
                style={{
                  fontSize: '1.1rem', fontFamily: 'Inter, sans-serif',
                  textTransform: 'uppercase', letterSpacing: '0.2em',
                  color: '#C2662D', background: 'none', border: 'none',
                  cursor: 'pointer', borderBottom: '1px solid #C2662D', paddingBottom: '0.25rem',
                  transition: 'color 0.2s, border-color 0.2s',
                }}
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
                  padding: '1.5rem 5.5rem',
                  background: 'transparent',
                  color: loadingMore ? '#7A6A50' : '#B8960A',
                  border: `1px solid ${loadingMore ? '#CEC0A0' : '#B8960A'}`,
                  fontSize: '1.1rem', fontFamily: 'Inter, sans-serif',
                  textTransform: 'uppercase', letterSpacing: '0.2em',
                  cursor: loadingMore ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => { if (!loadingMore) { e.currentTarget.style.background = '#B8960A'; e.currentTarget.style.color = '#FAF6EE'; } }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = loadingMore ? '#7A6A50' : '#B8960A'; }}
              >
                {loadingMore ? 'Chargement…' : 'Charger plus'}
                {!loadingMore && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Filter Drawer ── */}
      <>
        {/* Overlay */}
        <div
          onClick={() => setFilterOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(5px)',
            opacity: filterOpen ? 1 : 0,
            visibility: filterOpen ? 'visible' : 'hidden',
            transition: 'opacity 0.3s, visibility 0.3s',
          }}
        />

        {/* Panel */}
        <div
          style={{
            position: 'fixed', left: 0, top: 0, bottom: 0,
            width: '38rem', maxWidth: '95vw',
            background: '#FAF6EE',
            borderRight: '1px solid #E0D0B8',
            display: 'flex', flexDirection: 'column',
            boxShadow: '12px 0 50px rgba(0,0,0,0.5)',
            zIndex: 1001,
            transform: filterOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.38s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ padding: '3rem', borderBottom: '1px solid #E0D0B8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <h3 style={{ fontFamily: 'Aclonica, serif', fontSize: '2.2rem', color: '#B8960A', margin: 0, letterSpacing: '0.04em', fontWeight: 400 }}>
              Filtrer
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.6rem' }}>
              {activeCount > 0 && (
                <button
                  onClick={resetFilters}
                  style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#C2662D', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#1A1208'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#C2662D'}
                >
                  Tout effacer ({activeCount})
                </button>
              )}
              <button
                onClick={() => setFilterOpen(false)}
                style={{ background: 'none', border: 'none', color: '#7A6A50', cursor: 'pointer', fontSize: '2.2rem', lineHeight: 1, padding: '0.2rem', transition: 'color 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#1A1208'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#7A6A50'}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Body — accordion */}
          <div style={{ flex: 1, overflowY: 'auto' }}>

            {/* Recherche */}
            <AccordionSection
              title="Recherche"
              sectionKey="search"
              open={openSections.includes('search')}
              onToggle={toggleSection}
            >
              <input
                type="text"
                placeholder="Nom, style, matière…"
                value={searchQuery}
                onChange={(e) => updateFilter('search', e.target.value)}
                style={inputStyle}
                onFocus={(e) => e.currentTarget.style.borderBottomColor = '#B8960A'}
                onBlur={(e) => e.currentTarget.style.borderBottomColor = '#CEC0A0'}
              />
            </AccordionSection>

            {/* Catégorie */}
            <AccordionSection
              title="Catégorie"
              sectionKey="category"
              open={openSections.includes('category')}
              onToggle={toggleSection}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {[{ slug: '', name: 'Toutes les catégories' }, ...categories].map((cat) => {
                  const active = selectedCategory === cat.slug;
                  return (
                    <button
                      key={cat.slug}
                      onClick={() => updateFilter('category', cat.slug)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '1.4rem',
                        padding: '1.1rem 0', background: 'none', border: 'none',
                        cursor: 'pointer', textAlign: 'left',
                        borderBottom: '1px solid rgba(42,42,42,0.6)',
                      }}
                    >
                      <span style={{
                        width: '1.5rem', height: '1.5rem',
                        border: `1px solid ${active ? '#B8960A' : '#CEC0A0'}`,
                        background: active ? '#B8960A' : 'transparent',
                        flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s',
                      }}>
                        {active && (
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="3.5">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </span>
                      <span style={{ fontSize: '1.3rem', fontFamily: 'Inter, sans-serif', color: active ? '#1A1208' : '#7A6A50', transition: 'color 0.2s' }}>
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </AccordionSection>

            {/* Budget */}
            <AccordionSection
              title="Budget (FCFA)"
              sectionKey="price"
              open={openSections.includes('price')}
              onToggle={toggleSection}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div>
                  <label style={{ fontSize: '1rem', fontFamily: 'Inter, sans-serif', color: '#555', display: 'block', marginBottom: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Min</label>
                  <input
                    type="number" placeholder="0" value={minPrice}
                    onChange={(e) => updateFilter('min_price', e.target.value)}
                    style={inputStyle}
                    onFocus={(e) => e.currentTarget.style.borderBottomColor = '#B8960A'}
                    onBlur={(e) => e.currentTarget.style.borderBottomColor = '#CEC0A0'}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '1rem', fontFamily: 'Inter, sans-serif', color: '#555', display: 'block', marginBottom: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Max</label>
                  <input
                    type="number" placeholder="—" value={maxPrice}
                    onChange={(e) => updateFilter('max_price', e.target.value)}
                    style={inputStyle}
                    onFocus={(e) => e.currentTarget.style.borderBottomColor = '#B8960A'}
                    onBlur={(e) => e.currentTarget.style.borderBottomColor = '#CEC0A0'}
                  />
                </div>
              </div>
            </AccordionSection>

            {/* Trier par */}
            <AccordionSection
              title="Trier par"
              sectionKey="sort"
              open={openSections.includes('sort')}
              onToggle={toggleSection}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {SORT_OPTIONS.map((o) => {
                  const active = ordering === o.value;
                  return (
                    <button
                      key={o.value}
                      onClick={() => updateFilter('ordering', o.value)}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '1.2rem 0', background: 'none', border: 'none',
                        borderBottom: '1px solid rgba(42,42,42,0.6)',
                        cursor: 'pointer', textAlign: 'left',
                      }}
                    >
                      <span style={{ fontSize: '1.3rem', fontFamily: 'Inter, sans-serif', color: active ? '#1A1208' : '#7A6A50', transition: 'color 0.2s' }}>
                        {o.label}
                      </span>
                      {active && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </AccordionSection>
          </div>

          {/* Footer */}
          <div style={{ padding: '2.4rem 3rem', borderTop: '1px solid #E0D0B8', flexShrink: 0 }}>
            <button
              onClick={() => setFilterOpen(false)}
              style={{
                width: '100%', padding: '1.5rem',
                background: '#B8960A', color: '#FAF6EE',
                border: 'none', cursor: 'pointer',
                fontSize: '1.1rem', fontFamily: 'Inter, sans-serif',
                textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 700,
                transition: 'background 0.2s, color 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#C2662D'; e.currentTarget.style.color = '#1A1208'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#B8960A'; e.currentTarget.style.color = '#FAF6EE'; }}
            >
              Appliquer les filtres — {loading ? '…' : totalCount} pièce{totalCount > 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%, 100% { opacity: 0.35; }
          50%       { opacity: 0.7; }
        }
        @keyframes expandLine {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .hero-breadcrumb { animation: slideUp 0.6s ease both; }
        .hero-title      { animation: slideUp 0.7s ease 0.1s both; }
        .hero-line       { animation: expandLine 0.9s ease 0.3s both; transform-origin: center; }
        .toolbar-anim    { animation: slideUp 0.6s ease 0.2s both; }

        .filter-btn:hover .filter-icon { transform: rotate(14deg); }

        @media (max-width: 1024px) {
          .boutique-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 768px) {
          .boutique-section { padding-left: 3rem !important; padding-right: 3rem !important; }
        }
        @media (max-width: 560px) {
          .boutique-grid { grid-template-columns: 1fr !important; }
          .boutique-section { padding-left: 2rem !important; padding-right: 2rem !important; }
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
          stroke="#8A8A8A" strokeWidth="1.5"
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
