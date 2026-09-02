import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';
import { DEMONSTRATION, AVIS_DEMO } from '../constants/demonstration';

// Ref-callback plutôt que useRef : cette section peut d'abord rendre `null` (le temps
// de charger les avis), donc le nœud DOM n'existe pas encore lors du tout premier rendu.
// Un useEffect à deps [] classique raterait son attachement ; ici l'observer se (ré)attache
// dès que le nœud apparaît réellement.
const useInView = () => {
  const [node, setNode] = useState(null);
  const [visible, setVisible] = useState(false);
  const ref = useCallback((el) => setNode(el), []);

  useEffect(() => {
    if (!node) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1, rootMargin: '-60px' }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [node]);

  return [ref, visible];
};

const Stars = ({ value }) => (
  <span style={{ color: 'var(--text-accent)', fontSize: '1.4rem', letterSpacing: '0.15em' }}>
    {'★'.repeat(value)}{'☆'.repeat(5 - value)}
  </span>
);

const TestimonialsSection = () => {
  const [reviews, setReviews] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [ref, visible] = useInView();

  useEffect(() => {
    // Repli de démonstration : il ne s'affiche que si l'API ne renvoie AUCUN
    // avis. Le premier vrai avis publié le fait disparaître de lui-même.
    // ⚠ Ces avis sont inventés — voir constants/demonstration.js.
    const repli = DEMONSTRATION ? AVIS_DEMO : [];
    apiClient.get('/reviews/recents/')
      .then(({ data }) => setReviews(data && data.length ? data : repli))
      .catch(() => setReviews(repli))
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded || reviews.length === 0) return null;

  return (
    <section style={{ background: 'var(--surface)' }}>
      <div className="container">
        <div ref={ref} style={{
          marginBottom: '5rem', textAlign: 'center',
          opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}>
          {/* Titre seul, souligné du filet doré — le même traitement que
              « Nos créations », « Catégories » et « Promotion ». Le sur-titre
              « Avis Clients » a été retiré : il annonçait ce que le titre
              disait déjà. */}
          <h2>Elles Nous Font Confiance</h2>
          <span className="filet-titre" aria-hidden="true" />
        </div>

        <div className="testimonials-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2.4rem' }}>
          {reviews.slice(0, 6).map((r, i) => (
            <div
              key={r.id}
              style={{
                background: 'var(--surface-gold)', padding: '3.2rem 2.8rem', borderRadius: 'var(--r-3)',
                // Filet doré plutôt qu'un gris : l'or est structurel dans
                // ce système, il encadre au lieu de remplir.
                border: '1px solid var(--line-accent)',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(20px)',
                transition: `opacity 0.5s ease ${0.1 * i + 0.2}s, transform 0.5s ease ${0.1 * i + 0.2}s`,
              }}
            >
              <Stars value={r.rating} />
              <p style={{
                fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--text)',
                lineHeight: 1.6, margin: '1.6rem 0 2.4rem',
              }}>
                « {r.comment.length > 160 ? r.comment.slice(0, 160) + '…' : r.comment} »
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.3rem', fontWeight: 600, color: 'var(--text-accent)' }}>
                {r.customer_name}
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.15rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                à propos de {r.product_name}
              </p>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .testimonials-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 600px) {
          .testimonials-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
};

export default TestimonialsSection;
