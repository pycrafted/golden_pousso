import { useState } from 'react';
import { Link } from 'react-router-dom';
const C = {
  dark: '#0A0A0A',
  gold: '#D4AF37',
  goldDim: '#C9A84C',
  cream: '#F5F0EB',
  muted: '#8A8A8A',
  border: 'rgba(255,255,255,0.06)',
};

const FooterLink = ({ to, children }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      to={to}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontSize: '1.4rem',
        color: hovered ? C.cream : C.muted,
        textDecoration: 'none',
        lineHeight: 1,
        padding: '0.6rem 0',
        display: 'block',
        transition: 'color 0.2s',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {children}
    </Link>
  );
};

const SocialIcon = ({ icon }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '4rem',
        height: '4rem',
        borderRadius: '50%',
        border: hovered ? `1px solid ${C.gold}` : '1px solid rgba(255,255,255,0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'border-color 0.25s, color 0.25s',
        color: hovered ? C.gold : C.muted,
        fontSize: '1.8rem',
      }}
    >
      <i className={`bx ${icon}`}></i>
    </div>
  );
};

const ColHeading = ({ children }) => (
  <h5 style={{
    fontSize: '1.1rem',
    letterSpacing: '0.22em',
    color: C.muted,
    textTransform: 'uppercase',
    fontFamily: 'Inter, sans-serif',
    fontWeight: 600,
    marginBottom: '2.5rem',
    lineHeight: 1,
  }}>
    {children}
  </h5>
);

const Footer = () => {
  return (
    <footer style={{ background: C.dark, padding: '0 0 3rem' }}>

      {/* 1. Main footer grid — 4 columns */}
      <div style={{
        maxWidth: '120rem',
        padding: '0 6rem',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '4rem',
        marginBottom: '5rem',
      }}
        className="footer-main-grid"
      >
        {/* Col 1 — Brand */}
        <div>
          <span style={{
            fontFamily: 'Aclonica, sans-serif',
            fontSize: '1.8rem',
            letterSpacing: '0.04em',
            background: 'linear-gradient(90deg, #D4AF37, #F0D060, #C9A84C)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            display: 'block',
            marginBottom: '2rem',
            userSelect: 'none',
          }}>
            Golden Pousso
          </span>
          <p style={{
            fontSize: '1.4rem',
            color: C.muted,
            lineHeight: '2.4rem',
            fontFamily: 'Inter, sans-serif',
            marginBottom: '2.5rem',
          }}>
            Maison de mode africaine fondée à Dakar, Sénégal. Chaque pièce est confectionnée avec soin par nos artisans de Pikine.
          </p>
        </div>

        {/* Col 2 — Navigation */}
        <div>
          <ColHeading>Découvrir</ColHeading>
          <nav style={{ display: 'flex', flexDirection: 'column' }}>
            <FooterLink to="/">Accueil</FooterLink>
            <FooterLink to="/boutique">Boutique</FooterLink>
            <FooterLink to="/collections">Collections</FooterLink>
            <FooterLink to="/boutique?ordering=-created_at">Nouveautés</FooterLink>
            <FooterLink to="/a-propos">À propos</FooterLink>
          </nav>
        </div>

        {/* Col 3 — Service */}
        <div>
          <ColHeading>Aide & Service</ColHeading>
          <nav style={{ display: 'flex', flexDirection: 'column' }}>
            <FooterLink to="/contact">Contact</FooterLink>
            <FooterLink to="/mon-compte">Mon Compte</FooterLink>
            <FooterLink to="/commande/suivi">Suivi de commande</FooterLink>
            <FooterLink to="/guide-tailles">Tailles & Mesures</FooterLink>
            <FooterLink to="/livraison-retours">Livraison & Retours</FooterLink>
            <FooterLink to="/faq">FAQ</FooterLink>
          </nav>
        </div>

        {/* Col 4 — Contact */}
        <div>
          <ColHeading>Nous Trouver</ColHeading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
            <p style={{ fontSize: '1.4rem', color: C.muted, lineHeight: '2.2rem', fontFamily: 'Inter, sans-serif' }}>
              Pikine Tally Boumack, Tableau Gazelle N.2372, Dakar, Sénégal
            </p>
            <p style={{ fontSize: '1.4rem', color: C.muted, lineHeight: '2.2rem', fontFamily: 'Inter, sans-serif' }}>
              33 834 10 17 · 78 126 35 35
            </p>
            <p style={{ fontSize: '1.4rem', color: C.muted, lineHeight: '2.2rem', fontFamily: 'Inter, sans-serif' }}>
              Lun – Sam · 9h00 – 19h00
            </p>

            <p style={{
              fontSize: '1.2rem',
              color: C.gold,
              letterSpacing: '0.08em',
              fontFamily: 'Inter, sans-serif',
              marginTop: '0.5rem',
            }}>
              Commandes sur WhatsApp
            </p>
          </div>
        </div>
      </div>

      {/* 3. Bottom bar */}
      <div style={{
        maxWidth: '120rem',
        padding: '2rem 6rem',
        margin: '0 auto',
        borderTop: `1px solid ${C.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <p style={{
          fontSize: '1.25rem',
          color: '#444',
          fontFamily: 'Inter, sans-serif',
          lineHeight: '2rem',
        }}>
          © 2025 Golden Pousso. Tous droits réservés. Maison de mode · Dakar, Sénégal
        </p>
        <p style={{
          fontSize: '1.25rem',
          color: '#555',
          fontFamily: 'Inter, sans-serif',
          lineHeight: '2rem',
        }}>
          Conçu avec ✦ à Dakar
        </p>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 1024px) {
          .footer-main-grid {
            grid-template-columns: 1fr 1fr !important;
            padding: 0 3rem !important;
          }
          .footer-newsletter-grid {
            grid-template-columns: 1fr !important;
            padding: 0 3rem !important;
          }
        }
        @media (max-width: 600px) {
          .footer-main-grid {
            grid-template-columns: 1fr !important;
            padding: 0 2rem !important;
          }
          .footer-newsletter-grid {
            padding: 0 2rem !important;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;
