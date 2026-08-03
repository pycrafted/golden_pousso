import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../../api/client';
import { COLORS, RADIUS, FONT_BODY } from '../../theme';
import { PageHeader, GestionButton, GestionInput, GestionTextarea, Field, Badge, GestionTable, Td, EmptyState, ConfirmDialog } from './ui';

const emptyForm = { name: '', description: '', date: new Date().toISOString().slice(0, 10), is_featured: false, is_active: true };

const CollectionForm = ({ collection, onClose, onSaved }) => {
  const [form, setForm] = useState(collection ? {
    name: collection.name, description: collection.description, date: collection.date,
    is_featured: collection.is_featured, is_active: collection.is_active,
  } : emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.date) { toast.error('Nom et date sont requis'); return; }
    setSaving(true);
    try {
      let res;
      if (imageFile) {
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => fd.append(k, v));
        fd.append('cover_image', imageFile);
        res = collection
          ? await apiClient.patch(`/gestion/collections/${collection.id}/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
          : await apiClient.post('/gestion/collections/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        res = collection
          ? await apiClient.patch(`/gestion/collections/${collection.id}/`, form)
          : await apiClient.post('/gestion/collections/', form);
      }
      toast.success(collection ? 'Collection mise à jour' : 'Collection créée');
      onSaved(res.data);
    } catch (err) {
      toast.error(JSON.stringify(err.response?.data) || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(26,18,8,0.5)' }} />
      <div style={{ position: 'relative', width: '52rem', maxWidth: '100%', background: '#FAF6EE', height: '100vh', overflowY: 'auto', padding: '3.2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.4rem' }}>
          <h2 style={{ fontFamily: FONT_BODY, fontSize: '2rem', fontWeight: 700, color: COLORS.ink }}>{collection ? 'Modifier la collection' : 'Nouvelle collection'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer', color: COLORS.mutedOnLight }}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <Field label="Nom *"><GestionInput value={form.name} onChange={(e) => set('name', e.target.value)} required /></Field>
          <Field label="Description"><GestionTextarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} /></Field>
          <Field label="Date *"><GestionInput type="date" value={form.date} onChange={(e) => set('date', e.target.value)} required /></Field>
          <Field label="Image de couverture">
            {collection?.cover_image && !imageFile && <img src={collection.cover_image} alt="" style={{ width: '10rem', height: '10rem', objectFit: 'cover', borderRadius: RADIUS, marginBottom: '1rem', display: 'block' }} />}
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} style={{ fontFamily: FONT_BODY, fontSize: '1.2rem' }} />
          </Field>
          <div style={{ display: 'flex', gap: '2.4rem', marginBottom: '2.4rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontFamily: FONT_BODY, fontSize: '1.3rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_featured} onChange={(e) => set('is_featured', e.target.checked)} style={{ accentColor: COLORS.gold, width: '1.6rem', height: '1.6rem' }} />
              En vedette
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontFamily: FONT_BODY, fontSize: '1.3rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} style={{ accentColor: COLORS.gold, width: '1.6rem', height: '1.6rem' }} />
              Active (visible sur le site)
            </label>
          </div>
          <GestionButton type="submit" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</GestionButton>
        </form>
      </div>
    </div>
  );
};

const CollectionsPage = () => {
  const [collections, setCollections] = useState([]);
  const [editing, setEditing] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = useCallback(() => {
    apiClient.get('/gestion/collections/?page_size=200').then((r) => setCollections(r.data.results ?? r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = (col) => {
    setConfirmDelete({
      title: `Supprimer "${col.name}" ?`,
      description: "Les produits de cette collection resteront sur le site, mais ne seront plus regroupés sous ce nom. Cette action est définitive.",
      onConfirm: async () => {
        await apiClient.delete(`/gestion/collections/${col.id}/`);
        toast.success('Collection supprimée');
        setConfirmDelete(null);
        load();
      },
    });
  };

  if (loading) return null;

  return (
    <>
      <PageHeader
        title="Collections"
        subtitle="Vos défilés ou éditions saisonnières (ex. « Défilé Korité 2026 »). Une collection en vedette est mise en avant sur le site."
        action={<GestionButton onClick={() => setEditing(null)}>+ Nouvelle collection</GestionButton>}
      />
      {collections.length === 0 ? (
        <EmptyState icon="bx-collection" title="Aucune collection" description="Les collections sont optionnelles — elles permettent de regrouper des produits autour d'un thème ou d'un événement." action={<GestionButton onClick={() => setEditing(null)}>+ Créer une collection</GestionButton>} />
      ) : (
      <GestionTable columns={['', 'Nom', 'Date', 'Vedette', 'Statut', 'Actions']}>
        {collections.map((c) => (
          <tr key={c.id}>
            <Td style={{ width: '5rem' }}>{c.cover_image ? <img src={c.cover_image} alt="" style={{ width: '4rem', height: '4rem', objectFit: 'cover', borderRadius: RADIUS }} /> : '—'}</Td>
            <Td>{c.name}</Td>
            <Td>{c.date}</Td>
            <Td>{c.is_featured ? <Badge tone="warning">Vedette</Badge> : '—'}</Td>
            <Td>{c.is_active ? <Badge tone="success">Active</Badge> : <Badge>Inactive</Badge>}</Td>
            <Td>
              <div style={{ display: 'flex', gap: '0.8rem' }}>
                <GestionButton variant="outline" onClick={() => setEditing(c)} style={{ padding: '0.6rem 1.4rem' }}>Modifier</GestionButton>
                <GestionButton variant="danger" onClick={() => handleDelete(c)} style={{ padding: '0.6rem 1.4rem' }}>Supprimer</GestionButton>
              </div>
            </Td>
          </tr>
        ))}
      </GestionTable>
      )}
      {confirmDelete && <ConfirmDialog {...confirmDelete} onCancel={() => setConfirmDelete(null)} />}
      {editing !== undefined && (
        <CollectionForm collection={editing} onClose={() => { setEditing(undefined); load(); }} onSaved={(saved) => { setEditing(saved); load(); }} />
      )}
    </>
  );
};

export default CollectionsPage;
