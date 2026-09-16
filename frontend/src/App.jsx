import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
/* Les barres du site — montées une seule fois, au-dessus du site public ET de
   l'Espace Gestion : voir components/Chrome.jsx. */
import Chrome from './components/Chrome';
/* Le repli de <Suspense> : l'emblème de la maison sur l'indigo du site.
   C'était un anneau gris à segment doré sur l'ancien brun #1A1208. */
import Loader from './components/Loader';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
};

const HomePage = lazy(() => import('./pages/HomePage'));
const FavorisPage = lazy(() => import('./pages/FavorisPage'));
const CommandePage = lazy(() => import('./pages/CommandePage'));
const SuiviCommandePage = lazy(() => import('./pages/SuiviCommandePage'));
const CategoriePage = lazy(() => import('./pages/CategoriePage'));
const BoutiquePage = lazy(() => import('./pages/BoutiquePage'));
const MesCommandesPage = lazy(() => import('./pages/MesCommandesPage'));
const ProfilPage = lazy(() => import('./pages/MonComptePage'));
const ProduitPage = lazy(() => import('./pages/ProduitPage'));
const MentionsLegalesPage = lazy(() => import('./pages/MentionsLegalesPage'));
const Page404 = lazy(() => import('./pages/Page404'));

// Espace Gestion (back-office)
const GestionLayout = lazy(() => import('./pages/gestion/GestionLayout'));
const GestionCategoriesPage = lazy(() => import('./pages/gestion/CategoriesPage'));
const GestionCommandesPage = lazy(() => import('./pages/gestion/CommandesPage'));
const GestionClientsPage = lazy(() => import('./pages/gestion/ClientsPage'));
const GestionCoordonneesPage = lazy(() => import('./pages/gestion/CoordonneesPage'));


function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<Loader />}>
        <Routes>
          {/* Le chrome — bande de coordonnées, barre de navigation,
              notifications — coiffe les DEUX mises en page : il ne se démonte
              donc pas quand on passe de /gestion au site. */}
          <Route element={<Chrome />}>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/favoris" element={<FavorisPage />} />
              <Route path="/produit/:slug" element={<ProduitPage />} />
              <Route path="/commande" element={<CommandePage />} />
              <Route path="/commande/suivi" element={<SuiviCommandePage />} />
              <Route path="/commande/suivi/:orderNumber" element={<SuiviCommandePage />} />
              <Route path="/profil" element={<ProfilPage />} />
              <Route path="/mon-compte" element={<ProfilPage />} />
              <Route path="/categorie/:slug" element={<CategoriePage />} />
              <Route path="/boutique" element={<BoutiquePage />} />
              <Route path="/commandes" element={<MesCommandesPage />} />
              <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
              <Route path="*" element={<Page404 />} />
            </Route>

            <Route path="/gestion" element={<GestionLayout />}>
              {/* Le tableau de bord a été supprimé à la demande : l'Espace
                  Gestion s'ouvre sur les commandes. */}
              <Route index element={<Navigate to="/gestion/commandes" replace />} />
              <Route path="categories" element={<GestionCategoriesPage />} />
              <Route path="commandes" element={<GestionCommandesPage />} />
              {/* « Clients » est devenue « Comptes utilisateurs », à la demande :
                  l'ancienne adresse y mène. */}
              <Route path="comptes" element={<GestionClientsPage />} />
              <Route path="clients" element={<Navigate to="/gestion/comptes" replace />} />
              {/* Les coordonnées de la boutique — ce que la bande affiche en
                  tête de toutes les pages. */}
              <Route path="coordonnees" element={<GestionCoordonneesPage />} />
              {/* Plus de page « Vidéos de l'accueil » (ni de « Contenu du site »),
                  supprimée à la demande : les vidéos se gèrent par le stylo de
                  la section « Aperçu de la boutique », sur l'accueil. */}
            </Route>
            </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
