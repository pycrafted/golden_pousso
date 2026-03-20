import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useCartStore from '../store/cartStore';
import apiClient from '../api/client';

const formatFCFA = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

const DELIVERY_ZONES = [
  { value: 'dakar_centre', label: 'Dakar Centre', fee: 1500 },
  { value: 'dakar_banlieue', label: 'Dakar Banlieue / Pikine', fee: 1000 },
  { value: 'thies', label: 'Thiès et environs', fee: 3000 },
  { value: 'pickup', label: 'Retrait en boutique (Pikine Tally Boumack)', fee: 0 },
];

const PAYMENT_METHODS = [
  { value: 'orange_money', label: 'Orange Money', icon: '📱', instructions: 'Envoyez le montant au 77 XXX XX XX et mentionnez votre numéro de commande.' },
  { value: 'wave', label: 'Wave', icon: '💸', instructions: 'Scannez le QR code Wave en boutique ou envoyez au 77 XXX XX XX.' },
  { value: 'free_money', label: 'Free Money', icon: '📲', instructions: 'Composez le #150# et transférez le montant au 77 XXX XX XX.' },
  { value: 'cash_on_delivery', label: 'Paiement à la livraison', icon: '💵', instructions: 'Préparez le montant exact en espèces pour le livreur.' },
];

const StepIndicator = ({ current }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4rem', gap: 0 }}>
    {['Livraison', 'Paiement', 'Confirmation'].map((label, i) => {
      const step = i + 1;
      const done = current > step;
      const active = current === step;
      return (
        <div key={step} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '4rem', height: '4rem', borderRadius: '50%',
              background: done ? '#22c55e' : active ? '#C9A84C' : '#e0e0e0',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.6rem', fontWeight: 700,
            }}>
              {done ? <i className="bx bx-check"></i> : step}
            </div>
            <span style={{ fontSize: '1.3rem', color: active ? '#C9A84C' : 'var(--default-color)', fontWeight: active ? 600 : 400 }}>
              {label}
            </span>
          </div>
          {i < 2 && <div style={{ width: '8rem', height: '2px', background: done ? '#22c55e' : '#e0e0e0', margin: '0 0.5rem 2rem' }} />}
        </div>
      );
    })}
  </div>
);

const CommandePage = () => {
  const navigate = useNavigate();
  const { items, clearCart } = useCartStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  const [form, setForm] = useState({
    customer_name: '', customer_phone: '', customer_email: '',
    delivery_address: '', delivery_zone: 'dakar_centre', notes: '',
    payment_method: 'cash_on_delivery',
  });

  const zone = DELIVERY_ZONES.find((z) => z.value === form.delivery_zone);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryFee = zone?.fee ?? 1500;
  const total = subtotal + deliveryFee;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  /* ── Étape 1 : Livraison ── */
  const Step1 = () => (
    <div>
      <h3 style={{ fontSize: '2rem', marginBottom: '2.5rem' }}>Informations de livraison</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={{ fontSize: '1.4rem', fontWeight: 500, display: 'block', marginBottom: '0.6rem' }}>Nom complet *</label>
          <input value={form.customer_name} onChange={(e) => set('customer_name', e.target.value)}
            placeholder="Prénom et nom" style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: '1.4rem', fontWeight: 500, display: 'block', marginBottom: '0.6rem' }}>Téléphone * (+221)</label>
          <input value={form.customer_phone} onChange={(e) => set('customer_phone', e.target.value)}
            placeholder="+221 77 000 00 00" style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: '1.4rem', fontWeight: 500, display: 'block', marginBottom: '0.6rem' }}>Email (optionnel)</label>
          <input value={form.customer_email} onChange={(e) => set('customer_email', e.target.value)}
            placeholder="vous@exemple.com" type="email" style={inputStyle} />
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label style={{ fontSize: '1.4rem', fontWeight: 500, display: 'block', marginBottom: '0.6rem' }}>Zone de livraison *</label>
          <select value={form.delivery_zone} onChange={(e) => set('delivery_zone', e.target.value)} style={inputStyle}>
            {DELIVERY_ZONES.map((z) => (
              <option key={z.value} value={z.value}>{z.label} — {z.fee === 0 ? 'Gratuit' : formatFCFA(z.fee)}</option>
            ))}
          </select>
        </div>
        {form.delivery_zone !== 'pickup' && (
          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ fontSize: '1.4rem', fontWeight: 500, display: 'block', marginBottom: '0.6rem' }}>Adresse complète *</label>
            <textarea value={form.delivery_address} onChange={(e) => set('delivery_address', e.target.value)}
              placeholder="Rue, quartier, ville..." rows={3}
              style={{ ...inputStyle, resize: 'vertical', height: 'auto' }} />
          </div>
        )}
        <div style={{ gridColumn: '1/-1' }}>
          <label style={{ fontSize: '1.4rem', fontWeight: 500, display: 'block', marginBottom: '0.6rem' }}>Notes / Instructions (optionnel)</label>
          <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)}
            placeholder="Instructions pour le livreur..." rows={2}
            style={{ ...inputStyle, resize: 'vertical', height: 'auto' }} />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '3rem' }}>
        <button className="btn" onClick={() => {
          if (!form.customer_name || !form.customer_phone) { toast.error('Nom et téléphone requis'); return; }
          setStep(2);
        }} style={{ background: '#C9A84C', color: '#fff', padding: '1.2rem 4rem' }}>
          Continuer → Paiement
        </button>
      </div>
    </div>
  );

  /* ── Étape 2 : Paiement ── */
  const Step2 = () => (
    <div>
      <h3 style={{ fontSize: '2rem', marginBottom: '2.5rem' }}>Mode de paiement</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {PAYMENT_METHODS.map((pm) => (
          <label key={pm.value} style={{
            display: 'flex', alignItems: 'flex-start', gap: '1.5rem', padding: '2rem',
            border: `2px solid ${form.payment_method === pm.value ? '#C9A84C' : '#e0e0e0'}`,
            borderRadius: '1.2rem', cursor: 'pointer',
            background: form.payment_method === pm.value ? '#C9A84C11' : '#fff',
          }}>
            <input type="radio" name="payment" value={pm.value}
              checked={form.payment_method === pm.value}
              onChange={() => set('payment_method', pm.value)}
              style={{ accentColor: '#C9A84C', marginTop: '0.3rem', width: '1.8rem', height: '1.8rem' }} />
            <div>
              <p style={{ fontSize: '1.6rem', fontWeight: 600 }}>{pm.icon} {pm.label}</p>
              {form.payment_method === pm.value && (
                <p style={{ fontSize: '1.3rem', color: 'var(--default-color)', marginTop: '0.5rem', lineHeight: '2rem' }}>
                  {pm.instructions}
                </p>
              )}
            </div>
          </label>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem' }}>
        <button className="btn" onClick={() => setStep(1)} style={{ background: '#f0f0f0', color: 'var(--black-color)' }}>
          ← Retour
        </button>
        <button className="btn" onClick={() => setStep(3)} style={{ background: '#C9A84C', color: '#fff', padding: '1.2rem 4rem' }}>
          Continuer → Récapitulatif
        </button>
      </div>
    </div>
  );

  /* ── Étape 3 : Récapitulatif ── */
  const handleConfirm = async () => {
    setLoading(true);
    try {
      const payload = {
        customer_name: form.customer_name,
        customer_phone: form.customer_phone,
        customer_email: form.customer_email,
        delivery_address: form.delivery_address,
        delivery_zone: form.delivery_zone,
        payment_method: form.payment_method,
        notes: form.notes,
        items: items.map((i) => ({
          product_id: i.product.id,
          variant_id: i.variant?.id ?? null,
          quantity: i.quantity,
        })),
      };
      const res = await apiClient.post('/orders/', payload);
      setOrderNumber(res.data.order_number);
      clearCart();
      setStep(4);
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data || 'Erreur lors de la commande.';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  const Step3 = () => (
    <div>
      <h3 style={{ fontSize: '2rem', marginBottom: '2.5rem' }}>Récapitulatif de la commande</h3>
      <div style={{ background: '#f9f9f9', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem' }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem 0', borderBottom: '1px solid #eee', fontSize: '1.4rem' }}>
            <span>{item.product.name} {item.variant ? `(${[item.variant.size, item.variant.color].filter(Boolean).join('/')})` : ''} × {item.quantity}</span>
            <strong>{formatFCFA(item.price * item.quantity)}</strong>
          </div>
        ))}
        <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.4rem', color: 'var(--default-color)' }}>
            <span>Sous-total</span><span>{formatFCFA(subtotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.4rem', color: 'var(--default-color)' }}>
            <span>Livraison ({zone?.label})</span><span>{deliveryFee === 0 ? 'Gratuit' : formatFCFA(deliveryFee)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.8rem', fontWeight: 700, paddingTop: '1rem', borderTop: '2px solid #e0e0e0' }}>
            <span>Total</span><span style={{ color: '#C9A84C' }}>{formatFCFA(total)}</span>
          </div>
        </div>
      </div>
      <div style={{ background: '#f9f9f9', borderRadius: '1rem', padding: '2rem', marginBottom: '3rem', fontSize: '1.4rem' }}>
        <p><strong>Client :</strong> {form.customer_name} · {form.customer_phone}</p>
        {form.delivery_zone !== 'pickup' && <p><strong>Adresse :</strong> {form.delivery_address}</p>}
        <p><strong>Paiement :</strong> {PAYMENT_METHODS.find((p) => p.value === form.payment_method)?.label}</p>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button className="btn" onClick={() => setStep(2)} style={{ background: '#f0f0f0', color: 'var(--black-color)' }}>← Retour</button>
        <button className="btn" onClick={handleConfirm} disabled={loading}
          style={{ background: '#C9A84C', color: '#fff', padding: '1.2rem 4rem', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Envoi en cours…' : 'Confirmer ma commande ✓'}
        </button>
      </div>
    </div>
  );

  /* ── Confirmation ── */
  const Step4 = () => {
    const pm = PAYMENT_METHODS.find((p) => p.value === form.payment_method);
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div style={{ fontSize: '6rem', marginBottom: '2rem' }}>✅</div>
        <h2 style={{ fontSize: '2.8rem', marginBottom: '1rem' }}>Commande enregistrée !</h2>
        <p style={{ fontSize: '2rem', color: '#C9A84C', fontWeight: 700, marginBottom: '2rem' }}>#{orderNumber}</p>
        <div style={{ background: '#f9f9f9', borderRadius: '1.2rem', padding: '2rem', maxWidth: '50rem', margin: '0 auto 3rem', textAlign: 'left' }}>
          <h4 style={{ fontSize: '1.6rem', marginBottom: '1rem' }}>Instructions de paiement — {pm?.icon} {pm?.label}</h4>
          <p style={{ fontSize: '1.4rem', color: 'var(--default-color)', lineHeight: '2.5rem' }}>{pm?.instructions}</p>
          <p style={{ fontSize: '1.4rem', marginTop: '1rem', fontWeight: 600 }}>Montant à payer : {formatFCFA(total)}</p>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn" onClick={() => navigate(`/commande/suivi/${orderNumber}`)}
            style={{ background: '#C9A84C', color: '#fff' }}>
            Suivre ma commande
          </button>
          <button className="btn" onClick={() => navigate('/boutique')}
            style={{ background: '#f0f0f0', color: 'var(--black-color)' }}>
            Continuer mes achats
          </button>
        </div>
      </div>
    );
  };

  if (items.length === 0 && step < 4) {
    navigate('/panier');
    return null;
  }

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: '80rem', margin: '0 auto' }}>
        <div className="title"><span>GOLDEN POUSSO</span><h2>Finaliser ma commande</h2></div>
        <StepIndicator current={step} />
        {step === 1 && <Step1 />}
        {step === 2 && <Step2 />}
        {step === 3 && <Step3 />}
        {step === 4 && <Step4 />}
      </div>
    </section>
  );
};

const inputStyle = {
  width: '100%', padding: '1rem 1.4rem', borderRadius: '0.8rem',
  border: '1px solid #e0e0e0', fontSize: '1.4rem', background: '#fafafa',
};

export default CommandePage;
