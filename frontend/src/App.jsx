import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Layout from './components/Layout';

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
const GestionDashboardPage = lazy(() => import('./pages/gestion/DashboardPage'));
const GestionProduitsPage = lazy(() => import('./pages/gestion/ProduitsPage'));
const GestionCategoriesPage = lazy(() => import('./pages/gestion/CategoriesPage'));
const GestionCommandesPage = lazy(() => import('./pages/gestion/CommandesPage'));
const GestionAvisPage = lazy(() => import('./pages/gestion/AvisPage'));
const GestionMessagesPage = lazy(() => import('./pages/gestion/MessagesPage'));
const GestionContenuPage = lazy(() => import('./pages/gestion/ContenuPage'));
const GestionClientsPage = lazy(() => import('./pages/gestion/ClientsPage'));
const GestionStockAlertsPage = lazy(() => import('./pages/gestion/StockAlertsPage'));
const GestionVideosPage = lazy(() => import('./pages/gestion/VideosPage'));

const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh', background: '#1A1208' }}>
    <div style={{ width: '4rem', height: '4rem', border: '3px solid #1E1E1E', borderTop: '3px solid #B8960A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
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
            <Route index element={<GestionDashboardPage />} />
            <Route path="produits" element={<GestionProduitsPage />} />
            <Route path="categories" element={<GestionCategoriesPage />} />
            <Route path="commandes" element={<GestionCommandesPage />} />
            <Route path="avis" element={<GestionAvisPage />} />
            <Route path="messages" element={<GestionMessagesPage />} />
            <Route path="clients" element={<GestionClientsPage />} />
            <Route path="alertes-stock" element={<GestionStockAlertsPage />} />
            <Route path="videos" element={<GestionVideosPage />} />
            <Route path="contenu" element={<GestionContenuPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
