import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { COLORS, FONT_DISPLAY, FONT_BODY } from '../theme';

const SearchOverlay = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();

  /* Auto-focus à l'ouverture */
  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  /* Fermer sur Escape */
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  /* Bloquer le scroll du body */
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    onClose();
    navigate(`/recherche?search=${encodeURIComponent(query.trim())}`);
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 2000,
          background: 'rgba(26,18,8,0.97)',
          backdropFilter: 'blur(12px)',
          opacity: open ? 1 : 0,
          visibility: open ? 'visible' : 'hidden',
          transition: 'opacity 0.35s ease, visibility 0.35s',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '4rem 2rem',
        }}
        aria-hidden={!open}
      >
        {/* Bouton fermer */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '2.8rem', right: '3rem',
            background: 'none', border: 'none',
            color: COLORS.mutedOnDark,
            cursor: 'pointer', fontSize: '2rem', lineHeight: 1,
            padding: '0.4rem',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = COLORS.gold}
          onMouseLeave={(e) => e.currentTarget.style.color = COLORS.mutedOnDark}
          aria-label="Fermer la recherche"
        >
          ✕
        </button>

        {/* Contenu centré — stoppe la propagation pour ne pas fermer */}
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: '64rem',
            opacity: open ? 1 : 0,
            transform: open ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 0.4s ease 0.05s, transform 0.4s ease 0.05s',
          }}
        >
          {/* Label */}
          <p style={{
            fontSize: '1.1rem', fontFamily: FONT_BODY,
            textTransform: 'uppercase', letterSpacing: '0.35em',
            color: COLORS.gold, textAlign: 'center', marginBottom: '3.5rem',
          }}>
            Rechercher
          </p>

          {/* Input */}
          <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Que cherchez-vous ?"
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid rgba(184,150,10,0.35)',
                paddingBottom: '2rem',
                paddingRight: '5rem',
                fontSize: 'clamp(2.4rem, 5vw, 4rem)',
                fontFamily: FONT_DISPLAY,
                color: COLORS.cream,
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.25s',
                caretColor: COLORS.gold,
              }}
              onFocus={(e) => e.currentTarget.style.borderBottomColor = COLORS.gold}
              onBlur={(e) => e.currentTarget.style.borderBottomColor = 'rgba(184,150,10,0.35)'}
            />
            {/* Icône loupe */}
            <button
              type="submit"
              style={{
                position: 'absolute', right: 0, bottom: '1.8rem',
                background: 'none', border: 'none',
                color: COLORS.gold, cursor: 'pointer', padding: '0.4rem',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = COLORS.cream}
              onMouseLeave={(e) => e.currentTarget.style.color = COLORS.gold}
              aria-label="Lancer la recherche"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
          </form>

          {/* Suggestions rapides */}
          <div style={{ marginTop: '3.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
            {['Boubou brodé', 'Robe wax', 'Sandales cuir', 'Bijoux or', 'Sur mesure'].map((s) => (
              <button
                key={s}
                onClick={() => { onClose(); navigate(`/recherche?search=${encodeURIComponent(s)}`); }}
                style={{
                  padding: '0.7rem 1.8rem',
                  background: 'none',
                  border: '1px solid rgba(250,246,238,0.15)',
                  color: COLORS.mutedOnDark,
                  fontSize: '1.2rem', fontFamily: FONT_BODY,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, color 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = COLORS.gold; e.currentTarget.style.color = COLORS.cream; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(250,246,238,0.15)'; e.currentTarget.style.color = COLORS.mutedOnDark; }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Signature bas */}
        <p style={{
          position: 'absolute', bottom: '2.5rem',
          fontSize: '1rem', fontFamily: FONT_BODY,
          color: 'rgba(250,246,238,0.3)', letterSpacing: '0.2em', textTransform: 'uppercase',
        }}>
          Golden Pousso · Atelier Pikine, Dakar
        </p>
      </div>

      <style>{`
        input::placeholder { color: rgba(250,246,238,0.35); font-family: ${FONT_BODY}; }
        input { color-scheme: dark; }
      `}</style>
    </>
  );
};

export default SearchOverlay;
