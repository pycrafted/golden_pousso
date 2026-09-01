import { NavLink, Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { COLORS, FONT_DISPLAY, FONT_BODY } from '../../theme';

const NAV_ITEMS = [
  { to: '/gestion', label: 'Tableau de bord', end: true, icon: 'bx-grid-alt' },
  { to: '/gestion/produits', label: 'Produits', icon: 'bx-package' },
  { to: '/gestion/categories', label: 'Catégories', icon: 'bx-category' },
  { to: '/gestion/commandes', label: 'Commandes', icon: 'bx-receipt' },
  { to: '/gestion/avis', label: 'Avis clients', icon: 'bx-star' },
  { to: '/gestion/alertes-stock', label: 'Alertes de réassort', icon: 'bx-bell' },
  { to: '/gestion/messages', label: 'Messages', icon: 'bx-envelope' },
  { to: '/gestion/clients', label: 'Clients', icon: 'bx-user' },
  { to: '/gestion/videos', label: 'Vidéos', icon: 'bx-video' },
  { to: '/gestion/contenu', label: 'Contenu du site', icon: 'bx-image' },
];

const GestionLayout = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  if (!isAuthenticated || !user?.is_staff) {
    return <Navigate to="/" replace />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#FAF6EE' }}>
      {/* Sidebar */}
      <aside style={{ width: '26rem', flexShrink: 0, background: COLORS.ink, color: COLORS.cream, padding: '2.4rem 0', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
        <div style={{ padding: '0 2.4rem', marginBottom: '3.2rem' }}>
          <p style={{ fontFamily: FONT_DISPLAY, fontSize: '1.8rem', color: COLORS.gold }}>Golden Pousso</p>
          <p style={{ fontFamily: FONT_BODY, fontSize: '1.1rem', color: 'rgba(250,246,238,0.5)', textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: '0.3rem' }}>
            Espace Gestion
          </p>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          {NAV_ITEMS.map(({ to, label, end, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: '1.2rem',
                padding: '1.2rem 2.4rem',
                fontFamily: FONT_BODY, fontSize: '1.3rem', textDecoration: 'none',
                color: isActive ? COLORS.gold : 'rgba(250,246,238,0.75)',
                background: isActive ? 'rgba(184,150,10,0.12)' : 'transparent',
                borderLeft: `3px solid ${isActive ? COLORS.gold : 'transparent'}`,
                transition: 'background 0.2s, color 0.2s',
              })}
            >
              <i className={`bx ${icon}`} style={{ fontSize: '1.8rem' }} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: '2.4rem', marginTop: '2rem' }}>
          <NavLink to="/" style={{ fontFamily: FONT_BODY, fontSize: '1.2rem', color: 'rgba(250,246,238,0.5)', textDecoration: 'none' }}>
            ← Retour au site
          </NavLink>
        </div>
      </aside>

      {/* Content */}
      <main style={{ flex: 1, padding: '3.6rem 4rem', minWidth: 0 }}>
        <Outlet />
      </main>
    </div>
  );
};

export default GestionLayout;
