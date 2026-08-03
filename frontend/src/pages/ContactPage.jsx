import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
const useInView = () => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.08, rootMargin: '-50px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
};

/* ── Données de contact ── */
const INFO = [
  {
    label: 'Adresse',
    value: 'Pikine Tally Boumack\nTableau Gazelle N.2372, Dakar, Sénégal',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
      </svg>
    ),
  },
  {
    label: 'Téléphone',
    value: '33 834 10 17  ·  78 126 35 35',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.9 11.1a19.79 19.79 0 01-3.07-8.67A2 2 0 012.81 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.09 7.91a16 16 0 006 6l.97-.97a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
      </svg>
    ),
  },
  {
    label: 'Email',
    value: 'contact@goldenpousso.sn',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
  },
  {
    label: 'Horaires',
    value: 'Lundi – Samedi : 9h00 – 19h00',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
  },
];

/* ── Réseaux sociaux ── */
const SOCIALS = [
  {
    label: 'Facebook',
    href: '#',
    icon: <i className="bx bxl-facebook" style={{ fontSize: '2rem', lineHeight: 1 }} />,
  },
  {
    label: 'Instagram',
    href: '#',
    icon: <i className="bx bxl-instagram" style={{ fontSize: '2rem', lineHeight: 1 }} />,
  },
  {
    label: 'WhatsApp',
    href: '#',
    icon: <i className="bx bxl-whatsapp" style={{ fontSize: '2rem', lineHeight: 1 }} />,
  },
  {
    label: 'TikTok',
    href: '#',
    icon: <i className="bx bxl-tiktok" style={{ fontSize: '2rem', lineHeight: 1 }} />,
  },
];

/* ── Page ── */
const ContactPage = () => {
  const [heroRef, heroVisible] = useInView();
  const [bodyRef, bodyVisible] = useInView();

  return (
    <>
      <SEOHead
        title="Contact"
        description="Contactez Golden Pousso — atelier à Pikine Tally Boumack, Dakar. Téléphone, email, horaires et localisation."
        url="/contact"
      />

      <div style={{ background: C.bg, minHeight: '100vh', color: C.cream }}>

        {/* ══════════════════════════════════
            HERO
        ══════════════════════════════════ */}
        <section style={{ padding: '10rem 4rem 0', maxWidth: '110rem', margin: '0 auto' }}>

          {/* Titre */}
          <div
            ref={heroRef}
            style={{
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? 'translateY(0)' : 'translateY(24px)',
              transition: 'opacity 0.8s ease, transform 0.8s ease',
              textAlign: 'center',
              marginBottom: '5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.6rem', marginBottom: '3rem' }}>
              <div style={{ width: '4.8rem', height: '1px', background: C.gold }} />
              <p style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.3em', color: C.gold }}>
                Nous trouver
              </p>
              <div style={{ width: '4.8rem', height: '1px', background: C.gold }} />
            </div>
            <h1 style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 'clamp(4rem, 7vw, 7.2rem)',
              color: C.cream,
              letterSpacing: '0.04em',
              lineHeight: 1.05,
              textTransform: 'uppercase',
              marginBottom: '2.4rem',
            }}>
              Notre atelier
            </h1>
            <p style={{
              fontSize: '1.45rem', fontFamily: 'Inter, sans-serif',
              color: C.muted, lineHeight: 1.8,
              maxWidth: '52rem', margin: '0 auto',
            }}>
              Pikine Tally Boumack, Dakar — ouvert du lundi au samedi de 9h à 19h.
            </p>
          </div>

          {/* Ligne décorative */}
          <div className="ct-line" style={{ height: '1px', background: C.border }} />
        </section>

        {/* ══════════════════════════════════
            CORPS — infos + carte
        ══════════════════════════════════ */}
        <div style={{ padding: '8rem 4rem 14rem', maxWidth: '110rem', margin: '0 auto' }}>
          <div
            ref={bodyRef}
            className="ct-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10rem',
              alignItems: 'center',
              opacity: bodyVisible ? 1 : 0,
              transform: bodyVisible ? 'translateY(0)' : 'translateY(24px)',
              transition: 'opacity 0.8s ease, transform 0.8s ease',
            }}
          >

            {/* ══ Informations ══ */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.6rem', marginBottom: '4.5rem' }}>
                <div style={{ width: '4rem', height: '1px', background: C.gold }} />
                <p style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.3em', color: C.gold }}>
                  Coordonnées
                </p>
              </div>

              <h2 style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 'clamp(2.8rem, 3.5vw, 4.2rem)',
                color: C.cream, lineHeight: 1.1, marginBottom: '4.5rem',
              }}>
                Pikine, Dakar<br />
                <span style={{ color: C.gold }}>Sénégal</span>
              </h2>

              {/* Info items — grille 2 colonnes */}
              <div className="ct-info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0' }}>
                {INFO.map(({ label, value, icon }, i) => (
                  <div
                    key={label}
                    style={{
                      display: 'flex', gap: '1.6rem', alignItems: 'flex-start',
                      padding: '2.4rem 2rem 2.4rem 0',
                      borderBottom: `1px solid ${C.border}`,
                      borderRight: i % 2 === 0 ? `1px solid ${C.border}` : 'none',
                      paddingRight: i % 2 === 0 ? '2.4rem' : '0',
                      paddingLeft: i % 2 === 1 ? '2.4rem' : '0',
                    }}
                  >
                    <span style={{ color: C.gold, flexShrink: 0, marginTop: '0.2rem' }}>{icon}</span>
                    <div>
                      <p style={{ fontSize: '0.95rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.2em', color: C.muted, marginBottom: '0.6rem' }}>
                        {label}
                      </p>
                      <p style={{ fontSize: '1.4rem', fontFamily: 'Inter, sans-serif', color: C.cream, lineHeight: 1.65, whiteSpace: 'pre-line' }}>
                        {value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Réseaux sociaux */}
              <div style={{ marginTop: '5rem' }}>
                <p style={{ fontSize: '0.95rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.2em', color: C.muted, marginBottom: '2rem' }}>
                  Suivez-nous
                </p>
                <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap' }}>
                  {SOCIALS.map(({ label, href, icon }) => (
                    <a
                      key={label}
                      href={href}
                      title={label}
                      style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '5rem', height: '5rem',
                        border: `1px solid ${C.borderMid}`,
                        color: C.muted, textDecoration: 'none',
                        transition: 'border-color 0.2s, color 0.2s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.borderMid; e.currentTarget.style.color = C.muted; }}
                    >
                      {icon}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* ══ Carte + lien à propos ══ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.4rem' }}>

              {/* Google Maps */}
              <div style={{ border: `1px solid ${C.border}`, overflow: 'hidden' }}>
                <div style={{ height: '3px', background: `linear-gradient(to right, ${C.gold}, transparent)` }} />
                <iframe
                  title="Localisation Golden Pousso — Pikine Dakar"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15430.756!2d-17.3917!3d14.7645!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xec10d5a8a5fffff%3A0x0!2sPikine%2C%20Dakar%2C%20S%C3%A9n%C3%A9gal!5e0!3m2!1sfr!2ssn!4v1700000000000"
                  width="100%"
                  height="420"
                  style={{ border: 0, display: 'block' }}
                  allowFullScreen
                  loading="lazy"
                />
                <div style={{ padding: '1.6rem 2rem', background: '#EAE0CC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.15em', color: C.muted }}>
                    Pikine · Dakar · Sénégal
                  </span>
                  <span style={{ color: C.gold }}>✦</span>
                </div>
              </div>

              {/* CTA en savoir plus */}
              <Link
                to="/a-propos"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '1rem',
                  padding: '1.6rem 3.5rem',
                  background: 'transparent', color: C.muted,
                  border: `1px solid ${C.borderMid}`,
                  fontSize: '1.1rem', fontFamily: 'Inter, sans-serif',
                  textTransform: 'uppercase', letterSpacing: '0.2em',
                  textDecoration: 'none', alignSelf: 'flex-start',
                  transition: 'border-color 0.2s, color 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.borderMid; e.currentTarget.style.color = C.muted; }}
              >
                En savoir plus sur Golden Pousso →
              </Link>
            </div>

          </div>
        </div>

      </div>

      <style>{`
        @keyframes ct-line { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        .ct-line { animation: ct-line 0.9s ease 0.3s both; transform-origin: center; }
        @media (max-width: 960px) {
          .ct-grid { grid-template-columns: 1fr !important; gap: 6rem !important; }
          .ct-grid > div:last-child { position: static !important; }
        }
        @media (max-width: 540px) {
          .ct-info-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
};

export default ContactPage;
