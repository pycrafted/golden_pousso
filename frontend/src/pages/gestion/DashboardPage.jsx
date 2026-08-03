import { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import useSettingsStore, { formatPrice } from '../../store/settingsStore';
import { PageHeader, StatCard, HelpBox } from './ui';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const currency = useSettingsStore((s) => s.currency);

  useEffect(() => {
    apiClient.get('/gestion/dashboard/').then((r) => setStats(r.data)).catch(() => {});
  }, []);

  if (!stats) return null;

  return (
    <>
      <PageHeader
        title="Tableau de bord"
        subtitle="Vue d'ensemble de votre boutique. Cliquez sur une carte pour aller directement gérer ce qu'elle concerne."
      />

      {(stats.pending_orders > 0 || stats.low_stock_count > 0 || stats.pending_reviews > 0 || stats.unread_messages > 0) && (
        <HelpBox>
          À traiter en priorité :
          {stats.pending_orders > 0 && ` ${stats.pending_orders} commande${stats.pending_orders > 1 ? 's' : ''} en attente ·`}
          {stats.low_stock_count > 0 && ` ${stats.low_stock_count} produit${stats.low_stock_count > 1 ? 's' : ''} bientôt épuisé${stats.low_stock_count > 1 ? 's' : ''} ·`}
          {stats.pending_reviews > 0 && ` ${stats.pending_reviews} avis à modérer ·`}
          {stats.unread_messages > 0 && ` ${stats.unread_messages} message${stats.unread_messages > 1 ? 's' : ''} non lu${stats.unread_messages > 1 ? 's' : ''}`}
        </HelpBox>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(22rem, 1fr))', gap: '2rem' }}>
        <StatCard
          label="Commandes aujourd'hui"
          value={stats.orders_today}
          to="/gestion/commandes"
          hint="Voir toutes les commandes →"
        />
        <StatCard
          label="Commandes en attente"
          value={stats.pending_orders}
          tone={stats.pending_orders > 0 ? 'warning' : 'neutral'}
          to="/gestion/commandes"
          hint={stats.pending_orders > 0 ? 'À confirmer ou expédier →' : 'Rien à traiter'}
        />
        <StatCard label="Chiffre d'affaires du mois" value={formatPrice(stats.revenue_month, currency)} hint="Commandes payées uniquement" />
        <StatCard
          label="Stock faible (3 ou moins)"
          value={stats.low_stock_count}
          tone={stats.low_stock_count > 0 ? 'danger' : 'neutral'}
          to="/gestion/produits"
          hint={stats.low_stock_count > 0 ? 'Pensez à réapprovisionner →' : 'Tout va bien'}
        />
        <StatCard
          label="Avis en attente de validation"
          value={stats.pending_reviews}
          tone={stats.pending_reviews > 0 ? 'warning' : 'neutral'}
          to="/gestion/avis"
          hint={stats.pending_reviews > 0 ? 'À approuver ou rejeter →' : 'Rien à modérer'}
        />
        <StatCard
          label="Messages non lus"
          value={stats.unread_messages}
          tone={stats.unread_messages > 0 ? 'warning' : 'neutral'}
          to="/gestion/messages"
          hint={stats.unread_messages > 0 ? 'À lire →' : 'Boîte à jour'}
        />
      </div>
    </>
  );
};

export default DashboardPage;
