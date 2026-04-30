import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './Navbar';
import HomeFooter from './HomeFooter';
import useAuthStore from '../store/authStore';

const WHATSAPP_NUMBER = '221781263535';

const WhatsAppChat = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');

  const send = () => {
    const text = message.trim() || 'Bonjour Golden Pousso, je souhaite des informations sur vos créations.';
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
    setMessage('');
    setOpen(false);
  };

  const onKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  return (
    <>
      {/* Panneau chat */}
      {open && (
        <div style={{
          position: 'fixed', bottom: '8rem', right: '2rem', zIndex: 9998,
          width: '42rem', background: '#fff', borderRadius: '1.6rem',
          boxShadow: '0 -4px 48px rgba(0,0,0,0.18)',
          overflow: 'hidden', fontFamily: 'Inter, sans-serif',
          animation: 'chatIn 0.25s ease',
        }}>
          {/* Header */}
          <div style={{ background: '#25D366', padding: '1.6rem 2rem', display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
            <div style={{ width: '4.2rem', height: '4.2rem', borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}>
              <i className="bx bxl-whatsapp" style={{ fontSize: '2.6rem', color: 'white', lineHeight: 1 }} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>Golden Pousso</p>
              <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: '0.7rem', height: '0.7rem', borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
                En ligne
              </p>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontSize: '2rem', lineHeight: 1, padding: '0.2rem' }}>✕</button>
          </div>

          {/* Bulle message d'accueil */}
          <div style={{ padding: '3rem 2.4rem', background: '#ECE5DD', minHeight: '40rem', display: 'flex', alignItems: 'flex-start' }}>
            <div style={{ background: '#fff', borderRadius: '0 1.2rem 1.2rem 1.2rem', padding: '1.2rem 1.6rem', maxWidth: '85%', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
              <p style={{ fontSize: '1.3rem', color: '#1A1208', lineHeight: 1.6 }}>
                👋 Bonjour ! Bienvenue chez <strong>Golden Pousso</strong>.<br/>
                Notre équipe est disponible pour vous conseiller sur nos créations, tailles et commandes sur mesure.<br/>
                Envoyez-nous votre message — nous vous répondrons sur WhatsApp.
              </p>
              <p style={{ fontSize: '1rem', color: '#999', marginTop: '0.4rem', textAlign: 'right' }}>
                {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          {/* Zone saisie */}
          <div style={{ padding: '1.2rem 1.6rem', background: '#F0F0F0', display: 'flex', alignItems: 'flex-end', gap: '1rem' }}>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={onKey}
              placeholder="Écrivez votre message…"
              rows={2}
              style={{
                flex: 1, resize: 'none', border: 'none', borderRadius: '2.4rem',
                padding: '1rem 1.6rem', fontSize: '1.3rem', fontFamily: 'Inter, sans-serif',
                outline: 'none', background: '#fff', color: '#1A1208',
                lineHeight: 1.5, maxHeight: '10rem', overflowY: 'auto',
                boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
              }}
            />
            <button
              onClick={send}
              style={{
                width: '4.2rem', height: '4.2rem', borderRadius: '50%', border: 'none',
                background: '#25D366', cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#1DA851'}
              onMouseLeave={e => e.currentTarget.style.background = '#25D366'}
              aria-label="Envoyer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Bouton flottant — caché quand le chat est ouvert */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Chat WhatsApp"
          style={{
            position: 'fixed', bottom: '8rem', right: '2.4rem', zIndex: 9999,
            width: '5.8rem', height: '5.8rem', borderRadius: '50%', border: 'none',
            background: '#25D366', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(37,211,102,0.45)',
            transition: 'background 0.25s, transform 0.25s, box-shadow 0.25s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#1DA851'; e.currentTarget.style.transform = 'scale(1.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#25D366'; e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <i className="bx bxl-whatsapp" style={{ fontSize: '3rem', color: 'white', lineHeight: 1 }} />
        </button>
      )}

      <style>{`@keyframes chatIn { from { opacity:0; transform:translateY(12px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }`}</style>
    </>
  );
};

function Layout() {
  const { isAuthenticated } = useAuthStore();
  return (
    <>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <HomeFooter />
      {isAuthenticated && <WhatsAppChat />}
      <Toaster position="top-right" />
    </>
  );
}

export default Layout;
