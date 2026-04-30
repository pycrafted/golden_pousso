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
const BoutiquePage = lazy(() => import('./pages/BoutiquePage'));
const ProduitPage = lazy(() => import('./pages/ProduitPage'));
const PanierPage = lazy(() => import('./pages/PanierPage'));
const CommandePage = lazy(() => import('./pages/CommandePage'));
const SuiviCommandePage = lazy(() => import('./pages/SuiviCommandePage'));
const MonComptePage = lazy(() => import('./pages/MonComptePage'));
const CollectionsPage = lazy(() => import('./pages/CollectionsPage'));
const CollectionDetailPage = lazy(() => import('./pages/CollectionDetailPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const AProposPage = lazy(() => import('./pages/AProposPage'));
const GuideTaillesPage = lazy(() => import('./pages/GuideTaillesPage'));
const LivraisonRetoursPage = lazy(() => import('./pages/LivraisonRetoursPage'));
const FAQPage = lazy(() => import('./pages/FAQPage'));
const MentionsLegalesPage = lazy(() => import('./pages/MentionsLegalesPage'));
const Page404 = lazy(() => import('./pages/Page404'));

const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh', background: '#0A0A0A' }}>
    <div style={{ width: '4rem', height: '4rem', border: '3px solid #1E1E1E', borderTop: '3px solid #D4AF37', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
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
            <Route path="/boutique" element={<BoutiquePage />} />
            <Route path="/produit/:slug" element={<ProduitPage />} />
            <Route path="/panier" element={<PanierPage />} />
            <Route path="/commande" element={<CommandePage />} />
            <Route path="/commande/suivi" element={<SuiviCommandePage />} />
            <Route path="/commande/suivi/:orderNumber" element={<SuiviCommandePage />} />
            <Route path="/mon-compte" element={<MonComptePage />} />
            <Route path="/collections" element={<CollectionsPage />} />
            <Route path="/collections/:slug" element={<CollectionDetailPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/a-propos" element={<AProposPage />} />
            <Route path="/guide-tailles" element={<GuideTaillesPage />} />
            <Route path="/livraison-retours" element={<LivraisonRetoursPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/mentions-legales" element={<MentionsLegalesPage />} />
            <Route path="*" element={<Page404 />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
