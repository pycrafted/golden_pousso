import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';

const C = {
  bg:        '#1A1208',
  panel:     '#111111',
  border:    '#1E1E1E',
  borderMid: '#2A2A2A',
  gold:      '#B8960A',
  terra:     '#C2662D',
  cream:     '#FAF6EE',
  muted:     'rgba(250,246,238,0.6)',
};

const LINKS = [
  { to: '/',          label: 'Accueil' },
  { to: '/contact',   label: 'Contact' },
];

const Page404 = () => (
  <>
    <SEOHead title="Page introuvable" url="/404" noindex />

    <div style={{
      background: C.bg, minHeight: '100vh', color: C.cream,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '4rem 2rem', textAlign: 'center',
    }}>

      {/* Numéro 404 */}
      <p style={{
        fontFamily: 'Syne, sans-serif',
        fontSize: 'clamp(10rem, 20vw, 18rem)',
        lineHeight: 1,
        letterSpacing: '-0.04em',
        background: `linear-gradient(180deg, rgba(184,150,10,0.15) 0%, rgba(184,150,10,0.03) 100%)`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        marginBottom: '0',
        userSelect: 'none',
      }}>
        404
      </p>

      {/* Ornement */}
      <span style={{ fontSize: '1.6rem', color: C.gold, letterSpacing: '0.5em', marginBottom: '3rem' }}>✦ ✦ ✦</span>

      <h1 style={{
        fontFamily: 'Syne, sans-serif',
        fontSize: 'clamp(2.4rem, 4vw, 4rem)',
        color: C.cream, letterSpacing: '-0.01em',
        lineHeight: 1.1, marginBottom: '1.6rem',
      }}>
        Page introuvable
      </h1>

      <p style={{
        fontSize: '1.4rem', fontFamily: 'Inter, sans-serif',
        color: C.muted, lineHeight: 1.8,
        maxWidth: '44rem', marginBottom: '5rem',
      }}>
        La page que vous cherchez n'existe pas ou a été déplacée. Explorez notre boutique ou retournez à l'accueil.
      </p>

      {/* CTA principal */}
      <div style={{ display: 'flex', gap: '1.6rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '6rem' }}>
        <Link
          to="/recherche"
          style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '1.6rem 5rem',
            background: C.gold, color: '#1A1208',
            fontSize: '1.1rem', fontFamily: 'Inter, sans-serif',
            fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
            textDecoration: 'none', transition: 'background 0.25s, color 0.25s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = C.terra; e.currentTarget.style.color = C.cream; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = C.gold; e.currentTarget.style.color = '#1A1208'; }}
        >
          Voir la boutique
        </Link>
        <Link
          to="/"
          style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '1.6rem 4rem',
            background: 'transparent', color: C.muted,
            border: `1px solid ${C.borderMid}`,
            fontSize: '1.1rem', fontFamily: 'Inter, sans-serif',
            letterSpacing: '0.2em', textTransform: 'uppercase',
            textDecoration: 'none', transition: 'border-color 0.2s, color 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.borderMid; e.currentTarget.style.color = C.muted; }}
        >
          Accueil
        </Link>
      </div>

      {/* Liens rapides */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0',
        borderTop: `1px solid ${C.border}`, paddingTop: '3rem',
        flexWrap: 'wrap', justifyContent: 'center', gap: '3rem',
      }}>
        {LINKS.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            style={{
              fontSize: '1.1rem', fontFamily: 'Inter, sans-serif',
              textTransform: 'uppercase', letterSpacing: '0.2em',
              color: C.muted, textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = C.cream}
            onMouseLeave={(e) => e.currentTarget.style.color = C.muted}
          >
            {label}
          </Link>
        ))}
      </div>

    </div>
  </>
);

export default Page404;
