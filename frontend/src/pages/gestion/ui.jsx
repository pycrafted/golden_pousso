import { useState } from 'react';
import { Link } from 'react-router-dom';
import { COLORS, RADIUS, FONT_DISPLAY, FONT_BODY } from '../../theme';

export const PageHeader = ({ title, subtitle, action }) => (
  <div style={{ marginBottom: '3rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.6rem', marginBottom: subtitle ? '0.8rem' : 0 }}>
      <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: '2.6rem', color: COLORS.ink, letterSpacing: '-0.01em' }}>{title}</h1>
      {action}
    </div>
    {subtitle && (
      <p style={{ fontFamily: FONT_BODY, fontSize: '1.35rem', color: COLORS.mutedOnLight, lineHeight: 1.6, maxWidth: '72rem' }}>
        {subtitle}
      </p>
    )}
  </div>
);

export const GestionButton = ({ children, variant = 'primary', style, ...props }) => {
  const base = {
    padding: '1rem 2rem', border: 'none', cursor: 'pointer', borderRadius: RADIUS,
    fontFamily: FONT_BODY, fontSize: '1.2rem', fontWeight: 600, letterSpacing: '0.05em',
    display: 'inline-flex', alignItems: 'center', gap: '0.6rem', transition: 'opacity 0.2s',
  };
  const variants = {
    primary: { background: COLORS.gold, color: COLORS.cream },
    outline: { background: 'transparent', color: COLORS.ink, border: `1px solid ${COLORS.mutedOnLight}` },
    danger: { background: 'transparent', color: '#c0392b', border: '1px solid #c0392b' },
    dangerSolid: { background: '#c0392b', color: '#fff' },
  };
  return (
    <button
      {...props}
      style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
    >
      {children}
    </button>
  );
};

const fieldBase = {
  width: '100%', padding: '1rem 1.2rem', border: `1px solid #E0D8C8`, background: '#fff',
  fontFamily: FONT_BODY, fontSize: '1.3rem', color: COLORS.ink, outline: 'none',
  boxSizing: 'border-box', borderRadius: RADIUS,
};

export const GestionInput = (props) => <input {...props} style={{ ...fieldBase, ...props.style }} />;
export const GestionTextarea = (props) => <textarea {...props} style={{ ...fieldBase, resize: 'vertical', ...props.style }} />;
export const GestionSelect = ({ children, ...props }) => (
  <select {...props} style={{ ...fieldBase, cursor: 'pointer', ...props.style }}>{children}</select>
);

export const Field = ({ label, children }) => (
  <label style={{ display: 'block', marginBottom: '1.6rem' }}>
    <span style={{ display: 'block', fontFamily: FONT_BODY, fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: COLORS.mutedOnLight, marginBottom: '0.6rem' }}>
      {label}
    </span>
    {children}
  </label>
);

export const Badge = ({ children, tone = 'neutral' }) => {
  const tones = {
    neutral: { background: '#F0EAE0', color: COLORS.mutedOnLight },
    success: { background: 'rgba(34,197,94,0.12)', color: '#16803d' },
    warning: { background: 'rgba(184,150,10,0.14)', color: '#8a6d08' },
    danger: { background: 'rgba(220,38,38,0.1)', color: '#c0392b' },
  };
  return (
    <span style={{
      display: 'inline-block', padding: '0.3rem 1rem', fontSize: '1.05rem', fontFamily: FONT_BODY,
      fontWeight: 600, letterSpacing: '0.03em', borderRadius: '999px', ...tones[tone],
    }}>
      {children}
    </span>
  );
};

export const GestionTable = ({ columns, children }) => (
  <div style={{ overflowX: 'auto', background: '#fff', border: '1px solid #EDE5D6', borderRadius: RADIUS }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT_BODY }}>
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c} style={{
              textAlign: 'left', padding: '1.2rem 1.6rem', fontSize: '1.05rem', textTransform: 'uppercase',
              letterSpacing: '0.08em', color: COLORS.mutedOnLight, borderBottom: '1px solid #EDE5D6', whiteSpace: 'nowrap',
            }}>
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);

export const Td = ({ children, style }) => (
  <td style={{ padding: '1.2rem 1.6rem', fontSize: '1.3rem', color: COLORS.ink, borderBottom: '1px solid #F3EEE2', ...style }}>
    {children}
  </td>
);

export const StatCard = ({ label, value, hint, tone = 'neutral', to }) => {
  const toneColor = tone === 'warning' ? COLORS.terracotta : tone === 'danger' ? '#c0392b' : COLORS.gold;
  const content = (
    <>
      <p style={{ fontFamily: FONT_BODY, fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: COLORS.mutedOnLight, marginBottom: '1rem' }}>
        {label}
      </p>
      <p style={{ fontFamily: FONT_DISPLAY, fontSize: '2.8rem', color: toneColor }}>{value}</p>
      {hint && <p style={{ fontFamily: FONT_BODY, fontSize: '1.15rem', color: COLORS.mutedOnLight, marginTop: '0.8rem' }}>{hint}</p>}
    </>
  );
  const style = { display: 'block', background: '#fff', border: '1px solid #EDE5D6', borderRadius: RADIUS, padding: '2.2rem', textDecoration: 'none', transition: 'border-color 0.2s, box-shadow 0.2s' };
  if (to) {
    return (
      <Link
        to={to}
        style={style}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = COLORS.gold; e.currentTarget.style.boxShadow = '0 2px 10px rgba(184,150,10,0.12)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#EDE5D6'; e.currentTarget.style.boxShadow = 'none'; }}
      >
        {content}
      </Link>
    );
  }
  return <div style={style}>{content}</div>;
};

export const Panel = ({ children, style }) => (
  <div style={{ background: '#fff', border: '1px solid #EDE5D6', borderRadius: RADIUS, padding: '2.4rem', ...style }}>
    {children}
  </div>
);

/** Bandeau d'aide contextuelle, à placer en haut d'une page pour expliquer ce qu'on peut y faire. */
export const HelpBox = ({ children }) => (
  <div style={{
    display: 'flex', gap: '1.4rem', alignItems: 'flex-start',
    background: 'rgba(184,150,10,0.08)', border: `1px solid rgba(184,150,10,0.25)`,
    borderRadius: RADIUS, padding: '1.6rem 2rem', marginBottom: '2.4rem',
  }}>
    <i className="bx bx-bulb" style={{ fontSize: '2rem', color: COLORS.gold, flexShrink: 0, marginTop: '0.1rem' }} />
    <p style={{ fontFamily: FONT_BODY, fontSize: '1.3rem', color: COLORS.ink, lineHeight: 1.7 }}>{children}</p>
  </div>
);

/** État vide guidé — remplace les listes vides silencieuses par une explication + une action. */
export const EmptyState = ({ icon = 'bx-info-circle', title, description, action }) => (
  <div style={{ textAlign: 'center', padding: '6rem 3rem', background: '#fff', border: '1px dashed #E0D8C8', borderRadius: RADIUS }}>
    <i className={`bx ${icon}`} style={{ fontSize: '4rem', color: COLORS.gold, marginBottom: '1.6rem', display: 'block' }} />
    <p style={{ fontFamily: FONT_BODY, fontSize: '1.6rem', fontWeight: 700, color: COLORS.ink, marginBottom: '0.8rem' }}>{title}</p>
    {description && (
      <p style={{ fontFamily: FONT_BODY, fontSize: '1.3rem', color: COLORS.mutedOnLight, maxWidth: '46rem', margin: '0 auto 1.6rem', lineHeight: 1.7 }}>
        {description}
      </p>
    )}
    {action}
  </div>
);

/**
 * Boîte de confirmation guidée — remplace window.confirm().
 * Usage : const [confirm, setConfirm] = useState(null); setConfirm({ title, description, onConfirm })
 * puis <ConfirmDialog {...confirm} onCancel={() => setConfirm(null)} /> quand confirm !== null.
 */
export const ConfirmDialog = ({ title, description, confirmLabel = 'Confirmer', danger = true, onConfirm, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div onClick={onCancel} style={{ position: 'absolute', inset: 0, background: 'rgba(26,18,8,0.55)' }} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: RADIUS, padding: '3.2rem', maxWidth: '46rem', width: '100%' }}>
        <p style={{ fontFamily: FONT_BODY, fontSize: '1.8rem', fontWeight: 700, color: COLORS.ink, marginBottom: '1.2rem' }}>{title}</p>
        <p style={{ fontFamily: FONT_BODY, fontSize: '1.35rem', color: COLORS.mutedOnLight, lineHeight: 1.7, marginBottom: '2.6rem' }}>{description}</p>
        <div style={{ display: 'flex', gap: '1.2rem', justifyContent: 'flex-end' }}>
          <GestionButton variant="outline" onClick={onCancel}>Annuler</GestionButton>
          <GestionButton variant={danger ? 'dangerSolid' : 'primary'} onClick={handleConfirm} disabled={loading}>
            {loading ? 'Un instant…' : confirmLabel}
          </GestionButton>
        </div>
      </div>
    </div>
  );
};
