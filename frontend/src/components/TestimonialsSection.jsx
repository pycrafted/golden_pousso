import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';

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
  <span style={{ color: '#B8960A', fontSize: '1.4rem', letterSpacing: '0.15em' }}>
    {'★'.repeat(value)}{'☆'.repeat(5 - value)}
  </span>
);

const TestimonialsSection = () => {
  const [reviews, setReviews] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [ref, visible] = useInView();

  useEffect(() => {
    apiClient.get('/reviews/recents/').then(({ data }) => setReviews(data)).catch(() => {}).finally(() => setLoaded(true));
  }, []);

  if (!loaded || reviews.length === 0) return null;

  return (
    <section style={{ padding: '8rem 0', background: '#FAF6EE' }}>
      <div className="container">
        <div ref={ref} style={{
          marginBottom: '5rem', textAlign: 'center',
          opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}>
          <p style={{
            display: 'inline-block',
            fontSize: '1rem', fontFamily: 'Inter, sans-serif',
            textTransform: 'uppercase', letterSpacing: '0.4em',
            color: '#FAF6EE', background: '#B8960A',
            padding: '0.6rem 2rem', marginBottom: '1.6rem',
          }}>
            Avis Clients
          </p>
          <h2 style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 'clamp(2.8rem, 4vw, 4.2rem)',
            color: '#1A1208', letterSpacing: '-0.01em', lineHeight: 1.1,
          }}>
            Elles Nous Font Confiance
          </h2>
        </div>

        <div className="testimonials-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2.4rem' }}>
          {reviews.slice(0, 6).map((r, i) => (
            <div
              key={r.id}
              style={{
                background: '#fff', padding: '3.2rem 2.8rem', borderRadius: '2px',
                border: '1px solid #EDE5D6',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(20px)',
                transition: `opacity 0.5s ease ${0.1 * i + 0.2}s, transform 0.5s ease ${0.1 * i + 0.2}s`,
              }}
            >
              <Stars value={r.rating} />
              <p style={{
                fontFamily: 'Syne, sans-serif', fontSize: '1.5rem', color: '#1A1208',
                lineHeight: 1.6, margin: '1.6rem 0 2.4rem',
              }}>
                « {r.comment.length > 160 ? r.comment.slice(0, 160) + '…' : r.comment} »
              </p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.3rem', fontWeight: 600, color: '#1A1208' }}>
                {r.customer_name}
              </p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.15rem', color: '#7A6A50', marginTop: '0.2rem' }}>
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
