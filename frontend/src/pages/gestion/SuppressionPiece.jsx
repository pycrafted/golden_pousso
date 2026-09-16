import toast from 'react-hot-toast';
import apiClient from '../../api/client';
import useFavorisStore from '../../store/favorisStore';
import { ConfirmDialog } from './ui';

/**
 * Supprimer une pièce depuis sa carte — la poubelle des cartes produit.
 * ---------------------------------------------------------------------------
 * À la demande, sous le stylo de chaque carte, pour les seuls comptes
 * `is_staff`. Chargé au premier clic (`lazy`, voir ProductCard) : les
 * visiteurs ne téléchargent ni ce code ni la feuille de l'Espace Gestion.
 *
 * Suppression définitive (`DELETE /gestion/products/:id/`) : photos,
 * variantes et demandes de réassort partent avec la pièce ; une commande
 * passée garde sa ligne — nom, prix et quantité —, la pièce y devient vide
 * (`OrderItem.product` en SET_NULL). La pièce est aussi retirée des favoris
 * de CE navigateur, où elle mènerait à une fiche introuvable.
 */
const SuppressionPiece = ({ product, onClose, onSupprime }) => {
  const retirerFavori = useFavorisStore((s) => s.retirer);

  const supprimer = async () => {
    try {
      await apiClient.delete(`/gestion/products/${product.id}/`);
      retirerFavori(product.id);
      toast.success(`« ${product.name} » est supprimée`);
      onClose();
      onSupprime?.();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'La suppression a échoué.');
      onClose();
    }
  };

  return (
    <ConfirmDialog
      title={`Supprimer « ${product.name} » ?`}
      description="La pièce disparaît du site avec ses photos et ses variantes. Les commandes déjà passées la gardent, par son nom et son prix. C'est définitif."
      confirmLabel="Supprimer"
      danger
      onConfirm={supprimer}
      onCancel={onClose}
    />
  );
};

export default SuppressionPiece;
