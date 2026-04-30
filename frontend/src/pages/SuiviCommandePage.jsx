import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import apiClient from '../api/client';

const formatFCFA = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

const STATUS_STEPS = [
  { key: 'pending',    label: 'En attente',      icon: '○' },
  { key: 'confirmed',  label: 'Confirmée',        icon: '✓' },
  { key: 'processing', label: 'En préparation',   icon: '◎' },
  { key: 'shipped',    label: 'Expédiée',          icon: '▷' },
  { key: 'delivered',  label: 'Livrée',            icon: '✦' },
];

const STATUS_COLORS = {
  pending:    '#D4AF37',
  confirmed:  '#3b82f6',
  processing: '#8b5cf6',
  shipped:    '#06b6d4',
  delivered:  '#22c55e',
  cancelled:  '#ef4444',
};

const PAYMENT_LABELS = {
  orange_money:     'Orange Money',
  wave:             'Wave',
  free_money:       'Free Money',
  cash_on_delivery: 'Paiement à la livraison',
};

const ZONE_LABELS = {
  dakar_centre:   'Dakar Centre',
  dakar_banlieue: 'Dakar Banlieue / Pikine',
  thies:          'Thiès et environs',
  pickup:         'Retrait en boutique',
};

const SuiviCommandePage = () => {
  const { orderNumber } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [searchContact, setSearchContact] = useState('');

  useEffect(() => {
    if (!orderNumber) return;
    setLoading(true);
    setAccessDenied(false);
    // Récupère phone/email depuis l'URL ou sessionStorage (défini après commande)
    const phone = searchParams.get('phone') || sessionStorage.getItem(`order_phone_${orderNumber}`) || '';
    const email = searchParams.get('email') || sessionStorage.getItem(`order_email_${orderNumber}`) || '';
    const params = phone ? { phone } : email ? { email } : {};
    apiClient.get(`/orders/${orderNumber}/`, { params })
      .then((r) => setOrder(r.data))
      .catch((err) => {
        if (err.response?.status === 403) setAccessDenied(true);
        else setError(true);
      })
      .finally(() => setLoading(false));
  }, [orderNumber, searchParams]);

  const currentStepIdx = order
    ? STATUS_STEPS.findIndex((s) => s.key === order.status)
    : -1;

  const statusColor = order ? (STATUS_COLORS[order.status] || '#8A8A8A') : '#8A8A8A';

  const handleSearch = () => {
    const num = searchInput.trim();
    const contact = searchContact.trim();
    if (!num) return;
    const params = new URLSearchParams();
    if (contact.includes('@')) params.set('email', contact);
    else if (contact) params.set('phone', contact);
    navigate(`/commande/suivi/${num}${params.toString() ? '?' + params.toString() : ''}`);
  };

  /* ── Formulaire de recherche si pas de numéro dans l'URL ── */
  if (!orderNumber) {
    return (
      <>
        <SEOHead title="Suivi de commande" url="/commande/suivi" noindex />
        <div style={{ background: '#0A0A0A', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem' }}>
          <div style={{ maxWidth: '52rem', width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
              <p style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.3em', color: '#D4AF37', marginBottom: '1.6rem' }}>
                Golden Pousso
              </p>
              <h1 style={{ fontFamily: 'Aclonica, serif', fontSize: 'clamp(3rem, 5vw, 4.8rem)', color: '#F5F0EB', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                Suivi de commande
              </h1>
            </div>

            <div style={{ borderTop: '1px solid #2A2A2A', paddingTop: '4rem', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
              {[
                { label: 'Numéro de commande', placeholder: 'ex. GP-2026-00001', value: searchInput, setter: (v) => setSearchInput(v.toUpperCase()) },
                { label: 'Téléphone ou email', placeholder: '+221 77 000 00 00 ou vous@exemple.com', value: searchContact, setter: setSearchContact },
              ].map(({ label, placeholder, value, setter }) => (
                <div key={label}>
                  <label style={{ display: 'block', fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#8A8A8A', marginBottom: '1.2rem' }}>
                    {label}
                  </label>
                  <input
                    type="text" value={value}
                    onChange={(e) => setter(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                    placeholder={placeholder}
                    style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid #2A2A2A', padding: '1.2rem 0', fontSize: '1.5rem', fontFamily: 'Inter, sans-serif', color: '#F5F0EB', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.3s' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#D4AF37'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#2A2A2A'; }}
                  />
                </div>
              ))}
              <button
                onClick={handleSearch}
                style={{ alignSelf: 'flex-end', padding: '1.4rem 4rem', background: '#D4AF37', color: '#0A0A0A', border: 'none', cursor: 'pointer', fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em' }}
              >
                Rechercher →
              </button>
              <p style={{ fontSize: '1.2rem', fontFamily: 'Inter, sans-serif', color: '#444', lineHeight: 1.6 }}>
                Le numéro de commande vous a été communiqué à la confirmation de votre commande.
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (loading) return (
    <div style={{ background: '#0A0A0A', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '4rem', height: '4rem', border: '2px solid #2A2A2A', borderTop: '2px solid #D4AF37', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (accessDenied) return (
    <div style={{ background: '#0A0A0A', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center' }}>
      <div>
        <p style={{ fontSize: '4rem', marginBottom: '2rem' }}>🔒</p>
        <h2 style={{ fontFamily: 'Aclonica, serif', fontSize: '2.8rem', color: '#F5F0EB', marginBottom: '1.2rem' }}>Accès restreint</h2>
        <p style={{ fontSize: '1.4rem', fontFamily: 'Inter, sans-serif', color: '#8A8A8A', marginBottom: '3rem', maxWidth: '42rem', margin: '0 auto 3rem' }}>
          Veuillez indiquer l'email ou le téléphone utilisé lors de la commande pour y accéder.
        </p>
        <Link to="/commande/suivi" style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#D4AF37', textDecoration: 'none', borderBottom: '1px solid #D4AF37', paddingBottom: '0.3rem' }}>
          ← Nouvelle recherche
        </Link>
      </div>
    </div>
  );

  if (error || !order) return (
    <div style={{ background: '#0A0A0A', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center' }}>
      <div>
        <p style={{ fontSize: '4rem', marginBottom: '2rem' }}>✕</p>
        <h2 style={{ fontFamily: 'Aclonica, serif', fontSize: '2.8rem', color: '#F5F0EB', marginBottom: '1.2rem' }}>Commande introuvable</h2>
        <p style={{ fontSize: '1.4rem', fontFamily: 'Inter, sans-serif', color: '#8A8A8A', marginBottom: '3rem' }}>
          Vérifiez le numéro de commande et réessayez.
        </p>
        <Link to="/commande/suivi" style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#D4AF37', textDecoration: 'none', borderBottom: '1px solid #D4AF37', paddingBottom: '0.3rem' }}>
          ← Nouvelle recherche
        </Link>
      </div>
    </div>
  );

  const isCancelled = order.status === 'cancelled';

  return (
    <>
      <SEOHead title={`Commande #${order.order_number}`} url={`/commande/suivi/${order.order_number}`} noindex />

      <div style={{ background: '#0A0A0A', minHeight: '100vh', color: '#F5F0EB', paddingTop: '12rem', paddingBottom: '10rem' }}>
        <div style={{ maxWidth: '86rem', margin: '0 auto', padding: '0 4rem' }}>

          {/* ── En-tête ── */}
          <div style={{ marginBottom: '6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem' }}>
              <div style={{ width: '4.8rem', height: '1px', background: '#D4AF37' }} />
              <p style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.3em', color: '#D4AF37' }}>
                Suivi de commande
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem' }}>
              <div>
                <h1 style={{ fontFamily: 'Aclonica, serif', fontSize: 'clamp(2.8rem, 4vw, 4rem)', color: '#F5F0EB', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: '1rem' }}>
                  #{order.order_number}
                </h1>
                <p style={{ fontSize: '1.3rem', fontFamily: 'Inter, sans-serif', color: '#8A8A8A' }}>
                  Passée le {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.8rem',
                padding: '0.8rem 2rem',
                border: `1px solid ${statusColor}40`,
                background: `${statusColor}12`,
                fontSize: '1.2rem', fontFamily: 'Inter, sans-serif',
                textTransform: 'uppercase', letterSpacing: '0.2em',
                color: statusColor,
              }}>
                {isCancelled ? '✕' : '●'}&nbsp;
                {STATUS_STEPS.find((s) => s.key === order.status)?.label || order.status}
              </span>
            </div>
          </div>

          {/* ── Timeline (si pas annulée) ── */}
          {!isCancelled && (
            <div style={{ marginBottom: '6rem', padding: '4rem', background: '#111', border: '1px solid #2A2A2A' }}>
              <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                {/* Barre de fond */}
                <div style={{
                  position: 'absolute', top: '1.6rem', left: '1.6rem', right: '1.6rem',
                  height: '1px', background: '#2A2A2A', zIndex: 0,
                }} />
                {/* Barre de progression */}
                <div style={{
                  position: 'absolute', top: '1.6rem', left: '1.6rem',
                  height: '1px', background: '#D4AF37', zIndex: 1,
                  width: currentStepIdx >= 0
                    ? `calc(${(currentStepIdx / (STATUS_STEPS.length - 1)) * 100}% * ((100% - 3.2rem) / 100%))`
                    : '0%',
                  transition: 'width 0.8s ease',
                }} />

                {STATUS_STEPS.map((step, i) => {
                  const done = i <= currentStepIdx;
                  const active = i === currentStepIdx;
                  return (
                    <div key={step.key} style={{
                      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2rem', zIndex: 2, position: 'relative',
                    }}>
                      <div style={{
                        width: '3.2rem', height: '3.2rem', borderRadius: '50%',
                        background: done ? '#D4AF37' : '#1A1A1A',
                        border: `1px solid ${done ? '#D4AF37' : '#2A2A2A'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.2rem', color: done ? '#0A0A0A' : '#444',
                        boxShadow: active ? '0 0 0 4px rgba(212,175,55,0.15)' : 'none',
                        transition: 'all 0.4s ease',
                      }}>
                        {done ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        ) : (
                          <div style={{ width: '0.6rem', height: '0.6rem', borderRadius: '50%', background: '#2A2A2A' }} />
                        )}
                      </div>
                      <p style={{
                        fontSize: '1.1rem', fontFamily: 'Inter, sans-serif',
                        textTransform: 'uppercase', letterSpacing: '0.1em',
                        color: done ? '#F5F0EB' : '#444',
                        textAlign: 'center', lineHeight: 1.3,
                      }}>
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Grille détails ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }} className="suivi-grid">

            {/* Articles */}
            <div style={{ gridColumn: '1 / -1', background: '#111', border: '1px solid #2A2A2A', padding: '3rem' }}>
              <h3 style={{ fontFamily: 'Aclonica, serif', fontSize: '1.8rem', color: '#D4AF37', marginBottom: '2.5rem', letterSpacing: '0.02em' }}>
                Articles commandés
              </h3>
              {order.items.map((item, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '1.4rem 0',
                  borderBottom: i < order.items.length - 1 ? '1px solid #2A2A2A' : 'none',
                }}>
                  <div>
                    <p style={{ fontSize: '1.4rem', fontFamily: 'Inter, sans-serif', color: '#F5F0EB', marginBottom: '0.3rem' }}>
                      {item.product_name}
                    </p>
                    <p style={{ fontSize: '1.2rem', fontFamily: 'Inter, sans-serif', color: '#8A8A8A' }}>
                      Qté : {item.quantity} · {formatFCFA(item.product_price)} / unité
                    </p>
                  </div>
                  <p style={{ fontSize: '1.4rem', fontFamily: 'Inter, sans-serif', color: '#D4AF37', fontWeight: 600, whiteSpace: 'nowrap', marginLeft: '2rem' }}>
                    {formatFCFA(item.line_total)}
                  </p>
                </div>
              ))}
            </div>

            {/* Livraison */}
            <div style={{ background: '#111', border: '1px solid #2A2A2A', padding: '3rem' }}>
              <h3 style={{ fontFamily: 'Aclonica, serif', fontSize: '1.8rem', color: '#D4AF37', marginBottom: '2.5rem', letterSpacing: '0.02em' }}>
                Livraison
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <Row label="Client" value={order.customer_name} />
                <Row label="Téléphone" value={order.customer_phone} />
                <Row label="Zone" value={ZONE_LABELS[order.delivery_zone] || order.delivery_zone} />
                {order.delivery_address && <Row label="Adresse" value={order.delivery_address} />}
                <Row label="Frais de livraison" value={order.delivery_fee === 0 ? 'Gratuit' : formatFCFA(order.delivery_fee)} />
              </div>
            </div>

            {/* Paiement + total */}
            <div style={{ background: '#111', border: '1px solid #2A2A2A', padding: '3rem' }}>
              <h3 style={{ fontFamily: 'Aclonica, serif', fontSize: '1.8rem', color: '#D4AF37', marginBottom: '2.5rem', letterSpacing: '0.02em' }}>
                Paiement
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <Row label="Mode" value={PAYMENT_LABELS[order.payment_method] || order.payment_method} />
                <Row label="Statut paiement" value={order.payment_status === 'paid' ? 'Payé ✓' : 'En attente'} valueColor={order.payment_status === 'paid' ? '#22c55e' : '#D4AF37'} />
                <div style={{ marginTop: '1.6rem', paddingTop: '1.6rem', borderTop: '1px solid #2A2A2A' }}>
                  <Row label="Sous-total" value={formatFCFA(order.subtotal)} />
                  <div style={{ marginTop: '0.8rem' }} />
                  <Row label="Livraison" value={order.delivery_fee === 0 ? 'Gratuit' : formatFCFA(order.delivery_fee)} />
                  <div style={{ marginTop: '1.6rem', paddingTop: '1.6rem', borderTop: '1px solid #2A2A2A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.3rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#8A8A8A' }}>Total</span>
                    <span style={{ fontFamily: 'Aclonica, serif', fontSize: '2.2rem', color: '#D4AF37' }}>{formatFCFA(order.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Actions ── */}
          <div style={{ display: 'flex', gap: '1.6rem', flexWrap: 'wrap', marginTop: '4rem' }}>
            <Link
              to="/boutique"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.8rem',
                padding: '1.4rem 3.5rem',
                background: '#D4AF37', color: '#0A0A0A',
                fontSize: '1.1rem', fontFamily: 'Inter, sans-serif',
                textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 600,
                textDecoration: 'none', transition: 'background 0.2s, color 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#C2662D'; e.currentTarget.style.color = '#F5F0EB'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = '#D4AF37'; e.currentTarget.style.color = '#0A0A0A'; }}
            >
              Continuer mes achats
            </Link>
            <Link
              to="/commande/suivi"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.8rem',
                padding: '1.4rem 3.5rem',
                background: 'transparent', color: '#8A8A8A',
                border: '1px solid #2A2A2A',
                fontSize: '1.1rem', fontFamily: 'Inter, sans-serif',
                textTransform: 'uppercase', letterSpacing: '0.2em',
                textDecoration: 'none', transition: 'border-color 0.2s, color 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#D4AF37'; e.currentTarget.style.color = '#D4AF37'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2A2A2A'; e.currentTarget.style.color = '#8A8A8A'; }}
            >
              Chercher une autre commande
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 700px) { .suivi-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </>
  );
};

const Row = ({ label, value, valueColor }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1.6rem' }}>
    <span style={{ fontSize: '1.2rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8A8A8A', flexShrink: 0 }}>
      {label}
    </span>
    <span style={{ fontSize: '1.3rem', fontFamily: 'Inter, sans-serif', color: valueColor || '#F5F0EB', textAlign: 'right' }}>
      {value}
    </span>
  </div>
);

export default SuiviCommandePage;
