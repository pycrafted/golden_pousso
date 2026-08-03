import { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { COLORS, RADIUS, FONT_DISPLAY, FONT_BODY } from '../theme';

const CHARTS = {
  boubous: {
    title: 'Guide des tailles — Boubous & Robes',
    columns: ['Taille', 'Poitrine (cm)', 'Taille (cm)', 'Hanches (cm)'],
    rows: [
      ['S', '84–88', '66–70', '90–94'],
      ['M', '89–94', '71–76', '95–100'],
      ['L', '95–100', '77–82', '101–106'],
      ['XL', '101–106', '83–88', '107–112'],
      ['XXL', '107–114', '89–96', '113–120'],
    ],
  },
  chaussures: {
    title: 'Guide des tailles — Chaussures',
    columns: ['Pointure EU', 'Longueur pied (cm)'],
    rows: [
      ['36', '23.0'], ['37', '23.5'], ['38', '24.5'], ['39', '25.0'],
      ['40', '25.5'], ['41', '26.5'], ['42', '27.0'], ['43', '27.5'],
    ],
  },
};

const SizeGuideModal = ({ categorySlug, onClose }) => {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const chart = CHARTS[categorySlug] || CHARTS.boubous;

  const modal = (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 3000,
        background: 'rgba(26,18,8,0.7)', backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: COLORS.cream, maxWidth: '56rem', width: '100%', maxHeight: '85vh', overflowY: 'auto', padding: '3.2rem', borderRadius: RADIUS }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.4rem', gap: '2rem' }}>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 'clamp(1.8rem, 3vw, 2.2rem)', color: COLORS.ink, lineHeight: 1.2 }}>
            {chart.title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Fermer"
            style={{ background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer', color: COLORS.mutedOnLight, lineHeight: 1, flexShrink: 0 }}
          >
            ✕
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT_BODY }}>
            <thead>
              <tr>
                {chart.columns.map((c) => (
                  <th key={c} style={{ textAlign: 'left', padding: '1rem', borderBottom: `2px solid ${COLORS.gold}`, fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: COLORS.gold, whiteSpace: 'nowrap' }}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chart.rows.map((row, i) => (
                <tr key={i} style={{ background: i % 2 ? 'rgba(184,150,10,0.05)' : 'transparent' }}>
                  {row.map((cell, j) => (
                    <td key={j} style={{ padding: '1rem', fontSize: '1.3rem', color: COLORS.ink, borderBottom: '1px solid rgba(0,0,0,0.06)', whiteSpace: 'nowrap' }}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p style={{ marginTop: '2rem', fontSize: '1.2rem', color: COLORS.mutedOnLight, lineHeight: 1.7, fontFamily: FONT_BODY }}>
          Un doute sur votre taille ? Contactez-nous sur WhatsApp, notre équipe vous conseille en quelques minutes.
        </p>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
};

export default SizeGuideModal;
