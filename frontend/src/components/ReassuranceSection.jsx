import { useRef, useState, useEffect } from 'react';

const useInView = () => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1, rootMargin: '-50px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
};

const ITEMS = [
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#B8960A" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
      </svg>
    ),
    title: 'Livraison Dakar & Thiès',
    description: 'Dakar centre, banlieue, Thiès — ou retrait gratuit en boutique',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#B8960A" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    title: 'Savoir-faire 100 % Local',
    description: 'Chaque pièce cousue avec soin dans notre atelier à Pikine, Dakar',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#B8960A" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: 'Paiement Mobile Sécurisé',
    description: 'Orange Money, Wave, Free Money, paiement à la livraison',
  },
  {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#B8960A" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: 'Conseils Par WhatsApp',
    description: 'Réponse rapide 7j/7 — tailles, tissus, sur-mesure',
  },
];

const ReassuranceSection = () => {
  const [ref, visible] = useInView();
  return (
    <section ref={ref} style={{
      padding: '8rem 4rem',
      background: '#0A0A0A',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
    }}>
      <div style={{ maxWidth: '144rem', margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '4rem',
        }} className="reassurance-grid">
          {ITEMS.map((item, i) => (
            <div
              key={item.title}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(20px)',
                transition: `opacity 0.5s ease ${i * 0.1}s, transform 0.5s ease ${i * 0.1}s`,
              }}
            >
              <h3 style={{
                fontSize: '1.3rem',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                color: '#FAF6EE',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginBottom: '0.8rem',
                lineHeight: 1.4,
              }}>
                {item.title}
              </h3>
              <p style={{
                fontSize: '1.2rem',
                color: 'rgba(255,255,255,0.5)',
                lineHeight: 1.6,
                fontFamily: 'Inter, sans-serif',
              }}>
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 1023px) { .reassurance-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 479px)  { .reassurance-grid { grid-template-columns: repeat(1, 1fr) !important; } }
      `}</style>
    </section>
  );
};

export default ReassuranceSection;
