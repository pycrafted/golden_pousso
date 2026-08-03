import { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import { PageHeader, HelpBox, Badge, GestionTable, Td, EmptyState } from './ui';

const StockAlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/gestion/stock-alerts/?page_size=200').then((r) => setAlerts(r.data.results ?? r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  return (
    <>
      <PageHeader
        title="Alertes de réassort"
        subtitle="Quand un produit est épuisé, les clients intéressés peuvent laisser leur email pour être prévenus dès qu'il revient en stock."
      />
      <HelpBox>
        Rien à faire ici : dès que vous remettez un produit en stock (dans la fiche produit), un email est envoyé automatiquement à tous les clients en attente. Cette page sert juste à voir la demande.
      </HelpBox>

      {alerts.length === 0 ? (
        <EmptyState icon="bx-bell" title="Aucune alerte pour l'instant" description="Dès qu'un client demandera à être prévenu du retour en stock d'un produit épuisé, cela apparaîtra ici." />
      ) : (
        <GestionTable columns={['Produit', 'Email du client', 'Statut', 'Date de la demande']}>
          {alerts.map((a) => (
            <tr key={a.id}>
              <Td>{a.product_name}</Td>
              <Td>{a.email}</Td>
              <Td>{a.notified ? <Badge tone="success">Client prévenu</Badge> : <Badge tone="warning">En attente du réassort</Badge>}</Td>
              <Td>{new Date(a.created_at).toLocaleDateString('fr-FR')}</Td>
            </tr>
          ))}
        </GestionTable>
      )}
    </>
  );
};

export default StockAlertsPage;
