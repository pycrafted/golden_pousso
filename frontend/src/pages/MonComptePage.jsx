import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import SEOHead from '../components/SEOHead';
import apiClient from '../api/client';
import useSettingsStore, { formatPrice } from '../store/settingsStore';

const C = {
  bg:        '#FAF6EE',
  panel:     '#F0E8D8',
  border:    '#E0D0B8',
  borderMid: '#CEC0A0',
  gold:      '#B8960A',
  terra:     '#C2662D',
  cream:     '#1A1208',
  muted:     '#7A6A50',
};


const STATUS = {
  pending:    { label: 'En attente',      color: '#E8A000' },
  confirmed:  { label: 'Confirmée',       color: '#3B82F6' },
  processing: { label: 'En préparation',  color: '#8B5CF6' },
  shipped:    { label: 'Expédiée',        color: '#06B6D4' },
  delivered:  { label: 'Livrée',          color: '#22C55E' },
  cancelled:  { label: 'Annulée',         color: '#EF4444' },
};

/* ── Shared input style ── */
const mkInp = (focused, field) => ({
  width: '100%',
  padding: '1.3rem 0',
  background: 'transparent',
  border: 'none',
  borderBottom: `1px solid ${focused === field ? C.gold : C.borderMid}`,
  color: C.cream,
  fontSize: '1.4rem',
  fontFamily: 'Inter, sans-serif',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.25s',
  borderRadius: 0,
});

const FieldLabel = ({ children }) => (
  <label style={{
    display: 'block',
    fontSize: '1rem', fontFamily: 'Inter, sans-serif',
    textTransform: 'uppercase', letterSpacing: '0.2em',
    color: C.muted, marginBottom: '0.6rem',
  }}>
    {children}
  </label>
);

/* ══════════════════════════════════════
   AUTH FORM
══════════════════════════════════════ */
const AuthForm = () => {
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);
  const tabRefs = useRef({});
  const [underline, setUnderline] = useState({ left: 0, width: 0 });

  const { login, register } = useAuthStore();
  const [loginData, setLoginData] = useState({ phone: '', password: '' });
  const [registerData, setRegisterData] = useState({ first_name: '', last_name: '', phone: '', password: '' });

  useEffect(() => {
    const el = tabRefs.current[tab];
    if (el) setUnderline({ left: el.offsetLeft, width: el.offsetWidth });
  }, [tab]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(loginData.phone, loginData.password);
      toast.success('Connexion réussie !');
    } catch {
      toast.error('Numéro de téléphone ou mot de passe incorrect.');
    } finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(registerData);
      toast.success('Compte créé avec succès !');
    } catch (err) {
      toast.error(err.response?.data?.phone?.[0] || 'Erreur lors de la création du compte.');
    } finally { setLoading(false); }
  };

  const inp = (f) => mkInp(focused, f);

  return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10rem 2rem' }}>

      {/* Gold ornament */}
      <div className="auth-fade-1" style={{ textAlign: 'center', marginBottom: '5rem' }}>
        <span style={{ fontSize: '1.4rem', color: C.gold, letterSpacing: '0.5em', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase' }}>✦ ✦ ✦</span>
        <div style={{ marginTop: '1.6rem' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <span style={{
              fontFamily: 'Aclonica, sans-serif',
              fontSize: '2.8rem',
              letterSpacing: '0.04em',
              background: 'linear-gradient(90deg, #D4AF37, #F0D060, #C9A84C)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Golden Pousso
            </span>
          </Link>
        </div>
        <p style={{ marginTop: '0.8rem', fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', color: C.muted, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          Atelier · Pikine, Dakar
        </p>
      </div>

      {/* Card */}
      <div className="auth-fade-2" style={{
        width: '100%', maxWidth: '50rem',
        background: C.panel,
        border: `1px solid ${C.border}`,
        padding: '5rem',
        position: 'relative',
      }}>
        {/* Gold top bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(to right, ${C.gold}, ${C.terra}, transparent)` }} />

        {/* Tabs */}
        <div style={{ position: 'relative', marginBottom: '5rem', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex' }}>
            {[['login', 'Se connecter'], ['register', 'Créer un compte']].map(([key, label]) => (
              <button
                key={key}
                ref={(el) => tabRefs.current[key] = el}
                onClick={() => setTab(key)}
                style={{
                  flex: 1, padding: '0 0 1.8rem',
                  background: 'none', border: 'none',
                  fontSize: '1.3rem', fontFamily: 'Inter, sans-serif',
                  fontWeight: tab === key ? 600 : 400,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: tab === key ? C.cream : C.muted,
                  cursor: 'pointer', transition: 'color 0.25s',
                }}
              >{label}</button>
            ))}
          </div>
          {/* Sliding underline */}
          <div style={{
            position: 'absolute', bottom: -1, height: '2px',
            background: C.gold,
            left: underline.left, width: underline.width,
            transition: 'left 0.3s ease, width 0.3s ease',
          }} />
        </div>

        {/* Login form */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
            <div>
              <FieldLabel>Numéro de téléphone</FieldLabel>
              <input
                type="tel" value={loginData.phone}
                onChange={(e) => setLoginData({ ...loginData, phone: e.target.value })}
                placeholder="+221 77 000 00 00"
                style={inp('login-phone')}
                onFocus={() => setFocused('login-phone')}
                onBlur={() => setFocused(null)}
                required
              />
            </div>
            <div>
              <FieldLabel>Mot de passe</FieldLabel>
              <input
                type="password" value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                placeholder="••••••••"
                style={inp('login-pw')}
                onFocus={() => setFocused('login-pw')}
                onBlur={() => setFocused(null)}
                required
              />
            </div>
            <button
              type="submit" disabled={loading}
              style={{
                marginTop: '1rem',
                padding: '1.7rem',
                background: loading ? C.borderMid : C.gold,
                color: loading ? C.muted : '#FAF6EE',
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1.1rem', fontFamily: 'Inter, sans-serif',
                fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
                transition: 'background 0.25s, color 0.25s',
              }}
              onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = C.terra; e.currentTarget.style.color = C.cream; } }}
              onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.background = C.gold; e.currentTarget.style.color = '#FAF6EE'; } }}
            >
              {loading ? 'Connexion…' : 'Se connecter →'}
            </button>
            <p style={{ textAlign: 'center', fontSize: '1.2rem', fontFamily: 'Inter, sans-serif', color: C.muted }}>
              Pas encore de compte ?{' '}
              <button type="button" onClick={() => setTab('register')}
                style={{ background: 'none', border: 'none', color: C.gold, cursor: 'pointer', fontSize: '1.2rem', fontFamily: 'Inter, sans-serif', borderBottom: `1px solid ${C.gold}`, paddingBottom: '0.1rem' }}>
                Créer un compte
              </button>
            </p>
          </form>
        )}

        {/* Register form */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
            <div className="auth-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 3rem' }}>
              <div>
                <FieldLabel>Prénom</FieldLabel>
                <input
                  value={registerData.first_name}
                  onChange={(e) => setRegisterData({ ...registerData, first_name: e.target.value })}
                  placeholder="Votre prénom"
                  style={inp('reg-fn')}
                  onFocus={() => setFocused('reg-fn')}
                  onBlur={() => setFocused(null)}
                  required
                />
              </div>
              <div>
                <FieldLabel>Nom</FieldLabel>
                <input
                  value={registerData.last_name}
                  onChange={(e) => setRegisterData({ ...registerData, last_name: e.target.value })}
                  placeholder="Votre nom"
                  style={inp('reg-ln')}
                  onFocus={() => setFocused('reg-ln')}
                  onBlur={() => setFocused(null)}
                />
              </div>
            </div>
            <div>
              <FieldLabel>Numéro de téléphone</FieldLabel>
              <input
                type="tel" value={registerData.phone}
                onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                placeholder="+221 77 000 00 00"
                style={inp('reg-phone')}
                onFocus={() => setFocused('reg-phone')}
                onBlur={() => setFocused(null)}
                required
              />
            </div>
            <div>
              <FieldLabel>Mot de passe</FieldLabel>
              <input
                type="password" value={registerData.password}
                onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                placeholder="Minimum 6 caractères"
                style={inp('reg-pw')}
                onFocus={() => setFocused('reg-pw')}
                onBlur={() => setFocused(null)}
                required
              />
            </div>
            <button
              type="submit" disabled={loading}
              style={{
                marginTop: '1rem', padding: '1.7rem',
                background: loading ? C.borderMid : C.gold,
                color: loading ? C.muted : '#FAF6EE',
                border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1.1rem', fontFamily: 'Inter, sans-serif',
                fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
                transition: 'background 0.25s, color 0.25s',
              }}
              onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = C.terra; e.currentTarget.style.color = C.cream; } }}
              onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.background = C.gold; e.currentTarget.style.color = '#FAF6EE'; } }}
            >
              {loading ? 'Création…' : 'Créer mon compte →'}
            </button>
          </form>
        )}
      </div>

      {/* Signature */}
      <p className="auth-fade-3" style={{ marginTop: '4rem', fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', color: C.muted, letterSpacing: '0.2em', textTransform: 'uppercase', textAlign: 'center' }}>
        Atelier · Pikine, Dakar
      </p>

      <style>{`
        @keyframes auth-up { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        .auth-fade-1 { animation: auth-up 0.6s ease both; }
        .auth-fade-2 { animation: auth-up 0.7s ease 0.1s both; }
        .auth-fade-3 { animation: auth-up 0.6s ease 0.25s both; }
        @media (max-width: 560px) {
          .auth-row { grid-template-columns: 1fr !important; gap: 3.5rem 0 !important; }
        }
        input::placeholder { color: #9A8A70; font-family: Inter, sans-serif; }
        input { color-scheme: light; }
      `}</style>
    </div>
  );
};

/* ══════════════════════════════════════
   DASHBOARD
══════════════════════════════════════ */
const Dashboard = () => {
  const { user, logout, updateProfile, changePassword } = useAuthStore();
  const currency = useSettingsStore((s) => s.currency);
  const navigate = useNavigate();
  const [tab, setTab] = useState('profil');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [profileData, setProfileData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    default_address: user?.default_address || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [focused, setFocused] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || null);
  const [avatarFile, setAvatarFile] = useState(null);
  const avatarInputRef = useRef(null);

  // Sécurité
  const [pwData, setPwData] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    if (tab === 'commandes') {
      setLoadingOrders(true);
      apiClient.get('/orders/mes-commandes/')
        .then((r) => setOrders(r.data))
        .catch(() => {})
        .finally(() => setLoadingOrders(false));
    }
  }, [tab]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const fd = new FormData();
      Object.entries(profileData).forEach(([k, v]) => fd.append(k, v));
      if (avatarFile) fd.append('avatar', avatarFile);
      await updateProfile(fd);
      setAvatarFile(null);
      toast.success('Profil mis à jour !');
    } catch {
      toast.error('Erreur lors de la mise à jour.');
    } finally { setSavingProfile(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwData.new_password !== pwData.confirm_password) {
      toast.error('Les mots de passe ne correspondent pas.'); return;
    }
    setSavingPw(true);
    try {
      await changePassword(pwData.current_password, pwData.new_password);
      toast.success('Mot de passe modifié !');
      setPwData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      const msg = err.response?.data?.current_password?.[0] || err.response?.data?.detail || 'Erreur.';
      toast.error(msg);
    } finally { setSavingPw(false); }
  };

  const inp = (f) => mkInp(focused, f);

  const initials = [user?.first_name, user?.last_name]
    .filter(Boolean).map((s) => s[0].toUpperCase()).join('') || (user?.email?.[0]?.toUpperCase() ?? '?');

  const NAV_TABS = [
    { key: 'profil',    label: 'Mon Profil' },
    { key: 'commandes', label: 'Mes Commandes' },
    { key: 'adresses',  label: 'Mes Adresses' },
    { key: 'securite',  label: 'Sécurité' },
  ];

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.cream }}>

      {/* ── Page header ── */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: '0 4rem' }}>
        <div style={{ maxWidth: '140rem', margin: '0 auto', paddingTop: '12rem', paddingBottom: '4rem', display: 'flex', justifyContent: 'flex-end' }}>
          {/* Bloc profil aligné à droite */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.3em', color: C.gold, marginBottom: '0.8rem' }}>
                Mon compte
              </p>
              <h1 style={{ fontFamily: 'Aclonica, serif', fontSize: 'clamp(2rem, 3vw, 3.2rem)', color: C.cream, lineHeight: 1.1 }}>
                {user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Bienvenue'}
              </h1>
              {user?.email && (
                <p style={{ fontSize: '1.3rem', fontFamily: 'Inter, sans-serif', color: C.muted, marginTop: '0.4rem' }}>
                  {user.email}
                </p>
              )}
            </div>
            {/* Avatar */}
            <div style={{
              width: '7rem', height: '7rem', borderRadius: '50%',
              background: 'rgba(184,150,10,0.1)',
              border: `1px solid rgba(184,150,10,0.25)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', flexShrink: 0,
            }}>
              {avatarPreview
                ? <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontFamily: 'Aclonica, serif', fontSize: '2.2rem', color: C.gold }}>{initials}</span>
              }
            </div>
          </div>
        </div>

        {/* Tab nav */}
        <div className="db-tabs" style={{ maxWidth: '140rem', margin: '0 auto', display: 'flex', gap: '0' }}>
          {NAV_TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                padding: '1.5rem 3rem 1.5rem 0',
                background: 'none', border: 'none',
                borderBottom: tab === key ? `2px solid ${C.gold}` : '2px solid transparent',
                color: tab === key ? C.cream : C.muted,
                fontSize: '1.3rem', fontFamily: 'Inter, sans-serif',
                fontWeight: tab === key ? 600 : 400,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                cursor: 'pointer', transition: 'color 0.25s, border-color 0.25s',
                marginBottom: '-1px',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div style={{ padding: '5rem 4rem 12rem', maxWidth: '140rem', margin: '0 auto' }}>

        {/* ── Profil ── */}
        {tab === 'profil' && (
          <div className="db-a2" style={{ maxWidth: '72rem' }}>
            <div style={{ marginBottom: '5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.6rem', marginBottom: '1.6rem' }}>
                <div style={{ width: '4rem', height: '1px', background: C.gold }} />
                <p style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.3em', color: C.gold }}>
                  Profil
                </p>
              </div>
              <h2 style={{ fontFamily: 'Aclonica, serif', fontSize: '3.2rem', color: C.cream, lineHeight: 1.1 }}>
                Mes informations
              </h2>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>

              {/* Avatar upload */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '3rem', paddingBottom: '4rem', borderBottom: `1px solid ${C.border}` }}>
                <div style={{
                  width: '9rem', height: '9rem', borderRadius: '50%',
                  background: 'rgba(184,150,10,0.07)',
                  border: `1px solid rgba(184,150,10,0.2)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', flexShrink: 0,
                }}>
                  {avatarPreview
                    ? <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontFamily: 'Aclonica, serif', fontSize: '2.8rem', color: C.gold }}>{initials}</span>
                  }
                </div>
                <div>
                  <p style={{ fontSize: '1.3rem', fontFamily: 'Inter, sans-serif', color: C.cream, marginBottom: '0.8rem' }}>
                    Photo de profil
                  </p>
                  <p style={{ fontSize: '1.2rem', fontFamily: 'Inter, sans-serif', color: C.muted, marginBottom: '1.6rem' }}>
                    JPG ou PNG · 5 Mo max
                  </p>
                  <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    style={{
                      padding: '0.9rem 2.4rem',
                      background: 'none', border: `1px solid ${C.borderMid}`,
                      color: C.muted, cursor: 'pointer',
                      fontSize: '1.1rem', fontFamily: 'Inter, sans-serif',
                      textTransform: 'uppercase', letterSpacing: '0.15em',
                      transition: 'border-color 0.2s, color 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.borderMid; e.currentTarget.style.color = C.muted; }}
                  >
                    {avatarFile ? '✓ Photo sélectionnée' : 'Changer la photo'}
                  </button>
                </div>
              </div>

              <div className="db-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 5rem' }}>
                <div>
                  <FieldLabel>Prénom</FieldLabel>
                  <input value={profileData.first_name}
                    onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                    style={inp('pf-fn')} onFocus={() => setFocused('pf-fn')} onBlur={() => setFocused(null)} />
                </div>
                <div>
                  <FieldLabel>Nom</FieldLabel>
                  <input value={profileData.last_name}
                    onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                    style={inp('pf-ln')} onFocus={() => setFocused('pf-ln')} onBlur={() => setFocused(null)} />
                </div>
              </div>

              <div className="db-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 5rem' }}>
                <div>
                  <FieldLabel>Email</FieldLabel>
                  <input value={user?.email || ''} disabled
                    style={{ ...inp('pf-email'), color: C.muted, cursor: 'not-allowed' }} />
                </div>
                <div>
                  <FieldLabel>Téléphone</FieldLabel>
                  <input value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    placeholder="+221 77 000 00 00"
                    style={inp('pf-phone')} onFocus={() => setFocused('pf-phone')} onBlur={() => setFocused(null)} />
                </div>
              </div>

              <div style={{ paddingTop: '1rem' }}>
                <button
                  type="submit" disabled={savingProfile}
                  style={{
                    padding: '1.6rem 5rem',
                    background: savingProfile ? C.borderMid : C.gold,
                    color: savingProfile ? C.muted : '#FAF6EE',
                    border: 'none', cursor: savingProfile ? 'not-allowed' : 'pointer',
                    fontSize: '1.1rem', fontFamily: 'Inter, sans-serif',
                    fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
                    transition: 'background 0.25s, color 0.25s',
                  }}
                  onMouseEnter={(e) => { if (!savingProfile) { e.currentTarget.style.background = C.terra; e.currentTarget.style.color = C.cream; } }}
                  onMouseLeave={(e) => { if (!savingProfile) { e.currentTarget.style.background = C.gold; e.currentTarget.style.color = '#FAF6EE'; } }}
                >
                  {savingProfile ? 'Enregistrement…' : 'Sauvegarder'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Commandes ── */}
        {tab === 'commandes' && (
          <div className="db-a2">
            <div style={{ marginBottom: '5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.6rem', marginBottom: '1.6rem' }}>
                <div style={{ width: '4rem', height: '1px', background: C.gold }} />
                <p style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.3em', color: C.gold }}>
                  Historique
                </p>
              </div>
              <h2 style={{ fontFamily: 'Aclonica, serif', fontSize: '3.2rem', color: C.cream, lineHeight: 1.1 }}>
                Mes commandes
              </h2>
            </div>

            {loadingOrders ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {[1,2,3].map((i) => (
                  <div key={i} style={{ height: '7rem', background: C.panel, border: `1px solid ${C.border}`, animation: 'db-shimmer 1.6s ease-in-out infinite' }} />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '9rem 2rem', border: `1px solid ${C.border}` }}>
                <div style={{ marginBottom: '2.5rem' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(184,150,10,0.2)" strokeWidth="1" style={{ display: 'block', margin: '0 auto' }}>
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
                  </svg>
                </div>
                <p style={{ fontFamily: 'Aclonica, serif', fontSize: '2.4rem', color: C.cream, marginBottom: '1rem' }}>
                  Aucune commande
                </p>
                <p style={{ fontSize: '1.3rem', fontFamily: 'Inter, sans-serif', color: C.muted, marginBottom: '3.5rem' }}>
                  Vous n&apos;avez pas encore passé de commande.
                </p>
                <Link
                  to="/boutique"
                  style={{
                    display: 'inline-block',
                    padding: '1.4rem 4rem',
                    background: C.gold, color: '#FAF6EE',
                    textDecoration: 'none',
                    fontSize: '1.1rem', fontFamily: 'Inter, sans-serif',
                    fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
                    transition: 'background 0.25s, color 0.25s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = C.terra; e.currentTarget.style.color = C.cream; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = C.gold; e.currentTarget.style.color = '#FAF6EE'; }}
                >
                  Explorer la boutique
                </Link>
              </div>
            ) : (
              <div style={{ border: `1px solid ${C.border}`, overflow: 'hidden' }}>
                {/* Header row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '0 2rem', padding: '1.2rem 2.4rem', borderBottom: `1px solid ${C.border}`, background: '#E8DCC8' }}>
                  {['Commande', 'Date', 'Statut', 'Total', ''].map((h, i) => (
                    <span key={i} style={{ fontSize: '1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.2em', color: C.muted }}>
                      {h}
                    </span>
                  ))}
                </div>
                {orders.map((order) => {
                  const st = STATUS[order.status] || { label: order.status, color: C.muted };
                  const expanded = expandedOrder === order.order_number;
                  return (
                    <div key={order.order_number} style={{ borderBottom: `1px solid ${C.border}` }}>
                      {/* Order row */}
                      <div
                        onClick={() => setExpandedOrder(expanded ? null : order.order_number)}
                        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '0 2rem', padding: '2rem 2.4rem', alignItems: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.03)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <span style={{ fontSize: '1.35rem', fontFamily: 'Inter, sans-serif', fontWeight: 600, color: C.cream, letterSpacing: '0.04em' }}>
                          #{order.order_number}
                        </span>
                        <span style={{ fontSize: '1.3rem', fontFamily: 'Inter, sans-serif', color: C.muted }}>
                          {new Date(order.created_at).toLocaleDateString('fr-FR')}
                        </span>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
                          fontSize: '1.1rem', fontFamily: 'Inter, sans-serif',
                          color: st.color, letterSpacing: '0.08em',
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: st.color, flexShrink: 0 }} />
                          {st.label}
                        </span>
                        <span style={{ fontSize: '1.35rem', fontFamily: 'Inter, sans-serif', fontWeight: 600, color: C.gold }}>
                          {formatPrice(order.total)}
                        </span>
                        <svg
                          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="1.5"
                          style={{ transition: 'transform 0.25s ease', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
                        >
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </div>

                      {/* Expanded detail */}
                      {expanded && (
                        <div style={{ padding: '0 2.4rem 2.4rem', borderTop: `1px solid ${C.border}` }}>
                          <div style={{ paddingTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0' }}>
                            {order.items.map((item, i) => (
                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: `1px solid ${C.border}` }}>
                                <span style={{ fontSize: '1.3rem', fontFamily: 'Inter, sans-serif', color: C.cream }}>
                                  {item.product_name}
                                  <span style={{ color: C.muted, marginLeft: '0.6rem' }}>× {item.quantity}</span>
                                </span>
                                <span style={{ fontSize: '1.3rem', fontFamily: 'Inter, sans-serif', color: C.gold }}>
                                  {formatPrice(item.line_total)}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div style={{ marginTop: '1.8rem', display: 'flex', gap: '3rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '1.2rem', fontFamily: 'Inter, sans-serif', color: C.muted }}>
                              Livraison : <span style={{ color: C.cream }}>{formatPrice(order.delivery_fee)}</span>
                            </span>
                            <span style={{ fontSize: '1.2rem', fontFamily: 'Inter, sans-serif', color: C.muted }}>
                              Paiement : <span style={{ color: C.cream, textTransform: 'capitalize' }}>{order.payment_method}</span>
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Sécurité ── */}
        {tab === 'securite' && (
          <div className="db-a2" style={{ maxWidth: '60rem' }}>
            <div style={{ marginBottom: '5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.6rem', marginBottom: '1.6rem' }}>
                <div style={{ width: '4rem', height: '1px', background: C.gold }} />
                <p style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.3em', color: C.gold }}>
                  Sécurité
                </p>
              </div>
              <h2 style={{ fontFamily: 'Aclonica, serif', fontSize: '3.2rem', color: C.cream, lineHeight: 1.1 }}>
                Changer le mot de passe
              </h2>
            </div>

            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
              <div>
                <FieldLabel>Mot de passe actuel</FieldLabel>
                <input
                  type="password" value={pwData.current_password}
                  onChange={(e) => setPwData({ ...pwData, current_password: e.target.value })}
                  placeholder="••••••••"
                  style={inp('pw-cur')} onFocus={() => setFocused('pw-cur')} onBlur={() => setFocused(null)}
                  required
                />
              </div>
              <div>
                <FieldLabel>Nouveau mot de passe</FieldLabel>
                <input
                  type="password" value={pwData.new_password}
                  onChange={(e) => setPwData({ ...pwData, new_password: e.target.value })}
                  placeholder="Minimum 6 caractères"
                  style={inp('pw-new')} onFocus={() => setFocused('pw-new')} onBlur={() => setFocused(null)}
                  required
                />
              </div>
              <div>
                <FieldLabel>Confirmer le nouveau mot de passe</FieldLabel>
                <input
                  type="password" value={pwData.confirm_password}
                  onChange={(e) => setPwData({ ...pwData, confirm_password: e.target.value })}
                  placeholder="••••••••"
                  style={{
                    ...inp('pw-confirm'),
                    borderBottomColor: pwData.confirm_password && pwData.confirm_password !== pwData.new_password ? '#EF4444' : undefined,
                  }}
                  onFocus={() => setFocused('pw-confirm')} onBlur={() => setFocused(null)}
                  required
                />
                {pwData.confirm_password && pwData.confirm_password !== pwData.new_password && (
                  <p style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', color: '#EF4444', marginTop: '0.8rem' }}>
                    Les mots de passe ne correspondent pas
                  </p>
                )}
              </div>
              <div>
                <button
                  type="submit" disabled={savingPw}
                  style={{
                    padding: '1.6rem 5rem',
                    background: savingPw ? C.borderMid : C.gold,
                    color: savingPw ? C.muted : '#FAF6EE',
                    border: 'none', cursor: savingPw ? 'not-allowed' : 'pointer',
                    fontSize: '1.1rem', fontFamily: 'Inter, sans-serif',
                    fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
                    transition: 'background 0.25s, color 0.25s',
                  }}
                  onMouseEnter={(e) => { if (!savingPw) { e.currentTarget.style.background = C.terra; e.currentTarget.style.color = C.cream; } }}
                  onMouseLeave={(e) => { if (!savingPw) { e.currentTarget.style.background = C.gold; e.currentTarget.style.color = '#FAF6EE'; } }}
                >
                  {savingPw ? 'Enregistrement…' : 'Modifier le mot de passe'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Adresses ── */}
        {tab === 'adresses' && (
          <div className="db-a2" style={{ maxWidth: '60rem' }}>
            <div style={{ marginBottom: '5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.6rem', marginBottom: '1.6rem' }}>
                <div style={{ width: '4rem', height: '1px', background: C.gold }} />
                <p style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.3em', color: C.gold }}>
                  Livraison
                </p>
              </div>
              <h2 style={{ fontFamily: 'Aclonica, serif', fontSize: '3.2rem', color: C.cream, lineHeight: 1.1 }}>
                Mes adresses
              </h2>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
              <div>
                <FieldLabel>Adresse de livraison par défaut</FieldLabel>
                <textarea
                  value={profileData.default_address}
                  onChange={(e) => setProfileData({ ...profileData, default_address: e.target.value })}
                  rows={5}
                  placeholder="Quartier, rue, numéro…&#10;Ville, Sénégal"
                  style={{ ...inp('addr'), resize: 'none' }}
                  onFocus={() => setFocused('addr')}
                  onBlur={() => setFocused(null)}
                />
              </div>
              <div>
                <button
                  type="submit" disabled={savingProfile}
                  style={{
                    padding: '1.6rem 5rem',
                    background: savingProfile ? C.borderMid : C.gold,
                    color: savingProfile ? C.muted : '#FAF6EE',
                    border: 'none', cursor: savingProfile ? 'not-allowed' : 'pointer',
                    fontSize: '1.1rem', fontFamily: 'Inter, sans-serif',
                    fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
                    transition: 'background 0.25s, color 0.25s',
                  }}
                  onMouseEnter={(e) => { if (!savingProfile) { e.currentTarget.style.background = C.terra; e.currentTarget.style.color = C.cream; } }}
                  onMouseLeave={(e) => { if (!savingProfile) { e.currentTarget.style.background = C.gold; e.currentTarget.style.color = '#FAF6EE'; } }}
                >
                  {savingProfile ? 'Enregistrement…' : 'Sauvegarder'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <style>{`
        @keyframes db-up     { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes db-shimmer { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.6; } }
        .db-a1 { animation: db-up 0.6s ease both; }
        .db-a2 { animation: db-up 0.6s ease 0.1s both; }
        @media (max-width: 760px) {
          .db-form-row { grid-template-columns: 1fr !important; gap: 4rem 0 !important; }
          .db-tabs button { padding-right: 1.5rem !important; font-size: 1.1rem !important; }
        }
        input::placeholder, textarea::placeholder { color: #9A8A70; font-family: Inter, sans-serif; }
        input, textarea { color-scheme: light; }
      `}</style>
    </div>
  );
};

/* ══════════════════════════════════════
   PAGE
══════════════════════════════════════ */
const MonComptePage = () => {
  const { isAuthenticated } = useAuthStore();
  return (
    <>
      <SEOHead title="Mon Compte" url="/mon-compte" noindex />
      {isAuthenticated ? <Dashboard /> : <AuthForm />}
    </>
  );
};

export default MonComptePage;
