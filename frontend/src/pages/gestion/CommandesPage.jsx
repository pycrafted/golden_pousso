import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../../api/client';
import { COLORS, FONT_BODY } from '../../theme';
import { PageHeader, GestionButton, GestionSelect, Badge, GestionTable, Td, Panel, EmptyState } from './ui';

const formatFCFA = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

const STATUS_LABELS = {
  pending: 'En attente', confirmed: 'Confirmée', processing: 'En préparation',
  shipped: 'Expédiée', delivered: 'Livrée', cancelled: 'Annulée',
};
const STATUS_TONE = {
  pending: 'warning', confirmed: 'neutral', processing: 'neutral',
  shipped: 'neutral', delivered: 'success', cancelled: 'danger',
};
const PAYMENT_STATUS_LABELS = { pending: 'En attente', paid: 'Payé', failed: 'Échoué' };

const OrderDetail = ({ order, onClose, onUpdated }) => {
  const [status, setStatus] = useState(order.status);
  const [paymentStatus, setPaymentStatus] = useState(order.payment_status);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await apiClient.patch(`/gestion/orders/${order.id}/`, { status, payment_status: paymentStatus });
      toast.success('Commande mise à jour — client notifié par email si statut changé');
      onUpdated(res.data);
    } catch {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(26,18,8,0.5)' }} />
      <div style={{ position: 'relative', width: '56rem', maxWidth: '100%', background: '#FAF6EE', height: '100vh', overflowY: 'auto', padding: '3.2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.4rem' }}>
          <h2 style={{ fontFamily: FONT_BODY, fontSize: '2rem', fontWeight: 700, color: COLORS.ink }}>Commande #{order.order_number}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer', color: COLORS.mutedOnLight }}>✕</button>
        </div>

        <Panel style={{ marginBottom: '2rem' }}>
          <p style={{ fontFamily: FONT_BODY, fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: COLORS.mutedOnLight, marginBottom: '1rem' }}>Client</p>
          <p style={{ fontFamily: FONT_BODY, fontSize: '1.4rem', color: COLORS.ink }}>{order.customer_name}</p>
          <p style={{ fontFamily: FONT_BODY, fontSize: '1.3rem', color: COLORS.mutedOnLight }}>{order.customer_phone} {order.customer_email && `· ${order.customer_email}`}</p>
          {order.delivery_address && <p style={{ fontFamily: FONT_BODY, fontSize: '1.3rem', color: COLORS.mutedOnLight, marginTop: '0.6rem' }}>{order.delivery_address}</p>}
          {order.notes && <p style={{ fontFamily: FONT_BODY, fontSize: '1.3rem', color: COLORS.terracotta, marginTop: '0.6rem', fontStyle: 'italic' }}>{order.notes}</p>}
        </Panel>

        <Panel style={{ marginBottom: '2rem' }}>
          <p style={{ fontFamily: FONT_BODY, fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: COLORS.mutedOnLight, marginBottom: '1.2rem' }}>Articles</p>
          {order.items.map((it) => (
            <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem 0', borderBottom: '1px solid #F0E8D8', fontFamily: FONT_BODY, fontSize: '1.3rem' }}>
              <span>{it.quantity}× {it.product_name}</span>
              <span style={{ color: COLORS.gold }}>{formatFCFA(it.line_total)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '1.2rem', marginTop: '0.8rem', fontFamily: FONT_BODY, fontSize: '1.4rem', fontWeight: 700 }}>
            <span>Total</span><span style={{ color: COLORS.gold }}>{formatFCFA(order.total)}</span>
          </div>
        </Panel>

        <Panel>
          <p style={{ fontFamily: FONT_BODY, fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: COLORS.mutedOnLight, marginBottom: '1.2rem' }}>Statut</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.6rem', marginBottom: '2rem' }}>
            <GestionSelect value={status} onChange={(e) => setStatus(e.target.value)}>
              {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </GestionSelect>
            <GestionSelect value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
              {Object.entries(PAYMENT_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </GestionSelect>
          </div>
          <GestionButton onClick={save} disabled={saving}>{saving ? 'Enregistrement…' : 'Mettre à jour'}</GestionButton>
        </Panel>
      </div>
    </div>
  );
};

const CommandesPage = () => {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    apiClient.get('/gestion/orders/?page_size=200').then((r) => setOrders(r.data.results ?? r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = statusFilter ? orders.filter((o) => o.status === statusFilter) : orders;

  const exportCsv = () => {
    const header = ['N° Commande', 'Client', 'Téléphone', 'Total', 'Statut', 'Paiement', 'Date'];
    const rows = filtered.map((o) => [o.order_number, o.customer_name, o.customer_phone, o.total, STATUS_LABELS[o.status], o.payment_method, o.created_at]);
    const csv = '﻿' + [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'commandes.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return null;

  return (
    <>
      <PageHeader
        title="Commandes"
        subtitle="Cliquez sur « Détail » pour voir les articles commandés et faire avancer le statut. Le client reçoit un email automatique à chaque changement de statut."
        action={
          <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center' }}>
            <GestionSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: '18rem' }}>
              <option value="">Tous les statuts</option>
              {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </GestionSelect>
            <GestionButton variant="outline" onClick={exportCsv}>Exporter CSV</GestionButton>
          </div>
        }
      />
      {filtered.length === 0 ? (
        <EmptyState
          icon="bx-receipt"
          title={statusFilter ? "Aucune commande avec ce statut" : "Aucune commande pour l'instant"}
          description={statusFilter ? "Essayez un autre filtre, ou sélectionnez « Tous les statuts »." : "Les commandes passées par vos clients apparaîtront ici automatiquement."}
        />
      ) : (
      <GestionTable columns={['N°', 'Client', 'Total', 'Statut', 'Paiement', 'Date', '']}>
        {filtered.map((o) => (
          <tr key={o.id}>
            <Td>{o.order_number}</Td>
            <Td>{o.customer_name}</Td>
            <Td>{formatFCFA(o.total)}</Td>
            <Td><Badge tone={STATUS_TONE[o.status]}>{STATUS_LABELS[o.status]}</Badge></Td>
            <Td><Badge tone={o.payment_status === 'paid' ? 'success' : o.payment_status === 'failed' ? 'danger' : 'neutral'}>{PAYMENT_STATUS_LABELS[o.payment_status]}</Badge></Td>
            <Td>{new Date(o.created_at).toLocaleDateString('fr-FR')}</Td>
            <Td><GestionButton variant="outline" onClick={() => setSelected(o)} style={{ padding: '0.6rem 1.4rem' }}>Détail</GestionButton></Td>
          </tr>
        ))}
      </GestionTable>
      )}

      {selected && (
        <OrderDetail
          order={selected}
          onClose={() => setSelected(null)}
          onUpdated={(updated) => { setSelected(updated); load(); }}
        />
      )}
    </>
  );
};

export default CommandesPage;
