import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../../api/client';
import { COLORS, RADIUS, FONT_BODY } from '../../theme';
import { PageHeader, GestionButton, GestionInput, GestionTextarea, GestionSelect, Field, Badge, GestionTable, Td, Panel, EmptyState, ConfirmDialog } from './ui';

const formatFCFA = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

const emptyForm = {
  name: '', category: '', collection: '', description: '',
  price: '', old_price: '', stock: 0, is_active: true, is_featured: false, is_new: false,
};

/* ── Images & variantes d'un produit existant ── */
const ProductAssets = ({ product, onChanged }) => {
  const [images, setImages] = useState([]);
  const [variants, setVariants] = useState([]);
  const [newAlt, setNewAlt] = useState('');
  const [newSize, setNewSize] = useState('');
  const [newColor, setNewColor] = useState('');
  const [newVStock, setNewVStock] = useState(0);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const load = useCallback(() => {
    apiClient.get(`/gestion/product-images/?product=${product.id}`).then((r) => setImages(r.data.results ?? r.data));
    apiClient.get(`/gestion/product-variants/?product=${product.id}`).then((r) => setVariants(r.data.results ?? r.data));
  }, [product.id]);

  useEffect(() => { load(); }, [load]);

  const uploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('product', product.id);
    fd.append('image', file);
    fd.append('alt_text', newAlt);
    fd.append('is_primary', images.length === 0);
    try {
      await apiClient.post('/gestion/product-images/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setNewAlt('');
      load();
      onChanged?.();
    } catch {
      toast.error("Erreur lors de l'upload");
    }
    e.target.value = '';
  };

  const setPrimary = async (imgId) => {
    await Promise.all(images.map((img) => apiClient.patch(`/gestion/product-images/${img.id}/`, { is_primary: img.id === imgId })));
    load();
    onChanged?.();
  };

  const deleteImage = (imgId) => {
    setConfirmTarget({
      title: 'Supprimer cette image ?',
      description: "Elle disparaîtra immédiatement de la fiche produit sur le site. Cette action est définitive.",
      onConfirm: async () => {
        await apiClient.delete(`/gestion/product-images/${imgId}/`);
        setConfirmTarget(null);
        load();
        onChanged?.();
      },
    });
  };

  const addVariant = async () => {
    if (!newSize && !newColor) { toast.error('Renseignez taille ou couleur'); return; }
    await apiClient.post('/gestion/product-variants/', {
      product: product.id, size: newSize || null, color: newColor || null, stock: newVStock, price_adjustment: 0,
    });
    setNewSize(''); setNewColor(''); setNewVStock(0);
    load();
  };

  const updateVariantStock = async (variantId, stock) => {
    await apiClient.patch(`/gestion/product-variants/${variantId}/`, { stock });
    load();
  };

  const deleteVariant = (variantId) => {
    setConfirmTarget({
      title: 'Supprimer cette variante ?',
      description: "Les clients ne pourront plus choisir cette taille/couleur. Cette action est définitive.",
      onConfirm: async () => {
        await apiClient.delete(`/gestion/product-variants/${variantId}/`);
        setConfirmTarget(null);
        load();
      },
    });
  };

  return (
    <>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.4rem', marginTop: '2.4rem' }}>
      <Panel>
        <p style={{ fontFamily: FONT_BODY, fontSize: '1.3rem', fontWeight: 600, marginBottom: '0.6rem', color: COLORS.ink }}>Images</p>
        <p style={{ fontFamily: FONT_BODY, fontSize: '1.2rem', color: COLORS.mutedOnLight, marginBottom: '1.6rem' }}>
          La première photo ajoutée devient automatiquement l'image principale. Cliquez sur ⭐ pour en choisir une autre.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.6rem' }}>
          {images.map((img) => (
            <div key={img.id} style={{ position: 'relative', width: '7rem', height: '9.3rem' }}>
              <img src={img.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: RADIUS, border: img.is_primary ? `2px solid ${COLORS.gold}` : '1px solid #E0D8C8' }} />
              <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.4rem' }}>
                {!img.is_primary && (
                  <button onClick={() => setPrimary(img.id)} title="Définir comme principale" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.4rem' }}>⭐</button>
                )}
                <button onClick={() => deleteImage(img.id)} title="Supprimer" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.4rem', color: '#c0392b' }}>✕</button>
              </div>
            </div>
          ))}
        </div>
        <GestionInput placeholder="Texte alternatif (optionnel)" value={newAlt} onChange={(e) => setNewAlt(e.target.value)} style={{ marginBottom: '1rem' }} />
        <input type="file" accept="image/*" onChange={uploadImage} style={{ fontFamily: FONT_BODY, fontSize: '1.2rem' }} />
      </Panel>

      <Panel>
        <p style={{ fontFamily: FONT_BODY, fontSize: '1.3rem', fontWeight: 600, marginBottom: '1.6rem', color: COLORS.ink }}>Variantes (taille / couleur)</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.6rem' }}>
          {variants.map((v) => (
            <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1.3rem', fontFamily: FONT_BODY }}>
              <span style={{ flex: 1 }}>{[v.size, v.color].filter(Boolean).join(' · ') || '—'}</span>
              <GestionInput type="number" value={v.stock} onChange={(e) => updateVariantStock(v.id, Number(e.target.value))} style={{ width: '7rem' }} />
              <button onClick={() => deleteVariant(v.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c0392b', fontSize: '1.4rem' }}>✕</button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
          <GestionInput placeholder="Taille" value={newSize} onChange={(e) => setNewSize(e.target.value)} style={{ width: '8rem' }} />
          <GestionInput placeholder="Couleur" value={newColor} onChange={(e) => setNewColor(e.target.value)} style={{ width: '10rem' }} />
          <GestionInput type="number" placeholder="Stock" value={newVStock} onChange={(e) => setNewVStock(Number(e.target.value))} style={{ width: '8rem' }} />
          <GestionButton variant="outline" onClick={addVariant}>Ajouter</GestionButton>
        </div>
      </Panel>
    </div>
    {confirmTarget && <ConfirmDialog {...confirmTarget} onCancel={() => setConfirmTarget(null)} />}
    </>
  );
};

/* ── Formulaire produit (création / édition) ── */
const ProductForm = ({ product, categories, collections, onClose, onSaved }) => {
  const [form, setForm] = useState(product ? {
    name: product.name, category: product.category, collection: product.collection ?? '',
    description: product.description, price: product.price, old_price: product.old_price ?? '',
    stock: product.stock, is_active: product.is_active, is_featured: product.is_featured, is_new: product.is_new,
  } : emptyForm);
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.category || !form.price) { toast.error('Nom, catégorie et prix sont requis'); return; }
    setSaving(true);
    const payload = { ...form, collection: form.collection || null, old_price: form.old_price || null };
    try {
      let res;
      if (product) {
        res = await apiClient.patch(`/gestion/products/${product.id}/`, payload);
        toast.success('Produit mis à jour');
      } else {
        res = await apiClient.post('/gestion/products/', payload);
        toast.success('Produit créé — vous pouvez maintenant ajouter des photos et variantes ci-dessous');
      }
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
      <div style={{ position: 'relative', width: '64rem', maxWidth: '100%', background: '#FAF6EE', height: '100vh', overflowY: 'auto', padding: '3.2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.4rem' }}>
          <h2 style={{ fontFamily: FONT_BODY, fontSize: '2rem', fontWeight: 700, color: COLORS.ink }}>{product ? 'Modifier le produit' : 'Nouveau produit'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer', color: COLORS.mutedOnLight }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <Field label="Nom *">
            <GestionInput value={form.name} onChange={(e) => set('name', e.target.value)} required />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.6rem' }}>
            <Field label="Catégorie *">
              <GestionSelect value={form.category} onChange={(e) => set('category', e.target.value)} required>
                <option value="">— Choisir —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </GestionSelect>
            </Field>
            <Field label="Collection">
              <GestionSelect value={form.collection} onChange={(e) => set('collection', e.target.value)}>
                <option value="">— Aucune —</option>
                {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </GestionSelect>
            </Field>
          </div>
          <Field label="Description">
            <GestionTextarea rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.6rem' }}>
            <Field label="Prix (FCFA) *">
              <GestionInput type="number" value={form.price} onChange={(e) => set('price', e.target.value)} required />
            </Field>
            <Field label="Ancien prix">
              <GestionInput type="number" value={form.old_price} onChange={(e) => set('old_price', e.target.value)} />
            </Field>
            <Field label="Stock">
              <GestionInput type="number" value={form.stock} onChange={(e) => set('stock', Number(e.target.value))} />
            </Field>
          </div>
          <div style={{ display: 'flex', gap: '2.4rem', marginBottom: '2.4rem' }}>
            {[['is_active', 'Actif'], ['is_featured', 'Vedette'], ['is_new', 'Nouveauté']].map(([key, label]) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontFamily: FONT_BODY, fontSize: '1.3rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={form[key]} onChange={(e) => set(key, e.target.checked)} style={{ accentColor: COLORS.gold, width: '1.6rem', height: '1.6rem' }} />
                {label}
              </label>
            ))}
          </div>
          <GestionButton type="submit" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</GestionButton>
        </form>

        {product && <ProductAssets product={product} onChanged={() => onSaved(product)} />}
      </div>
    </div>
  );
};

/* ── Page principale ── */
const ProduitsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [collections, setCollections] = useState([]);
  const [editing, setEditing] = useState(undefined); // undefined = fermé, null = création, obj = édition
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = useCallback(() => {
    apiClient.get('/gestion/products/?page_size=200').then((r) => setProducts(r.data.results ?? r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    apiClient.get('/categories/').then((r) => setCategories(r.data.results ?? r.data));
    apiClient.get('/collections/').then((r) => setCollections(r.data.results ?? r.data));
  }, [load]);

  const handleDelete = (product) => {
    setConfirmDelete({
      title: `Supprimer "${product.name}" ?`,
      description: "Le produit disparaîtra définitivement du site, avec ses photos et variantes. S'il a déjà été commandé, préférez le désactiver (case \"Actif\" dans le formulaire) plutôt que de le supprimer.",
      onConfirm: async () => {
        await apiClient.delete(`/gestion/products/${product.id}/`);
        toast.success('Produit supprimé');
        setConfirmDelete(null);
        load();
      },
    });
  };

  const handleSaved = (saved) => { setEditing(saved); load(); };

  if (loading) return null;

  return (
    <>
      <PageHeader
        title="Produits"
        subtitle="Tout ce qui apparaît dans votre boutique en ligne. Le stock passe en orange (≤ 3) ou rouge (0) pour vous alerter."
        action={<GestionButton onClick={() => setEditing(null)}>+ Nouveau produit</GestionButton>}
      />
      {products.length === 0 ? (
        <EmptyState
          icon="bx-package"
          title="Aucun produit pour l'instant"
          description="Créez votre premier produit pour qu'il apparaisse dans la boutique. Vous pourrez ensuite y ajouter des photos et des variantes (taille, couleur)."
          action={<GestionButton onClick={() => setEditing(null)}>+ Créer mon premier produit</GestionButton>}
        />
      ) : (
      <GestionTable columns={['', 'Nom', 'Catégorie', 'Prix', 'Stock', 'Statut', 'Actions']}>
        {products.map((p) => (
          <tr key={p.id}>
            <Td style={{ width: '5rem' }}>
              {p.images?.[0] ? <img src={p.images[0].image} alt="" style={{ width: '4rem', height: '5.3rem', objectFit: 'cover', borderRadius: RADIUS }} /> : '—'}
            </Td>
            <Td>{p.name}</Td>
            <Td>{p.category_name}</Td>
            <Td>{formatFCFA(p.price)}</Td>
            <Td>
              <Badge tone={p.stock === 0 ? 'danger' : p.stock <= 3 ? 'warning' : 'neutral'}>{p.stock}</Badge>
            </Td>
            <Td>{p.is_active ? <Badge tone="success">Actif</Badge> : <Badge>Inactif</Badge>}</Td>
            <Td>
              <div style={{ display: 'flex', gap: '0.8rem' }}>
                <GestionButton variant="outline" onClick={() => setEditing(p)} style={{ padding: '0.6rem 1.4rem' }}>Modifier</GestionButton>
                <GestionButton variant="danger" onClick={() => handleDelete(p)} style={{ padding: '0.6rem 1.4rem' }}>Supprimer</GestionButton>
              </div>
            </Td>
          </tr>
        ))}
      </GestionTable>
      )}

      {confirmDelete && <ConfirmDialog {...confirmDelete} onCancel={() => setConfirmDelete(null)} />}

      {editing !== undefined && (
        <ProductForm
          product={editing}
          categories={categories}
          collections={collections}
          onClose={() => { setEditing(undefined); load(); }}
          onSaved={handleSaved}
        />
      )}
    </>
  );
};

export default ProduitsPage;
