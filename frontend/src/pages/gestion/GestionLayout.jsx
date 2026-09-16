import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import SEOHead from '../../components/SEOHead';
import Sommaire, { SommaireTete } from '../../components/Sommaire';

const NAV_ITEMS = [
  { to: '/gestion/categories', label: 'Catégories' },
  { to: '/gestion/commandes', label: 'Commandes' },
  { to: '/gestion/comptes', label: 'Comptes utilisateurs' },
  { to: '/gestion/coordonnees', label: 'Coordonnées' },
];

/**
 * La mise en page de l'Espace Gestion.
 * ---------------------------------------------------------------------------
 * Les deux barres du site public — bande de coordonnées puis barre de
 * navigation — la coiffent, à la demande. Elles ne sont plus posées ici mais
 * dans `components/Chrome.jsx`, AU-DESSUS des deux mises en page : montées
 * une seule fois, elles ne se démontent plus quand on passe du site à
 * l'Espace Gestion. Toutes deux collantes, elles publient leur hauteur dans
 * --bande-h et --nav-h, que le cadre ci-dessous lit (--gl-haut).
 *
 * ── Le menu : LE sommaire, pas une copie ───────────────────────────────────
 * C'est le composant `components/Sommaire.jsx`, celui de la page d'accueil, à
 * la demande : une carte flottante à gauche, décollée du bord, sur un voile
 * d'indigo à 85 % et un flou, cernée d'un filet de laiton, aux coins --r-3.
 * Chaque page : son numéro, un trait, son nom ; la courante en laiton, trait
 * déployé. Le dessin y était RECOPIÉ, classe par classe (`.gl-sommaire-*`) ;
 * il ne reste ici que l'emplacement de la carte. Il a été une colonne sombre
 * pleine hauteur, collée au bord, icônes Boxicons en tête de ligne.
 *
 * ⚠ La bande de coordonnées et la barre de navigation sont, elles aussi, les
 * composants du site public (`BandeCoordonnees`, `Navbar`) : rien n'est
 * recopié ici.
 *
 * ── Le fond : l'indigo du site ──────────────────────────────────────────────
 * À la demande, l'Espace Gestion est la continuité du site : il pose les
 * classes de <main> du Layout public, « site-page on-dark » — fond #161B2D,
 * tokens de texte, de filet et de champ du site sombre. Il était écru. Les
 * briques (en-tête, tableaux, pastilles, tiroirs) sont dans ui.jsx et
 * gestion.css. Sur l'indigo, le voile de la carte n'a plus rien à rattraper :
 * écru 15,85:1, laiton 7,14:1.
 *
 * Elle est centrée dans la hauteur qui reste sous les deux barres, et le
 * contenu lui réserve sa place à gauche (--gl-reserve). Sous 900 px, elle
 * rentre dans le flux, en tête de page, sur toute la largeur.
 */
const GestionLayout = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const { pathname } = useLocation();

  /* Le titre de l'onglet, au format du reste du site — « Commandes | Golden
     Pousso ». L'Espace Gestion n'en posait AUCUN : l'onglet gardait le titre
     de la page d'où l'on venait, ou celui du document sur une ouverture
     directe. Le nom vient du menu : renommer une page la renomme partout.
     `noindex`, comme les autres pages de compte : rien de tout cela n'a à
     être indexé. */
  const page = NAV_ITEMS.find((i) => pathname.startsWith(i.to));

  if (!isAuthenticated || !user?.is_staff) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <SEOHead title={page?.label ?? 'Espace Gestion'} url={pathname} noindex />

      <div className="gl site-page on-dark">
        {/* La même carte que le sommaire de l'accueil — le composant, pas une
            copie de son dessin (components/Sommaire.jsx). Ici, un titre en
            tête à la place du chevron, et des liens de routeur. */}
        <Sommaire
          className="gl-sommaire"
          label="Espace Gestion"
          tete={<SommaireTete>Espace Gestion</SommaireTete>}
          entrees={NAV_ITEMS.map(({ to, label }) => ({ cle: to, to, nom: label }))}
        />

        <main className="gl-contenu">
          <Outlet />
        </main>
      </div>

      <style>{`
        /* ── Le cadre ───────────────────────────────────────────────────── */
        .gl {
          --gl-bord: clamp(1.6rem, 2.2vw, 3.2rem);
          --gl-largeur: 22.6rem;
          --gl-reserve: calc(var(--gl-bord) + var(--gl-largeur) + 2.4rem);
          --gl-haut: calc(var(--bande-h, 0px) + var(--nav-h, 0px));
          min-height: calc(100vh - var(--gl-haut));
        }
        .gl-contenu {
          min-width: 0;
          max-width: calc(var(--gl-reserve) + 120rem);
          padding: 4.8rem 4rem 9.6rem var(--gl-reserve);
        }

        /* ── Le sommaire ── la carte est components/Sommaire.jsx ─────────
           Partagée avec la page d'accueil ; il ne reste ici que son
           EMPLACEMENT : fixée à gauche, centrée dans la hauteur qui reste
           sous les deux barres. Elle a été une colonne sombre pleine hauteur,
           collée au bord, icônes en tête de ligne. */
        .gl-sommaire {
          position: fixed;
          top: calc(var(--gl-haut) + (100vh - var(--gl-haut)) / 2);
          left: var(--gl-bord);
          z-index: 30;
          width: var(--gl-largeur);
          transform: translateY(-50%);
        }

        /* ── Sous 900 px : la carte rentre dans le flux, en tête de page ── */
        @media (max-width: 900px) {
          .gl-sommaire {
            position: static;
            width: auto;
            margin: 1.6rem 1.6rem 0;
            transform: none;
          }
          .gl-contenu { padding: 2.4rem 1.6rem; }
        }

        /* Les transitions de la carte sont coupées par le composant
           lui-même quand le visiteur demande moins d'animations. */
      `}</style>
    </>
  );
};

export default GestionLayout;
