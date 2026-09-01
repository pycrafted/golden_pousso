import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useCartStore from '../store/cartStore';
import useSettingsStore, { formatPrice, CURRENCIES, LANGUAGES } from '../store/settingsStore';
import useFavorisStore from '../store/favorisStore';
import useAuthStore from '../store/authStore';
import CldImg from './CldImg';
import apiClient from '../api/client';
import { COLORS } from '../theme';

const C = {
  dark: COLORS.ink,
  dark2: '#0F1320',
  gold: COLORS.goldOnDark,
  goldDim: COLORS.goldOnDark,
  terracotta: COLORS.terracotta,
  cream: COLORS.cream,
  muted: COLORS.mutedOnDark,
  cardBg: '#161B2D',
};

const inputStyle = {
  width: '100%', padding: '1.1rem 0', background: 'transparent',
  border: 'none', borderBottom: '1px solid rgba(255,255,255,0.16)', color: '#FAF6EE',
  fontFamily: 'var(--font-body)', fontSize: '1.3rem',
  outline: 'none', boxSizing: 'border-box',
};

/* ── Dropdown profil ── */
const ProfileDropdown = () => {
  const [open, setOpen]       = useState(false);
  const [mode, setMode]       = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [form, setForm]       = useState({ phone: '', password: '', first_name: '', last_name: '' });
  const ref = useRef(null);
  const navigate = useNavigate();
  const { isAuthenticated, user, login, logout, register } = useAuthStore();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const reset = () => { setForm({ phone: '', password: '', first_name: '', last_name: '' }); setError(''); };
  const switchMode = (m) => { setMode(m); reset(); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      if (mode === 'login') {
        await login(form.phone, form.password);
      } else {
        await register({ phone: form.phone, password: form.password, first_name: form.first_name, last_name: form.last_name });
      }
      setOpen(false); reset();
    } catch (err) {
      const data = err?.response?.data;
      if (data) {
        const msg = Object.values(data).flat().join(' ');
        setError(msg || 'Une erreur est survenue.');
      } else {
        setError(mode === 'login' ? 'Téléphone ou mot de passe incorrect.' : 'Une erreur est survenue.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <IconBtn onClick={() => isAuthenticated ? navigate('/profil') : setOpen(o => !o)} title="Mon compte">
        <i className="bx bx-user" style={{ fontSize: '2.2rem' }}></i>
      </IconBtn>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 1.2rem)', right: 0,
          width: '32rem', background: '#161B2D', border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: '4px', padding: '2.4rem',
          boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
          zIndex: 200,
        }}>
          {isAuthenticated ? (
            <>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '1.1rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '0.6rem' }}>
                Connecté en tant que
              </p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: C.gold, marginBottom: '2rem' }}>
                {user?.first_name || user?.phone || 'Mon compte'}
              </p>
              <button
                onClick={() => { logout(); navigate('/'); setOpen(false); }}
                style={{ width: '100%', padding: '1.1rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.16)', color: '#888', fontFamily: 'var(--font-body)', fontSize: '1.2rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', transition: 'border-color 0.2s, color 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#C2662D'; e.currentTarget.style.color = '#C2662D'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#888'; }}
              >
                Se déconnecter
              </button>
            </>
          ) : (
            <>
              {/* Toggle connexion / inscription */}
              <div style={{ display: 'flex', marginBottom: '2.4rem', borderBottom: '1px solid rgba(255,255,255,0.10)' }}>
                {['login', 'register'].map((m) => (
                  <button
                    key={m}
                    onClick={() => switchMode(m)}
                    style={{
                      flex: 1, padding: '1rem', background: 'none', border: 'none',
                      borderBottom: mode === m ? `2px solid ${C.gold}` : '2px solid transparent',
                      color: mode === m ? '#FAF6EE' : '#666',
                      fontFamily: 'var(--font-body)', fontSize: '1.2rem',
                      fontWeight: mode === m ? 600 : 400,
                      letterSpacing: '0.1em', textTransform: 'uppercase',
                      cursor: 'pointer', transition: 'color 0.2s',
                      marginBottom: '-1px',
                    }}
                  >
                    {m === 'login' ? 'Connexion' : 'Créer un compte'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit}>
                {mode === 'register' && (
                  <>
                    <input type="text" placeholder="Prénom" value={form.first_name} onChange={set('first_name')} required style={{ ...inputStyle, marginBottom: '1.4rem' }} />
                    <input type="text" placeholder="Nom" value={form.last_name} onChange={set('last_name')} style={{ ...inputStyle, marginBottom: '1.4rem' }} />
                  </>
                )}
                <input type="tel" placeholder="Téléphone" value={form.phone} onChange={set('phone')} required style={{ ...inputStyle, marginBottom: '1.4rem' }} />
                <input type="password" placeholder="Mot de passe" value={form.password} onChange={set('password')} required style={{ ...inputStyle, marginBottom: '0.8rem' }} />

                {error && <p style={{ color: '#C2662D', fontFamily: 'var(--font-body)', fontSize: '1.1rem', marginTop: '0.8rem' }}>{error}</p>}

                <button
                  type="submit" disabled={loading}
                  style={{ width: '100%', padding: '1.2rem', marginTop: '1.6rem', background: C.gold, border: 'none', color: '#12141C', fontFamily: 'var(--font-body)', fontSize: '1.2rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? '…' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const Navbar = () => {
  const [navOpen, setNavOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [sticky, setSticky] = useState(false);
  const navigate = useNavigate();

  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const currency    = useSettingsStore((s) => s.currency);
  const language    = useSettingsStore((s) => s.language);
  const setCurrency = useSettingsStore((s) => s.setCurrency);
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  const { isAuthenticated, user, logout } = useAuthStore();
  // Un nombre et non le tableau : un sélecteur qui renvoie le tableau ferait
  // re-rendre la barre entière à chaque écriture du magasin.
  const nbFavoris = useFavorisStore((s) => s.items.length);

  const [categories, setCategories] = useState([]);
  useEffect(() => {
    apiClient.get('/categories/')
      .then((res) => setCategories(res.data.results ?? res.data))
      .catch(() => {});
  }, []);

  /* `sticky` ne décide plus de la POSITION — le conteneur colle en
     permanence. Il ne reste qu'un état d'apparence : le filet et le flou
     n'apparaissent qu'une fois la page en mouvement, pour détacher la barre
     du contenu qui passe dessous. Le seuil descend à 1 px : à 80, l'habillage
     arrivait longtemps après que la barre ait commencé à recouvrir. */
  useEffect(() => {
    const onScroll = () => setSticky(window.scrollY > 0);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Fermeture du tiroir panier — à la touche Échap seulement.
     ---------------------------------------------------------------------
     Il y avait ici un écouteur `mousedown` sur tout le document qui fermait
     le tiroir dès qu'un clic tombait hors de `cartRef`. Or `cartRef` est posé
     sur l'ICÔNE du panier, pas sur le tiroir : tout clic DANS le tiroir —
     changer une quantité, retirer un article — comptait donc comme un clic
     extérieur et le refermait aussitôt.

     Le clic extérieur n'a pas besoin de cet écouteur : le tiroir a déjà un
     voile en plein écran, posé dessous, dont le `onClick` ferme. C'est le
     mécanisme juste, et il ne peut pas se tromper de cible.

     Reste le clavier, que le voile ne sert pas — d'où Échap. */
  useEffect(() => {
    if (!cartOpen) return undefined;
    const auClavier = (e) => { if (e.key === 'Escape') setCartOpen(false); };
    document.addEventListener('keydown', auClavier);
    return () => document.removeEventListener('keydown', auClavier);
  }, [cartOpen]);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = navOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [navOpen]);

  // « Accueil » n'est plus dans la liste : c'est le nom de la maison, à
  // gauche, qui ramène à la page d'accueil — la convention que tout visiteur
  // connaît déjà. Une entrée de menu en plus disait la même chose deux fois.
  /* « Boutique » ouvre la liste, avant les rayons : c'est l'entrée qui les
     contient tous, elle passe donc avant ceux qu'elle regroupe. Elle est
     écrite en dur et non tirée de l'API — ce n'est pas une catégorie, c'est
     une page.

     La normalisation de casse ci-dessous ne s'applique qu'aux rayons : leurs
     noms viennent de la base et arrivent dans une casse quelconque
     (« Boubou Africain », « SACS »). « Boutique » est déjà écrit comme il
     doit s'afficher, le faire passer par la moulinette ne changerait rien
     mais ferait croire qu'il en a besoin. */
  const navLinks = [
    { to: '/boutique', label: 'Boutique' },
    ...categories.map((cat) => ({
      to: `/categorie/${cat.slug}`,
      label: cat.name.charAt(0).toUpperCase() + cat.name.slice(1).toLowerCase(),
    })),
  ];

  return (
    /* C'est ce CONTENEUR qui colle, et non le <nav> qu'il enveloppe : un
       élément `sticky` ne colle que dans les limites de son parent, et le
       <nav> n'aurait eu pour piste que la hauteur de ce div — il se serait
       décollé aussitôt. Les tiroirs (panier, menu mobile) sont en `position:
       fixed` et `sticky` ne crée pas de bloc conteneur pour eux : ils
       continuent de se caler sur la fenêtre.

       `top: var(--bande-h)` : la barre se pose sous la bande de coordonnées,
       qui reste visible en permanence et publie sa hauteur (voir
       `BandeCoordonnees`). Repli 0px si la bande n'est pas montée. */
    <div style={{
      position: 'sticky',
      top: 'var(--bande-h, 0px)',
      zIndex: 1000,
    }}>
      {/* Main navbar */}
      <nav style={{
        background: 'var(--surface-chrome)',
        /* Le filet doré qui sépare la barre de la bande de coordonnées. Posé
           sur le bord HAUT de la navbar et non sur le bord bas de la bande :
           la navbar chevauche la bande d'une fraction de pixel (voir
           l'arrondi de `--bande-h` dans `BandeCoordonnees`) et recouvrirait
           un filet posé de l'autre côté. */
        borderTop: '1px solid var(--line-dark-accent)',
        backdropFilter: sticky ? 'blur(16px)' : 'none',
        borderBottom: sticky ? '1px solid rgba(255,255,255,0.06)' : 'none',
        padding: '1.4rem 0',
        /* Plus de bascule `fixed` au défilement : c'est le conteneur qui
           colle. La barre passait de `relative` à `fixed` au-delà de 80 px,
           et pendant ces 80 px elle remontait avec la page pendant que la
           bande de coordonnées, elle, restait collée — un écart s'ouvrait
           entre les deux, puis se refermait d'un coup. */
        position: 'relative',
        zIndex: 1000,
        transition: 'all 0.4s',
      }}>
        <div style={{
          width: '100%',
          padding: '0 3rem',
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          alignItems: 'center',
          columnGap: '2rem',
          position: 'relative',
        }}
          className="nav-inner"
        >

          {/* Nom — colonne gauche, et retour à l'accueil.

              Le nom était un simple span : la barre ne ramenait donc à
              l'accueil que par son entrée « Accueil ». C'est maintenant lui
              le chemin du retour, sur toutes les pages puisque la barre y est
              partout.

              Un Link et non un div cliquable : le navigateur donne alors
              gratuitement l'ouverture dans un nouvel onglet, le survol qui
              montre l'adresse, la tabulation et l'annonce au lecteur d'écran.
              L'aria-label ajoute la destination au nom visible, sinon le lien
              s'annonce « Golden Pousso » sans dire où il mène. */}
          <Link
            to="/"
            aria-label="Golden Pousso — retour à l'accueil"
            className="nav-logo"
            style={{ display: 'flex', alignItems: 'center', gap: '0', minWidth: 0, textDecoration: 'none' }}
          >
            <span className="nav-logo-text" style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2rem',
              color: C.gold,
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
            }}>
              Golden Pousso
            </span>
          </Link>

          {/* Desktop nav links (colonne centrale, rétrécit sans jamais chevaucher logo/icônes) */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.2rem',
            justifyContent: 'center',
            minWidth: 0,
            overflowX: 'auto',
          }}
            className="desktop-nav"
          >
            {navLinks.map(({ to, label }) => (
              <NavLink key={to} to={to} label={label} />
            ))}
          </div>

          {/* Icônes — colonne droite */}
          <div className="nav-icons" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0 }}>
            {/* Le cœur n'apparaît qu'à partir d'un favori. Il ne mène qu'à sa
                propre liste : tant qu'elle est vide, il n'ouvre sur rien, et
                une icône qui ne conduit qu'à un message « aucune pièce mise en
                favoris » occupe la barre sans rien offrir. Le geste d'AJOUT,
                lui, reste sur les cartes produit — c'est là qu'on met de côté,
                pas ici.

                Corollaire : le badge n'a plus de cas à zéro à traiter, mais la
                condition reste, elle protège d'un compteur vide si la
                condition du dessus venait à bouger.

                Le badge reprend celui du panier, à dessein : deux compteurs de
                formes différentes dans la même barre se liraient comme deux
                mécanismes sans rapport. */}
            {nbFavoris > 0 && (
            <div style={{ position: 'relative' }}>
              <IconBtn onClick={() => navigate('/favoris')} title="Mes favoris">
                <i className="bx bx-heart" style={{ fontSize: '2.2rem' }}></i>
                {nbFavoris > 0 && (
                  <span style={{
                    position: 'absolute', top: '0.4rem', right: '0.4rem',
                    minWidth: '1.7rem', height: '1.7rem', padding: '0 0.4rem',
                    display: 'grid', placeItems: 'center',
                    borderRadius: 'var(--r-pill)',
                    background: C.gold, color: COLORS.ink,
                    fontSize: '1rem', fontWeight: 700,
                    fontFamily: 'var(--font-body)',
                  }}>
                    {nbFavoris}
                  </span>
                )}
              </IconBtn>
            </div>
            )}
            {/* L'historique des commandes n'a de sens qu'avec un compte : la
                page lit /orders/mes-commandes/, qui exige d'être connecté. Un
                visiteur anonyme n'y trouverait qu'une invitation à se
                connecter — autant ne pas lui montrer la porte. Celui qui a
                commandé SANS compte passe par /commande/suivi. */}
            {isAuthenticated && (
              <IconBtn onClick={() => navigate('/commandes')} title="Historique des commandes">
                <i className="bx bx-receipt" style={{ fontSize: '2.2rem' }}></i>
              </IconBtn>
            )}
            {isAuthenticated && user?.is_staff && (
              <IconBtn onClick={() => navigate('/gestion')} title="Espace Gestion">
                <i className="bx bx-cog" style={{ fontSize: '2.2rem' }}></i>
              </IconBtn>
            )}
            <ProfileDropdown />
            <div style={{ position: 'relative' }}>
              <IconBtn onClick={() => setCartOpen((o) => !o)} title="Panier">
                <i className="bx bx-cart" style={{ fontSize: '2.2rem' }}></i>
                {totalItems > 0 && (
                  <span style={{
                    position: 'absolute', top: '0.4rem', right: '0.4rem',
                    background: C.gold, color: C.dark, borderRadius: '50%',
                    width: '1.8rem', height: '1.8rem', fontSize: '0.95rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, border: 'none', lineHeight: 1, fontFamily: 'var(--font-body)',
                  }}>
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </IconBtn>
            </div>
            {isAuthenticated && (
              <IconBtn onClick={() => { logout(); navigate('/'); }} title="Se déconnecter">
                <i className="bx bx-log-out" style={{ fontSize: '2.2rem' }}></i>
              </IconBtn>
            )}
          </div>

          {/* Hamburger (mobile) */}
          <button
            onClick={() => setNavOpen(true)}
            style={{
              position: 'absolute', right: '2rem', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', color: C.cream, cursor: 'pointer',
              fontSize: '2.6rem', padding: '0.4rem', display: 'none',
              alignItems: 'center', justifyContent: 'center', zIndex: 2,
            }}
            className="hamburger-btn"
            aria-label="Menu"
          >
            <svg width="24" height="18" viewBox="0 0 24 18" fill="none">
                <rect x="0" y="0" width="24" height="2.5" rx="1.25" fill="#FAF6EE"/>
                <rect x="0" y="7.75" width="24" height="2.5" rx="1.25" fill="#FAF6EE"/>
                <rect x="0" y="15.5" width="24" height="2.5" rx="1.25" fill="#FAF6EE"/>
              </svg>
          </button>
        </div>
      </nav>

      {/* ── Cart drawer (slide from right) ── */}
      <>
        {/* Overlay */}
        <div
          onClick={() => setCartOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 1100,
            opacity: cartOpen ? 1 : 0,
            visibility: cartOpen ? 'visible' : 'hidden',
            transition: 'opacity 0.3s, visibility 0.3s',
            backdropFilter: 'blur(4px)',
          }}
        />

        {/* Panel */}
        <div style={{
          position: 'fixed',
          top: 0, right: 0, bottom: 0,
          width: '44rem',
          maxWidth: '100vw',
          background: '#161B2D',
          zIndex: 1200,
          transform: cartOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.38s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-12px 0 60px rgba(0,0,0,0.6)',
        }}>

          {/* ── Header ── */}
          <div style={{
            padding: '2.4rem',
            borderBottom: '1px solid #2A2A2A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.9rem',
                color: C.gold,
                letterSpacing: '0.04em',
                fontWeight: 400,
              }}>
                Votre Panier
              </h2>
              {totalItems > 0 && (
                <span style={{
                  background: 'rgba(198,164,61,0.12)',
                  border: '1px solid rgba(198,164,61,0.25)',
                  color: C.gold,
                  fontSize: '1.1rem',
                  fontFamily: 'var(--font-body)',
                  letterSpacing: '0.08em',
                  padding: '0.25rem 0.9rem',
                  borderRadius: '999px',
                }}>
                  {totalItems}
                </span>
              )}
            </div>
            <button
              onClick={() => setCartOpen(false)}
              aria-label="Fermer le panier"
              style={{
                width: '3.2rem', height: '3.2rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'none',
                border: '1px solid #2A2A2A',
                borderRadius: 'var(--r-pill)',
                color: C.muted,
                cursor: 'pointer',
                fontSize: '1.8rem',
                transition: 'border-color 0.2s, color 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.cream; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2A2A2A'; e.currentTarget.style.color = C.muted; }}
            >
              ✕
            </button>
          </div>

          {/* ── Body ── */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {items.length === 0 ? (
              /* Panier vide */
              <div style={{ padding: '7rem 3rem', textAlign: 'center' }}>
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="rgba(198,164,61,0.2)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto 2.5rem' }}>
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
                <p style={{ fontSize: '1.4rem', color: C.muted, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-body)', marginBottom: '3rem' }}>
                  Votre panier est vide
                </p>
                <button
                  onClick={() => { setCartOpen(false); navigate('/boutique'); }}
                  style={{
                    padding: '1.3rem 3.5rem',
                    background: C.gold,
                    color: C.dark,
                    border: 'none',
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    borderRadius: 'var(--r-pill)',
                    transition: 'background 0.25s, color 0.25s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = C.terracotta; e.currentTarget.style.color = C.cream; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = C.gold; e.currentTarget.style.color = C.dark; }}
                >
                  Explorer la boutique
                </button>
              </div>
            ) : (
              /* Liste des articles */
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {items.map((item, idx) => (
                  <CartItem
                    key={idx}
                    item={item}
                    onUpdate={(delta) => updateQuantity(item.product.id, item.variant?.id ?? null, item.quantity + delta)}
                    onRemove={() => removeItem(item.product.id, item.variant?.id ?? null)}
                    C={C}
                  />
                ))}
              </ul>
            )}
          </div>

          {/* ── Footer ── */}
          {items.length > 0 && (
            <div style={{
              padding: '2.4rem',
              borderTop: '1px solid #2A2A2A',
              flexShrink: 0,
              background: '#161B2D',
            }}>
              {/* Sous-total */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                marginBottom: '2.4rem',
                paddingBottom: '2.4rem',
                borderBottom: '1px solid #2A2A2A',
              }}>
                <span style={{ fontSize: '1.2rem', color: C.muted, letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>
                  Sous-total
                </span>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '2rem', color: C.gold, fontFamily: 'var(--font-display)', fontWeight: 400, lineHeight: 1.2 }}>
                    {formatPrice(totalPrice, currency)}
                  </p>
                </div>
              </div>

              {/* Une seule sortie. « Voir le panier » menait à /panier, page
                  supprimée : le tiroir EST le panier, il montre les articles,
                  les quantités et le sous-total. Une page de plus pour redire
                  la même chose n'ajoutait qu'une étape avant de payer.

                  La ligne « Paiement sécurisé · Wave · Orange Money » est
                  partie avec. ⚠ Les moyens de paiement ne sont donc plus
                  annoncés nulle part avant l'écran de commande. */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button
                  onClick={() => { setCartOpen(false); navigate('/commande'); }}
                  style={{
                    padding: '1.6rem',
                    background: C.gold,
                    color: C.dark,
                    border: 'none',
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    borderRadius: 'var(--r-pill)',
                    transition: 'background 0.25s, color 0.25s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = C.terracotta; e.currentTarget.style.color = C.cream; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = C.gold; e.currentTarget.style.color = C.dark; }}
                >
                  Procéder au paiement
                </button>
              </div>

            </div>
          )}
        </div>
      </>

      {/* ── Mobile menu overlay ── */}
      <>
        <div
          onClick={() => setNavOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 1100,
            opacity: navOpen ? 1 : 0,
            visibility: navOpen ? 'visible' : 'hidden',
            transition: 'opacity 0.3s, visibility 0.3s',
          }}
        />
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: '42rem',
          background: C.dark,
          zIndex: 1200,
          transform: navOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.38s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          padding: '3rem',
        }}>
          {/* Close */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '4rem' }}>
            <button
              onClick={() => setNavOpen(false)}
              style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: '3rem', lineHeight: 1, padding: '0.2rem', transition: 'color 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.color = C.cream}
              onMouseLeave={(e) => e.currentTarget.style.color = C.muted}
            >
              <i className="bx bx-x"></i>
            </button>
          </div>

          {/* Links */}
          <nav style={{ flex: 1 }}>
            {navLinks.map(({ to, label }, i) => (
              <div
                key={to}
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  transform: navOpen ? 'translateX(0)' : 'translateX(3rem)',
                  opacity: navOpen ? 1 : 0,
                  transition: `transform 0.4s ease ${0.05 * i + 0.1}s, opacity 0.4s ease ${0.05 * i + 0.1}s`,
                }}
              >
                <Link
                  to={to}
                  onClick={() => setNavOpen(false)}
                  style={{
                    display: 'block',
                    padding: '2.2rem 0',
                    fontSize: '2.8rem',
                    fontFamily: 'var(--font-display)',
                    color: C.cream,
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = C.gold}
                  onMouseLeave={(e) => e.currentTarget.style.color = C.cream}
                >
                  {label}
                </Link>
              </div>
            ))}
          </nav>

          {/* Bottom section in mobile menu */}
          <div style={{ paddingTop: '3rem' }}>
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => { setNavOpen(false); navigate('/mon-compte'); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.8rem',
                  background: 'none', border: '1px solid rgba(255,255,255,0.15)',
                  color: C.cream, padding: '1.2rem 2rem', cursor: 'pointer',
                  fontSize: '1.4rem', fontFamily: 'var(--font-body)',
                  transition: 'border-color 0.2s, color 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = C.cream; }}
              >
                <i className="bx bx-user" style={{ fontSize: '1.8rem' }}></i>
                Connexion
              </button>

              {isAuthenticated && (
                <button
                  onClick={() => { setNavOpen(false); navigate('/commandes'); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.8rem',
                    background: 'none', border: '1px solid rgba(255,255,255,0.15)',
                    color: C.cream, padding: '1.2rem 2rem', cursor: 'pointer',
                    fontSize: '1.4rem', fontFamily: 'var(--font-body)',
                    transition: 'border-color 0.2s, color 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = C.cream; }}
                >
                  <i className="bx bx-receipt" style={{ fontSize: '1.8rem' }}></i>
                  Mes commandes
                </button>
              )}

              {isAuthenticated && user?.is_staff && (
                <button
                  onClick={() => { setNavOpen(false); navigate('/gestion'); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.8rem',
                    background: 'none', border: `1px solid ${C.gold}`,
                    color: C.gold, padding: '1.2rem 2rem', cursor: 'pointer',
                    fontSize: '1.4rem', fontFamily: 'var(--font-body)',
                  }}
                >
                  <i className="bx bx-cog" style={{ fontSize: '1.8rem' }}></i>
                  Espace Gestion
                </button>
              )}
            </div>


            <p style={{ fontSize: '1.2rem', color: '#444', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>
              Made in Dakar · Savoir-faire Africain
            </p>
          </div>
        </div>
      </>

      {/* Inline styles for responsive + hover effects */}
      <style>{`
        @media (max-width: 1080px) {
          .desktop-nav { display: none !important; }
          .nav-icons { display: none !important; }
          .hamburger-btn { display: flex !important; }
          .nav-selectors { display: none !important; }
          .nav-inner { padding: 0 1.6rem !important; min-height: 4.8rem; grid-template-columns: auto auto !important; }
        }
        @media (min-width: 1081px) {
          .hamburger-btn { display: none !important; }
        }
        .desktop-nav::-webkit-scrollbar { display: none; }
        .desktop-nav { scrollbar-width: none; -ms-overflow-style: none; }
        select option { background: #141414 !important; }
        @keyframes dropIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-6px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

    </div>
  );
};

/* ── Styles partagés select ── */
const mobileSelectStyle = {
  appearance: 'none',
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.12)',
  color: 'rgba(250,246,238,0.6)',
  fontSize: '1.3rem',
  fontFamily: 'var(--font-body)',
  textTransform: 'uppercase',
  letterSpacing: '0.15em',
  cursor: 'pointer',
  padding: '0.8rem 3rem 0.8rem 1.4rem',
  outline: 'none',
};

/* ── Sub-components ── */

const NavDropdown = ({ value, options, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find((o) => o.value === value) || options[0];

  const close = useCallback(() => setOpen(false), []);
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) close(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, close]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: 'none', border: 'none', cursor: 'pointer',
          color: open ? 'rgba(250,246,238,0.9)' : 'rgba(250,246,238,0.6)',
          fontSize: '1.1rem', fontFamily: 'var(--font-body)',
          textTransform: 'uppercase', letterSpacing: '0.15em',
          padding: '0.6rem 0.8rem',
          transition: 'color 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(250,246,238,0.9)'}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.color = 'rgba(250,246,238,0.6)'; }}
      >
        {selected.label}
        <svg
          width="9" height="9" viewBox="0 0 24 24" fill="none"
          stroke="rgba(250,246,238,0.4)" strokeWidth="2"
          style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 0.6rem)', left: '50%',
          transform: 'translateX(-50%)',
          background: '#0F1320',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          minWidth: '9rem',
          zIndex: 2000,
          animation: 'dropIn 0.15s ease backwards',
        }}>
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '1rem 1.6rem',
                background: opt.value === value ? 'rgba(198,164,61,0.08)' : 'none',
                border: 'none', cursor: 'pointer',
                fontSize: '1.1rem', fontFamily: 'var(--font-body)',
                textTransform: 'uppercase', letterSpacing: '0.15em',
                color: opt.value === value ? '#C6A43D' : 'rgba(250,246,238,0.6)',
                transition: 'background 0.15s, color 0.15s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(198,164,61,0.12)'; e.currentTarget.style.color = 'rgba(250,246,238,0.9)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = opt.value === value ? 'rgba(198,164,61,0.08)' : 'none'; e.currentTarget.style.color = opt.value === value ? '#C6A43D' : 'rgba(250,246,238,0.6)'; }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const NavLink = ({ to, label }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      to={to}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-block',
        padding: '0.9rem 1.2rem',
        fontSize: '1.4rem',
        fontWeight: 500,
        letterSpacing: '0.02em',
        color: hovered ? '#C6A43D' : 'rgba(250,246,238,0.85)',
        textDecoration: 'none',
        transition: 'color 0.2s',
        fontFamily: 'var(--font-body)',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {label}
    </Link>
  );
};

const CartItem = ({ item, onUpdate, onRemove, C }) => {
  const [hovered, setHovered] = useState(false);
  const variantLabel = item.variant
    ? [item.variant.size, item.variant.color].filter(Boolean).join(' · ')
    : null;

  return (
    <li
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        gap: '1.6rem',
        padding: '2rem 2.4rem',
        borderBottom: '1px solid #2A2A2A',
        alignItems: 'flex-start',
        background: hovered ? 'rgba(255,255,255,0.02)' : 'transparent',
        transition: 'background 0.2s',
      }}
    >
      {/* Miniature 3/4 */}
      <div style={{
        flexShrink: 0,
        width: '7.5rem',
        aspectRatio: '3/4',
        background: '#161B2D',
        overflow: 'hidden',
        borderRadius: '2px',
      }}>
        {item.product.primary_image ? (
          <CldImg
            src={item.product.primary_image}
            alt={item.product.name}
            sizes="80px"
            widths={[80, 160]}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </div>
        )}
      </div>

      {/* Infos + contrôles */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>

        {/* Ligne nom + × */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
          <div style={{ minWidth: 0 }}>
            <p style={{
              fontSize: '1.35rem',
              fontWeight: 500,
              color: C.cream,
              fontFamily: 'var(--font-body)',
              lineHeight: 1.4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {item.product.name}
            </p>
            {variantLabel && (
              <span style={{
                display: 'inline-block',
                marginTop: '0.4rem',
                fontSize: '1.1rem',
                color: C.muted,
                border: '1px solid #2A2A2A',
                borderRadius: 'var(--r-pill)',
                padding: '0.15rem 0.6rem',
                letterSpacing: '0.08em',
                fontFamily: 'var(--font-body)',
              }}>
                {variantLabel}
              </span>
            )}
          </div>
          {/* Bouton supprimer */}
          <button
            onClick={onRemove}
            aria-label={`Retirer ${item.product.name}`}
            style={{
              flexShrink: 0,
              background: 'none',
              border: 'none',
              color: '#444',
              cursor: 'pointer',
              fontSize: '1.6rem',
              lineHeight: 1,
              padding: '0.2rem',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = C.cream}
            onMouseLeave={(e) => e.currentTarget.style.color = '#444'}
          >
            ✕
          </button>
        </div>

        {/* Ligne prix + contrôles quantité */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: '1.3rem', color: C.gold, fontFamily: 'var(--font-body)', fontWeight: 600 }}>
            {new Intl.NumberFormat('fr-FR').format(item.price)} FCFA
          </p>

          {/* − qty + */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              onClick={() => onUpdate(-1)}
              aria-label="Diminuer"
              style={{
                width: '2.8rem', height: '2.8rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'none',
                border: '1px solid #2A2A2A',
                borderRadius: 'var(--r-pill)',
                color: C.cream,
                cursor: 'pointer',
                fontSize: '1.6rem',
                lineHeight: 1,
                transition: 'background 0.2s, border-color 0.2s, color 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = C.gold; e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = '#12141C'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = '#2A2A2A'; e.currentTarget.style.color = C.cream; }}
            >
              −
            </button>
            <span style={{
              minWidth: '2rem',
              textAlign: 'center',
              fontSize: '1.4rem',
              fontWeight: 600,
              color: C.cream,
              fontFamily: 'var(--font-body)',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {item.quantity}
            </span>
            <button
              onClick={() => onUpdate(+1)}
              aria-label="Augmenter"
              style={{
                width: '2.8rem', height: '2.8rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'none',
                border: '1px solid #2A2A2A',
                borderRadius: 'var(--r-pill)',
                color: C.cream,
                cursor: 'pointer',
                fontSize: '1.6rem',
                lineHeight: 1,
                transition: 'background 0.2s, border-color 0.2s, color 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = C.gold; e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = '#12141C'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = '#2A2A2A'; e.currentTarget.style.color = C.cream; }}
            >
              +
            </button>
          </div>
        </div>
      </div>
    </li>
  );
};

const IconBtn = ({ onClick, title, children }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        background: hovered ? 'rgba(255,255,255,0.07)' : 'none',
        border: 'none',
        color: hovered ? '#C6A43D' : 'rgba(250,246,238,0.85)',
        cursor: 'pointer',
        padding: '0.7rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'color 0.2s, background 0.2s',
        borderRadius: '0.4rem',
      }}
    >
      {children}
    </button>
  );
};

export default Navbar;
