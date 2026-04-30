import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';


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

const NewsletterSection = () => {
  const [ref, visible] = useInView();
  const navigate = useNavigate();


  return (
    <div style={{ background: '#FAF6EE', borderTop: '1px solid #FAF6EE', borderBottom: '1px solid #E0D0B8' }}>
      <div ref={ref} style={{
        padding: '8rem 4rem',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'opacity 0.8s ease, transform 0.8s ease',
      }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto', textAlign: 'center' }}>

          {/* Eyebrow */}
          <p style={{
            fontSize: '1.1rem', fontFamily: 'Inter, sans-serif',
            textTransform: 'uppercase', letterSpacing: '0.3em',
            color: '#B8960A', marginBottom: '2rem',
          }}>
            Rejoignez la communauté
          </p>

          {/* Titre */}
          <h3 style={{
            fontFamily: 'Aclonica, serif',
            fontSize: 'clamp(2.4rem, 4vw, 4rem)',
            color: '#1A1208',
            letterSpacing: '-0.02em',
            marginBottom: '1.6rem',
            lineHeight: 1.15,
          }}>
            Recevez nos nouveautés en avant-première
          </h3>

          {/* Sous-titre */}
          <p style={{
            fontSize: '1.4rem', fontFamily: 'Aclonica, serif',
            color: '#7A6A50', marginBottom: '4.8rem', lineHeight: 1.7,
            maxWidth: '50rem', margin: '0 auto 4.8rem',
          }}>
            Créez un compte et recevez automatiquement nos nouvelles collections
            directement sur WhatsApp.
          </p>

          {/* Boutons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.6rem', flexWrap: 'wrap' }}>

            {/* Créer un compte */}
            <button
              onClick={() => navigate('/mon-compte')}
              style={{
                padding: '1.3rem 3.2rem',
                background: '#B8960A',
                color: '#FAF6EE',
                border: 'none',
                fontFamily: 'Aclonica, serif',
                fontSize: '1.3rem',
                letterSpacing: '0.1em',
                cursor: 'pointer',
                transition: 'background 0.25s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#C2662D'}
              onMouseLeave={e => e.currentTarget.style.background = '#B8960A'}
            >
              Créer un compte
            </button>


          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsletterSection;
