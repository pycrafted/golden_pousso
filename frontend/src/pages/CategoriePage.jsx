import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import apiClient from '../api/client';
import { PLPCard, SkeletonCard, PLP_GRID_STYLES, SidebarOptionList, PriceFilter } from '../components/ProductGridCard';

const SORT_OPTIONS = [
  { value: '-created_at', label: 'Nouveautés' },
  { value: 'price',       label: 'Prix croissant' },
  { value: '-price',      label: 'Prix décroissant' },
  { value: 'name',        label: 'Nom A–Z' },
];

const CategoriePage = () => {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [category, setCategory]     = useState(null);
  const [notFound, setNotFound]     = useState(false);
  const [catLoading, setCatLoading] = useState(true);

  const [products, setProducts]       = useState([]);
  const [totalCount, setTotalCount]   = useState(0);
  const [nextUrl, setNextUrl]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';
  const ordering = searchParams.get('ordering') || '-created_at';

  const updateFilter = (key, value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value); else p.delete(key);
    setSearchParams(p);
  };
  const resetFilters = () => setSearchParams({});
  const isSorted = ordering !== '-created_at';
  const activeCount = [minPrice, maxPrice, isSorted && ordering].filter(Boolean).length;

  const activeChips = [
    minPrice && { key: 'min_price', label: `≥ ${Number(minPrice).toLocaleString('fr-FR')} FCFA` },
    maxPrice && { key: 'max_price', label: `≤ ${Number(maxPrice).toLocaleString('fr-FR')} FCFA` },
    isSorted && { key: 'ordering', label: SORT_OPTIONS.find((o) => o.value === ordering)?.label },
  ].filter(Boolean);

  /* Charger la catégorie (nom, description) */
  useEffect(() => {
    setCatLoading(true);
    setNotFound(false);
    apiClient.get('/categories/')
      .then((res) => {
        const list = res.data.results ?? res.data;
        const found = list.find((c) => c.slug === slug);
        if (!found) { setNotFound(true); return; }
        setCategory(found);
      })
      .catch(() => setNotFound(true))
      .finally(() => setCatLoading(false));
  }, [slug]);

  const fetchProducts = useCallback(async (reset = true) => {
    if (catLoading || notFound) return;
    reset ? setLoading(true) : setLoadingMore(true);
    try {
      const params = { category: slug };
      if (minPrice) params.min_price = minPrice;
      if (maxPrice) params.max_price = maxPrice;
      if (ordering) params.ordering = ordering;
      const res = await apiClient.get('/products/', { params });
      const data = res.data;
      const results = data.results ?? data;
      setTotalCount(data.count ?? results.length);
      setNextUrl(data.next ?? null);
      reset ? setProducts(results) : setProducts((p) => [...p, ...results]);
    } catch { if (reset) setProducts([]); }
    finally { reset ? setLoading(false) : setLoadingMore(false); }
  }, [slug, minPrice, maxPrice, ordering, catLoading, notFound]);

  useEffect(() => { fetchProducts(true); }, [fetchProducts]);

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

  if (!catLoading && notFound) {
    return (
      <div style={{ background: '#FAF6EE', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center' }}>
        <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '2.6rem', color: '#1A1208', marginBottom: '1.2rem' }}>
          Catégorie introuvable
        </p>
        <Link
          to="/recherche"
          style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#C2662D', borderBottom: '1px solid #C2662D', paddingBottom: '0.25rem' }}
        >
          Voir toutes nos pièces
        </Link>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={category?.name || 'Catégorie'}
        description={category?.description || `Découvrez notre sélection ${category?.name ?? ''} — Haute couture africaine à Dakar, Sénégal.`}
        url={`/categorie/${slug}`}
      />

      <div style={{ background: '#FAF6EE', minHeight: '100vh', color: '#1A1208' }}>

        {/* ── Hero ── */}
        <section className="categorie-section" style={{ padding: '10rem 4rem 0', maxWidth: '130rem', margin: '0 auto' }}>
          <div className="categorie-title" style={{ marginBottom: '5rem', paddingLeft: 'calc(28rem + 5rem)' }}>
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
              {catLoading ? ' ' : category?.name}
            </h1>
          </div>
        </section>

        {/* ── Layout principal : produits + filtre sticky ── */}
        <div className="categorie-layout" style={{
          maxWidth: '130rem', margin: '0 auto',
          padding: '4rem 4rem 12rem',
          display: 'grid',
          gridTemplateColumns: '28rem 1fr',
          gap: '5rem',
          alignItems: 'start',
        }}>

          {/* ── Filtre sidebar sticky ── */}
          <aside style={{ position: 'sticky', top: '9rem', alignSelf: 'start' }}>
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

            {/* Prix */}
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.6rem', color: '#B8960A', margin: '2rem 0 1.6rem', letterSpacing: '0.04em', fontWeight: 400 }}>
              Prix (FCFA)
            </h3>
            <PriceFilter
              minPrice={minPrice}
              maxPrice={maxPrice}
              onApply={(min, max) => {
                const p = new URLSearchParams(searchParams);
                if (min) p.set('min_price', min); else p.delete('min_price');
                if (max) p.set('max_price', max); else p.delete('max_price');
                setSearchParams(p);
              }}
            />

            {/* Tri */}
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.6rem', color: '#B8960A', margin: '2.8rem 0 0.4rem', letterSpacing: '0.04em', fontWeight: 400 }}>
              Trier par
            </h3>
            <SidebarOptionList
              options={SORT_OPTIONS}
              activeValue={ordering}
              onSelect={(v) => updateFilter('ordering', v)}
            />
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
            {loading || catLoading ? (
              <div className="categorie-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2.4rem 2rem' }}>
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
              <div className="categorie-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2.4rem 2rem' }}>
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
        ${PLP_GRID_STYLES}
        @media (max-width: 1100px) {
          .categorie-layout { grid-template-columns: 1fr 24rem !important; gap: 3rem !important; }
          .categorie-grid   { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 860px) {
          .categorie-layout { grid-template-columns: 1fr !important; padding: 3rem 3rem 8rem !important; }
          .categorie-layout aside { position: static !important; max-height: none !important; }
          .categorie-title { padding-left: 0 !important; }
        }
        @media (max-width: 640px) {
          .categorie-section { padding-left: 2rem !important; padding-right: 2rem !important; }
        }
        @media (max-width: 560px) {
          .categorie-grid { grid-template-columns: 1fr !important; }
        }
        select option { background: #141414 !important; }
      `}</style>
    </>
  );
};

export default CategoriePage;
