import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const FullWidthBanner = () => {
  const navigate = useNavigate();
  const [btnHovered, setBtnHovered] = useState(false);

  return (
    <section style={{
      position: 'relative',
      height: '38rem',
      backgroundImage: 'url(/Gemini_Generated_Image_gtmje0gtmje0gtmj.png)',
      backgroundAttachment: 'fixed',
      backgroundSize: 'cover',
      backgroundPosition: 'center center',
    }}>

      {/* Overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(10,10,10,0.52)',
      }} />

      {/* Contenu centré */}
      <div style={{
        position: 'relative', zIndex: 1,
        height: '100%',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', color: '#F5F0EB',
        padding: '0 2rem',
      }}>
        <h2 style={{
          fontFamily: 'Aclonica, sans-serif',
          fontSize: 'clamp(2rem, 4vw, 3.8rem)',
          textTransform: 'uppercase', letterSpacing: '0.06em',
          marginBottom: '1rem', lineHeight: 1.1, color: '#D4AF37',
        }}>
          ENFIN DISPONIBLE !
        </h2>

        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 'clamp(1rem, 1.8vw, 1.4rem)',
          textTransform: 'uppercase', letterSpacing: '0.22em',
          marginBottom: '0.6rem', fontWeight: 400, color: '#E8E0D0',
        }}>
          NOTRE TOUTE NOUVELLE COLLECTION
        </p>

        <p style={{
          fontFamily: 'Aclonica, sans-serif',
          fontSize: 'clamp(1.2rem, 2.2vw, 2rem)',
          textTransform: 'uppercase', letterSpacing: '0.1em',
          marginBottom: '2.2rem', color: '#F5F0EB',
        }}>
          "GOLDEN POUSSO"
        </p>

        {/* Séparateur */}
        <div style={{ width: '4rem', height: '2px', background: '#D4AF37', marginBottom: '2.5rem' }} />

        <button
          onClick={() => navigate('/collections')}
          onMouseEnter={() => setBtnHovered(true)}
          onMouseLeave={() => setBtnHovered(false)}
          style={{
            padding: '1.2rem 3.8rem',
            background: btnHovered ? '#C2662D' : '#D4AF37',
            color: '#0A0A0A',
            border: 'none', fontSize: '1.1rem', fontWeight: 700,
            letterSpacing: '0.2em', textTransform: 'uppercase',
            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            transition: 'background 0.25s',
          }}
        >
          JE COMMANDE
        </button>
      </div>
    </section>
  );
};

export default FullWidthBanner;
