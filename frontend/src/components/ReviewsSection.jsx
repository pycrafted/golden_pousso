import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiClient from '../api/client';
import useAuthStore from '../store/authStore';
import { COLORS, RADIUS, FONT_DISPLAY, FONT_BODY } from '../theme';

const Stars = ({ value, size = '1.6rem', onRate }) => (
  <div style={{ display: 'flex', gap: '0.2rem' }}>
    {[1, 2, 3, 4, 5].map((n) => (
      <span
        key={n}
        onClick={() => onRate && onRate(n)}
        style={{
          fontSize: size,
          cursor: onRate ? 'pointer' : 'default',
          color: n <= value ? COLORS.gold : 'rgba(0,0,0,0.15)',
          lineHeight: 1,
        }}
      >
        ★
      </span>
    ))}
  </div>
);

const ReviewsSection = ({ productSlug }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    apiClient.get(`/products/${productSlug}/reviews/`)
      .then((r) => setReviews(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productSlug]);

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) { toast.error('Choisissez une note'); return; }
    if (!comment.trim()) { toast.error('Ajoutez un commentaire'); return; }
    setSubmitting(true);
    try {
      await apiClient.post(`/products/${productSlug}/reviews/`, { rating, comment });
      toast.success('Merci pour votre avis ! Il sera visible après modération.');
      setRating(0);
      setComment('');
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Erreur lors de l'envoi.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <div style={{ marginTop: '8rem', borderTop: '1px solid #2A2A2A', paddingTop: '6rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '1.6rem' }}>
        <div style={{ width: '4.8rem', height: '1px', background: COLORS.gold }} />
        <p style={{ fontSize: '1.1rem', fontFamily: FONT_BODY, textTransform: 'uppercase', letterSpacing: '0.3em', color: COLORS.gold }}>
          Avis clients
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.6rem', marginBottom: '4rem', flexWrap: 'wrap' }}>
        <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 'clamp(2.4rem, 3.5vw, 3.6rem)', color: COLORS.ink, letterSpacing: '-0.02em' }}>
          {reviews.length > 0 ? `${avg.toFixed(1)} / 5` : 'Aucun avis pour le moment'}
        </h2>
        {reviews.length > 0 && <Stars value={Math.round(avg)} />}
        {reviews.length > 0 && (
          <span style={{ fontSize: '1.3rem', color: COLORS.mutedOnLight, fontFamily: FONT_BODY }}>
            ({reviews.length} avis)
          </span>
        )}
      </div>

      {reviews.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.4rem', marginBottom: '4rem', maxWidth: '72rem' }}>
          {reviews.map((r) => (
            <div key={r.id} style={{ paddingBottom: '2.4rem', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '0.8rem', flexWrap: 'wrap' }}>
                <Stars value={r.rating} size="1.3rem" />
                <span style={{ fontFamily: FONT_BODY, fontSize: '1.3rem', fontWeight: 600, color: COLORS.ink }}>
                  {r.customer_name}
                </span>
              </div>
              <p style={{ fontFamily: FONT_BODY, fontSize: '1.3rem', color: COLORS.mutedOnLight, lineHeight: 1.7 }}>
                {r.comment}
              </p>
              {r.photo && (
                <img src={r.photo} alt="" style={{ width: '8rem', height: '8rem', objectFit: 'cover', marginTop: '1.2rem', borderRadius: RADIUS }} />
              )}
            </div>
          ))}
        </div>
      )}

      {isAuthenticated ? (
        submitted ? null : (
          <form onSubmit={handleSubmit} style={{ maxWidth: '56rem', padding: '2.4rem', background: '#F4EFE4' }}>
            <p style={{ fontFamily: FONT_BODY, fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: COLORS.mutedOnLight, marginBottom: '1.6rem' }}>
              Laisser un avis
            </p>
            <div style={{ marginBottom: '1.6rem' }}>
              <Stars value={rating} onRate={setRating} size="2.2rem" />
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Votre expérience avec ce produit..."
              rows={3}
              style={{
                width: '100%', padding: '1.2rem', border: '1px solid #CEC0A0', background: 'transparent',
                fontFamily: FONT_BODY, fontSize: '1.3rem', resize: 'vertical', marginBottom: '1.6rem',
                boxSizing: 'border-box', color: COLORS.ink,
              }}
            />
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '1.2rem 3rem', background: COLORS.gold, color: COLORS.cream, border: 'none',
                fontFamily: FONT_BODY, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
                fontSize: '1.2rem', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? 'Envoi…' : 'Publier mon avis'}
            </button>
          </form>
        )
      ) : (
        <p style={{ fontFamily: FONT_BODY, fontSize: '1.3rem', color: COLORS.mutedOnLight }}>
          <Link to="/mon-compte" style={{ color: COLORS.gold, textDecoration: 'underline' }}>Connectez-vous</Link> pour laisser un avis.
        </p>
      )}
    </div>
  );
};

export default ReviewsSection;
