import { useState } from 'react';
import { Link } from 'react-router-dom';

const C = {
  bg:     '#111111',
  bgBot:  '#0A0A0A',
  gold:   '#D4AF37',
  cream:  '#F5F0EB',
  muted:  '#9A9A9A',
  border: 'rgba(255,255,255,0.08)',
};

const Divider = () => (
  <div style={{ width: '3.6rem', height: '2px', background: C.gold, marginBottom: '2.4rem' }} />
);

const ColHeading = ({ children }) => (
  <>
    <h5 style={{
      fontSize: '1.3rem', letterSpacing: '0.18em', color: C.cream,
      textTransform: 'uppercase', fontFamily: 'Inter, sans-serif',
      fontWeight: 700, marginBottom: '1.2rem', lineHeight: 1,
    }}>
      {children}
    </h5>
    <Divider />
  </>
);

const FooterLink = ({ to, children }) => {
  const [hov, setHov] = useState(false);
  return (
    <Link
      to={to}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontSize: '1.35rem', color: hov ? C.gold : C.muted,
        textDecoration: 'none', display: 'block',
        padding: '0.55rem 0', fontFamily: 'Inter, sans-serif',
        transition: 'color 0.2s',
      }}
    >
      {children}
    </Link>
  );
};

const SocialBtn = ({ icon, label }) => {
  const [hov, setHov] = useState(false);
  return (
    <a
      href="#"
      aria-label={label}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '3.8rem', height: '3.8rem', borderRadius: '50%',
        border: hov ? `1px solid ${C.gold}` : '1px solid rgba(255,255,255,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: hov ? C.gold : C.muted, fontSize: '1.8rem',
        textDecoration: 'none',
        transition: 'border-color 0.25s, color 0.25s',
        flexShrink: 0,
      }}
    >
      <i className={`bx ${icon}`} />
    </a>
  );
};

const NewsletterForm = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    setSent(true);
  };

  return sent ? (
    <p style={{ fontSize: '1.3rem', color: C.gold, fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}>
      Merci ! Vous recevrez nos actualités bientôt.
    </p>
  ) : (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Votre adresse email"
        required
        style={{
          padding: '1.1rem 1.6rem',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '0.4rem',
          color: C.cream, fontSize: '1.3rem',
          fontFamily: 'Inter, sans-serif',
          outline: 'none',
          width: '100%',
          boxSizing: 'border-box',
        }}
        onFocus={e => e.target.style.borderColor = C.gold}
        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
      />
      <button
        type="submit"
        style={{
          padding: '1.1rem',
          background: C.gold, color: '#0A0A0A',
          border: 'none', borderRadius: '0.4rem',
          fontSize: '1.2rem', fontWeight: 700,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          fontFamily: 'Inter, sans-serif',
          cursor: 'pointer', transition: 'background 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#C2662D'}
        onMouseLeave={e => e.currentTarget.style.background = C.gold}
      >
        S'abonner
      </button>
    </form>
  );
};

const Footer = () => (
  <footer style={{ background: C.bg }}>

    {/* ── Grille principale ── */}
    <div style={{
      maxWidth: '120rem', margin: '0 auto',
      padding: '6rem 6rem 5rem',
      display: 'grid',
      gridTemplateColumns: '1.4fr 1fr 1.2fr',
      gap: '5rem',
    }} className="footer-grid">

      {/* Col 1 — À propos */}
      <div>
        <ColHeading>À Propos de Nous</ColHeading>
        <p style={{
          fontSize: '1.35rem', color: C.muted, lineHeight: '2.2rem',
          fontFamily: 'Inter, sans-serif', marginBottom: '2.8rem',
        }}>
          Golden Pousso est une maison de mode africaine fondée à Dakar, Sénégal.
          Chaque pièce est confectionnée à la main par nos artisans de Pikine,
          alliant couture traditionnelle et esthétique contemporaine.
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <SocialBtn icon="bxl-facebook"   label="Facebook" />
          <SocialBtn icon="bxl-instagram"  label="Instagram" />
          <SocialBtn icon="bxl-whatsapp"   label="WhatsApp" />
          <SocialBtn icon="bxl-tiktok"     label="TikTok" />
          <SocialBtn icon="bxl-youtube"    label="YouTube" />
        </div>
      </div>

      {/* Col 2 — Liens utiles */}
      <div>
        <ColHeading>Liens Utiles</ColHeading>
        <nav style={{ display: 'flex', flexDirection: 'column' }}>
          <FooterLink to="/">Accueil</FooterLink>
          <FooterLink to="/boutique">Boutique</FooterLink>
          <FooterLink to="/collections">Collections</FooterLink>
          <FooterLink to="/mon-compte">Mon Compte</FooterLink>
          <FooterLink to="/commande/suivi">Suivi de commande</FooterLink>
          <FooterLink to="/contact">Service Client</FooterLink>
        </nav>
      </div>

      {/* Col 3 — Newsletter */}
      <div>
        <ColHeading>S'abonner à notre Newsletter</ColHeading>
        <p style={{
          fontSize: '1.3rem', color: C.muted, lineHeight: '2rem',
          fontFamily: 'Inter, sans-serif', marginBottom: '2rem',
        }}>
          Entrez votre adresse email pour profiter de nos offres exclusives et nouveautés.
        </p>
        <NewsletterForm />
      </div>
    </div>

    {/* ── Barre bottom ── */}
    <div style={{ background: C.bgBot, borderTop: `1px solid ${C.border}` }}>
      <div style={{
        maxWidth: '120rem', margin: '0 auto',
        padding: '2rem 6rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '1.4rem',
      }} className="footer-bottom">

        <div style={{ display: 'flex', alignItems: 'center', gap: '2.4rem', flexWrap: 'wrap' }}>
          {[
            { to: '/a-propos', label: 'À Propos' },
            { to: '/boutique', label: 'Boutique' },
            { to: '/collections', label: 'Collections' },
            { to: '/contact', label: 'Contact' },
          ].map(({ to, label }) => (
            <Link key={to} to={to} style={{
              fontSize: '1.1rem', color: '#555', textDecoration: 'none',
              fontFamily: 'Inter, sans-serif', letterSpacing: '0.08em',
              textTransform: 'uppercase', transition: 'color 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.color = C.muted}
              onMouseLeave={e => e.currentTarget.style.color = '#555'}
            >
              {label}
            </Link>
          ))}
          <span style={{ fontSize: '1.1rem', color: '#444', fontFamily: 'Inter, sans-serif' }}>
            Copyright {new Date().getFullYear()} © Golden Pousso
          </span>
        </div>

        {/* Méthodes de paiement */}
        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
          {['VISA', 'WAVE', 'OM'].map(name => (
            <span key={name} style={{
              padding: '0.4rem 0.9rem',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '0.3rem',
              fontSize: '1rem', fontWeight: 700,
              color: C.muted, fontFamily: 'Inter, sans-serif',
              letterSpacing: '0.06em',
            }}>
              {name}
            </span>
          ))}
          <span style={{
            padding: '0.4rem 0.9rem',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '0.3rem',
            fontSize: '1rem', fontWeight: 700,
            color: C.muted, fontFamily: 'Inter, sans-serif',
            letterSpacing: '0.06em',
          }}>
            MASTERCARD
          </span>
        </div>
      </div>
    </div>

    <style>{`
      @media (max-width: 1024px) {
        .footer-grid { grid-template-columns: 1fr 1fr !important; padding: 5rem 3rem 4rem !important; }
        .footer-bottom { padding: 2rem 3rem !important; }
      }
      @media (max-width: 640px) {
        .footer-grid { grid-template-columns: 1fr !important; padding: 4rem 2rem 3rem !important; gap: 3.6rem !important; }
        .footer-bottom { flex-direction: column !important; align-items: flex-start !important; padding: 2rem !important; }
      }
    `}</style>
  </footer>
);

export default Footer;
