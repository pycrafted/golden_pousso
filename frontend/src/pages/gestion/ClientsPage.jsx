import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../../api/client';
import useAuthStore from '../../store/authStore';
import useSettingsStore, { formatPrice } from '../../store/settingsStore';
import { COLORS } from '../../theme';
import { PageHeader, HelpBox, GestionButton, Badge, GestionTable, Td, EmptyState, ConfirmDialog } from './ui';

const ClientsPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);
  const currentUser = useAuthStore((s) => s.user);
  const currency = useSettingsStore((s) => s.currency);

  const load = useCallback(() => {
    apiClient.get('/gestion/customers/?page_size=200').then((r) => setCustomers(r.data.results ?? r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleStaff = (customer) => {
    const grant = !customer.is_staff;
    setConfirm({
      title: grant ? `Donner l'accès Gestion à ${customer.first_name || customer.phone} ?` : `Retirer l'accès Gestion de ${customer.first_name || customer.phone} ?`,
      description: grant
        ? "Cette personne pourra se connecter et gérer produits, commandes, catégories, avis, messages et contenu du site — exactement comme vous. À réserver aux personnes de confiance."
        : "Cette personne perdra immédiatement l'accès à l'Espace Gestion. Son compte client normal reste inchangé.",
      danger: !grant,
      confirmLabel: grant ? "Donner l'accès" : "Retirer l'accès",
      onConfirm: async () => {
        try {
          await apiClient.patch(`/gestion/customers/${customer.id}/`, { is_staff: grant });
          toast.success(grant ? 'Accès accordé' : 'Accès retiré');
          setConfirm(null);
          load();
        } catch (err) {
          toast.error(err.response?.data?.[0] || err.response?.data?.detail || 'Erreur');
          setConfirm(null);
        }
      },
    });
  };

  if (loading) return null;

  return (
    <>
      <PageHeader
        title="Clients"
        subtitle="Tous les comptes créés sur le site : historique d'achat et gestion des accès à cet espace de gestion."
      />
      <HelpBox>
        Le badge <Badge tone="warning">Accès Gestion</Badge> indique qui, en plus de vous, peut se connecter ici. Donnez cet accès uniquement à des personnes de confiance : elles pourront tout modifier sur le site.
      </HelpBox>

      {customers.length === 0 ? (
        <EmptyState icon="bx-user" title="Aucun client pour l'instant" description="Les comptes créés par vos clients apparaîtront ici automatiquement." />
      ) : (
        <GestionTable columns={['Nom', 'Téléphone', 'Email', 'Commandes', 'Total dépensé', 'Accès Gestion', '']}>
          {customers.map((c) => {
            const isSelf = currentUser?.id === c.id;
            return (
              <tr key={c.id}>
                <Td>{[c.first_name, c.last_name].filter(Boolean).join(' ') || '—'} {isSelf && <span style={{ color: COLORS.mutedOnLight, fontSize: '1.1rem' }}>(vous)</span>}</Td>
                <Td>{c.phone || '—'}</Td>
                <Td>{c.email || '—'}</Td>
                <Td>{c.order_count}</Td>
                <Td>{formatPrice(c.total_spent, currency)}</Td>
                <Td>{c.is_staff ? <Badge tone="warning">Accès Gestion</Badge> : <Badge>Client</Badge>}</Td>
                <Td>
                  <GestionButton
                    variant={c.is_staff ? 'danger' : 'outline'}
                    onClick={() => toggleStaff(c)}
                    disabled={isSelf && c.is_staff}
                    title={isSelf && c.is_staff ? 'Vous ne pouvez pas retirer votre propre accès' : undefined}
                    style={{ padding: '0.6rem 1.4rem', opacity: isSelf && c.is_staff ? 0.5 : 1, cursor: isSelf && c.is_staff ? 'not-allowed' : 'pointer' }}
                  >
                    {c.is_staff ? 'Retirer l’accès' : 'Donner l’accès'}
                  </GestionButton>
                </Td>
              </tr>
            );
          })}
        </GestionTable>
      )}

      {confirm && <ConfirmDialog {...confirm} onCancel={() => setConfirm(null)} />}
    </>
  );
};

export default ClientsPage;
