import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../../api/client';
import { COLORS, FONT_BODY } from '../../theme';
import { PageHeader, GestionButton, Badge, GestionTable, Td, Panel, EmptyState, ConfirmDialog } from './ui';

const MessagesPage = () => {
  const [messages, setMessages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = useCallback(() => {
    apiClient.get('/gestion/messages/?page_size=200').then((r) => setMessages(r.data.results ?? r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openMessage = async (msg) => {
    setSelected(msg);
    if (!msg.is_read) {
      await apiClient.patch(`/gestion/messages/${msg.id}/`, { is_read: true });
      load();
    }
  };

  const remove = (id) => {
    setConfirmDelete({
      title: 'Supprimer ce message ?',
      description: "Le message sera effacé définitivement. Pensez à répondre au client (par téléphone ou email) avant de le supprimer si ce n'est pas déjà fait.",
      onConfirm: async () => {
        await apiClient.delete(`/gestion/messages/${id}/`);
        setSelected(null);
        toast.success('Message supprimé');
        setConfirmDelete(null);
        load();
      },
    });
  };

  if (loading) return null;

  return (
    <>
      <PageHeader title="Messages de contact" subtitle="Les demandes envoyées via le formulaire de contact du site. Cliquez sur une ligne pour la lire — elle sera alors marquée comme lue." />
      {messages.length === 0 ? (
        <EmptyState icon="bx-envelope" title="Aucun message" description="Les messages envoyés depuis le formulaire de contact du site apparaîtront ici." />
      ) : (
      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 40rem' : '1fr', gap: '2.4rem' }}>
        <GestionTable columns={['', 'Nom', 'Contact', 'Sujet', 'Date']}>
          {messages.map((m) => (
            <tr key={m.id} onClick={() => openMessage(m)} style={{ cursor: 'pointer' }}>
              <Td style={{ width: '3rem' }}>{!m.is_read && <span style={{ display: 'inline-block', width: '0.8rem', height: '0.8rem', borderRadius: '50%', background: COLORS.gold }} />}</Td>
              <Td style={{ fontWeight: m.is_read ? 400 : 700 }}>{m.name}</Td>
              <Td>{m.contact}</Td>
              <Td>{m.subject}</Td>
              <Td>{new Date(m.created_at).toLocaleDateString('fr-FR')}</Td>
            </tr>
          ))}
        </GestionTable>

        {selected && (
          <Panel>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.6rem' }}>
              <div>
                <p style={{ fontFamily: FONT_BODY, fontSize: '1.5rem', fontWeight: 700, color: COLORS.ink }}>{selected.name}</p>
                <p style={{ fontFamily: FONT_BODY, fontSize: '1.2rem', color: COLORS.mutedOnLight }}>{selected.contact}</p>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: '1.8rem', cursor: 'pointer', color: COLORS.mutedOnLight }}>✕</button>
            </div>
            <Badge>{selected.subject}</Badge>
            <p style={{ fontFamily: FONT_BODY, fontSize: '1.3rem', color: COLORS.ink, lineHeight: 1.7, marginTop: '1.6rem', marginBottom: '2rem' }}>
              {selected.message}
            </p>
            <GestionButton variant="danger" onClick={() => remove(selected.id)}>Supprimer</GestionButton>
          </Panel>
        )}
      </div>
      )}
      {confirmDelete && <ConfirmDialog {...confirmDelete} onCancel={() => setConfirmDelete(null)} />}
    </>
  );
};

export default MessagesPage;
