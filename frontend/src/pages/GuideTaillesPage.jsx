import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';

const C = {
  bg:        '#0A0A0A',
  panel:     '#111111',
  border:    '#1E1E1E',
  borderMid: '#2A2A2A',
  gold:      '#D4AF37',
  terra:     '#C2662D',
  cream:     '#F5F0EB',
  muted:     '#8A8A8A',
};

const useInView = () => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.08, rootMargin: '-40px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
};

/* ── Données tailles ── */
const BOUBOUS_HOMMES = [
  { taille: 'S',   poitrine: '86–90',  epaules: '42',  hauteur: '165–170' },
  { taille: 'M',   poitrine: '90–96',  epaules: '44',  hauteur: '170–175' },
  { taille: 'L',   poitrine: '96–102', epaules: '46',  hauteur: '175–180' },
  { taille: 'XL',  poitrine: '102–108',epaules: '48',  hauteur: '178–183' },
  { taille: 'XXL', poitrine: '108–116',epaules: '50',  hauteur: '180–185' },
  { taille: '3XL', poitrine: '116–124',epaules: '52',  hauteur: '182–188' },
];

const BOUBOUS_FEMMES = [
  { taille: 'XS', poitrine: '78–82',  taille_cm: '60–64', hanches: '84–88',  hauteur: '158–163' },
  { taille: 'S',  poitrine: '82–86',  taille_cm: '64–68', hanches: '88–92',  hauteur: '160–165' },
  { taille: 'M',  poitrine: '86–92',  taille_cm: '68–74', hanches: '92–98',  hauteur: '163–168' },
  { taille: 'L',  poitrine: '92–98',  taille_cm: '74–80', hanches: '98–104', hauteur: '165–170' },
  { taille: 'XL', poitrine: '98–106', taille_cm: '80–88', hanches: '104–112',hauteur: '168–173' },
  { taille: 'XXL',poitrine: '106–114',taille_cm: '88–96', hanches: '112–120',hauteur: '170–175' },
];

const CHAUSSURES = [
  { eu: '36', uk: '3',  us: '5.5', cm: '22.5' },
  { eu: '37', uk: '4',  us: '6.5', cm: '23.5' },
  { eu: '38', uk: '5',  us: '7',   cm: '24'   },
  { eu: '39', uk: '6',  us: '8',   cm: '24.5' },
  { eu: '40', uk: '6.5',us: '8.5', cm: '25'   },
  { eu: '41', uk: '7',  us: '9',   cm: '25.5' },
  { eu: '42', uk: '8',  us: '10',  cm: '26.5' },
  { eu: '43', uk: '9',  us: '11',  cm: '27'   },
  { eu: '44', uk: '9.5',us: '11.5',cm: '28'   },
  { eu: '45', uk: '10.5',us:'12',  cm: '29'   },
];

const CONSEILS = [
  { titre: 'Prendre ses mesures', texte: 'Utilisez un mètre ruban souple. Tenez-vous droit, les bras le long du corps. Pour la poitrine, mesurez à l\'endroit le plus large. Pour la taille, mesurez à l\'endroit le plus fin.' },
  { titre: 'Quelle taille choisir ?', texte: 'En cas de doute entre deux tailles, choisissez la taille supérieure. Les boubous et tenues africaines ont une coupe ample pensée pour le confort. Un retouche est toujours possible en boutique.' },
  { titre: 'Sur-mesure', texte: 'Tous nos modèles sont réalisables en sur-mesure. Contactez-nous avec vos mensurations exactes (poitrine, taille, hanches, hauteur) et nous créerons votre pièce unique.' },
  { titre: 'Retouches', texte: 'Votre commande ne vous va pas parfaitement ? Nous proposons des retouches gratuites sur les pièces achetées en boutique, et des retouches payantes sur les commandes en ligne.' },
];

/* ── Tableau générique ── */
const Table = ({ headers, rows, keys }) => (
  <div style={{ overflowX: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter, sans-serif' }}>
      <thead>
        <tr>
          {headers.map((h) => (
            <th key={h} style={{
              padding: '1.4rem 2rem',
              background: '#0D0D0D',
              borderBottom: `1px solid ${C.borderMid}`,
              fontSize: '1rem', textTransform: 'uppercase',
              letterSpacing: '0.2em', color: C.gold,
              textAlign: 'left', whiteSpace: 'nowrap',
              fontWeight: 600,
            }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr
            key={i}
            style={{ borderBottom: `1px solid ${C.border}`, transition: 'background 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(212,175,55,0.03)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            {keys.map((k, j) => (
              <td key={k} style={{
                padding: '1.4rem 2rem',
                fontSize: '1.35rem',
                color: j === 0 ? C.cream : C.muted,
                fontWeight: j === 0 ? 600 : 400,
                whiteSpace: 'nowrap',
              }}>
                {row[k]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/* ── Section ── */
const Section = ({ titre, label, children }) => {
  const [ref, visible] = useInView();
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.7s ease, transform 0.7s ease',
        marginBottom: '7rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.6rem', marginBottom: '3rem' }}>
        <div style={{ width: '4rem', height: '1px', background: C.gold }} />
        <p style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.3em', color: C.gold }}>
          {label}
        </p>
      </div>
      <h2 style={{
        fontFamily: 'Aclonica, serif',
        fontSize: 'clamp(2.2rem, 3vw, 3.2rem)',
        color: C.cream, marginBottom: '3rem', lineHeight: 1.1,
      }}>
        {titre}
      </h2>
      <div style={{ background: C.panel, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
};

/* ── Page ── */
const GuideTaillesPage = () => {
  const [heroRef, heroVisible] = useInView();

  return (
    <>
      <SEOHead
        title="Guide des tailles"
        description="Guide des tailles Golden Pousso — boubous hommes & femmes, chaussures, accessoires. Tableau complet en cm."
        url="/guide-tailles"
      />

      <div style={{ background: C.bg, minHeight: '100vh', color: C.cream }}>

        {/* Hero */}
        <section style={{ padding: '14rem 4rem 0', maxWidth: '140rem', margin: '0 auto' }}>
          <nav aria-label="Fil d'Ariane" style={{ marginBottom: '4rem' }}>
            <ol style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', listStyle: 'none', padding: 0, margin: 0 }}>
              {[{ label: 'Accueil', to: '/' }, { label: 'Guide des tailles' }].map((crumb, i) => (
                <li key={crumb.label} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  {i > 0 && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(138,138,138,0.35)" strokeWidth="1.5"><polyline points="9 18 15 12 9 6"/></svg>}
                  {crumb.to
                    ? <Link to={crumb.to} style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.2em', color: C.muted, textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = C.cream} onMouseLeave={(e) => e.currentTarget.style.color = C.muted}>{crumb.label}</Link>
                    : <span style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.2em', color: C.gold }}>{crumb.label}</span>
                  }
                </li>
              ))}
            </ol>
          </nav>

          <div ref={heroRef} style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(24px)', transition: 'opacity 0.8s ease, transform 0.8s ease', marginBottom: '6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.6rem', marginBottom: '3rem' }}>
              <div style={{ width: '4.8rem', height: '1px', background: C.gold }} />
              <p style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.3em', color: C.gold }}>Tailles & Mesures</p>
            </div>
            <h1 style={{ fontFamily: 'Aclonica, serif', fontSize: 'clamp(3.5rem, 6vw, 6rem)', color: C.cream, letterSpacing: '0.02em', lineHeight: 1.05, textTransform: 'uppercase', marginBottom: '2.4rem' }}>
              Guide des tailles
            </h1>
            <p style={{ fontSize: '1.45rem', fontFamily: 'Inter, sans-serif', color: C.muted, lineHeight: 1.8, maxWidth: '60rem' }}>
              Toutes les mesures sont en centimètres. En cas de doute, optez pour la taille supérieure — nos pièces sont taillées pour le confort. Le sur-mesure est disponible sur demande.
            </p>
          </div>
          <div style={{ height: '1px', background: C.border }} />
        </section>

        {/* Corps */}
        <div style={{ padding: '8rem 4rem 10rem', maxWidth: '140rem', margin: '0 auto' }}>

          {/* Boubous Femmes */}
          <Section titre="Boubous & tenues femme" label="Femmes">
            <Table
              headers={['Taille', 'Poitrine (cm)', 'Tour de taille (cm)', 'Hanches (cm)', 'Hauteur (cm)']}
              rows={BOUBOUS_FEMMES}
              keys={['taille', 'poitrine', 'taille_cm', 'hanches', 'hauteur']}
            />
          </Section>

          {/* Boubous Hommes */}
          <Section titre="Boubous & tenues homme" label="Hommes">
            <Table
              headers={['Taille', 'Poitrine (cm)', 'Épaules (cm)', 'Hauteur (cm)']}
              rows={BOUBOUS_HOMMES}
              keys={['taille', 'poitrine', 'epaules', 'hauteur']}
            />
          </Section>

          {/* Chaussures */}
          <Section titre="Chaussures & sandales" label="Pointures">
            <Table
              headers={['EU', 'UK', 'US', 'Longueur pied (cm)']}
              rows={CHAUSSURES}
              keys={['eu', 'uk', 'us', 'cm']}
            />
          </Section>

          {/* Conseils */}
          <div style={{ marginBottom: '4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.6rem', marginBottom: '3rem' }}>
              <div style={{ width: '4rem', height: '1px', background: C.gold }} />
              <p style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.3em', color: C.gold }}>
                Conseils
              </p>
            </div>
            <div className="gt-conseils-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
              {CONSEILS.map((c, i) => (
                <div key={c.titre} style={{
                  background: C.panel, border: `1px solid ${C.border}`,
                  padding: '3rem', transition: 'border-color 0.25s',
                }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = C.border}
                >
                  <p style={{ fontSize: '1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.2em', color: C.gold, marginBottom: '1.2rem' }}>
                    0{i + 1}
                  </p>
                  <h3 style={{ fontFamily: 'Aclonica, serif', fontSize: '1.8rem', color: C.cream, marginBottom: '1.2rem' }}>
                    {c.titre}
                  </h3>
                  <p style={{ fontSize: '1.35rem', fontFamily: 'Inter, sans-serif', color: C.muted, lineHeight: 1.75 }}>
                    {c.texte}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA sur-mesure */}
          <div style={{
            background: C.panel, border: `1px solid ${C.borderMid}`,
            padding: '5rem', display: 'flex',
            alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '3rem',
          }}>
            <div>
              <p style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.3em', color: C.gold, marginBottom: '1.2rem' }}>
                Vous n'avez pas trouvé votre taille ?
              </p>
              <h2 style={{ fontFamily: 'Aclonica, serif', fontSize: 'clamp(2.2rem, 3vw, 3.2rem)', color: C.cream, lineHeight: 1.1 }}>
                Commandez sur-mesure
              </h2>
            </div>
            <Link
              to="/contact"
              style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '1.7rem 5rem',
                background: C.gold, color: '#0A0A0A',
                fontSize: '1.1rem', fontFamily: 'Inter, sans-serif',
                fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
                textDecoration: 'none', flexShrink: 0,
                transition: 'background 0.25s, color 0.25s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = C.terra; e.currentTarget.style.color = C.cream; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = C.gold; e.currentTarget.style.color = '#0A0A0A'; }}
            >
              Nous contacter →
            </Link>
          </div>

        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .gt-conseils-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
};

export default GuideTaillesPage;
