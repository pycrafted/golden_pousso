import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Hero from '../components/Hero';
import CategoryTeaser from '../components/CategoryTeaser';
import SkeletonCard from '../components/SkeletonCard';
import SEOHead from '../components/SEOHead';
import CategoryGrid from '../components/CategoryGrid';
import NewsletterSection from '../components/NewsletterSection';
import apiClient from '../api/client';
import useSettingsStore, { formatPrice } from '../store/settingsStore';

/* ── Card produit — copie exacte du style "regarde" ── */
const HomeProductCard = ({ product }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const outOfStock = product.stock === 0;
  const currency = useSettingsStore((s) => s.currency);

  return (
    /* Tout le card se soulève au hover, comme dans regarde */
    <div
      onClick={() => !outOfStock && navigate(`/produit/${product.slug}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: outOfStock ? 'default' : 'pointer',
        opacity: outOfStock ? 0.55 : 1,
        transform: hovered && !outOfStock ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'transform 0.3s ease',
      }}
    >
      {/* Zone image — aspect 3/4, bg sombre, rounded-sm */}
      <div style={{
        position: 'relative',
        aspectRatio: '3/4',
        overflow: 'hidden',
        marginBottom: '1.6rem',
        background: '#E8DCC8',
        borderRadius: '2px',
      }}>
        {/* Image A — zoom si pas de secondaire, swap sinon */}
        {product.primary_image ? (
          <img src={product.primary_image} alt={product.name} loading="lazy"
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
              opacity: hovered && product.secondary_image ? 0 : 1,
              transform: hovered && !product.secondary_image ? 'scale(1.08)' : 'scale(1)',
              transition: 'opacity 0.7s ease, transform 0.7s ease',
            }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '1.1rem', color: '#7A6A50', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Photo bientôt</span>
          </div>
        )}
        {/* Image B */}
        {product.secondary_image && (
          <img src={product.secondary_image} alt={product.name} loading="lazy"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: hovered ? 1 : 0, transition: 'opacity 0.7s ease' }} />
        )}

        {/* Bouton "Ajouter" slide-up — identique regarde */}
        <button
          onClick={e => { e.stopPropagation(); if (!outOfStock) navigate(`/produit/${product.slug}`); }}
          style={{
            position: 'absolute', bottom: '1.6rem', left: '1.6rem', right: '1.6rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            background: '#B8960A', color: '#FAF6EE',
            border: 'none', borderRadius: '2px',
            padding: '1.2rem',
            fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', fontWeight: 600,
            letterSpacing: '0.2em', textTransform: 'uppercase',
            cursor: 'pointer',
            opacity: hovered && !outOfStock ? 1 : 0,
            transform: hovered && !outOfStock ? 'translateY(0)' : 'translateY(10px)',
            transition: 'opacity 0.25s ease, transform 0.25s ease, background 0.2s ease, color 0.2s ease',
            zIndex: 2,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#C2662D'; e.currentTarget.style.color = '#1A1208'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#B8960A'; e.currentTarget.style.color = '#FAF6EE'; }}
        >
          + Ajouter
        </button>
      </div>

      {/* Texte — copie exacte regarde */}
      <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.4rem', fontWeight: 500, color: '#1A1208', marginBottom: '0.4rem' }}>
        {product.name}
      </h3>

      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.4rem', color: '#B8960A' }}>
        {formatPrice(product.price, currency)}
      </p>
    </div>
  );
};

/* ── useInView ── */
const useInView = () => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1, rootMargin: '-60px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
};

/* ── Sur Mesure ── */
const SurMesureSection = () => {
  const [ref, visible] = useInView();
  const [atelierImageUrl, setAtelierImageUrl] = useState(null);

  useEffect(() => {
    apiClient.get('/atelier-image/').then((r) => {
      if (r.data.image_url) setAtelierImageUrl(r.data.image_url);
    }).catch(() => {});
  }, []);

  const STEPS = [
    { num: '01', title: 'Consultation', desc: 'Vous décrivez, on écoute.' },
    { num: '02', title: 'Mesures', desc: 'En boutique ou vous nous envoyez vos mesures.' },
    { num: '03', title: 'Création', desc: 'Confection dans notre atelier.' },
    { num: '04', title: 'Livraison', desc: 'En boutique ou livré à Dakar et Thiès.' },
  ];

  return (
    <section style={{ background: '#FAF6EE', borderTop: '1px solid #FAF6EE', overflow: 'hidden' }}>
      <div style={{ maxWidth: '110rem', margin: '0 auto', padding: '0 4rem' }}>
      <div ref={ref} style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', gap: '6rem',
        opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'opacity 0.9s ease, transform 0.9s ease',
      }} className="sur-mesure-grid">

        {/* Gauche — texte + étapes */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: '3.2rem' }}>

          {/* Eyebrow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.6rem' }}>
            <div style={{ width: '3.2rem', height: '1px', background: '#B8960A', flexShrink: 0 }} />
            <p style={{ fontSize: '1.3rem', fontFamily: 'Aclonica, sans-serif', textTransform: 'uppercase', letterSpacing: '0.35em', color: '#B8960A' }}>
              Atelier Golden Pousso
            </p>
          </div>

          {/* Accroche */}
          <p style={{ fontSize: '1.7rem', fontFamily: 'Aclonica, sans-serif', color: '#7A6A50', lineHeight: 1.85, borderLeft: '2px solid #E0D0B8', paddingLeft: '2rem' }}>
            Des stylistes qualifiés donnent vie à vos imaginations — tissus soigneusement sélectionnés, finitions impeccables, chaque pièce taillée à votre mesure.
          </p>

          {/* Séparateur */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
            <div style={{ flex: 1, height: '1px', background: '#E0D0B8' }} />
            <span style={{ fontSize: '1.3rem', fontFamily: 'Aclonica, sans-serif', textTransform: 'uppercase', letterSpacing: '0.25em', color: '#B8960A' }}>Comment ça marche</span>
            <div style={{ flex: 1, height: '1px', background: '#E0D0B8' }} />
          </div>

          {/* Étapes */}
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
            {STEPS.map((step, i) => (
              <li key={step.num} style={{
                display: 'flex', gap: '1.2rem', alignItems: 'baseline',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateX(0)' : 'translateX(16px)',
                transition: `opacity 0.5s ease ${0.1 * i + 0.3}s, transform 0.5s ease ${0.1 * i + 0.3}s`,
              }}>
                <span style={{ color: '#B8960A', fontSize: '1.3rem', flexShrink: 0 }}>—</span>
                <p style={{ fontSize: '1.6rem', fontFamily: 'Aclonica, sans-serif', color: '#3A3028', lineHeight: 1.6 }}>
                  <strong style={{ color: '#1A1208' }}>{step.title} :</strong> {step.desc}
                </p>
              </li>
            ))}
          </ul>

        </div>

        {/* Droite — image */}
        {atelierImageUrl && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '42rem' }}>
              <img
                src={atelierImageUrl}
                alt="Tenue sur mesure Golden Pousso"
                style={{
                  width: '100%',
                  aspectRatio: '4 / 5',
                  objectFit: 'cover',
                  objectPosition: 'center top',
                  display: 'block',
                  border: '1px solid #E0D0B8',
                }}
              />
              {/* Cadre décoratif décalé */}
              <div style={{
                position: 'absolute',
                inset: '-1rem',
                border: '1px solid rgba(184,150,10,0.25)',
                pointerEvents: 'none',
                zIndex: -1,
              }} />
            </div>
          </div>
        )}
      </div>
      </div>
      <style>{`@media (max-width: 900px) { .sur-mesure-grid { grid-template-columns: 1fr !important; } }`}</style>
    </section>
  );
};

/* ── Page ── */
const HomePage = () => {
  const [newProducts, setNewProducts] = useState([]);
  const [loadingNew, setLoadingNew] = useState(true);
  const [sectionRef, sectionVisible] = useInView();

  useEffect(() => {
    apiClient.get('/products/new/').then((r) => setNewProducts(r.data)).catch(() => {}).finally(() => setLoadingNew(false));
  }, []);

  return (
    <>
      <SEOHead url="/" />

      {/* ── 1. HERO ── */}
      <Hero />

      {/* ── 2. CATÉGORIES — 4 cartes éditoriales ── */}
      <CategoryTeaser />

      {/* ── 3. NOS PRODUITS ── */}
      <CategoryGrid />

      {/* ── 4. ATELIER ── */}
      <SurMesureSection />

      {/* ── 5. NOUVEAUTÉS ── */}
      <section id="collection" style={{ padding: '0', background: '#FAF6EE' }}>
        <div className="container">

          {/* En-tête */}
          <div ref={sectionRef} style={{
            marginBottom: '5rem',
            opacity: sectionVisible ? 1 : 0, transform: sectionVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.8s ease, transform 0.8s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2.4rem' }}>
              <div style={{ width: '4.8rem', height: '1px', background: '#B8960A' }} />
              <p style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.3em', color: '#B8960A' }}>
                Nouveautés
              </p>
            </div>

          </div>

          {/* Grille 4 colonnes */}
          {loadingNew ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2.4rem' }} className="products-grid">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div
              style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2.4rem' }}
              className="products-grid"
            >
              {newProducts.slice(0, 4).map((p, i) => (
                <div
                  key={p.id}
                  style={{
                    opacity: sectionVisible ? 1 : 0,
                    transform: sectionVisible ? 'translateY(0)' : 'translateY(20px)',
                    transition: `opacity 0.5s ease ${0.1 * i + 0.3}s, transform 0.5s ease ${0.1 * i + 0.3}s`,
                  }}
                >
                  <HomeProductCard product={p} />
                </div>
              ))}
            </div>
          )}
        </div>
        <style>{`
          @media (max-width: 1023px) { .products-grid { grid-template-columns: repeat(2, 1fr) !important; } }
          @media (max-width: 479px)  { .products-grid { grid-template-columns: repeat(1, 1fr) !important; } }
        `}</style>
      </section>

      {/* ── 6. NEWSLETTER ── */}
      <NewsletterSection />

    </>
  );
};


export default HomePage;
