import { useState, useRef, useEffect } from 'react';
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
      { threshold: 0.06, rootMargin: '-30px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
};

/* ── Données FAQ ── */
const FAQ_CATEGORIES = [
  {
    id: 'commandes',
    label: 'Commandes',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 01-8 0"/>
      </svg>
    ),
    questions: [
      {
        q: 'Comment passer une commande ?',
        a: 'Vous pouvez commander directement depuis notre boutique en ligne en ajoutant les articles à votre panier, puis en procédant au paiement. Vous pouvez également passer commande via WhatsApp au 78 126 35 35 en envoyant une photo du produit et vos mensurations si nécessaire.',
      },
      {
        q: 'Puis-je modifier ou annuler ma commande après validation ?',
        a: 'Les modifications sont possibles dans les 2 heures suivant la commande. Après ce délai, si la préparation a débuté, les modifications peuvent ne plus être possibles. Contactez-nous rapidement par téléphone au 33 834 10 17 ou par WhatsApp.',
      },
      {
        q: 'Comment suivre ma commande ?',
        a: 'Rendez-vous sur la page "Suivi de commande" et saisissez votre numéro de commande reçu par SMS ou e-mail. Vous pouvez également nous contacter directement par WhatsApp pour un suivi en temps réel.',
      },
      {
        q: 'Recevrai-je une confirmation de commande ?',
        a: 'Oui. Une confirmation est envoyée par SMS et/ou e-mail dès que votre commande est validée. Elle contient votre numéro de commande, le récapitulatif des articles et le montant total.',
      },
    ],
  },
  {
    id: 'paiement',
    label: 'Paiement',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
        <line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
    questions: [
      {
        q: 'Quels moyens de paiement acceptez-vous ?',
        a: 'Nous acceptons : Orange Money, Wave, Free Money, virement bancaire et le paiement à la livraison (disponible uniquement à Dakar et Pikine). Les paiements par carte bancaire internationale seront bientôt disponibles.',
      },
      {
        q: 'Comment payer par Orange Money ?',
        a: 'Après validation de votre commande, vous recevez notre numéro Orange Money. Effectuez le transfert depuis votre application ou par USSD (*144#), puis envoyez la capture d\'écran de confirmation par WhatsApp. Votre commande est traitée dès réception.',
      },
      {
        q: 'Comment payer par Wave ?',
        a: 'Même principe qu\'Orange Money : transférez le montant total sur notre numéro Wave, puis envoyez la capture de la transaction par WhatsApp au 78 126 35 35. Le traitement est immédiat.',
      },
      {
        q: 'Le paiement à la livraison est-il disponible ?',
        a: 'Oui, uniquement pour Dakar Centre et Dakar Banlieue/Pikine. Pour les autres zones, le paiement en avance est requis (Orange Money, Wave ou virement). En cas de retrait en boutique, vous pouvez payer sur place.',
      },
    ],
  },
  {
    id: 'livraison',
    label: 'Livraison',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="1" y="3" width="15" height="13"/>
        <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
        <circle cx="5.5" cy="18.5" r="2.5"/>
        <circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
    questions: [
      {
        q: 'Quels sont les délais de livraison ?',
        a: 'Dakar Centre : 24h ouvrées. Dakar Banlieue / Pikine : 24–48h. Thiès et autres villes : 2 à 3 jours ouvrés. Retrait en boutique : immédiat dès que la commande est prête (en général sous 4h pour les articles en stock).',
      },
      {
        q: 'Quels sont les frais de livraison ?',
        a: 'Dakar Centre : 1 500 FCFA. Dakar Banlieue / Pikine : 1 000 FCFA. Thiès : 3 000 FCFA. Retrait en boutique à Pikine Tally Boumack : gratuit.',
      },
      {
        q: 'Livrez-vous en dehors du Sénégal ?',
        a: 'Pas encore de manière régulière. Pour une commande internationale, contactez-nous directement par e-mail ou WhatsApp afin d\'établir un devis personnalisé. Nous travaillons à déployer une livraison internationale dans les prochains mois.',
      },
      {
        q: 'Que se passe-t-il si je ne suis pas disponible à la livraison ?',
        a: 'Notre livreur vous contacte avant de se déplacer. En cas d\'absence, un nouveau créneau est convenu avec vous. Après deux tentatives infructueuses, votre commande peut être mise en retrait en boutique.',
      },
    ],
  },
  {
    id: 'sur-mesure',
    label: 'Sur-mesure',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 20h9"/>
        <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
    questions: [
      {
        q: 'Comment commander une pièce sur-mesure ?',
        a: 'Contactez-nous via le formulaire de contact, par WhatsApp ou par téléphone. Communiquez vos mensurations exactes (poitrine, taille, hanches, hauteur) et choisissez votre modèle et tissu. Notre artisan vous confirmera les délais et le tarif.',
      },
      {
        q: 'Quels sont les délais pour une pièce sur-mesure ?',
        a: 'En règle générale, 5 à 10 jours ouvrés selon la complexité du modèle. Pour les commandes groupées (cérémonies, mariages), comptez 2 à 3 semaines. Nous vous communiquons un délai précis au moment de la prise en charge.',
      },
      {
        q: 'Le sur-mesure coûte-t-il plus cher ?',
        a: 'Oui légèrement, car chaque pièce est créée spécifiquement pour vous. Le supplément dépend du modèle et du tissu choisi. Obtenez un devis personnalisé gratuit en nous contactant.',
      },
      {
        q: 'Puis-je apporter mon propre tissu ?',
        a: 'Oui, nous acceptons les tissus fournis par le client. Apportez ou envoyez votre tissu en boutique, et nos artisans se chargeront de la confection. La quantité nécessaire vous sera précisée selon le modèle.',
      },
    ],
  },
  {
    id: 'retours',
    label: 'Retours & Échanges',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polyline points="1 4 1 10 7 10"/>
        <path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
      </svg>
    ),
    questions: [
      {
        q: 'Puis-je retourner un article ?',
        a: 'Oui, dans un délai de 14 jours suivant la réception, à condition que l\'article soit dans son état d\'origine (non porté, non lavé, avec étiquettes). Les pièces sur-mesure, bijoux et accessoires personnalisés ne sont pas retournables.',
      },
      {
        q: 'Comment initier un retour ?',
        a: 'Contactez-nous par WhatsApp ou e-mail en indiquant votre numéro de commande et la raison du retour. Nous vous indiquerons la procédure et l\'adresse de retour. Les frais de retour sont à la charge du client.',
      },
      {
        q: 'Quand serai-je remboursé ?',
        a: 'Après réception et vérification de l\'article retourné (sous 48h), le remboursement est effectué sous 3 à 5 jours ouvrés via le même mode de paiement que lors de votre commande.',
      },
      {
        q: 'Puis-je échanger un article contre une autre taille ?',
        a: 'Oui, les échanges de taille sont possibles sous 14 jours, sous réserve de disponibilité. Si la taille souhaitée n\'est plus en stock, un avoir ou un remboursement vous sera proposé.',
      },
    ],
  },
];

/* ── Accordion item ── */
const AccordionItem = ({ q, a, isOpen, onToggle }) => (
  <div style={{
    borderBottom: `1px solid ${C.border}`,
    transition: 'background 0.2s',
  }}>
    <button
      onClick={onToggle}
      style={{
        width: '100%', background: 'none', border: 'none', cursor: 'pointer',
        padding: '2.4rem 3rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        gap: '2rem', textAlign: 'left',
      }}
    >
      <span style={{
        fontSize: '1.5rem', fontFamily: 'Inter, sans-serif',
        color: isOpen ? C.cream : C.cream,
        fontWeight: isOpen ? 600 : 400,
        lineHeight: 1.4,
        transition: 'color 0.2s',
      }}>
        {q}
      </span>
      <span style={{
        flexShrink: 0, width: '2.4rem', height: '2.4rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: isOpen ? C.gold : C.muted,
        transition: 'color 0.2s, transform 0.3s',
        transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </span>
    </button>
    <div style={{
      maxHeight: isOpen ? '40rem' : '0',
      overflow: 'hidden',
      transition: 'max-height 0.35s ease',
    }}>
      <p style={{
        padding: '0 3rem 2.4rem',
        fontSize: '1.4rem', fontFamily: 'Inter, sans-serif',
        color: C.muted, lineHeight: 1.8,
      }}>
        {a}
      </p>
    </div>
  </div>
);

/* ── Category tab ── */
const CategoryTab = ({ cat, isActive, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: '1rem',
      padding: '1.2rem 2.4rem',
      background: isActive ? 'rgba(184,150,10,0.08)' : 'transparent',
      border: isActive ? `1px solid rgba(184,150,10,0.3)` : `1px solid ${C.border}`,
      cursor: 'pointer',
      color: isActive ? C.gold : C.muted,
      fontSize: '1.2rem', fontFamily: 'Inter, sans-serif',
      textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 600,
      transition: 'all 0.2s', whiteSpace: 'nowrap',
    }}
    onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.borderColor = 'rgba(184,150,10,0.2)'; e.currentTarget.style.color = C.cream; } }}
    onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; } }}
  >
    <span style={{ opacity: isActive ? 1 : 0.5 }}>{cat.icon}</span>
    {cat.label}
  </button>
);

/* ── Page ── */
const FAQPage = () => {
  const [heroRef, heroVisible] = useInView();
  const [contentRef, contentVisible] = useInView();
  const [activeCategory, setActiveCategory] = useState('commandes');
  const [openIndex, setOpenIndex] = useState(null);

  const currentCat = FAQ_CATEGORIES.find((c) => c.id === activeCategory);

  const handleCategoryChange = (id) => {
    setActiveCategory(id);
    setOpenIndex(null);
  };

  return (
    <>
      <SEOHead
        title="FAQ — Questions fréquentes"
        description="Toutes les réponses aux questions fréquentes Golden Pousso : commandes, paiement Orange Money/Wave, livraison Dakar, sur-mesure, retours."
        url="/faq"
      />

      <div style={{ background: C.bg, minHeight: '100vh', color: C.cream }}>

        {/* Hero */}
        <section style={{ padding: '14rem 4rem 0', maxWidth: '140rem', margin: '0 auto' }}>
          <nav aria-label="Fil d'Ariane" style={{ marginBottom: '4rem' }}>
            <ol style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', listStyle: 'none', padding: 0, margin: 0 }}>
              {[{ label: 'Accueil', to: '/' }, { label: 'FAQ' }].map((crumb, i) => (
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
              <p style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.3em', color: C.gold }}>Questions fréquentes</p>
            </div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(3.5rem, 6vw, 6rem)', color: C.cream, letterSpacing: '0.02em', lineHeight: 1.05, textTransform: 'uppercase', marginBottom: '2.4rem' }}>
              FAQ
            </h1>
            <p style={{ fontSize: '1.45rem', fontFamily: 'Inter, sans-serif', color: C.muted, lineHeight: 1.8, maxWidth: '60rem' }}>
              Vous avez une question ? Consultez les réponses ci-dessous. Si vous ne trouvez pas ce que vous cherchez, notre équipe est disponible sur WhatsApp ou par téléphone.
            </p>
          </div>
          <div style={{ height: '1px', background: C.border }} />
        </section>

        {/* Corps */}
        <div style={{ padding: '8rem 4rem 10rem', maxWidth: '140rem', margin: '0 auto' }}>

          {/* Tabs catégories */}
          <div
            style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '5rem', overflowX: 'auto' }}
            className="faq-tabs"
          >
            {FAQ_CATEGORIES.map((cat) => (
              <CategoryTab
                key={cat.id}
                cat={cat}
                isActive={activeCategory === cat.id}
                onClick={() => handleCategoryChange(cat.id)}
              />
            ))}
          </div>

          {/* Accordion */}
          <div
            ref={contentRef}
            style={{
              opacity: contentVisible ? 1 : 0,
              transform: contentVisible ? 'translateY(0)' : 'translateY(16px)',
              transition: 'opacity 0.6s ease, transform 0.6s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.6rem', marginBottom: '3rem' }}>
              <div style={{ width: '4rem', height: '1px', background: C.gold }} />
              <p style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.3em', color: C.gold }}>
                {currentCat?.label}
              </p>
            </div>

            <div style={{ background: C.panel, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
              {currentCat?.questions.map((item, i) => (
                <AccordionItem
                  key={i}
                  q={item.q}
                  a={item.a}
                  isOpen={openIndex === i}
                  onToggle={() => setOpenIndex(openIndex === i ? null : i)}
                />
              ))}
            </div>
          </div>

          {/* Toutes les questions — résumé compteur */}
          <p style={{ marginTop: '2rem', fontSize: '1.2rem', fontFamily: 'Inter, sans-serif', color: C.muted, textAlign: 'right' }}>
            {FAQ_CATEGORIES.reduce((acc, c) => acc + c.questions.length, 0)} questions · {FAQ_CATEGORIES.length} catégories
          </p>

          {/* CTA contact */}
          <div style={{
            marginTop: '7rem',
            background: C.panel, border: `1px solid ${C.borderMid}`,
            padding: '5rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '3rem',
          }}>
            <div>
              <p style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.3em', color: C.gold, marginBottom: '1.2rem' }}>
                Vous n'avez pas trouvé votre réponse ?
              </p>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(2.2rem, 3vw, 3.2rem)', color: C.cream, lineHeight: 1.1 }}>
                Notre équipe vous répond
              </h2>
              <p style={{ marginTop: '1.2rem', fontSize: '1.35rem', fontFamily: 'Inter, sans-serif', color: C.muted }}>
                WhatsApp · 78 126 35 35 · Lun–Sam 9h–19h
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1.6rem', flexWrap: 'wrap' }}>
              <Link
                to="/contact"
                style={{
                  display: 'inline-flex', alignItems: 'center',
                  padding: '1.7rem 4rem',
                  background: C.gold, color: '#1A1208',
                  fontSize: '1.1rem', fontFamily: 'Inter, sans-serif',
                  fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
                  textDecoration: 'none', flexShrink: 0,
                  transition: 'background 0.25s, color 0.25s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = C.terra; e.currentTarget.style.color = C.cream; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = C.gold; e.currentTarget.style.color = '#1A1208'; }}
              >
                Nous contacter
              </Link>
              <Link
                to="/livraison-retours"
                style={{
                  display: 'inline-flex', alignItems: 'center',
                  padding: '1.7rem 4rem',
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
                Livraison & Retours
              </Link>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .faq-tabs { gap: 0.8rem !important; }
        }
      `}</style>
    </>
  );
};

export default FAQPage;
