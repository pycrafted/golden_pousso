import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../../api/client';
import { COLORS, RADIUS, FONT_BODY } from '../../theme';
import { PageHeader, GestionButton, GestionInput, GestionTextarea, Field, Badge, GestionTable, Td, EmptyState, ConfirmDialog } from './ui';

const emptyForm = { name: '', description: '', is_active: true, order: 0 };

const CategoryForm = ({ category, onClose, onSaved }) => {
  const [form, setForm] = useState(category ? {
    name: category.name, description: category.description, is_active: category.is_active, order: category.order,
  } : emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) { toast.error('Le nom est requis'); return; }
    setSaving(true);
    try {
      let res;
      if (imageFile) {
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => fd.append(k, v));
        fd.append('image', imageFile);
        res = category
          ? await apiClient.patch(`/gestion/categories/${category.id}/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
          : await apiClient.post('/gestion/categories/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        res = category
          ? await apiClient.patch(`/gestion/categories/${category.id}/`, form)
          : await apiClient.post('/gestion/categories/', form);
      }
      toast.success(category ? 'Catégorie mise à jour' : 'Catégorie créée');
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
          <h2 style={{ fontFamily: FONT_BODY, fontSize: '2rem', fontWeight: 700, color: COLORS.ink }}>{category ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer', color: COLORS.mutedOnLight }}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <Field label="Nom *"><GestionInput value={form.name} onChange={(e) => set('name', e.target.value)} required /></Field>
          <Field label="Description"><GestionTextarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} /></Field>
          <Field label="Ordre d'affichage"><GestionInput type="number" value={form.order} onChange={(e) => set('order', Number(e.target.value))} /></Field>
          <Field label="Image">
            {category?.image && !imageFile && <img src={category.image} alt="" style={{ width: '8rem', height: '8rem', objectFit: 'cover', borderRadius: RADIUS, marginBottom: '1rem', display: 'block' }} />}
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} style={{ fontFamily: FONT_BODY, fontSize: '1.2rem' }} />
          </Field>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontFamily: FONT_BODY, fontSize: '1.3rem', marginBottom: '2.4rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} style={{ accentColor: COLORS.gold, width: '1.6rem', height: '1.6rem' }} />
            Actif (visible sur le site)
          </label>
          <GestionButton type="submit" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</GestionButton>
        </form>
      </div>
    </div>
  );
};

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = useCallback(() => {
    apiClient.get('/gestion/categories/?page_size=200').then((r) => setCategories(r.data.results ?? r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = (cat) => {
    setConfirmDelete({
      title: `Supprimer "${cat.name}" ?`,
      description: "Attention : si des produits sont encore rattachés à cette catégorie, la suppression sera refusée automatiquement — déplacez-les d'abord vers une autre catégorie.",
      onConfirm: async () => {
        try {
          await apiClient.delete(`/gestion/categories/${cat.id}/`);
          toast.success('Catégorie supprimée');
          setConfirmDelete(null);
          load();
        } catch {
          toast.error('Impossible de supprimer : des produits utilisent encore cette catégorie.');
          setConfirmDelete(null);
        }
      },
    });
  };

  if (loading) return null;

  return (
    <>
      <PageHeader
        title="Catégories"
        subtitle="Les grandes familles de produits (ex. Boubous, Chaussures). L'ordre détermine leur position dans le menu du site."
        action={<GestionButton onClick={() => setEditing(null)}>+ Nouvelle catégorie</GestionButton>}
      />
      {categories.length === 0 ? (
        <EmptyState icon="bx-category" title="Aucune catégorie" description="Créez au moins une catégorie avant d'ajouter des produits — chaque produit doit appartenir à une catégorie." action={<GestionButton onClick={() => setEditing(null)}>+ Créer une catégorie</GestionButton>} />
      ) : (
      <GestionTable columns={['', 'Nom', 'Ordre', 'Statut', 'Actions']}>
        {categories.map((c) => (
          <tr key={c.id}>
            <Td style={{ width: '5rem' }}>{c.image ? <img src={c.image} alt="" style={{ width: '4rem', height: '4rem', objectFit: 'cover', borderRadius: RADIUS }} /> : '—'}</Td>
            <Td>{c.name}</Td>
            <Td>{c.order}</Td>
            <Td>{c.is_active ? <Badge tone="success">Actif</Badge> : <Badge>Inactif</Badge>}</Td>
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
        <CategoryForm category={editing} onClose={() => { setEditing(undefined); load(); }} onSaved={(saved) => { setEditing(saved); load(); }} />
      )}
    </>
  );
};

export default CategoriesPage;
