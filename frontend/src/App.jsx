import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';

const HomePage = lazy(() => import('./pages/HomePage'));
const BoutiquePage = lazy(() => import('./pages/BoutiquePage'));
const ProduitPage = lazy(() => import('./pages/ProduitPage'));
const CollectionsPage = lazy(() => import('./pages/CollectionsPage'));
const PanierPage = lazy(() => import('./pages/PanierPage'));
const CommandePage = lazy(() => import('./pages/CommandePage'));
const MonComptePage = lazy(() => import('./pages/MonComptePage'));
const AProposPage = lazy(() => import('./pages/AProposPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));

const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
    <div style={{ width: '4rem', height: '4rem', border: '3px solid #f0f0f0', borderTop: '3px solid #C9A84C', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/boutique" element={<BoutiquePage />} />
            <Route path="/produit/:slug" element={<ProduitPage />} />
            <Route path="/collections" element={<CollectionsPage />} />
            <Route path="/panier" element={<PanierPage />} />
            <Route path="/commande" element={<CommandePage />} />
            <Route path="/commande/suivi/:orderNumber" element={<CommandePage />} />
            <Route path="/mon-compte" element={<MonComptePage />} />
            <Route path="/a-propos" element={<AProposPage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
