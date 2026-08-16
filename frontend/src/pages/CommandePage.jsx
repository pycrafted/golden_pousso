import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import useCartStore from '../store/cartStore';
import SEOHead from '../components/SEOHead';
import apiClient from '../api/client';

const formatFCFA = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

const DELIVERY_ZONES = [
  { value: 'dakar_centre',   label: 'Dakar Centre',                    fee: 1500, delay: '24h' },
  { value: 'dakar_banlieue', label: 'Dakar Banlieue / Pikine',         fee: 1000, delay: '24h' },
  { value: 'thies',          label: 'Thiès et environs',               fee: 3000, delay: '2–3 jours' },
  { value: 'pickup',         label: 'Retrait en boutique (Pikine Tally Boumack)', fee: 0, delay: 'Immédiat' },
];

const PAYMENT_METHODS = [
  { value: 'card',             label: 'Carte bancaire',          icon: '💳', instructions: 'Vous serez redirigé vers la page de paiement sécurisée PayDunya (Visa, Mastercard, Orange Money, Wave…).', paydunya: true },
  { value: 'orange_money',     label: 'Orange Money',           icon: '📱', instructions: 'Envoyez le montant au 77 XXX XX XX et mentionnez votre numéro de commande.' },
  { value: 'wave',             label: 'Wave',                   icon: '💸', instructions: 'Scannez le QR code Wave en boutique ou envoyez au 77 XXX XX XX.' },
  { value: 'free_money',       label: 'Free Money',             icon: '📲', instructions: 'Composez le #150# et transférez le montant au 77 XXX XX XX.' },
  { value: 'cash_on_delivery', label: 'Paiement à la livraison', icon: '💵', instructions: 'Préparez le montant exact en espèces pour le livreur.' },
];

const inputStyle = {
  width: '100%', padding: '1.2rem 0',
  background: 'transparent', border: 'none',
  borderBottom: '1px solid #CEC0A0',
  color: '#1A1208', fontSize: '1.4rem', fontFamily: 'Inter, sans-serif',
  outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.3s',
};

const ctaPrimary = {
  padding: '1.4rem 4rem',
  background: '#B8960A', color: '#FAF6EE',
  border: 'none', cursor: 'pointer',
  fontSize: '1.1rem', fontFamily: 'Inter, sans-serif',
  fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em',
  transition: 'background 0.25s, color 0.25s',
};

const ctaSecondary = {
  padding: '1.4rem 3rem',
  background: 'transparent', color: '#7A6A50',
  border: '1px solid #E0D0B8', cursor: 'pointer',
  fontSize: '1.1rem', fontFamily: 'Inter, sans-serif',
  textTransform: 'uppercase', letterSpacing: '0.2em',
  transition: 'border-color 0.2s, color 0.2s',
};

const Label = ({ children }) => (
  <label style={{ display: 'block', fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#7A6A50', marginBottom: '0.8rem' }}>
    {children}
  </label>
);

/* ── Indicateur d'étapes ── */
const StepIndicator = ({ current }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '6rem', gap: 0 }}>
    {['Livraison', 'Paiement', 'Confirmation'].map((label, i) => {
      const step = i + 1;
      const done = current > step;
      const active = current === step;
      return (
        <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{
              width: '3.6rem', height: '3.6rem', borderRadius: '50%',
              background: done ? '#22c55e' : active ? '#B8960A' : 'transparent',
              border: `1px solid ${done ? '#22c55e' : active ? '#B8960A' : '#CEC0A0'}`,
              color: done || active ? '#FAF6EE' : '#7A6A50',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', fontWeight: 700, fontFamily: 'Inter, sans-serif',
              boxShadow: active ? '0 0 0 4px rgba(184,150,10,0.12)' : 'none',
              transition: 'all 0.3s',
            }}>
              {done ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              ) : step}
            </div>
            <span style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.15em', color: active ? '#1A1208' : '#7A6A50' }}>
              {label}
            </span>
          </div>
          {i < 2 && (
            <div style={{ width: '8rem', height: '1px', background: done ? '#22c55e' : '#E0D0B8', margin: '0 0.5rem 2.4rem', transition: 'background 0.3s' }} />
          )}
        </div>
      );
    })}
  </div>
);

/* ── Récapitulatif commande (colonne droite) ── */
const OrderSummary = ({ items, subtotal, deliveryFee, total }) => (
  <div style={{ background: '#F0E8D8', border: '1px solid #CEC0A0', padding: '3rem' }}>
    <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.8rem', color: '#B8960A', marginBottom: '2.5rem', letterSpacing: '0.02em' }}>
      Votre commande
    </h3>
    {items.map((item, i) => (
      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '1.2rem 0', borderBottom: '1px solid #E0D0B8', gap: '1.6rem' }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: '1.3rem', fontFamily: 'Inter, sans-serif', color: '#1A1208', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.product.name}
          </p>
          {item.variant && (
            <p style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', color: '#7A6A50', marginTop: '0.3rem' }}>
              {[item.variant.size, item.variant.color].filter(Boolean).join(' · ')}
            </p>
          )}
          <p style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', color: '#7A6A50', marginTop: '0.3rem' }}>
            × {item.quantity}
          </p>
        </div>
        <p style={{ fontSize: '1.3rem', fontFamily: 'Inter, sans-serif', color: '#B8960A', flexShrink: 0, whiteSpace: 'nowrap' }}>
          {formatFCFA(item.price * item.quantity)}
        </p>
      </div>
    ))}
    <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.3rem', fontFamily: 'Inter, sans-serif', color: '#7A6A50' }}>
        <span>Sous-total</span><span>{formatFCFA(subtotal)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.3rem', fontFamily: 'Inter, sans-serif', color: '#7A6A50' }}>
        <span>Livraison</span>
        <span>{deliveryFee === 0 ? 'Gratuit' : formatFCFA(deliveryFee)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '1.6rem', borderTop: '1px solid #E0D0B8' }}>
        <span style={{ fontSize: '1.3rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#7A6A50' }}>Total</span>
        <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '2.2rem', color: '#B8960A' }}>{formatFCFA(total)}</span>
      </div>
    </div>
  </div>
);

/* ── Étape 1 : Livraison ── */
const Step1 = ({ form, set, setStep }) => (
  <div>
    <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '2.4rem', color: '#1A1208', marginBottom: '4rem', letterSpacing: '-0.01em' }}>
      Informations de livraison
    </h2>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 3rem' }} className="form-grid">
      <div style={{ gridColumn: '1 / -1', marginBottom: '3rem' }}>
        <Label>Nom complet *</Label>
        <input value={form.customer_name} onChange={(e) => set('customer_name', e.target.value)}
          placeholder="Prénom et nom" style={inputStyle}
          onFocus={(e) => e.currentTarget.style.borderColor = '#B8960A'}
          onBlur={(e) => e.currentTarget.style.borderColor = '#CEC0A0'} />
      </div>
      <div style={{ marginBottom: '3rem' }}>
        <Label>Téléphone *</Label>
        <div
          style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #CEC0A0', transition: 'border-color 0.2s' }}
          onFocusCapture={(e) => e.currentTarget.style.borderColor = '#B8960A'}
          onBlurCapture={(e) => e.currentTarget.style.borderColor = '#CEC0A0'}
        >
          <span style={{ fontSize: '1.4rem', fontFamily: 'Inter, sans-serif', color: '#7A6A50', padding: '1.2rem 0.8rem 1.2rem 0', whiteSpace: 'nowrap', userSelect: 'none' }}>
            +221
          </span>
          <span style={{ color: '#CEC0A0', marginRight: '0.6rem', fontSize: '1.2rem' }}>|</span>
          <input
            value={form.customer_phone}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
              set('customer_phone', digits);
            }}
            placeholder="77 000 00 00"
            inputMode="numeric"
            style={{ ...inputStyle, borderBottom: 'none', flex: 1, padding: '1.2rem 0' }}
          />
        </div>
      </div>
      <div style={{ marginBottom: '3rem' }}>
        <Label>Email (optionnel)</Label>
        <input value={form.customer_email} onChange={(e) => set('customer_email', e.target.value)}
          placeholder="vous@exemple.com" type="email" style={inputStyle}
          onFocus={(e) => e.currentTarget.style.borderColor = '#B8960A'}
          onBlur={(e) => e.currentTarget.style.borderColor = '#CEC0A0'} />
      </div>
      <div style={{ gridColumn: '1 / -1', marginBottom: '3rem' }}>
        <Label>Zone de livraison *</Label>
        <select value={form.delivery_zone} onChange={(e) => set('delivery_zone', e.target.value)}
          style={{ ...inputStyle, cursor: 'pointer' }}>
          {DELIVERY_ZONES.map((z) => (
            <option key={z.value} value={z.value} style={{ background: '#F0E8D8', color: '#1A1208' }}>
              {z.label} — {z.fee === 0 ? 'Gratuit' : formatFCFA(z.fee)} · {z.delay}
            </option>
          ))}
        </select>
      </div>
      {form.delivery_zone !== 'pickup' && (
        <div style={{ gridColumn: '1 / -1', marginBottom: '3rem' }}>
          <Label>Adresse complète *</Label>
          <textarea value={form.delivery_address} onChange={(e) => set('delivery_address', e.target.value)}
            placeholder="Rue, quartier, ville..." rows={3}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#B8960A'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#CEC0A0'} />
        </div>
      )}
      <div style={{ gridColumn: '1 / -1', marginBottom: '3rem' }}>
        <label style={{
          display: 'flex', alignItems: 'center', gap: '1.2rem', padding: '1.6rem 2rem', cursor: 'pointer',
          border: `1px solid ${form.is_gift ? '#B8960A' : '#CEC0A0'}`,
          background: form.is_gift ? 'rgba(184,150,10,0.06)' : 'transparent',
          transition: 'border-color 0.2s, background 0.2s',
        }}>
          <input type="checkbox" checked={form.is_gift} onChange={(e) => set('is_gift', e.target.checked)}
            style={{ accentColor: '#B8960A', width: '1.8rem', height: '1.8rem', flexShrink: 0 }} />
          <span style={{ fontSize: '1.3rem', fontFamily: 'Inter, sans-serif', color: '#1A1208' }}>
            🎁 C'est un cadeau pour quelqu'un d'autre
          </span>
        </label>

        {form.is_gift && (
          <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 3rem' }} className="form-grid">
            <div style={{ gridColumn: '1 / -1', marginBottom: '2rem' }}>
              <Label>Nom du destinataire</Label>
              <input value={form.gift_recipient} onChange={(e) => set('gift_recipient', e.target.value)}
                placeholder="Prénom et nom" style={inputStyle}
                onFocus={(e) => e.currentTarget.style.borderColor = '#B8960A'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#CEC0A0'} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <Label>Message cadeau (optionnel)</Label>
              <textarea value={form.gift_message} onChange={(e) => set('gift_message', e.target.value)}
                placeholder="Un petit mot pour accompagner le cadeau..." rows={2}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#B8960A'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#CEC0A0'} />
            </div>
          </div>
        )}
      </div>
      <div style={{ gridColumn: '1 / -1', marginBottom: '4rem' }}>
        <Label>Notes / Instructions (optionnel)</Label>
        <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)}
          placeholder="Instructions pour le livreur..." rows={2}
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
          onFocus={(e) => e.currentTarget.style.borderColor = '#B8960A'}
          onBlur={(e) => e.currentTarget.style.borderColor = '#CEC0A0'} />
      </div>
    </div>
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <button
        onClick={() => {
          if (!form.customer_name || !form.customer_phone) { toast.error('Nom et téléphone requis'); return; }
          setStep(2);
        }}
        style={ctaPrimary}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#C2662D'; e.currentTarget.style.color = '#1A1208'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = '#B8960A'; e.currentTarget.style.color = '#FAF6EE'; }}
      >
        Paiement →
      </button>
    </div>
  </div>
);

/* ── Étape 2 : Paiement ── */
const Step2 = ({ form, set, setStep }) => (
  <div>
    <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '2.4rem', color: '#1A1208', marginBottom: '4rem', letterSpacing: '-0.01em' }}>
      Mode de paiement
    </h2>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginBottom: '4rem' }}>
      {PAYMENT_METHODS.map((pm) => {
        const active = form.payment_method === pm.value;
        return (
          <label key={pm.value} style={{
            display: 'flex', alignItems: 'flex-start', gap: '1.6rem', padding: '2rem 2.4rem',
            border: `1px solid ${active ? '#B8960A' : '#CEC0A0'}`,
            background: active ? 'rgba(184,150,10,0.06)' : 'transparent',
            cursor: 'pointer', transition: 'border-color 0.2s, background 0.2s',
          }}>
            <input type="radio" name="payment" value={pm.value}
              checked={active} onChange={() => set('payment_method', pm.value)}
              style={{ accentColor: '#B8960A', marginTop: '0.3rem', width: '1.6rem', height: '1.6rem', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: active ? '0.8rem' : 0 }}>
                <p style={{ fontSize: '1.5rem', fontFamily: 'Inter, sans-serif', fontWeight: 500, color: '#1A1208', margin: 0 }}>
                  {pm.icon} {pm.label}
                </p>
                {pm.paydunya && (
                  <span style={{ fontSize: '1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.15em', padding: '0.2rem 0.8rem', background: 'rgba(184,150,10,0.12)', color: '#B8960A', border: '1px solid rgba(184,150,10,0.25)' }}>
                    Recommandé
                  </span>
                )}
              </div>
              {active && (
                <p style={{ fontSize: '1.3rem', fontFamily: 'Inter, sans-serif', color: '#7A6A50', lineHeight: 1.7 }}>
                  {pm.instructions}
                </p>
              )}
            </div>
          </label>
        );
      })}
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1.2rem', flexWrap: 'wrap' }}>
      <button onClick={() => setStep(1)} style={ctaSecondary}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#B8960A'; e.currentTarget.style.color = '#B8960A'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#CEC0A0'; e.currentTarget.style.color = '#7A6A50'; }}
      >← Livraison</button>
      <button onClick={() => setStep(3)} style={ctaPrimary}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#C2662D'; e.currentTarget.style.color = '#1A1208'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = '#B8960A'; e.currentTarget.style.color = '#FAF6EE'; }}
      >Récapitulatif →</button>
    </div>
  </div>
);

/* ── Étape 3 : Récapitulatif ── */
const Step3 = ({ form, zone, setStep, handleConfirm, loading }) => (
  <div>
    <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '2.4rem', color: '#1A1208', marginBottom: '4rem', letterSpacing: '-0.01em' }}>
      Récapitulatif
    </h2>
    <div style={{ background: '#F0E8D8', border: '1px solid #CEC0A0', padding: '2.4rem', marginBottom: '2rem' }}>
      <p style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#B8960A', marginBottom: '1.6rem' }}>Client</p>
      <p style={{ fontSize: '1.4rem', fontFamily: 'Inter, sans-serif', color: '#1A1208', marginBottom: '0.4rem' }}>{form.customer_name}</p>
      <p style={{ fontSize: '1.3rem', fontFamily: 'Inter, sans-serif', color: '#7A6A50' }}>+221{form.customer_phone}</p>
      {form.customer_email && <p style={{ fontSize: '1.3rem', fontFamily: 'Inter, sans-serif', color: '#7A6A50' }}>{form.customer_email}</p>}
    </div>
    <div style={{ background: '#F0E8D8', border: '1px solid #CEC0A0', padding: '2.4rem', marginBottom: '2rem' }}>
      <p style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#B8960A', marginBottom: '1.6rem' }}>Livraison</p>
      <p style={{ fontSize: '1.3rem', fontFamily: 'Inter, sans-serif', color: '#1A1208', marginBottom: '0.4rem' }}>{zone?.label}</p>
      {form.delivery_zone !== 'pickup' && form.delivery_address && (
        <p style={{ fontSize: '1.3rem', fontFamily: 'Inter, sans-serif', color: '#7A6A50' }}>{form.delivery_address}</p>
      )}
      <p style={{ fontSize: '1.2rem', fontFamily: 'Inter, sans-serif', color: '#B8960A', marginTop: '0.6rem' }}>
        ⏱ Délai estimé : {zone?.delay}
      </p>
    </div>
    <div style={{ background: '#F0E8D8', border: '1px solid #CEC0A0', padding: '2.4rem', marginBottom: '4rem' }}>
      <p style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#B8960A', marginBottom: '1.6rem' }}>Paiement</p>
      <p style={{ fontSize: '1.4rem', fontFamily: 'Inter, sans-serif', color: '#1A1208' }}>
        {PAYMENT_METHODS.find((p) => p.value === form.payment_method)?.icon}{' '}
        {PAYMENT_METHODS.find((p) => p.value === form.payment_method)?.label}
      </p>
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1.2rem', flexWrap: 'wrap' }}>
      <button onClick={() => setStep(2)} style={ctaSecondary}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#B8960A'; e.currentTarget.style.color = '#B8960A'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#CEC0A0'; e.currentTarget.style.color = '#7A6A50'; }}
      >← Paiement</button>
      <button onClick={handleConfirm} disabled={loading}
        style={{ ...ctaPrimary, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
        onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = '#C2662D'; e.currentTarget.style.color = '#1A1208'; } }}
        onMouseLeave={(e) => { e.currentTarget.style.background = '#B8960A'; e.currentTarget.style.color = '#FAF6EE'; }}
      >
        {loading
          ? (form.payment_method === 'card' ? 'Redirection…' : 'Envoi…')
          : (form.payment_method === 'card' ? '💳 Payer par carte →' : 'Confirmer ma commande ✓')}
      </button>
    </div>
  </div>
);

/* ── Étape 4 : Confirmation ── */
const Step4 = ({ form, orderNumber, total }) => {
  const pm = PAYMENT_METHODS.find((p) => p.value === form.payment_method);
  return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      <div style={{ width: '7rem', height: '7rem', borderRadius: '50%', background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 3rem' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <p style={{ fontSize: '1.2rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.3em', color: '#B8960A', marginBottom: '1.6rem' }}>
        Commande enregistrée
      </p>
      <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(2.8rem, 4vw, 4.2rem)', color: '#1A1208', letterSpacing: '-0.02em', marginBottom: '1.2rem', lineHeight: 1.1 }}>
        #{orderNumber}
      </h2>
      <p style={{ fontSize: '1.4rem', fontFamily: 'Inter, sans-serif', color: '#7A6A50', marginBottom: '4rem' }}>
        Notez ce numéro pour suivre votre commande.
      </p>
      <div style={{ background: '#F0E8D8', border: '1px solid #CEC0A0', padding: '3rem', maxWidth: '52rem', margin: '0 auto 4rem', textAlign: 'left' }}>
        <p style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#B8960A', marginBottom: '1.6rem' }}>
          Instructions de paiement — {pm?.icon} {pm?.label}
        </p>
        <p style={{ fontSize: '1.4rem', fontFamily: 'Inter, sans-serif', color: '#7A6A50', lineHeight: 1.8 }}>{pm?.instructions}</p>
        <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #E0D0B8', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '1.2rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#7A6A50' }}>Montant à payer</span>
          <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '2rem', color: '#B8960A' }}>{formatFCFA(total)}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '1.2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link
          to={`/commande/suivi/${orderNumber}`}
          style={{ ...ctaPrimary, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#C2662D'; e.currentTarget.style.color = '#1A1208'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#B8960A'; e.currentTarget.style.color = '#FAF6EE'; }}
        >
          Suivre ma commande
        </Link>
        <Link
          to="/recherche"
          style={{ ...ctaSecondary, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#B8960A'; e.currentTarget.style.color = '#B8960A'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#CEC0A0'; e.currentTarget.style.color = '#7A6A50'; }}
        >
          Continuer mes achats
        </Link>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   Page principale
══════════════════════════════════════════════════════════════ */
const CommandePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { items, clearCart } = useCartStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  useEffect(() => {
    const payment = searchParams.get('payment');
    if (payment === 'cancel') {
      toast.error('Paiement annulé. Vous pouvez réessayer.');
    }
  }, []);

  const [form, setForm] = useState({
    customer_name: '', customer_phone: '', customer_email: '',
    delivery_address: '', delivery_zone: 'dakar_centre', notes: '',
    payment_method: 'cash_on_delivery',
    is_gift: false, gift_recipient: '', gift_message: '',
  });

  const zone = DELIVERY_ZONES.find((z) => z.value === form.delivery_zone);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryFee = zone?.fee ?? 1500;
  const total = subtotal + deliveryFee;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  if (items.length === 0 && step < 4) {
    navigate('/panier');
    return null;
  }

  const handleConfirm = async () => {
    setLoading(true);
    const fullPhone = form.customer_phone ? `+221${form.customer_phone}` : '';
    const notes = form.is_gift
      ? [
          `🎁 CADEAU — Destinataire : ${form.gift_recipient || '(non précisé)'}`,
          form.gift_message ? `Message : ${form.gift_message}` : null,
          form.notes || null,
        ].filter(Boolean).join('\n')
      : form.notes;
    const payload = {
      customer_name: form.customer_name,
      customer_phone: fullPhone,
      customer_email: form.customer_email,
      delivery_address: form.delivery_address,
      delivery_zone: form.delivery_zone,
      payment_method: form.payment_method,
      notes,
      items: items.map((i) => ({
        product_id: i.product.id,
        variant_id: i.variant?.id ?? null,
        quantity: i.quantity,
      })),
    };

    try {
      if (form.payment_method === 'card') {
        const res = await apiClient.post('/paiement/initier/', payload);
        sessionStorage.setItem(`order_phone_${res.data.order_number}`, fullPhone);
        if (form.customer_email) sessionStorage.setItem(`order_email_${res.data.order_number}`, form.customer_email);
        clearCart();
        window.location.href = res.data.invoice_url;
      } else {
        const res = await apiClient.post('/orders/', payload);
        sessionStorage.setItem(`order_phone_${res.data.order_number}`, fullPhone);
        if (form.customer_email) sessionStorage.setItem(`order_email_${res.data.order_number}`, form.customer_email);
        setOrderNumber(res.data.order_number);
        clearCart();
        setStep(4);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data || 'Erreur lors de la commande.';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh', color: '#1A1208', paddingTop: '10rem', paddingBottom: '10rem' }}>
      <SEOHead title="Commande" url="/commande" noindex />

      <div style={{ maxWidth: '110rem', margin: '0 auto', padding: '0 4rem' }}>

        {/* En-tête */}
        <div style={{ marginBottom: '5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem' }}>
            <div style={{ width: '4.8rem', height: '1px', background: '#B8960A' }} />
            <p style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.3em', color: '#B8960A' }}>
              Golden Pousso
            </p>
          </div>
          <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(3rem, 4vw, 4.5rem)', color: '#1A1208', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            Finaliser ma commande
          </h1>
        </div>

        <StepIndicator current={step} />

        {step < 4 ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 38rem', gap: '6rem', alignItems: 'flex-start' }} className="commande-grid">
            <div>
              {step === 1 && <Step1 form={form} set={set} setStep={setStep} />}
              {step === 2 && <Step2 form={form} set={set} setStep={setStep} />}
              {step === 3 && <Step3 form={form} zone={zone} setStep={setStep} handleConfirm={handleConfirm} loading={loading} />}
            </div>
            <OrderSummary items={items} subtotal={subtotal} deliveryFee={deliveryFee} total={total} />
          </div>
        ) : (
          <Step4 form={form} orderNumber={orderNumber} total={total} />
        )}
      </div>

      <style>{`
        @media (max-width: 900px) { .commande-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 600px) { .form-grid { grid-template-columns: 1fr !important; } }
        select option { background: #F0E8D8 !important; color: #1A1208 !important; }
      `}</style>
    </div>
  );
};

export default CommandePage;
