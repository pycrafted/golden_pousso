import { useState, useRef, useEffect } from 'react';

const useInView = () => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1, rootMargin: '-100px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
};

const LookbookImage = ({ label, style }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        borderRadius: '2px',
        background: hovered ? '#1A1A1A' : '#161616',
        border: `1px solid ${hovered ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.08)'}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.3s ease, border-color 0.3s ease',
        ...style,
      }}
    >
      <span style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: '1.3rem',
        textTransform: 'uppercase',
        letterSpacing: '0.2em',
        color: hovered ? '#D4AF37' : 'rgba(255,255,255,0.25)',
        transition: 'color 0.3s ease',
      }}>
        {label}
      </span>
    </div>
  );
};

const LookbookSection = () => {
  const [ref, visible] = useInView();
  return (
    <section style={{ padding: '8rem 0', background: '#0D0D0D' }}>
      <div className="container">
        {/* En-tête */}
        <div style={{
          marginBottom: '4rem',
          opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '1.5rem' }}>
            <div style={{ width: '5rem', height: '1px', background: '#D4AF37' }} />
            <p style={{ fontSize: '1.2rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.3em', color: '#D4AF37' }}>
              Lookbook
            </p>
          </div>
          <h2 style={{
            fontFamily: 'Aclonica, serif',
            fontSize: 'clamp(3rem, 5vw, 5.5rem)',
            color: '#F5F0EB',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}>
            L&apos;Art de la Silhouette
          </h2>
        </div>

        {/* Grille asymétrique */}
        <div
          ref={ref}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gridAutoRows: '280px',
            gap: '1.2rem',
            opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(30px)',
            transition: 'opacity 0.8s ease 0.2s, transform 0.8s ease 0.2s',
          }}
        >
          {/* Grande image gauche — mise en avant */}
          <LookbookImage label="Image 1" style={{ gridColumn: '1 / 7', gridRow: '1 / 3' }} />
          {/* Droite — 2x2 réduit */}
          <LookbookImage label="Image 2" style={{ gridColumn: '7 / 10', gridRow: '1 / 2' }} />
          <LookbookImage label="Image 3" style={{ gridColumn: '10 / 13', gridRow: '1 / 2' }} />
          <LookbookImage label="Image 4" style={{ gridColumn: '7 / 10', gridRow: '2 / 3' }} />
          <LookbookImage label="Image 5" style={{ gridColumn: '10 / 13', gridRow: '2 / 3' }} />
        </div>
      </div>
    </section>
  );
};

export default LookbookSection;
