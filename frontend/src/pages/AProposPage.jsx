import { useRef, useState, useEffect } from 'react';
import SEOHead from '../components/SEOHead';

/* ── Palette ── */
const C = {
  bg:        '#FAF6EE',
  panel:     '#F0E8D8',
  border:    '#E0D0B8',
  borderMid: '#CEC0A0',
  gold:      '#B8960A',
  terra:     '#C2662D',
  cream:     '#1A1208',
  muted:     '#7A6A50',
};

/* ── useInView ── */
const useInView = (options = {}) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.08, rootMargin: '-60px', ...options }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []); // eslint-disable-line
  return [ref, visible];
};


/* ── Page ── */
const AProposPage = () => {
  const [heroRef, heroVisible] = useInView();
  const [histRef, histVisible] = useInView();

  return (
    <>
      <SEOHead
        title="À propos"
        description="Découvrez l'histoire de Golden Pousso — salon de couture africaine haut de gamme basé à Pikine, Dakar. Savoir-faire, passion, authenticité."
        url="/a-propos"
      />

      <div style={{ background: C.bg, minHeight: '100vh', color: C.cream }}>

        {/* ══════════════════════════════════
            HERO
        ══════════════════════════════════ */}
        <section style={{ padding: '10rem 4rem 0', maxWidth: '110rem', margin: '0 auto' }}>

          {/* Titre hero */}
          <div ref={heroRef} style={{
            opacity: heroVisible ? 1 : 0,
            transform: heroVisible ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.8s ease, transform 0.8s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.6rem', marginBottom: '3rem' }}>
              <div style={{ width: '4.8rem', height: '1px', background: C.gold }} />
              <p style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.3em', color: C.gold }}>
                Notre maison
              </p>
            </div>
            <h1 style={{
              fontFamily: 'Aclonica, serif',
              fontSize: 'clamp(4rem, 7vw, 7.2rem)',
              color: C.cream,
              letterSpacing: '0.04em',
              lineHeight: 1.05,
              textTransform: 'uppercase',
              marginBottom: '3rem',
            }}>
              La couture africaine<br />
              <span style={{ color: C.gold }}>autrement</span>
            </h1>
          </div>
        </section>

        {/* ══════════════════════════════════
            HISTOIRE — texte + image
        ══════════════════════════════════ */}
        <section style={{ padding: '10rem 4rem', maxWidth: '110rem', margin: '0 auto' }}>
          <div
            ref={histRef}
            className="ap-histoire-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10rem',
              alignItems: 'center',
              opacity: histVisible ? 1 : 0,
              transform: histVisible ? 'translateY(0)' : 'translateY(30px)',
              transition: 'opacity 0.9s ease, transform 0.9s ease',
            }}
          >
            {/* Texte */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.6rem', marginBottom: '4rem' }}>
                <div style={{ width: '4rem', height: '1px', background: C.gold }} />
                <p style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.3em', color: C.gold }}>
                  Notre histoire
                </p>
              </div>
              <h2 style={{
                fontFamily: 'Aclonica, serif',
                fontSize: 'clamp(2.8rem, 3.5vw, 4.2rem)',
                color: C.cream, lineHeight: 1.1, marginBottom: '3rem',
              }}>
                Née d'une passion,<br />forgée par le talent
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <p style={{ fontSize: '1.4rem', fontFamily: 'Inter, sans-serif', color: C.muted, lineHeight: 1.85 }}>
                  Golden Pousso a vu le jour dans l'atelier familial de Pikine Tally Boumack, au cœur du Sénégal. Fondée sur l'amour des tissus nobles et la maîtrise des techniques de coupe ancestrales, la maison s'est rapidement imposée comme une référence de la mode africaine haut de gamme à Dakar.
                </p>
                <p style={{ fontSize: '1.4rem', fontFamily: 'Inter, sans-serif', color: C.muted, lineHeight: 1.85 }}>
                  Ce qui a débuté comme un atelier de quartier est aujourd'hui une maison reconnue pour l'excellence de ses créations — boubous africains, bijoux, sacs et chaussures — portées et portés lors des grandes occasions à travers tout le Sénégal et la diaspora.
                </p>
                <p style={{ fontSize: '1.4rem', fontFamily: 'Inter, sans-serif', color: C.muted, lineHeight: 1.85 }}>
                  Notre mission reste intacte : <em style={{ color: C.cream, fontStyle: 'normal' }}>rendre la culture africaine visible, élégante et accessible</em>, sans jamais sacrifier la qualité artisanale qui fait notre identité.
                </p>
              </div>
            </div>

            {/* Image */}
            <div style={{ position: 'relative' }}>
              <div style={{
                aspectRatio: '4/5',
                background: '#E8DCC8',
                overflow: 'hidden',
              }}>
                <img
                  src="/images/test.jpg"
                  alt="Atelier Golden Pousso — Pikine, Dakar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(250,246,238,0.5) 0%, transparent 60%)',
                  pointerEvents: 'none',
                }} />
              </div>
              {/* Badge flottant */}
              <div style={{
                position: 'absolute', bottom: '-2rem', left: '-2rem',
                background: C.gold, color: '#0A0A0A',
                padding: '2rem 2.8rem',
              }}>
                <p style={{ fontFamily: 'Aclonica, serif', fontSize: '2.8rem', lineHeight: 1, marginBottom: '0.4rem' }}>
                  2012
                </p>
                <p style={{ fontSize: '1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 600 }}>
                  Fondation
                </p>
              </div>
            </div>
          </div>
        </section>


      </div>

      <style>{`
        @keyframes ap-line { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        .ap-line { animation: ap-line 1s ease 0.4s both; transform-origin: left; }
        @media (max-width: 960px) {
          .ap-histoire-grid { grid-template-columns: 1fr !important; gap: 6rem !important; }
        }
      `}</style>
    </>
  );
};

export default AProposPage;
