import { useState } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';
import { COLORS, FONT_BODY } from '../theme';

const StockAlertForm = ({ productSlug }) => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await apiClient.post(`/products/${productSlug}/stock-alert/`, { email: email.trim() });
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.email?.[0] || 'Erreur, réessayez.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <p style={{ fontFamily: FONT_BODY, fontSize: '1.2rem', color: '#22c55e', textAlign: 'center', padding: '1.2rem' }}>
        ✓ Vous serez averti(e) dès le retour en stock.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Votre email pour être averti(e)"
        style={{
          flex: 1, minWidth: '18rem', padding: '1.2rem 1.4rem',
          border: '1px solid #CEC0A0', background: 'transparent',
          fontFamily: FONT_BODY, fontSize: '1.3rem', color: COLORS.ink,
          outline: 'none', boxSizing: 'border-box',
        }}
      />
      <button
        type="submit"
        disabled={loading}
        style={{
          padding: '1.2rem 2.4rem', background: COLORS.ink, color: COLORS.cream, border: 'none',
          fontFamily: FONT_BODY, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
          fontSize: '1.1rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? '…' : 'Me prévenir'}
      </button>
    </form>
  );
};

export default StockAlertForm;
