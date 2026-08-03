import { useRef, useEffect, useState } from 'react';
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
      { threshold: 0.05, rootMargin: '-20px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
};

/* ── Bloc de section légale ── */
const LegalSection = ({ id, label, titre, children }) => {
  const [ref, visible] = useInView();
  return (
    <div
      id={id}
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.7s ease, transform 0.7s ease',
        marginBottom: '7rem',
        scrollMarginTop: '10rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.6rem', marginBottom: '2.4rem' }}>
        <div style={{ width: '4rem', height: '1px', background: C.gold }} />
        <p style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.3em', color: C.gold }}>
          {label}
        </p>
      </div>
      <h2 style={{
        fontFamily: 'Syne, sans-serif',
        fontSize: 'clamp(2.2rem, 3vw, 3.2rem)',
        color: C.cream, marginBottom: '3.5rem', lineHeight: 1.1,
      }}>
        {titre}
      </h2>
      <div style={{ background: C.panel, border: `1px solid ${C.border}`, padding: '4rem 4.5rem' }}>
        {children}
      </div>
    </div>
  );
};

/* ── Paragraphe légal ── */
const P = ({ children, style }) => (
  <p style={{ fontSize: '1.4rem', fontFamily: 'Inter, sans-serif', color: C.muted, lineHeight: 1.85, marginBottom: '1.8rem', ...style }}>
    {children}
  </p>
);

const H3 = ({ children }) => (
  <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.8rem', color: C.cream, marginBottom: '1.2rem', marginTop: '3rem' }}>
    {children}
  </h3>
);

const Highlight = ({ label, value }) => (
  <div style={{ display: 'flex', gap: '1.2rem', padding: '1.4rem 0', borderBottom: `1px solid ${C.border}` }}>
    <span style={{ fontSize: '1.3rem', fontFamily: 'Inter, sans-serif', color: C.gold, minWidth: '18rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
    <span style={{ fontSize: '1.35rem', fontFamily: 'Inter, sans-serif', color: C.muted }}>{value}</span>
  </div>
);

/* ── Navigation interne ── */
const SECTIONS = [
  { id: 'mentions', label: 'Mentions légales' },
  { id: 'cgv',      label: 'CGV' },
  { id: 'confidentialite', label: 'Confidentialité' },
  { id: 'cookies',  label: 'Cookies' },
];

/* ── Page ── */
const MentionsLegalesPage = () => {
  const [heroRef, heroVisible] = useInView();

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <SEOHead
        title="Mentions légales & CGV"
        description="Mentions légales, conditions générales de vente, politique de confidentialité et cookies de Golden Pousso — Dakar, Sénégal."
        url="/mentions-legales"
        noindex
      />

      <div style={{ background: C.bg, minHeight: '100vh', color: C.cream }}>

        {/* Hero */}
        <section style={{ padding: '14rem 4rem 0', maxWidth: '140rem', margin: '0 auto' }}>
          <nav aria-label="Fil d'Ariane" style={{ marginBottom: '4rem' }}>
            <ol style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', listStyle: 'none', padding: 0, margin: 0 }}>
              {[{ label: 'Accueil', to: '/' }, { label: 'Mentions légales' }].map((crumb, i) => (
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
              <p style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.3em', color: C.gold }}>Informations légales</p>
            </div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(3rem, 5vw, 5.5rem)', color: C.cream, letterSpacing: '0.02em', lineHeight: 1.05, textTransform: 'uppercase', marginBottom: '2.4rem' }}>
              Mentions légales & CGV
            </h1>
            <p style={{ fontSize: '1.4rem', fontFamily: 'Inter, sans-serif', color: C.muted, lineHeight: 1.8, maxWidth: '60rem', marginBottom: '4rem' }}>
              Dernière mise à jour : avril 2025. Ces mentions régissent l'utilisation du site et les conditions de vente de Golden Pousso.
            </p>

            {/* Navigation interne */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  style={{
                    padding: '0.9rem 2.2rem',
                    background: 'transparent',
                    border: `1px solid ${C.borderMid}`,
                    color: C.muted,
                    fontSize: '1.15rem', fontFamily: 'Inter, sans-serif',
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.borderMid; e.currentTarget.style.color = C.muted; }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ height: '1px', background: C.border }} />
        </section>

        {/* Corps */}
        <div style={{ padding: '8rem 4rem 10rem', maxWidth: '100rem', margin: '0 auto' }}>

          {/* 1. Mentions légales */}
          <LegalSection id="mentions" label="Éditeur du site" titre="Mentions légales">
            <div style={{ marginBottom: '2rem' }}>
              <Highlight label="Raison sociale"   value="Golden Pousso" />
              <Highlight label="Forme juridique"  value="Entreprise individuelle" />
              <Highlight label="Adresse"          value="Pikine Tally Boumack, Tableau Gazelle N.2372, Dakar, Sénégal" />
              <Highlight label="Téléphone"        value="33 834 10 17 · 78 126 35 35" />
              <Highlight label="Email"            value="contact@goldenpousso.sn" />
              <Highlight label="Directeur de publication" value="Équipe Golden Pousso" />
              <Highlight label="Hébergement"      value="Vercel Inc. · 340 Pine Street, San Francisco, CA 94104, USA" />
            </div>
            <P>
              Le site goldenpousso.sn est édité par Golden Pousso, maison de mode africaine basée à Dakar, Sénégal, spécialisée dans la création et la vente de vêtements et accessoires inspirés des traditions ouest-africaines.
            </P>
          </LegalSection>

          {/* 2. CGV */}
          <LegalSection id="cgv" label="Vente en ligne" titre="Conditions Générales de Vente">

            <H3>1. Objet</H3>
            <P>
              Les présentes conditions générales de vente (CGV) régissent les relations contractuelles entre Golden Pousso et tout client effectuant un achat sur le site goldenpousso.sn ou via WhatsApp.
            </P>

            <H3>2. Produits et prix</H3>
            <P>
              Les prix sont indiqués en Franc CFA (XOF) toutes taxes comprises. Golden Pousso se réserve le droit de modifier ses prix à tout moment. Les articles sur-mesure font l'objet d'un devis personnalisé. Les frais de livraison sont indiqués séparément lors de la commande.
            </P>

            <H3>3. Commande et validation</H3>
            <P>
              Toute commande vaut acceptation des présentes CGV. La commande est confirmée après réception du paiement ou, pour les commandes à la livraison, après confirmation téléphonique. Un numéro de commande est communiqué par SMS et/ou e-mail.
            </P>

            <H3>4. Paiement</H3>
            <P>
              Modes de paiement acceptés : Orange Money, Wave, Free Money, virement bancaire, paiement à la livraison (Dakar Centre et Banlieue uniquement). Le paiement est dû intégralement avant expédition, sauf pour le paiement à la livraison.
            </P>

            <H3>5. Livraison</H3>
            <P>
              Les délais et frais de livraison sont consultables sur la page <Link to="/livraison-retours" style={{ color: C.gold, textDecoration: 'none' }}>Livraison & Retours</Link>. Golden Pousso ne saurait être tenu responsable des retards dus à des événements extérieurs (intempéries, grèves, force majeure).
            </P>

            <H3>6. Droit de rétractation et retours</H3>
            <P>
              Conformément à notre politique, les articles peuvent être retournés dans les 14 jours suivant la réception, en état d'origine. Les pièces sur-mesure, bijoux et accessoires personnalisés sont exclus du droit de retour. Voir notre page <Link to="/livraison-retours" style={{ color: C.gold, textDecoration: 'none' }}>Livraison & Retours</Link> pour la procédure complète.
            </P>

            <H3>7. Propriété intellectuelle</H3>
            <P>
              Tous les contenus du site (photos, textes, logos, créations) sont la propriété exclusive de Golden Pousso. Toute reproduction ou utilisation sans autorisation écrite est interdite.
            </P>

            <H3>8. Litiges</H3>
            <P>
              En cas de litige, nous privilégions le règlement amiable. Contactez-nous par e-mail ou WhatsApp. À défaut de solution amiable, les tribunaux compétents de Dakar, Sénégal, seront saisis.
            </P>
          </LegalSection>

          {/* 3. Confidentialité */}
          <LegalSection id="confidentialite" label="Données personnelles" titre="Politique de confidentialité">

            <H3>Données collectées</H3>
            <P>
              Lors d'une commande, nous collectons : nom, prénom, adresse de livraison, numéro de téléphone, adresse e-mail. Ces données sont nécessaires au traitement de votre commande et à notre communication avec vous.
            </P>

            <H3>Utilisation des données</H3>
            <P>
              Vos données sont utilisées exclusivement pour : le traitement et le suivi de vos commandes, la communication relative à vos achats, l'amélioration de nos services. Elles ne sont en aucun cas vendues ou cédées à des tiers à des fins commerciales.
            </P>

            <H3>Conservation des données</H3>
            <P>
              Vos données sont conservées pendant la durée nécessaire à l'exécution de la relation commerciale, et au maximum 3 ans après votre dernier achat, conformément à la réglementation sénégalaise (Loi n°2008-12 sur la protection des données personnelles).
            </P>

            <H3>Vos droits</H3>
            <P>
              Vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles. Pour exercer ces droits, contactez-nous par e-mail à contact@goldenpousso.sn ou par WhatsApp au 78 126 35 35.
            </P>

            <H3>Sécurité</H3>
            <P>
              Nous mettons en œuvre les mesures techniques et organisationnelles appropriées pour protéger vos données contre tout accès non autorisé, perte ou altération.
            </P>
          </LegalSection>

          {/* 4. Cookies */}
          <LegalSection id="cookies" label="Navigation" titre="Politique de cookies">
            <P>
              Notre site utilise des cookies techniques nécessaires au bon fonctionnement du service (gestion du panier, préférences de langue, authentification). Ces cookies ne collectent pas de données à des fins publicitaires.
            </P>
            <P>
              Nous n'utilisons pas de cookies de suivi tiers (Google Analytics, Facebook Pixel) à ce jour. Si de tels outils devaient être intégrés à l'avenir, nous vous en informerions et recueillerions votre consentement.
            </P>
            <P>
              Vous pouvez configurer votre navigateur pour refuser les cookies, mais certaines fonctionnalités du site (panier, compte) pourraient alors ne plus fonctionner correctement.
            </P>
          </LegalSection>

          {/* CTA contact */}
          <div style={{
            background: C.panel, border: `1px solid ${C.borderMid}`,
            padding: '4rem 5rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '2.4rem',
          }}>
            <div>
              <p style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.3em', color: C.gold, marginBottom: '0.8rem' }}>
                Une question d'ordre légal ?
              </p>
              <p style={{ fontSize: '1.5rem', fontFamily: 'Inter, sans-serif', color: C.cream }}>
                Contactez-nous par e-mail à <span style={{ color: C.gold }}>contact@goldenpousso.sn</span>
              </p>
            </div>
            <Link
              to="/contact"
              style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '1.5rem 4rem',
                background: 'transparent', color: C.muted,
                border: `1px solid ${C.borderMid}`,
                fontSize: '1.1rem', fontFamily: 'Inter, sans-serif',
                letterSpacing: '0.2em', textTransform: 'uppercase',
                textDecoration: 'none', flexShrink: 0,
                transition: 'border-color 0.2s, color 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.borderMid; e.currentTarget.style.color = C.muted; }}
            >
              Nous contacter
            </Link>
          </div>

        </div>
      </div>
    </>
  );
};

export default MentionsLegalesPage;
