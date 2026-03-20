import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import SkeletonCard from '../components/SkeletonCard';
import SEOHead from '../components/SEOHead';
import apiClient from '../api/client';

const SORT_OPTIONS = [
  { value: '-created_at', label: 'Nouveautés' },
  { value: 'price', label: 'Prix croissant' },
  { value: '-price', label: 'Prix décroissant' },
  { value: 'name', label: 'Nom A-Z' },
];

/* ── Chip filtre actif ── */
const FilterChip = ({ label, onRemove }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
    background: '#C9A84C22', color: '#8a6b1a', border: '1px solid #C9A84C55',
    borderRadius: '2rem', padding: '0.4rem 1rem', fontSize: '1.3rem', fontWeight: 500,
  }}>
    {label}
    <button onClick={onRemove} style={{
      background: 'none', color: '#8a6b1a', cursor: 'pointer',
      fontSize: '1.4rem', lineHeight: 1, padding: 0,
    }}>×</button>
  </span>
);

/* ── Section sidebar ── */
const SidebarSection = ({ icon, title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '1.8rem', marginBottom: '1.8rem' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          width: '100%', background: 'none', cursor: 'pointer', marginBottom: open ? '1.2rem' : 0,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '1.5rem', fontWeight: 600, color: 'var(--black-color)' }}>
          <i className={`bx ${icon}`} style={{ color: '#C9A84C', fontSize: '1.8rem' }}></i>
          {title}
        </span>
        <i className={`bx bx-chevron-${open ? 'up' : 'down'}`} style={{ fontSize: '1.8rem', color: 'var(--default-color)' }}></i>
      </button>
      {open && children}
    </div>
  );
};

const BoutiquePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [nextUrl, setNextUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [gridCols, setGridCols] = useState(3);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const selectedCategory = searchParams.get('category') || '';
  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';
  const searchQuery = searchParams.get('search') || '';
  const ordering = searchParams.get('ordering') || '-created_at';

  const updateFilter = (key, value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value); else p.delete(key);
    p.delete('page');
    setSearchParams(p);
  };

  const resetFilters = () => setSearchParams({});

  const hasActiveFilters = selectedCategory || minPrice || maxPrice || searchQuery;

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
    } catch {
      if (reset) setProducts([]);
    } finally {
      reset ? setLoading(false) : setLoadingMore(false);
    }
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
    } finally {
      setLoadingMore(false);
    }
  };

  const categoryLabel = selectedCategory
    ? (categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory)
    : null;

  /* ── Sidebar content ── */
  const SidebarContent = () => (
    <div>
      {/* Recherche */}
      <SidebarSection icon="bx-search" title="Recherche">
        <div style={{ position: 'relative' }}>
          <i className="bx bx-search" style={{
            position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)',
            color: 'var(--default-color)', fontSize: '1.6rem',
          }}></i>
          <input
            type="text"
            placeholder="Nom, matière, style…"
            value={searchQuery}
            onChange={(e) => updateFilter('search', e.target.value)}
            style={{
              width: '100%', padding: '1rem 1rem 1rem 3.6rem', borderRadius: '0.8rem',
              border: '1.5px solid #e8e8e8', fontSize: '1.4rem', background: '#fafafa',
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
      </SidebarSection>

      {/* Catégories */}
      <SidebarSection icon="bx-category" title="Catégories">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {[{ slug: '', name: 'Toutes les catégories' }, ...categories].map((cat) => {
            const active = selectedCategory === cat.slug;
            return (
              <button
                key={cat.slug}
                onClick={() => updateFilter('category', cat.slug)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.8rem 1.2rem', borderRadius: '0.8rem', cursor: 'pointer',
                  background: active ? '#C9A84C' : 'transparent',
                  color: active ? '#fff' : 'var(--black-color)',
                  fontSize: '1.4rem', fontWeight: active ? 600 : 400,
                  textAlign: 'left', transition: 'all 0.15s',
                  border: active ? 'none' : '1.5px solid transparent',
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = '#C9A84C11'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <span>{cat.name}</span>
                {active && <i className="bx bx-check" style={{ fontSize: '1.6rem' }}></i>}
              </button>
            );
          })}
        </div>
      </SidebarSection>

      {/* Prix */}
      <SidebarSection icon="bx-money" title="Prix (FCFA)">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '1.2rem', color: 'var(--default-color)', display: 'block', marginBottom: '0.4rem' }}>Prix minimum</label>
            <input
              type="number"
              placeholder="0"
              value={minPrice}
              onChange={(e) => updateFilter('min_price', e.target.value)}
              style={{
                width: '100%', padding: '0.8rem 1.2rem', borderRadius: '0.8rem',
                border: '1.5px solid #e8e8e8', fontSize: '1.4rem', background: '#fafafa',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '1.2rem', color: 'var(--default-color)', display: 'block', marginBottom: '0.4rem' }}>Prix maximum</label>
            <input
              type="number"
              placeholder="999 999"
              value={maxPrice}
              onChange={(e) => updateFilter('max_price', e.target.value)}
              style={{
                width: '100%', padding: '0.8rem 1.2rem', borderRadius: '0.8rem',
                border: '1.5px solid #e8e8e8', fontSize: '1.4rem', background: '#fafafa',
                boxSizing: 'border-box',
              }}
            />
          </div>
          {(minPrice || maxPrice) && (
            <button onClick={() => { updateFilter('min_price', ''); updateFilter('max_price', ''); }}
              style={{ fontSize: '1.2rem', color: '#C9A84C', background: 'none', cursor: 'pointer', textDecoration: 'underline', textAlign: 'left' }}>
              Effacer les prix
            </button>
          )}
        </div>
      </SidebarSection>

      {/* Réinitialiser */}
      {hasActiveFilters && (
        <button
          onClick={resetFilters}
          style={{
            width: '100%', padding: '1rem', borderRadius: '0.8rem', cursor: 'pointer',
            background: '#0D0D0D', color: '#fff', fontSize: '1.4rem', fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem',
          }}
        >
          <i className="bx bx-reset"></i> Réinitialiser les filtres
        </button>
      )}
    </div>
  );

  return (
    <>
      <SEOHead title="Boutique" description="Découvrez toutes nos créations : boubous brodés, robes wax, tenues de cérémonie et accessoires artisanaux." url="/boutique" />

      {/* ── Hero ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0D0D0D 55%, #1a1200 100%)',
        padding: '5rem 3rem', textAlign: 'center', marginBottom: '4rem',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 80% 50%, #C9A84C14 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        <span style={{ color: '#C9A84C', fontSize: '1.3rem', letterSpacing: '0.25em', textTransform: 'uppercase' }}>GOLDEN POUSSO</span>
        <h1 style={{ color: '#fff', fontSize: '3.2rem', fontFamily: 'Aclonica, sans-serif', margin: '1rem 0 1.2rem' }}>
          Notre Boutique
        </h1>
        <p style={{ color: '#bbb', fontSize: '1.5rem', maxWidth: '48rem', margin: '0 auto 2.5rem' }}>
          Boubous brodés, robes wax, tenues de cérémonie — chaque pièce raconte une histoire.
        </p>
        {/* Catégories rapides */}
        {categories.length > 0 && (
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => updateFilter('category', cat.slug === selectedCategory ? '' : cat.slug)}
                style={{
                  padding: '0.7rem 1.8rem', borderRadius: '2rem', cursor: 'pointer', fontSize: '1.4rem',
                  background: selectedCategory === cat.slug ? '#C9A84C' : 'rgba(255,255,255,0.1)',
                  color: selectedCategory === cat.slug ? '#fff' : '#ddd',
                  border: selectedCategory === cat.slug ? '1px solid #C9A84C' : '1px solid rgba(255,255,255,0.2)',
                  fontWeight: selectedCategory === cat.slug ? 700 : 400,
                  transition: 'all 0.2s',
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="container">
        <div style={{ display: 'flex', gap: '3rem', alignItems: 'flex-start' }}>

          {/* ── Sidebar desktop ── */}
          <aside style={{
            width: '26rem', flexShrink: 0,
            background: '#fff', padding: '2.5rem 2rem',
            borderRadius: '1.4rem', boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
            alignSelf: 'flex-start', position: 'sticky', top: '2rem',
            display: 'none',
          }} className="boutique-sidebar">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '2px solid #f5f5f5' }}>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <i className="bx bx-filter-alt" style={{ color: '#C9A84C', fontSize: '2rem' }}></i>
                Filtres
              </h3>
              {hasActiveFilters && (
                <span style={{
                  background: '#C9A84C', color: '#fff', borderRadius: '50%',
                  width: '2rem', height: '2rem', fontSize: '1.2rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {[selectedCategory, minPrice, maxPrice, searchQuery].filter(Boolean).length}
                </span>
              )}
            </div>
            <SidebarContent />
          </aside>

          {/* ── Contenu principal ── */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Barre d'outils */}
            <div style={{
              background: '#fff', borderRadius: '1.2rem', padding: '1.4rem 2rem',
              boxShadow: '0 2px 12px rgba(0,0,0,0.05)', marginBottom: '2rem',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexWrap: 'wrap', gap: '1rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                {/* Bouton filtres mobile */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="boutique-filter-btn"
                  style={{
                    display: 'none', alignItems: 'center', gap: '0.6rem',
                    padding: '0.8rem 1.4rem', borderRadius: '0.8rem', cursor: 'pointer',
                    background: hasActiveFilters ? '#C9A84C' : '#f5f5f5',
                    color: hasActiveFilters ? '#fff' : 'var(--black-color)',
                    fontSize: '1.4rem', fontWeight: hasActiveFilters ? 600 : 400,
                  }}
                >
                  <i className="bx bx-filter-alt"></i>
                  Filtres
                  {hasActiveFilters && (
                    <span style={{
                      background: '#fff', color: '#C9A84C', borderRadius: '50%',
                      width: '1.8rem', height: '1.8rem', fontSize: '1.1rem', fontWeight: 700,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {[selectedCategory, minPrice, maxPrice, searchQuery].filter(Boolean).length}
                    </span>
                  )}
                </button>

                <span style={{ color: 'var(--default-color)', fontSize: '1.4rem' }}>
                  {loading
                    ? <><i className="bx bx-loader-alt bx-spin" style={{ marginRight: '0.5rem' }}></i>Chargement…</>
                    : <><strong style={{ color: 'var(--black-color)' }}>{totalCount}</strong> produit{totalCount > 1 ? 's' : ''} trouvé{totalCount > 1 ? 's' : ''}</>
                  }
                </span>
              </div>

              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {/* Tri */}
                <div style={{ position: 'relative' }}>
                  <i className="bx bx-sort-alt-2" style={{
                    position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--default-color)', fontSize: '1.6rem', pointerEvents: 'none',
                  }}></i>
                  <select
                    value={ordering}
                    onChange={(e) => updateFilter('ordering', e.target.value)}
                    style={{
                      padding: '0.8rem 1.2rem 0.8rem 3.2rem', borderRadius: '0.8rem',
                      border: '1.5px solid #e8e8e8', fontSize: '1.4rem',
                      background: '#fafafa', cursor: 'pointer', appearance: 'none',
                      paddingRight: '2.5rem',
                    }}
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                {/* Toggle grille */}
                <div style={{ display: 'flex', background: '#f5f5f5', borderRadius: '0.8rem', padding: '0.3rem' }}>
                  {[
                    { n: 2, icon: 'bx-grid-small', title: '2 colonnes' },
                    { n: 3, icon: 'bx-grid', title: '3 colonnes' },
                    { n: 4, icon: 'bx-grid-alt', title: '4 colonnes' },
                  ].map(({ n, icon, title }) => (
                    <button
                      key={n}
                      title={title}
                      onClick={() => setGridCols(n)}
                      style={{
                        padding: '0.6rem 1rem', borderRadius: '0.6rem', cursor: 'pointer',
                        background: gridCols === n ? '#C9A84C' : 'transparent',
                        color: gridCols === n ? '#fff' : 'var(--default-color)',
                        fontSize: '1.6rem', transition: 'all 0.15s',
                      }}
                    >
                      <i className={`bx ${icon}`}></i>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Filtres actifs (chips) */}
            {hasActiveFilters && (
              <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '1.3rem', color: 'var(--default-color)' }}>Filtres actifs :</span>
                {categoryLabel && <FilterChip label={categoryLabel} onRemove={() => updateFilter('category', '')} />}
                {searchQuery && <FilterChip label={`"${searchQuery}"`} onRemove={() => updateFilter('search', '')} />}
                {minPrice && <FilterChip label={`≥ ${Number(minPrice).toLocaleString('fr-FR')} FCFA`} onRemove={() => updateFilter('min_price', '')} />}
                {maxPrice && <FilterChip label={`≤ ${Number(maxPrice).toLocaleString('fr-FR')} FCFA`} onRemove={() => updateFilter('max_price', '')} />}
                <button onClick={resetFilters} style={{ fontSize: '1.3rem', color: '#888', background: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                  Tout effacer
                </button>
              </div>
            )}

            {/* Grille produits */}
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${gridCols}, 1fr)`, gap: '2rem' }}>
                {Array.from({ length: gridCols * 2 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : products.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '6rem 2rem',
                background: '#fff', borderRadius: '1.4rem',
                boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
              }}>
                <div style={{
                  width: '8rem', height: '8rem', borderRadius: '50%', background: '#C9A84C11',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem',
                }}>
                  <i className="bx bx-search-alt" style={{ fontSize: '4rem', color: '#C9A84C' }}></i>
                </div>
                <h3 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Aucun produit trouvé</h3>
                <p style={{ color: 'var(--default-color)', marginBottom: '2.5rem' }}>
                  Aucun article ne correspond à vos critères.<br />Essayez d'élargir votre recherche.
                </p>
                <button onClick={resetFilters} className="btn" style={{ background: '#C9A84C', color: '#fff', padding: '1.2rem 3rem' }}>
                  <i className="bx bx-reset" style={{ marginRight: '0.5rem' }}></i>
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${gridCols}, 1fr)`, gap: '2rem' }}>
                {products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}

            {/* Charger plus */}
            {nextUrl && !loading && (
              <div style={{ textAlign: 'center', marginTop: '4rem' }}>
                <button
                  className="btn loadmore"
                  onClick={loadMore}
                  disabled={loadingMore}
                  style={{
                    background: loadingMore ? '#f0f0f0' : '#0D0D0D',
                    color: loadingMore ? 'var(--default-color)' : '#fff',
                    padding: '1.3rem 4rem', fontSize: '1.5rem',
                    display: 'inline-flex', alignItems: 'center', gap: '0.8rem',
                  }}
                >
                  {loadingMore
                    ? <><i className="bx bx-loader-alt bx-spin"></i>Chargement…</>
                    : <><i className="bx bx-down-arrow-alt"></i>Charger plus de produits</>
                  }
                </button>
                <p style={{ color: 'var(--default-color)', fontSize: '1.3rem', marginTop: '1rem' }}>
                  {products.length} / {totalCount} produits affichés
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Drawer mobile ── */}
      {sidebarOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.5)', display: 'flex',
          }}
          onClick={() => setSidebarOpen(false)}
        >
          <div
            style={{
              width: '32rem', maxWidth: '90vw', background: '#fff',
              height: '100%', overflowY: 'auto', padding: '2rem',
              boxShadow: '4px 0 30px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Filtres</h3>
              <button onClick={() => setSidebarOpen(false)} style={{
                background: '#f5f5f5', borderRadius: '50%', width: '3.5rem', height: '3.5rem',
                cursor: 'pointer', fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>×</button>
            </div>
            <SidebarContent />
            <button
              onClick={() => setSidebarOpen(false)}
              style={{
                width: '100%', marginTop: '1rem', padding: '1.3rem',
                background: '#C9A84C', color: '#fff', borderRadius: '0.8rem',
                fontSize: '1.5rem', fontWeight: 700, cursor: 'pointer',
              }}
            >
              Voir les {totalCount} produits
            </button>
          </div>
        </div>
      )}

      <style>{`
        @media (min-width: 900px) {
          .boutique-sidebar { display: block !important; }
        }
        @media (max-width: 899px) {
          .boutique-filter-btn { display: inline-flex !important; }
        }
      `}</style>
    </>
  );
};

export default BoutiquePage;
