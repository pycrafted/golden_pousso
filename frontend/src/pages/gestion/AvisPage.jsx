import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../../api/client';
import { COLORS, FONT_BODY } from '../../theme';
import { PageHeader, GestionButton, Badge, GestionTable, Td, EmptyState, ConfirmDialog, HelpBox } from './ui';

const Stars = ({ value }) => (
  <span style={{ color: COLORS.gold, letterSpacing: '0.1em' }}>{'★'.repeat(value)}{'☆'.repeat(5 - value)}</span>
);

const AvisPage = () => {
  const [reviews, setReviews] = useState([]);
  const [onlyPending, setOnlyPending] = useState(true);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = useCallback(() => {
    apiClient.get('/gestion/reviews/?page_size=200').then((r) => setReviews(r.data.results ?? r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const approve = async (id, is_approved) => {
    await apiClient.patch(`/gestion/reviews/${id}/`, { is_approved });
    toast.success(is_approved ? 'Avis approuvé — visible sur la fiche produit' : 'Avis retiré du site');
    load();
  };

  const remove = (id) => {
    setConfirmDelete({
      title: 'Supprimer cet avis ?',
      description: "L'avis sera effacé définitivement. Le client qui l'a écrit ne sera pas prévenu.",
      onConfirm: async () => {
        await apiClient.delete(`/gestion/reviews/${id}/`);
        toast.success('Avis supprimé');
        setConfirmDelete(null);
        load();
      },
    });
  };

  if (loading) return null;
  const filtered = onlyPending ? reviews.filter((r) => !r.is_approved) : reviews;

  return (
    <>
      <PageHeader
        title="Avis clients"
        subtitle="Un avis n'apparaît sur le site qu'après votre validation. Vous pouvez le retirer à tout moment."
        action={
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontFamily: FONT_BODY, fontSize: '1.3rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={onlyPending} onChange={(e) => setOnlyPending(e.target.checked)} style={{ accentColor: COLORS.gold, width: '1.6rem', height: '1.6rem' }} />
            Afficher seulement les avis en attente
          </label>
        }
      />
      {onlyPending && reviews.some((r) => !r.is_approved) === false && reviews.length > 0 && (
        <HelpBox>Tous les avis ont déjà été traités. Décochez la case ci-dessus pour voir l'historique complet.</HelpBox>
      )}
      {filtered.length === 0 ? (
        <EmptyState
          icon="bx-star"
          title={onlyPending ? "Aucun avis en attente" : "Aucun avis pour l'instant"}
          description={onlyPending ? "Tous les avis ont été traités, ou aucun client n'a encore laissé d'avis." : "Les avis laissés par vos clients sur les fiches produits apparaîtront ici."}
        />
      ) : (
      <GestionTable columns={['Produit', 'Client', 'Note', 'Commentaire', 'Statut', 'Actions']}>
        {filtered.map((r) => (
          <tr key={r.id}>
            <Td>{r.product_name}</Td>
            <Td>{r.customer_name}</Td>
            <Td><Stars value={r.rating} /></Td>
            <Td style={{ maxWidth: '32rem' }}>{r.comment}</Td>
            <Td>{r.is_approved ? <Badge tone="success">Approuvé</Badge> : <Badge tone="warning">En attente</Badge>}</Td>
            <Td>
              <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                {!r.is_approved && <GestionButton onClick={() => approve(r.id, true)} style={{ padding: '0.6rem 1.4rem' }}>Approuver</GestionButton>}
                {r.is_approved && <GestionButton variant="outline" onClick={() => approve(r.id, false)} style={{ padding: '0.6rem 1.4rem' }}>Retirer</GestionButton>}
                <GestionButton variant="danger" onClick={() => remove(r.id)} style={{ padding: '0.6rem 1.4rem' }}>Supprimer</GestionButton>
              </div>
            </Td>
          </tr>
        ))}
      </GestionTable>
      )}
      {confirmDelete && <ConfirmDialog {...confirmDelete} onCancel={() => setConfirmDelete(null)} />}
    </>
  );
};

export default AvisPage;
