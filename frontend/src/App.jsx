import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import BoutiquePage from './pages/BoutiquePage';
import ProduitPage from './pages/ProduitPage';
import CollectionsPage from './pages/CollectionsPage';
import PanierPage from './pages/PanierPage';
import CommandePage from './pages/CommandePage';
import MonComptePage from './pages/MonComptePage';
import AProposPage from './pages/AProposPage';
import ContactPage from './pages/ContactPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/boutique" element={<BoutiquePage />} />
          <Route path="/produit/:slug" element={<ProduitPage />} />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/panier" element={<PanierPage />} />
          <Route path="/commande" element={<CommandePage />} />
          <Route path="/mon-compte" element={<MonComptePage />} />
          <Route path="/a-propos" element={<AProposPage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
