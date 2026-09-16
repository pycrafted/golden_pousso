import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../../api/client';
import ProductForm from './ProductForm';

/**
 * Modifier une pièce depuis sa carte — le stylo des cartes produit.
 * ---------------------------------------------------------------------------
 * À la demande, un stylo posé sur chaque carte (boutique, rayons, favoris,
 * pièces similaires), visible des seuls comptes `is_staff`, ouvre le
 * formulaire produit en MODIFICATION. Chargé au premier clic (`lazy`, voir
 * ProductCard) : les visiteurs ne téléchargent pas ce code.
 *
 * La carte ne porte que les champs publics d'une pièce ; le formulaire a
 * besoin de ceux de l'Espace Gestion (catégorie par identifiant, description,
 * ancien prix, stock). La pièce est donc relue sur `/gestion/products/:id/`,
 * et les rayons sur `/categories/` pour le menu.
 *
 * Le panneau reste OUVERT après « Enregistrer », à la demande : rien
 * n'indique que l'admin a fini — il le ferme lui-même. Le bouton passe à
 * « ✓ Enregistré » (ProductForm). La page relit sa grille (`onModifie`) à la
 * FERMETURE, s'il y a eu un enregistrement — pas à chaque envoi : la relecture
 * remplace les cartes par des squelettes, ce qui démonterait la carte qui
 * porte ce panneau, et le fermerait.
 */
const EditionPiece = ({ productId, onClose, onModifie }) => {
  const [produit, setProduit] = useState(null);
  const [categories, setCategories] = useState([]);
  const modifie = useRef(false);

  const fermer = useCallback(() => {
    onClose();
    if (modifie.current) onModifie?.();
  }, [onClose, onModifie]);

  useEffect(() => {
    let actif = true;
    Promise.all([
      apiClient.get(`/gestion/products/${productId}/`),
      apiClient.get('/categories/', { params: { page_size: 200 } }),
    ])
      .then(([p, c]) => {
        if (!actif) return;
        setProduit(p.data);
        setCategories(c.data.results ?? c.data);
      })
      .catch(() => {
        if (!actif) return;
        toast.error('Impossible d’ouvrir cette pièce.');
        onClose();
      });
    return () => { actif = false; };
  }, [productId, onClose]);

  if (!produit) return null;

  return (
    <ProductForm
      product={produit}
      categories={categories}
      onClose={fermer}
      onSaved={() => { modifie.current = true; }}
    />
  );
};

export default EditionPiece;
