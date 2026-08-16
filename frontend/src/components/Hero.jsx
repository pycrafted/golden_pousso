import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { getCachedImageUrl, setCachedImageUrl } from '../utils/imageCache';

// Affichée tant que le propriétaire n'a pas encore mis en ligne de bannière (Espace Gestion → Contenu du site).
const FALLBACK_HERO_IMAGE = '/images/test.jpg';

const Hero = () => {
  const navigate = useNavigate();
  const [mobile, setMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [primaryHovered, setPrimaryHovered] = useState(false);
  const [heroImage, setHeroImage] = useState(() => getCachedImageUrl('hero_banner') || FALLBACK_HERO_IMAGE);

  // Affiche la version en cache instantanément, puis vérifie en arrière-plan si l'image a changé.
  useEffect(() => {
    apiClient.get('/hero-banner/')
      .then(({ data }) => {
        if (!data.image_url) return;
        setCachedImageUrl('hero_banner', data.image_url);
        setHeroImage(data.image_url);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const check = () => setMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  if (mobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#000000' }}>
        <div style={{ position: 'relative', height: '40vh', overflow: 'hidden', flexShrink: 0 }}>
          <img
            src={heroImage}
            alt=""
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'center top',
            }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, transparent 50%, #000000 100%)',
          }} />
        </div>

        <div style={{
          flex: 1, padding: '3.5rem 3rem 5rem',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          alignItems: 'flex-start', textAlign: 'left',
        }}>
          <p style={{
            fontSize: '1rem', letterSpacing: '0.35em', color: '#B8960A',
            textTransform: 'uppercase', marginBottom: '2rem',
            fontFamily: 'Inter, sans-serif', lineHeight: 1,
            opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s',
          }}>
            SAVOIR FAIRE SÉNÉGALAIS
          </p>

          <h1 style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 'clamp(5.5rem, 14vw, 8rem)',
            lineHeight: 1.05, color: '#FAF6EE', marginBottom: '0',
            opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.8s ease 0.2s, transform 0.8s ease 0.2s',
          }}>
            <span style={{ display: 'block' }}>Golden</span>
            <span style={{ display: 'block' }}>P<span style={{ color: '#B8960A' }}>o</span>usso</span>
          </h1>

          <div style={{
            width: '4rem', height: '1px', background: '#B8960A', margin: '2.5rem 0',
            opacity: mounted ? 1 : 0, transition: 'opacity 0.7s ease 0.4s',
          }} />

          <p style={{
            fontSize: '1.1rem', letterSpacing: '0.22em', color: 'rgba(250,246,238,0.6)',
            textTransform: 'uppercase', fontFamily: 'Inter, sans-serif', lineHeight: 1,
            opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(10px)',
            transition: 'opacity 0.7s ease 0.45s, transform 0.7s ease 0.45s',
          }}>
            PORTEZ VOTRE CULTURE AVEC FIERTÉ
          </p>

          <div style={{
            marginTop: '3.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem',
            alignItems: 'flex-start',
            opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(14px)',
            transition: 'opacity 0.7s ease 0.55s, transform 0.7s ease 0.55s',
          }}>
            <button onClick={() => navigate('/recherche')}
              style={{ padding: '1.4rem 3.5rem', background: primaryHovered ? '#C2662D' : '#B8960A', color: primaryHovered ? '#FAF6EE' : '#1A1208', border: 'none', fontSize: '1.2rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.25s', fontFamily: 'Inter, sans-serif' }}
              onMouseEnter={() => setPrimaryHovered(true)} onMouseLeave={() => setPrimaryHovered(false)}
            >
              Découvrir la boutique
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Desktop layout
  return (
    <div style={{ display: 'flex', height: '100vh', minHeight: '60rem' }}>

      {/* Left panel */}
      <div style={{
        width: '55%',
        background: '#000000',
        padding: '6rem',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'flex-start',
        position: 'relative',
      }}>
        <p style={{
          fontSize: '1.1rem', letterSpacing: '0.35em', color: '#B8960A',
          textTransform: 'uppercase', marginBottom: '3rem',
          fontFamily: 'Inter, sans-serif', lineHeight: 1,
          opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s',
        }}>
          SAVOIR FAIRE SÉNÉGALAIS
        </p>

        <h1 style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 'clamp(7rem, 11vw, 12rem)',
          lineHeight: 1.0, color: '#FAF6EE', letterSpacing: '-0.01em',
          opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.9s ease 0.2s, transform 0.9s ease 0.2s',
        }}>
          <span style={{ display: 'block' }}>Golden</span>
          <span style={{ display: 'block' }}>P<span style={{ color: '#B8960A' }}>o</span>usso</span>
        </h1>

        <div style={{
          width: '4rem', height: '1px', background: '#B8960A', margin: '3rem 0',
          opacity: mounted ? 1 : 0, transition: 'opacity 0.7s ease 0.45s',
        }} />

        <p style={{
          fontSize: '1.2rem', letterSpacing: '0.22em', color: 'rgba(250,246,238,0.6)',
          textTransform: 'uppercase', fontFamily: 'Inter, sans-serif', lineHeight: 1,
          opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(10px)',
          transition: 'opacity 0.7s ease 0.5s, transform 0.7s ease 0.5s',
        }}>
          PORTEZ VOTRE CULTURE AVEC FIERTÉ
        </p>

        <div style={{
          marginTop: '4rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap',
          opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(14px)',
          transition: 'opacity 0.7s ease 0.6s, transform 0.7s ease 0.6s',
        }}>
          <button onClick={() => navigate('/recherche')}
            style={{ padding: '1.4rem 3.5rem', background: primaryHovered ? '#C2662D' : '#B8960A', color: primaryHovered ? '#FAF6EE' : '#1A1208', border: 'none', fontSize: '1.2rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.25s', fontFamily: 'Inter, sans-serif' }}
            onMouseEnter={() => setPrimaryHovered(true)} onMouseLeave={() => setPrimaryHovered(false)}
          >
            Découvrir la boutique
          </button>
        </div>
      </div>

      {/* Right panel — image statique */}
      <div style={{ width: '45%', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        <img
          src={heroImage}
          alt="Tenue de cérémonie Golden Pousso — mode africaine haut de gamme, Dakar"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'center top',
          }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, #000000 0%, transparent 25%)',
          pointerEvents: 'none',
        }} />
      </div>

    </div>
  );
};

export default Hero;
