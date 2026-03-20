import { useState } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

const ContactPage = () => {
  const [form, setForm] = useState({ name: '', contact: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const inputStyle = { width: '100%', padding: '1rem 1.4rem', borderRadius: '0.8rem', border: '1px solid #e0e0e0', fontSize: '1.4rem', background: '#fafafa' };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.post('/contact/', form);
      toast.success('Message envoyé ! Nous vous répondrons sous 24h.');
      setForm({ name: '', contact: '', subject: '', message: '' });
    } catch { toast.error('Erreur lors de l\'envoi. Réessayez ou appelez-nous directement.'); }
    finally { setLoading(false); }
  };

  return (
    <section className="section">
      {/* En-tête */}
      <div style={{ background: 'linear-gradient(135deg, #0D0D0D 60%, #1a1200)', padding: '6rem 3rem', textAlign: 'center', marginBottom: '5rem' }}>
        <span style={{ color: '#C9A84C', fontSize: '1.4rem', letterSpacing: '0.2em' }}>GOLDEN POUSSO</span>
        <h1 style={{ color: '#fff', fontSize: '3.5rem', fontFamily: 'Aclonica, sans-serif', margin: '1.5rem 0' }}>Contactez-nous</h1>
        <p style={{ color: '#aaa', maxWidth: '50rem', margin: '0 auto' }}>Nous sommes à votre écoute pour toute question sur nos créations et collections.</p>
      </div>

      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem', alignItems: 'flex-start' }}>

          {/* Formulaire */}
          <div>
            <h2 style={{ fontSize: '2.4rem', marginBottom: '2.5rem' }}>Envoyez-nous un message</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
              <div>
                <label style={{ fontSize: '1.4rem', fontWeight: 500, display: 'block', marginBottom: '0.6rem' }}>Nom complet *</label>
                <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Votre nom" style={inputStyle} required />
              </div>
              <div>
                <label style={{ fontSize: '1.4rem', fontWeight: 500, display: 'block', marginBottom: '0.6rem' }}>Email ou Téléphone *</label>
                <input value={form.contact} onChange={(e) => set('contact', e.target.value)} placeholder="vous@exemple.com ou +221 77 000 00 00" style={inputStyle} required />
              </div>
              <div>
                <label style={{ fontSize: '1.4rem', fontWeight: 500, display: 'block', marginBottom: '0.6rem' }}>Sujet *</label>
                <input value={form.subject} onChange={(e) => set('subject', e.target.value)} placeholder="Objet de votre message" style={inputStyle} required />
              </div>
              <div>
                <label style={{ fontSize: '1.4rem', fontWeight: 500, display: 'block', marginBottom: '0.6rem' }}>Message *</label>
                <textarea value={form.message} onChange={(e) => set('message', e.target.value)} rows={5} placeholder="Votre message…" style={{ ...inputStyle, resize: 'vertical', height: 'auto' }} required />
              </div>
              <button type="submit" className="btn" disabled={loading} style={{ background: '#C9A84C', color: '#fff', padding: '1.3rem', fontSize: '1.5rem', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Envoi en cours…' : 'Envoyer le message'}
              </button>
            </form>
          </div>

          {/* Coordonnées + Carte */}
          <div>
            <h2 style={{ fontSize: '2.4rem', marginBottom: '2.5rem' }}>Nos coordonnées</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '3rem' }}>
              {[
                { icon: 'bx-map', label: 'Adresse', value: 'Pikine Tally Boumack, Tableau Gazelle N.2372, Dakar, Sénégal' },
                { icon: 'bx-phone', label: 'Téléphone', value: '33 834 10 17 / 78 126 35 35' },
                { icon: 'bx-envelope', label: 'Email', value: 'contact@goldenpousso.sn' },
                { icon: 'bx-time', label: 'Horaires', value: 'Lun – Sam : 9h00 – 19h00' },
              ].map(({ icon, label, value }) => (
                <div key={label} style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                  <div style={{ width: '4.5rem', height: '4.5rem', borderRadius: '50%', background: '#C9A84C22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={`bx ${icon}`} style={{ fontSize: '2rem', color: '#C9A84C' }}></i>
                  </div>
                  <div>
                    <p style={{ fontSize: '1.3rem', color: 'var(--default-color)', lineHeight: '2rem' }}>{label}</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: 500, lineHeight: '2.4rem' }}>{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Réseaux sociaux */}
            <div style={{ display: 'flex', gap: '1.2rem', marginBottom: '3rem' }}>
              {[['bxl-facebook', '#1877f2'], ['bxl-instagram', '#e4405f'], ['bxl-whatsapp', '#25d366']].map(([icon, color]) => (
                <a key={icon} href="#" style={{ width: '4.5rem', height: '4.5rem', borderRadius: '50%', background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className={`bx ${icon}`} style={{ fontSize: '2.2rem', color }}></i>
                </a>
              ))}
            </div>

            {/* Carte Google Maps */}
            <div style={{ borderRadius: '1.2rem', overflow: 'hidden', boxShadow: 'var(--box-shadow-1)' }}>
              <iframe
                title="Localisation Golden Pousso - Pikine Dakar"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15430.756!2d-17.3917!3d14.7645!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xec10d5a8a5fffff%3A0x0!2sPikine%2C%20Dakar%2C%20S%C3%A9n%C3%A9gal!5e0!3m2!1sfr!2ssn!4v1700000000000"
                width="100%" height="250" style={{ border: 0, display: 'block' }} allowFullScreen loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactPage;
