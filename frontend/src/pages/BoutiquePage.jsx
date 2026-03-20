import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import SkeletonCard from '../components/SkeletonCard';
import apiClient from '../api/client';

const SORT_OPTIONS = [
  { value: '-created_at', label: 'Nouveautés' },
  { value: 'price', label: 'Prix croissant' },
  { value: '-price', label: 'Prix décroissant' },
  { value: 'name', label: 'Nom A-Z' },
];

const BoutiquePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filtres depuis l'URL
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [nextUrl, setNextUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [gridCols, setGridCols] = useState(4);

  // Valeurs des filtres
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

  useEffect(() => {
    fetchProducts(true);
  }, [fetchProducts]);

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

  /* ── Sidebar ── */
  const Sidebar = () => (
    <aside style={{
      width: '24rem',
      flexShrink: 0,
      background: '#fff',
      padding: '2rem',
      borderRadius: '1rem',
      boxShadow: 'var(--box-shadow-1)',
      alignSelf: 'flex-start',
      position: 'sticky',
      top: '2rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.8rem' }}>Filtres</h3>
        <button onClick={resetFilters} style={{
          background: 'none', color: 'var(--primary-color)', cursor: 'pointer',
          fontSize: '1.3rem', textDecoration: 'underline',
        }}>Réinitialiser</button>
      </div>

      {/* Recherche */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h4 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Recherche</h4>
        <input
          type="text"
          placeholder="Rechercher..."
          value={searchQuery}
          onChange={(e) => updateFilter('search', e.target.value)}
          style={{
            width: '100%', padding: '0.8rem 1.2rem', borderRadius: '0.8rem',
            border: '1px solid #e0e0e0', fontSize: '1.4rem', background: 'var(--grey-color)',
          }}
        />
      </div>

      {/* Catégories */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h4 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Catégories</h4>
        {[{ slug: '', name: 'Toutes les catégories' }, ...categories].map((cat) => (
          <label key={cat.slug} style={{
            display: 'flex', alignItems: 'center', gap: '1rem',
            padding: '0.6rem 0', cursor: 'pointer', fontSize: '1.4rem',
          }}>
            <input
              type="radio"
              name="category"
              checked={selectedCategory === cat.slug}
              onChange={() => updateFilter('category', cat.slug)}
              style={{ accentColor: '#C9A84C', width: '1.6rem', height: '1.6rem' }}
            />
            {cat.name}
          </label>
        ))}
      </div>

      {/* Prix */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h4 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Prix (FCFA)</h4>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => updateFilter('min_price', e.target.value)}
            style={{
              flex: 1, padding: '0.8rem', borderRadius: '0.8rem',
              border: '1px solid #e0e0e0', fontSize: '1.3rem', background: 'var(--grey-color)',
            }}
          />
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => updateFilter('max_price', e.target.value)}
            style={{
              flex: 1, padding: '0.8rem', borderRadius: '0.8rem',
              border: '1px solid #e0e0e0', fontSize: '1.3rem', background: 'var(--grey-color)',
            }}
          />
        </div>
      </div>
    </aside>
  );

  return (
    <section className="section">
      <div className="container">
        <div className="title">
          <span>GOLDEN POUSSO</span>
          <h2>Notre Boutique</h2>
        </div>

        <div style={{ display: 'flex', gap: '3rem', alignItems: 'flex-start' }}>
          {/* Sidebar filtres */}
          <Sidebar />

          {/* Contenu principal */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Barre d'outils */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem',
            }}>
              <span style={{ color: 'var(--default-color)', fontSize: '1.4rem' }}>
                {loading ? '…' : `${totalCount} produit${totalCount > 1 ? 's' : ''} trouvé${totalCount > 1 ? 's' : ''}`}
              </span>
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                {/* Tri */}
                <select
                  value={ordering}
                  onChange={(e) => updateFilter('ordering', e.target.value)}
                  style={{
                    padding: '0.8rem 1.2rem', borderRadius: '0.8rem', border: '1px solid #e0e0e0',
                    fontSize: '1.4rem', background: '#fff', cursor: 'pointer',
                  }}
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                {/* Bascule grille */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[2, 4].map((n) => (
                    <button
                      key={n}
                      onClick={() => setGridCols(n)}
                      style={{
                        padding: '0.6rem 1rem', borderRadius: '0.5rem', cursor: 'pointer',
                        background: gridCols === n ? '#C9A84C' : 'var(--grey-color)',
                        color: gridCols === n ? '#fff' : 'var(--black-color)',
                        fontSize: '1.3rem',
                      }}
                    >
                      <i className={`bx bx-grid-${n === 2 ? 'small' : 'alt'}`}></i>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Grille produits */}
            {loading ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
                gap: '2rem',
              }}>
                {Array.from({ length: gridCols * 2 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '6rem 2rem' }}>
                <i className="bx bx-search-alt" style={{ fontSize: '6rem', color: '#C9A84C', display: 'block', marginBottom: '2rem' }}></i>
                <h3 style={{ marginBottom: '1rem' }}>Aucun produit trouvé</h3>
                <p style={{ color: 'var(--default-color)' }}>Essayez d'autres filtres.</p>
                <button onClick={resetFilters} className="btn" style={{ marginTop: '2rem' }}>
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
                gap: '2rem',
              }}>
                {products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}

            {/* Charger plus */}
            {nextUrl && (
              <div className="button d-flex" style={{ marginTop: '3rem' }}>
                <button
                  className="btn loadmore"
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Chargement…' : 'Charger plus'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BoutiquePage;
