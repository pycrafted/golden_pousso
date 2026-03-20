import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import apiClient from '../api/client';

const formatFCFA = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

const STATUS_LABELS = {
  pending: { label: 'En attente', color: '#e8a000' },
  confirmed: { label: 'Confirmée', color: '#3b82f6' },
  processing: { label: 'En préparation', color: '#8b5cf6' },
  shipped: { label: 'Expédiée', color: '#06b6d4' },
  delivered: { label: 'Livrée', color: '#22c55e' },
  cancelled: { label: 'Annulée', color: '#ef4444' },
};

/* ── Formulaire Login/Inscription ── */
const AuthForm = () => {
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuthStore();
  const navigate = useNavigate();

  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ first_name: '', last_name: '', email: '', phone: '', password: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(loginData.email, loginData.password);
      toast.success('Connexion réussie !');
    } catch {
      toast.error('Email ou mot de passe incorrect.');
    } finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(registerData);
      toast.success('Compte créé avec succès !');
    } catch (err) {
      toast.error(err.response?.data?.email?.[0] || 'Erreur lors de la création du compte.');
    } finally { setLoading(false); }
  };

  const inputStyle = { width: '100%', padding: '1rem 1.4rem', borderRadius: '0.8rem', border: '1px solid #e0e0e0', fontSize: '1.4rem', background: '#fafafa', marginBottom: '1.5rem' };

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: '50rem', margin: '0 auto' }}>
        <div className="title"><span>GOLDEN POUSSO</span><h2>Mon Compte</h2></div>

        {/* Onglets */}
        <div style={{ display: 'flex', borderBottom: '2px solid #f0f0f0', marginBottom: '3rem' }}>
          {[['login', 'Se connecter'], ['register', 'Créer un compte']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              flex: 1, padding: '1.2rem', fontSize: '1.5rem', cursor: 'pointer', background: 'none',
              borderBottom: tab === key ? '3px solid #C9A84C' : '3px solid transparent',
              color: tab === key ? '#C9A84C' : 'var(--default-color)', fontWeight: tab === key ? 700 : 400,
              marginBottom: '-2px',
            }}>{label}</button>
          ))}
        </div>

        {tab === 'login' ? (
          <form onSubmit={handleLogin}>
            <input value={loginData.email} onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
              type="email" placeholder="Email" style={inputStyle} required />
            <input value={loginData.password} onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              type="password" placeholder="Mot de passe" style={inputStyle} required />
            <button type="submit" className="btn" disabled={loading}
              style={{ width: '100%', background: '#C9A84C', color: '#fff', padding: '1.3rem', fontSize: '1.5rem', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1.5rem' }}>
              <input value={registerData.first_name} onChange={(e) => setRegisterData({ ...registerData, first_name: e.target.value })}
                placeholder="Prénom" style={inputStyle} required />
              <input value={registerData.last_name} onChange={(e) => setRegisterData({ ...registerData, last_name: e.target.value })}
                placeholder="Nom" style={inputStyle} />
            </div>
            <input value={registerData.email} onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
              type="email" placeholder="Email *" style={inputStyle} required />
            <input value={registerData.phone} onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
              placeholder="Téléphone (+221)" style={inputStyle} />
            <input value={registerData.password} onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
              type="password" placeholder="Mot de passe (min. 6 caractères)" style={inputStyle} required />
            <button type="submit" className="btn" disabled={loading}
              style={{ width: '100%', background: '#C9A84C', color: '#fff', padding: '1.3rem', fontSize: '1.5rem', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Création…' : 'Créer mon compte'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
};

/* ── Dashboard ── */
const Dashboard = () => {
  const { user, logout, updateProfile } = useAuthStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState('profil');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [profileData, setProfileData] = useState({ first_name: user?.first_name || '', last_name: user?.last_name || '', phone: user?.phone || '', default_address: user?.default_address || '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    if (tab === 'commandes') {
      setLoadingOrders(true);
      apiClient.get('/orders/mes-commandes/').then((r) => setOrders(r.data)).catch(() => {}).finally(() => setLoadingOrders(false));
    }
  }, [tab]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile(profileData);
      toast.success('Profil mis à jour !');
    } catch { toast.error('Erreur lors de la mise à jour.'); }
    finally { setSavingProfile(false); }
  };

  const inputStyle = { width: '100%', padding: '1rem 1.4rem', borderRadius: '0.8rem', border: '1px solid #e0e0e0', fontSize: '1.4rem', background: '#fafafa' };
  const tabs = [['profil', 'Mon Profil'], ['commandes', 'Mes Commandes'], ['adresses', 'Mes Adresses']];

  return (
    <section className="section">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="title" style={{ marginBottom: 0 }}>
              <span>BIENVENUE</span>
              <h2>{user?.first_name ? `${user.first_name} ${user.last_name}` : user?.email}</h2>
            </div>
          </div>
          <button onClick={() => { logout(); toast.success('Déconnecté.'); navigate('/'); }}
            className="btn" style={{ background: '#f0f0f0', color: 'var(--black-color)' }}>
            <i className="bx bx-log-out" style={{ marginRight: '0.5rem' }}></i> Déconnexion
          </button>
        </div>

        <div style={{ display: 'flex', gap: '3rem', alignItems: 'flex-start' }}>
          {/* Sidebar onglets */}
          <div style={{ width: '22rem', flexShrink: 0, background: '#fff', borderRadius: '1.2rem', boxShadow: 'var(--box-shadow-1)', overflow: 'hidden' }}>
            {tabs.map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)} style={{
                display: 'block', width: '100%', padding: '1.5rem 2rem', textAlign: 'left', cursor: 'pointer',
                background: tab === key ? '#C9A84C11' : '#fff', borderLeft: tab === key ? '4px solid #C9A84C' : '4px solid transparent',
                color: tab === key ? '#C9A84C' : 'var(--black-color)', fontSize: '1.5rem', fontWeight: tab === key ? 600 : 400,
              }}>{label}</button>
            ))}
          </div>

          {/* Contenu */}
          <div style={{ flex: 1, background: '#fff', borderRadius: '1.2rem', padding: '3rem', boxShadow: 'var(--box-shadow-1)' }}>

            {/* Profil */}
            {tab === 'profil' && (
              <form onSubmit={handleSaveProfile}>
                <h3 style={{ fontSize: '2rem', marginBottom: '2.5rem' }}>Mon Profil</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div>
                    <label style={{ fontSize: '1.4rem', display: 'block', marginBottom: '0.6rem', fontWeight: 500 }}>Prénom</label>
                    <input value={profileData.first_name} onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: '1.4rem', display: 'block', marginBottom: '0.6rem', fontWeight: 500 }}>Nom</label>
                    <input value={profileData.last_name} onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: '1.4rem', display: 'block', marginBottom: '0.6rem', fontWeight: 500 }}>Email</label>
                    <input value={user?.email || ''} disabled style={{ ...inputStyle, background: '#f5f5f5', color: '#888' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '1.4rem', display: 'block', marginBottom: '0.6rem', fontWeight: 500 }}>Téléphone</label>
                    <input value={profileData.phone} onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })} placeholder="+221 77 000 00 00" style={inputStyle} />
                  </div>
                </div>
                <div style={{ marginTop: '1.5rem' }}>
                  <button type="submit" className="btn" disabled={savingProfile}
                    style={{ background: '#C9A84C', color: '#fff', padding: '1.2rem 3rem', opacity: savingProfile ? 0.7 : 1 }}>
                    {savingProfile ? 'Enregistrement…' : 'Sauvegarder'}
                  </button>
                </div>
              </form>
            )}

            {/* Commandes */}
            {tab === 'commandes' && (
              <div>
                <h3 style={{ fontSize: '2rem', marginBottom: '2.5rem' }}>Mes Commandes</h3>
                {loadingOrders ? (
                  <p style={{ color: 'var(--default-color)' }}>Chargement…</p>
                ) : orders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '4rem' }}>
                    <i className="bx bx-package" style={{ fontSize: '5rem', color: '#C9A84C', display: 'block', marginBottom: '1.5rem' }}></i>
                    <p style={{ color: 'var(--default-color)' }}>Aucune commande pour le moment.</p>
                  </div>
                ) : orders.map((order) => {
                  const st = STATUS_LABELS[order.status] || { label: order.status, color: '#888' };
                  const expanded = expandedOrder === order.order_number;
                  return (
                    <div key={order.order_number} style={{ border: '1px solid #f0f0f0', borderRadius: '1rem', marginBottom: '1.5rem', overflow: 'hidden' }}>
                      <div onClick={() => setExpandedOrder(expanded ? null : order.order_number)}
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 2rem', cursor: 'pointer', background: '#fafafa' }}>
                        <div>
                          <strong style={{ fontSize: '1.5rem' }}>#{order.order_number}</strong>
                          <span style={{ marginLeft: '1.5rem', fontSize: '1.3rem', color: 'var(--default-color)' }}>
                            {new Date(order.created_at).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                          <span style={{ background: st.color + '22', color: st.color, padding: '0.4rem 1rem', borderRadius: '2rem', fontSize: '1.3rem', fontWeight: 600 }}>
                            {st.label}
                          </span>
                          <strong style={{ color: '#C9A84C' }}>{formatFCFA(order.total)}</strong>
                          <i className={`bx bx-chevron-${expanded ? 'up' : 'down'}`} style={{ fontSize: '2rem' }}></i>
                        </div>
                      </div>
                      {expanded && (
                        <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid #f0f0f0' }}>
                          {order.items.map((item, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', fontSize: '1.4rem', borderBottom: '1px solid #f9f9f9' }}>
                              <span>{item.product_name} × {item.quantity}</span>
                              <span>{formatFCFA(item.line_total)}</span>
                            </div>
                          ))}
                          <div style={{ marginTop: '1rem', fontSize: '1.3rem', color: 'var(--default-color)' }}>
                            Livraison : {formatFCFA(order.delivery_fee)} · Paiement : {order.payment_method}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Adresses */}
            {tab === 'adresses' && (
              <form onSubmit={handleSaveProfile}>
                <h3 style={{ fontSize: '2rem', marginBottom: '2.5rem' }}>Adresse de livraison</h3>
                <label style={{ fontSize: '1.4rem', display: 'block', marginBottom: '0.6rem', fontWeight: 500 }}>Adresse par défaut</label>
                <textarea value={profileData.default_address} onChange={(e) => setProfileData({ ...profileData, default_address: e.target.value })}
                  rows={4} placeholder="Votre adresse complète…" style={{ ...inputStyle, resize: 'vertical', height: 'auto' }} />
                <button type="submit" className="btn" disabled={savingProfile}
                  style={{ marginTop: '1.5rem', background: '#C9A84C', color: '#fff', padding: '1.2rem 3rem', opacity: savingProfile ? 0.7 : 1 }}>
                  {savingProfile ? 'Enregistrement…' : 'Sauvegarder'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ── Page principale ── */
const MonComptePage = () => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <Dashboard /> : <AuthForm />;
};

export default MonComptePage;
