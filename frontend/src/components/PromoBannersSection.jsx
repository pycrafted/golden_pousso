import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const SLIDES = [
  {
    image: '/images/hero.jpg',
    eyebrow: 'Collection Prestige',
    title: 'ÉLÉGANCE\nAFRICAINE',
    cta: 'Découvrir la boutique',
    link: '/boutique',
  },
  {
    image: '/images/woman-in-cart.png',
    eyebrow: 'Prêt-à-Porter',
    title: 'TENUES\nAU FÉMININ',
    cta: 'Voir la boutique',
    link: '/boutique',
  },
];

const BANNERS = [
  {
    image: '/images/hero.jpg',
    eyebrow: 'Cérémonie & Gala',
    title: 'Robes de\nPrestige',
    cta: 'Je commande',
    link: '/boutique',
  },
  {
    image: '/images/woman-in-cart.png',
    eyebrow: 'Nouveautés',
    title: 'Collection\nFemme',
    cta: 'Découvrir',
    link: '/boutique',
  },
];

const INTERVAL = 5000;

const PromoBannersSection = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [arrowHovered, setArrowHovered] = useState(null);
  const [bannerHovered, setBannerHovered] = useState(null);
  const timerRef = useRef(null);

  const resetTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setActive(p => (p + 1) % SLIDES.length), INTERVAL);
  };

  useEffect(() => {
    if (!paused) resetTimer();
    else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [paused]);

  const goTo = (i) => { setActive(i); resetTimer(); };
  const prev = () => { setActive(p => (p - 1 + SLIDES.length) % SLIDES.length); resetTimer(); };
  const next = () => { setActive(p => (p + 1) % SLIDES.length); resetTimer(); };

  return (
    <div style={{
      display: 'flex',
      gap: '1.2rem',
      background: '#FAF6EE',
      padding: '1.2rem',
      height: '72vh',
      minHeight: '48rem',
      maxHeight: '75rem',
    }}
      className="promo-section"
    >

      {/* ── CAROUSEL GAUCHE ── */}
      <div
        style={{ flex: '0 0 72%', position: 'relative', overflow: 'hidden', cursor: 'pointer' }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onClick={() => navigate(SLIDES[active].link)}
      >
        {SLIDES.map((slide, i) => (
          <div key={i} style={{
            position: 'absolute', inset: 0,
            opacity: i === active ? 1 : 0,
            transition: 'opacity 0.9s ease',
            pointerEvents: i === active ? 'auto' : 'none',
          }}>
            <img src={slide.image} alt="" style={{
              width: '100%', height: '100%', objectFit: 'cover',
              transform: i === active ? 'scale(1.03)' : 'scale(1)',
              transition: 'transform 6s ease',
            }} />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(105deg, rgba(10,10,10,0.72) 0%, rgba(10,10,10,0.25) 55%, transparent 100%)',
            }} />

            {/* Texte */}
            <div style={{
              position: 'absolute', bottom: '14%', left: '7%',
              opacity: i === active ? 1 : 0,
              transform: i === active ? 'translateY(0)' : 'translateY(24px)',
              transition: 'opacity 0.7s ease 0.35s, transform 0.7s ease 0.35s',
            }}>
              <p style={{
                fontSize: '1rem', letterSpacing: '0.32em', color: '#D4AF37',
                textTransform: 'uppercase', marginBottom: '1.4rem',
                fontFamily: 'Inter, sans-serif',
              }}>
                {slide.eyebrow}
              </p>
              <h2 style={{
                fontFamily: 'Aclonica, sans-serif',
                fontSize: 'clamp(2.8rem, 4.5vw, 5.5rem)',
                lineHeight: 1.08, color: '#F5F0EB',
                marginBottom: '2.8rem', whiteSpace: 'pre-line',
              }}>
                {slide.title}
              </h2>
              <button
                onClick={e => { e.stopPropagation(); navigate(slide.link); }}
                style={{
                  padding: '1.2rem 3rem', background: '#D4AF37', color: '#0A0A0A',
                  border: 'none', fontSize: '1.05rem', fontWeight: 700,
                  letterSpacing: '0.15em', textTransform: 'uppercase',
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#C2662D'}
                onMouseLeave={e => e.currentTarget.style.background = '#D4AF37'}
              >
                {slide.cta}
              </button>
            </div>
          </div>
        ))}

        {/* Flèches */}
        {[
          { dir: 'prev', style: { left: '2rem' }, action: (e) => { e.stopPropagation(); prev(); } },
          { dir: 'next', style: { right: '2rem' }, action: (e) => { e.stopPropagation(); next(); } },
        ].map(({ dir, style: pos, action }) => (
          <button
            key={dir}
            onClick={action}
            onMouseEnter={() => setArrowHovered(dir)}
            onMouseLeave={() => setArrowHovered(null)}
            style={{
              position: 'absolute', top: '50%', transform: 'translateY(-50%)',
              ...pos,
              width: '4.4rem', height: '4.4rem', borderRadius: '50%',
              background: arrowHovered === dir ? 'rgba(212,175,55,0.9)' : 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.25)',
              color: arrowHovered === dir ? '#0A0A0A' : '#F5F0EB',
              fontSize: '1.4rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.25s',
              opacity: paused ? 1 : 0,
              pointerEvents: paused ? 'auto' : 'none',
            }}
          >
            {dir === 'prev' ? '‹' : '›'}
          </button>
        ))}

        {/* Dots */}
        <div style={{
          position: 'absolute', bottom: '2.8rem', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: '0.7rem', alignItems: 'center',
        }}>
          {SLIDES.map((_, i) => (
            <button key={i}
              onClick={e => { e.stopPropagation(); goTo(i); }}
              style={{
                width: i === active ? '2.2rem' : '0.7rem',
                height: '0.7rem', borderRadius: '0.35rem',
                background: i === active ? '#D4AF37' : 'rgba(255,255,255,0.35)',
                border: 'none', cursor: 'pointer', padding: 0,
                transition: 'all 0.35s ease',
              }}
            />
          ))}
        </div>

        {/* Barre de progression */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px',
          background: 'rgba(255,255,255,0.1)',
        }}>
          <div
            key={`${active}-${paused}`}
            style={{
              height: '100%', background: '#D4AF37',
              animation: paused ? 'none' : `progressBar ${INTERVAL}ms linear`,
            }}
          />
        </div>
      </div>

      {/* ── BANNIÈRES DROITE ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        {BANNERS.map((banner, i) => (
          <div key={i}
            onClick={() => navigate(banner.link)}
            onMouseEnter={() => setBannerHovered(i)}
            onMouseLeave={() => setBannerHovered(null)}
            style={{ flex: 1, position: 'relative', overflow: 'hidden', cursor: 'pointer' }}
          >
            <img src={banner.image} alt="" style={{
              width: '100%', height: '100%', objectFit: 'cover',
              transform: bannerHovered === i ? 'scale(1.06)' : 'scale(1)',
              transition: 'transform 0.6s ease',
            }} />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(10,10,10,0.82) 0%, rgba(10,10,10,0.15) 55%, transparent 100%)',
            }} />
            <div style={{
              position: 'absolute', bottom: '1.8rem', left: '1.8rem', color: '#F5F0EB',
              transform: bannerHovered === i ? 'translateY(-4px)' : 'translateY(0)',
              transition: 'transform 0.35s ease',
            }}>
              <p style={{
                fontSize: '0.75rem', letterSpacing: '0.25em', color: '#D4AF37',
                textTransform: 'uppercase', marginBottom: '0.5rem',
                fontFamily: 'Inter, sans-serif',
              }}>
                {banner.eyebrow}
              </p>
              <h3 style={{
                fontFamily: 'Aclonica, sans-serif',
                fontSize: 'clamp(1.4rem, 2vw, 2rem)',
                lineHeight: 1.2, marginBottom: '1.2rem',
                whiteSpace: 'pre-line',
              }}>
                {banner.title}
              </h3>
              <span style={{
                display: 'inline-block',
                padding: '0.65rem 1.8rem',
                background: bannerHovered === i ? '#C2662D' : '#D4AF37',
                color: '#0A0A0A',
                fontSize: '0.85rem', fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                fontFamily: 'Inter, sans-serif',
                transition: 'background 0.25s',
              }}>
                {banner.cta}
              </span>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes progressBar {
          from { width: 0% }
          to   { width: 100% }
        }
        @media (max-width: 768px) {
          .promo-section {
            flex-direction: column !important;
            height: auto !important;
            min-height: unset !important;
          }
          .promo-section > div:first-child {
            flex: none !important;
            height: 55vw !important;
            min-height: 28rem !important;
          }
          .promo-section > div:last-child {
            flex: none !important;
            flex-direction: row !important;
            height: 22rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PromoBannersSection;
