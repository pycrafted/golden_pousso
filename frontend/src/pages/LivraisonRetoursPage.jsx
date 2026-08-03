import { useRef, useState, useEffect } from 'react';
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

const ZONES = [
  { zone: 'Dakar Centre',          frais: '1 500 FCFA', delai: '24h',       icone: '🏙️' },
  { zone: 'Dakar Banlieue / Pikine', frais: '1 000 FCFA', delai: '24h',     icone: '🏘️' },
  { zone: 'Thiès et environs',     frais: '3 000 FCFA', delai: '2–3 jours', icone: '🚌' },
  { zone: 'Retrait en boutique',   frais: 'Gratuit',    delai: 'Immédiat',  icone: '📍' },
];

const ETAPES_LIVRAISON = [
  { num: '01', titre: 'Commande passée',      texte: 'Votre commande est enregistrée et un numéro de suivi vous est communiqué immédiatement.' },
  { num: '02', titre: 'Confirmation',          texte: 'Notre équipe confirme votre commande et vérifie la disponibilité sous 2h en jours ouvrés.' },
  { num: '03', titre: 'Préparation',           texte: 'Votre pièce est soigneusement préparée, vérifiée et emballée dans notre atelier de Pikine.' },
  { num: '04', titre: 'Livraison',             texte: 'Le livreur vous contacte avant le passage. Vous pouvez suivre votre commande en temps réel.' },
];

const RETOURS_INFO = [
  {
    titre: 'Délai de retour',
    texte: '14 jours à compter de la réception de votre commande pour effectuer une demande de retour.',
    icone: '📅',
  },
  {
    titre: 'État du produit',
    texte: 'L\'article doit être non porté, non lavé, avec toutes ses étiquettes d\'origine attachées.',
    icone: '✅',
  },
  {
    titre: 'Procédure',
    texte: 'Contactez-nous par WhatsApp ou email avec votre numéro de commande. Nous vous guidons pour le retour.',
    icone: '📱',
  },
  {
    titre: 'Remboursement',
    texte: 'Le remboursement est effectué sous 5 jours ouvrés après réception et vérification de l\'article retourné.',
    icone: '💰',
  },
];

const Card = ({ children, style = {} }) => (
  <div style={{
    background: C.panel,
    border: `1px solid ${C.border}`,
    padding: '3rem',
    transition: 'border-color 0.25s',
    ...style,
  }}
    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(184,150,10,0.25)'}
    onMouseLeave={(e) => e.currentTarget.style.borderColor = C.border}
  >
    {children}
  </div>
);

const LivraisonRetoursPage = () => {
  const [heroRef, heroVisible]       = useInView();
  const [zonesRef, zonesVisible]     = useInView();
  const [etapesRef, etapesVisible]   = useInView();
  const [retoursRef, retoursVisible] = useInView();

  return (
    <>
      <SEOHead
        title="Livraison & Retours"
        description="Informations de livraison et retours Golden Pousso. Zones Dakar, Thiès, retrait boutique. Délais, frais et procédure de retour."
        url="/livraison-retours"
      />

      <div style={{ background: C.bg, minHeight: '100vh', color: C.cream }}>

        {/* ── Hero ── */}
        <section style={{ padding: '14rem 4rem 0', maxWidth: '140rem', margin: '0 auto' }}>
          <nav aria-label="Fil d'Ariane" style={{ marginBottom: '4rem' }}>
            <ol style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', listStyle: 'none', padding: 0, margin: 0 }}>
              {[{ label: 'Accueil', to: '/' }, { label: 'Livraison & Retours' }].map((crumb, i) => (
                <li key={crumb.label} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  {i > 0 && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(138,138,138,0.35)" strokeWidth="1.5"><polyline points="9 18 15 12 9 6"/></svg>}
                  {crumb.to
                    ? <Link to={crumb.to} style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.2em', color: C.muted, textDecoration: 'none' }} onMouseEnter={(e) => e.currentTarget.style.color = C.cream} onMouseLeave={(e) => e.currentTarget.style.color = C.muted}>{crumb.label}</Link>
                    : <span style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.2em', color: C.gold }}>{crumb.label}</span>
                  }
                </li>
              ))}
            </ol>
          </nav>

          <div ref={heroRef} style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(24px)', transition: 'opacity 0.8s ease, transform 0.8s ease', marginBottom: '6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.6rem', marginBottom: '3rem' }}>
              <div style={{ width: '4.8rem', height: '1px', background: C.gold }} />
              <p style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.3em', color: C.gold }}>Service client</p>
            </div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(3.5rem, 6vw, 6rem)', color: C.cream, letterSpacing: '0.02em', lineHeight: 1.05, textTransform: 'uppercase', marginBottom: '2.4rem' }}>
              Livraison &amp; Retours
            </h1>
            <p style={{ fontSize: '1.45rem', fontFamily: 'Inter, sans-serif', color: C.muted, lineHeight: 1.8, maxWidth: '60rem' }}>
              Nous livrons à Dakar et Thiès. Chaque commande est soigneusement préparée dans notre atelier de Pikine avant expédition.
            </p>
          </div>
          <div style={{ height: '1px', background: C.border }} />
        </section>

        <div style={{ padding: '8rem 4rem 10rem', maxWidth: '140rem', margin: '0 auto' }}>

          {/* ── Zones & frais ── */}
          <div ref={zonesRef} style={{ marginBottom: '8rem', opacity: zonesVisible ? 1 : 0, transform: zonesVisible ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.8s ease, transform 0.8s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.6rem', marginBottom: '1.6rem' }}>
              <div style={{ width: '4rem', height: '1px', background: C.gold }} />
              <p style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.3em', color: C.gold }}>Zones de livraison</p>
            </div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(2.2rem, 3vw, 3.2rem)', color: C.cream, marginBottom: '4rem', lineHeight: 1.1 }}>
              Frais et délais
            </h2>

            <div className="lr-zones-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem' }}>
              {ZONES.map((z, i) => (
                <Card key={z.zone} style={{ textAlign: 'center', opacity: zonesVisible ? 1 : 0, transform: zonesVisible ? 'translateY(0)' : 'translateY(20px)', transition: `opacity 0.5s ease ${i * 0.1}s, transform 0.5s ease ${i * 0.1}s` }}>
                  <span style={{ fontSize: '3rem', display: 'block', marginBottom: '2rem' }}>{z.icone}</span>
                  <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.4rem', fontWeight: 600, color: C.cream, marginBottom: '1.6rem', lineHeight: 1.3 }}>{z.zone}</h3>
                  <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '2.2rem', color: C.gold, marginBottom: '0.8rem' }}>{z.frais}</p>
                  <p style={{ fontSize: '1.2rem', fontFamily: 'Inter, sans-serif', color: C.muted, textTransform: 'uppercase', letterSpacing: '0.15em' }}>⏱ {z.delai}</p>
                </Card>
              ))}
            </div>

            {/* Note */}
            <p style={{ marginTop: '2.4rem', fontSize: '1.2rem', fontFamily: 'Inter, sans-serif', color: '#555', lineHeight: 1.7 }}>
              * Les délais sont estimés en jours ouvrés à partir de la confirmation de la commande. Ils peuvent varier selon la disponibilité du livreur.
            </p>
          </div>

          {/* ── Étapes de livraison ── */}
          <div ref={etapesRef} style={{ marginBottom: '8rem', opacity: etapesVisible ? 1 : 0, transform: etapesVisible ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.8s ease, transform 0.8s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.6rem', marginBottom: '1.6rem' }}>
              <div style={{ width: '4rem', height: '1px', background: C.gold }} />
              <p style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.3em', color: C.gold }}>Processus</p>
            </div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(2.2rem, 3vw, 3.2rem)', color: C.cream, marginBottom: '4rem', lineHeight: 1.1 }}>
              Comment ça fonctionne
            </h2>

            <div className="lr-etapes-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem', position: 'relative' }}>
              {/* Ligne de connexion */}
              <div className="lr-connector" style={{
                position: 'absolute', top: '4rem', left: '12.5%', right: '12.5%',
                height: '1px', background: `linear-gradient(to right, ${C.gold}, transparent)`,
                zIndex: 0,
              }} />
              {ETAPES_LIVRAISON.map((e, i) => (
                <div key={e.num} style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                  <div style={{
                    width: '7rem', height: '7rem', borderRadius: '50%',
                    background: 'rgba(184,150,10,0.08)',
                    border: `1px solid rgba(184,150,10,0.3)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 2.4rem',
                  }}>
                    <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.8rem', color: C.gold }}>{e.num}</span>
                  </div>
                  <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.4rem', fontWeight: 600, color: C.cream, marginBottom: '1.2rem' }}>{e.titre}</h3>
                  <p style={{ fontSize: '1.3rem', fontFamily: 'Inter, sans-serif', color: C.muted, lineHeight: 1.7 }}>{e.texte}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Retours ── */}
          <div ref={retoursRef} style={{ marginBottom: '6rem', opacity: retoursVisible ? 1 : 0, transform: retoursVisible ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.8s ease, transform 0.8s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.6rem', marginBottom: '1.6rem' }}>
              <div style={{ width: '4rem', height: '1px', background: C.gold }} />
              <p style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.3em', color: C.gold }}>Politique de retour</p>
            </div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(2.2rem, 3vw, 3.2rem)', color: C.cream, marginBottom: '4rem', lineHeight: 1.1 }}>
              Retours & échanges
            </h2>

            <div className="lr-retours-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem', marginBottom: '4rem' }}>
              {RETOURS_INFO.map((r) => (
                <Card key={r.titre}>
                  <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '2.4rem', flexShrink: 0 }}>{r.icone}</span>
                    <div>
                      <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.5rem', fontWeight: 600, color: C.cream, marginBottom: '0.8rem' }}>{r.titre}</h3>
                      <p style={{ fontSize: '1.35rem', fontFamily: 'Inter, sans-serif', color: C.muted, lineHeight: 1.75 }}>{r.texte}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Exceptions */}
            <div style={{ background: 'rgba(194,102,45,0.06)', border: `1px solid rgba(194,102,45,0.25)`, padding: '2.8rem 3rem' }}>
              <p style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.2em', color: C.terra, marginBottom: '1.2rem' }}>
                ⚠ Articles non retournables
              </p>
              <p style={{ fontSize: '1.35rem', fontFamily: 'Inter, sans-serif', color: C.muted, lineHeight: 1.75 }}>
                Les articles sur-mesure, les bijoux et les sacs à main personnalisés ne peuvent pas être retournés ni échangés, sauf en cas de défaut de fabrication.
              </p>
            </div>
          </div>

          {/* CTA contact */}
          <div style={{
            background: C.panel, border: `1px solid ${C.borderMid}`,
            padding: '5rem', display: 'flex',
            alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '3rem',
          }}>
            <div>
              <p style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.3em', color: C.gold, marginBottom: '1.2rem' }}>
                Une question ?
              </p>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(2rem, 2.8vw, 3rem)', color: C.cream, lineHeight: 1.1 }}>
                Notre équipe vous répond sous 24h
              </h2>
            </div>
            <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap' }}>
              <Link to="/contact" style={{ display: 'inline-flex', alignItems: 'center', padding: '1.6rem 4rem', background: C.gold, color: '#1A1208', fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', textDecoration: 'none', transition: 'background 0.25s, color 0.25s' }} onMouseEnter={(e) => { e.currentTarget.style.background = C.terra; e.currentTarget.style.color = C.cream; }} onMouseLeave={(e) => { e.currentTarget.style.background = C.gold; e.currentTarget.style.color = '#1A1208'; }}>
                Nous contacter
              </Link>
              <Link to="/faq" style={{ display: 'inline-flex', alignItems: 'center', padding: '1.6rem 4rem', background: 'transparent', color: C.muted, border: `1px solid ${C.borderMid}`, fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', letterSpacing: '0.2em', textTransform: 'uppercase', textDecoration: 'none', transition: 'border-color 0.2s, color 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.borderMid; e.currentTarget.style.color = C.muted; }}>
                Voir la FAQ
              </Link>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @media (max-width: 960px) {
          .lr-zones-grid  { grid-template-columns: repeat(2, 1fr) !important; }
          .lr-etapes-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .lr-connector   { display: none !important; }
        }
        @media (max-width: 600px) {
          .lr-zones-grid  { grid-template-columns: 1fr !important; }
          .lr-etapes-grid { grid-template-columns: 1fr !important; }
          .lr-retours-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
};

export default LivraisonRetoursPage;
