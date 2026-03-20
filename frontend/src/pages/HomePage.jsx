import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import NewArrival from '../components/NewArrival';
import Statistics from '../components/Statistics';
import Blog from '../components/Blog';
import ProductCard from '../components/ProductCard';
import SkeletonCard from '../components/SkeletonCard';
import SEOHead from '../components/SEOHead';
import apiClient from '../api/client';

/* ── helpers ── */
const SectionTitle = ({ sub, title }) => (
  <div className="title">
    <span>{sub}</span>
    <h2>{title}</h2>
  </div>
);

const ProductGrid = ({ products, loading, error }) => {
  if (error) return (
    <p style={{ textAlign: 'center', color: 'var(--default-color)', padding: '2rem' }}>
      <i className="bx bx-wifi-off" style={{ marginRight: '0.5rem' }}></i>
      Impossible de charger les produits.
    </p>
  );
  if (loading) return (
    <div className="products container">
      {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
  if (!products.length) return null;
  return (
    <div className="products container">
      {products.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  );
};

/* ── Page ── */
const HomePage = () => {
  const [featured, setFeatured] = useState([]);
  const [newProducts, setNewProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingNew, setLoadingNew] = useState(true);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [errorFeatured, setErrorFeatured] = useState(false);
  const [errorNew, setErrorNew] = useState(false);

  useEffect(() => {
    apiClient.get('/products/featured/')
      .then((r) => setFeatured(r.data))
      .catch(() => setErrorFeatured(true))
      .finally(() => setLoadingFeatured(false));

    apiClient.get('/products/new/')
      .then((r) => setNewProducts(r.data))
      .catch(() => setErrorNew(true))
      .finally(() => setLoadingNew(false));

    apiClient.get('/collections/')
      .then((r) => setCollections(r.data.results ?? r.data))
      .catch(() => {})
      .finally(() => setLoadingCollections(false));
  }, []);

  return (
    <>
      <SEOHead url="/" />
      {/* Hero */}
      <header className="header">
        <Hero />
      </header>

      {/* Produits Vedettes */}
      <section className="section categories">
        <SectionTitle sub="SÉLECTION" title="Produits Vedettes" />
        <ProductGrid products={featured} loading={loadingFeatured} error={errorFeatured} />
        <div className="button d-flex">
          <Link to="/boutique" className="btn loadmore">Voir toute la boutique</Link>
        </div>
      </section>

      {/* Nouveautés */}
      <section className="section categories">
        <SectionTitle sub="TENDANCES" title="Nouveautés" />
        <ProductGrid products={newProducts} loading={loadingNew} error={errorNew} />
      </section>

      {/* Collections */}
      {!loadingCollections && collections.length > 0 && (
        <section className="section categories">
          <SectionTitle sub="DÉFILÉS" title="Nos Collections" />
          <div className="products container">
            {collections.map((col) => (
              <Link
                to="/collections"
                key={col.id}
                className="product"
                style={{ textDecoration: 'none', cursor: 'pointer' }}
              >
                <div className="top d-flex" style={{ position: 'relative' }}>
                  {col.cover_image ? (
                    <img src={col.cover_image} alt={col.name} loading="lazy" />
                  ) : (
                    <div style={{
                      width: '100%',
                      aspectRatio: '1',
                      background: 'linear-gradient(135deg, #C9A84C22, #C9A84C55)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '1rem',
                    }}>
                      <i className="bx bx-collection" style={{ fontSize: '4rem', color: '#C9A84C' }}></i>
                    </div>
                  )}
                  {col.is_featured && (
                    <span style={{
                      position: 'absolute', top: '1rem', left: '1rem',
                      background: '#C9A84C', color: '#fff',
                      padding: '0.3rem 0.8rem', borderRadius: '2rem',
                      fontSize: '1rem', fontWeight: '700',
                    }}>VEDETTE</span>
                  )}
                </div>
                <div className="bottom">
                  <h4 style={{ fontSize: '1.4rem' }}>{col.name}</h4>
                  <p style={{ fontSize: '1.2rem', color: 'var(--default-color)', lineHeight: '2rem' }}>
                    {col.description?.slice(0, 60)}…
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Bannière promo */}
      <section style={{
        background: 'linear-gradient(135deg, #0D0D0D 60%, #1a1a1a)',
        padding: '6rem 3rem',
        textAlign: 'center',
      }}>
        <div className="container">
          <span style={{ color: '#C9A84C', fontSize: '1.4rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            Golden Pousso
          </span>
          <h2 style={{ color: '#fff', fontSize: '3.6rem', margin: '1.5rem 0', fontFamily: 'Aclonica, sans-serif' }}>
            La Couture Africaine Autrement
          </h2>
          <p style={{ color: '#aaa', marginBottom: '3rem', maxWidth: '50rem', margin: '0 auto 3rem' }}>
            Découvrez notre sélection de boubous, chaussures, sacs et bijoux artisanaux — fabriqués à Dakar avec passion.
          </p>
          <Link to="/boutique" className="btn" style={{ background: '#C9A84C', color: '#fff' }}>
            Explorer la boutique
          </Link>
        </div>
      </section>

      {/* Sections statiques du template */}
      <NewArrival />
      <Statistics />
      <Blog />
    </>
  );
};

export default HomePage;
