import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import apiClient from '../api/client';

const CollectionsPage = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null); // { images: [], index: 0 }

  useEffect(() => {
    apiClient.get('/collections/')
      .then((r) => setCollections(r.data.results ?? r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const featured = collections.find((c) => c.is_featured);
  const others = collections.filter((c) => !c.is_featured);

  const openLightbox = (col) => {
    const images = col.products
      ?.flatMap((p) => p.images ?? [])
      .filter((img) => img?.image);
    if (images?.length) setLightbox({ title: col.name, images, index: 0 });
  };

  const CollectionCard = ({ col, large = false }) => (
    <div style={{
      background: '#fff',
      borderRadius: '1.5rem',
      overflow: 'hidden',
      boxShadow: 'var(--box-shadow-1)',
      display: large ? 'grid' : 'block',
      gridTemplateColumns: large ? '1fr 1fr' : undefined,
    }}>
      {/* Image */}
      <div style={{
        aspectRatio: large ? '4/3' : '1',
        background: 'linear-gradient(135deg, #C9A84C22, #C9A84C44)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', position: 'relative',
      }}>
        {col.cover_image ? (
          <img src={col.cover_image} alt={col.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy" />
        ) : (
          <i className="bx bx-collection" style={{ fontSize: large ? '8rem' : '5rem', color: '#C9A84C' }}></i>
        )}
        {col.is_featured && (
          <span style={{
            position: 'absolute', top: '1.5rem', left: '1.5rem',
            background: '#C9A84C', color: '#fff',
            padding: '0.4rem 1.2rem', borderRadius: '2rem',
            fontSize: '1.2rem', fontWeight: 700,
          }}>VEDETTE</span>
        )}
      </div>

      {/* Texte */}
      <div style={{ padding: large ? '4rem' : '2rem' }}>
        <p style={{ color: '#C9A84C', fontSize: '1.3rem', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
          {new Date(col.date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })}
        </p>
        <h2 style={{ fontSize: large ? '3rem' : '2rem', marginBottom: '1.5rem', lineHeight: 1.2 }}>{col.name}</h2>
        <p style={{ color: 'var(--default-color)', lineHeight: '2.8rem', marginBottom: '2rem' }}>
          {large ? col.description : col.description?.slice(0, 100) + '…'}
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link
            to={`/boutique?collection=${col.slug}`}
            className="btn"
            style={{ background: '#C9A84C', color: '#fff' }}
          >
            Voir les produits
          </Link>
          {col.products?.some((p) => p.images?.length > 0) && (
            <button
              className="btn"
              onClick={() => openLightbox(col)}
              style={{ background: 'transparent', border: '2px solid #C9A84C', color: '#C9A84C' }}
            >
              <i className="bx bx-images" style={{ marginRight: '0.5rem' }}></i>
              Galerie photos
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <section className="section">
      <SEOHead title="Collections" description="Explorez les collections exclusives Golden Pousso — chaque saison, une nouvelle vision de l'élégance africaine." url="/collections" />
      {/* En-tête */}
      <div style={{
        background: 'linear-gradient(135deg, #0D0D0D 60%, #1a1200)',
        padding: '8rem 3rem',
        textAlign: 'center',
        marginBottom: '5rem',
      }}>
        <span style={{ color: '#C9A84C', fontSize: '1.4rem', letterSpacing: '0.2em' }}>GOLDEN POUSSO</span>
        <h1 style={{ color: '#fff', fontSize: '4rem', fontFamily: 'Aclonica, sans-serif', margin: '1.5rem 0' }}>
          Nos Collections
        </h1>
        <p style={{ color: '#aaa', maxWidth: '50rem', margin: '0 auto' }}>
          Chaque collection est une célébration de l'artisanat africain, mêlant tradition et modernité.
        </p>
      </div>

      <div className="container">
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3rem' }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{
                height: '30rem', background: '#f0f0f0', borderRadius: '1.5rem',
                animation: 'shimmer 1.4s infinite',
              }} />
            ))}
          </div>
        ) : collections.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--default-color)', padding: '6rem' }}>
            Aucune collection disponible pour le moment.
          </p>
        ) : (
          <>
            {/* Collection vedette en grand format */}
            {featured && (
              <div style={{ marginBottom: '5rem' }}>
                <CollectionCard col={featured} large />
              </div>
            )}

            {/* Grille des autres collections */}
            {others.length > 0 && (
              <>
                <div className="title">
                  <span>DÉFILÉS</span>
                  <h2>Toutes les Collections</h2>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(30rem, 1fr))',
                  gap: '3rem',
                  marginTop: '3rem',
                }}>
                  {others.map((col) => <CollectionCard key={col.id} col={col} />)}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* ── Lightbox ── */}
      {lightbox && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)',
          zIndex: 9999, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          {/* Fermer */}
          <button onClick={() => setLightbox(null)} style={{
            position: 'fixed', top: '2rem', right: '2rem',
            background: 'rgba(255,255,255,0.15)', color: '#fff',
            width: '4.5rem', height: '4.5rem', borderRadius: '50%',
            cursor: 'pointer', fontSize: '2.2rem',
          }}>
            <i className="bx bx-x"></i>
          </button>

          <p style={{ color: '#C9A84C', marginBottom: '1.5rem', letterSpacing: '0.1em' }}>{lightbox.title}</p>

          {/* Image principale */}
          <img
            src={lightbox.images[lightbox.index].image}
            alt=""
            style={{ maxWidth: '80vw', maxHeight: '70vh', objectFit: 'contain', borderRadius: '1rem' }}
          />

          {/* Compteur */}
          <p style={{ color: '#888', marginTop: '1rem', fontSize: '1.4rem' }}>
            {lightbox.index + 1} / {lightbox.images.length}
          </p>

          {/* Navigation */}
          <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem' }}>
            <button
              onClick={() => setLightbox((l) => ({ ...l, index: (l.index - 1 + l.images.length) % l.images.length }))}
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '1rem 2rem', borderRadius: '0.8rem', cursor: 'pointer', fontSize: '1.6rem' }}>
              <i className="bx bx-chevron-left"></i> Précédent
            </button>
            <button
              onClick={() => setLightbox((l) => ({ ...l, index: (l.index + 1) % l.images.length }))}
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '1rem 2rem', borderRadius: '0.8rem', cursor: 'pointer', fontSize: '1.6rem' }}>
              Suivant <i className="bx bx-chevron-right"></i>
            </button>
          </div>

          {/* Miniatures */}
          {lightbox.images.length > 1 && (
            <div style={{ display: 'flex', gap: '0.8rem', marginTop: '2rem', overflowX: 'auto', maxWidth: '80vw', padding: '0.5rem' }}>
              {lightbox.images.map((img, i) => (
                <img key={i} src={img.image} alt=""
                  onClick={() => setLightbox((l) => ({ ...l, index: i }))}
                  style={{
                    width: '6rem', height: '6rem', objectFit: 'cover',
                    borderRadius: '0.5rem', cursor: 'pointer', flexShrink: 0,
                    border: lightbox.index === i ? '2px solid #C9A84C' : '2px solid transparent',
                    opacity: lightbox.index === i ? 1 : 0.6,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default CollectionsPage;
