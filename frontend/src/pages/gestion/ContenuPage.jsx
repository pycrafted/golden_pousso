import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../../api/client';
import { COLORS, RADIUS, FONT_BODY } from '../../theme';
import { PageHeader, GestionButton, Badge, Panel, ConfirmDialog } from './ui';

const ImageBlock = ({ title, description, endpoint, field }) => {
  const [items, setItems] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = useCallback(() => {
    apiClient.get(`${endpoint}?page_size=50`).then((r) => setItems(r.data.results ?? r.data));
  }, [endpoint]);

  useEffect(() => { load(); }, [load]);

  const upload = async () => {
    if (!file) { toast.error('Choisissez une image'); return; }
    setUploading(true);
    const fd = new FormData();
    fd.append(field, file);
    fd.append('is_active', true);
    try {
      await apiClient.post(endpoint, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Image mise à jour sur le site');
      setFile(null);
      load();
    } catch {
      toast.error("Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const remove = (id) => {
    setConfirmDelete({
      title: 'Supprimer cette ancienne image ?',
      description: "Elle n'est plus utilisée sur le site (seule l'image marquée « en ligne » y apparaît), donc supprimer une ancienne version n'affecte pas le site actuel.",
      onConfirm: async () => {
        await apiClient.delete(`${endpoint}${id}/`);
        setConfirmDelete(null);
        load();
      },
    });
  };

  const active = items.find((i) => i.is_active);

  return (
    <Panel style={{ marginBottom: '2.4rem' }}>
      <p style={{ fontFamily: FONT_BODY, fontSize: '1.5rem', fontWeight: 700, color: COLORS.ink, marginBottom: '0.4rem' }}>{title}</p>
      {description && <p style={{ fontFamily: FONT_BODY, fontSize: '1.2rem', color: COLORS.mutedOnLight, marginBottom: '1.6rem' }}>{description}</p>}

      {active ? (
        <div style={{ marginBottom: '1.6rem' }}>
          <img src={active[field]} alt="" style={{ width: '100%', maxWidth: '32rem', aspectRatio: '16/9', objectFit: 'cover', borderRadius: RADIUS, display: 'block', marginBottom: '0.8rem' }} />
          <Badge tone="success">Image actuellement en ligne</Badge>
        </div>
      ) : (
        <p style={{ fontFamily: FONT_BODY, fontSize: '1.3rem', color: COLORS.mutedOnLight, marginBottom: '1.6rem', fontStyle: 'italic' }}>
          Aucune image définie pour l'instant — le site affichera un espace vide tant que vous n'en aurez pas ajouté une.
        </p>
      )}

      <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} style={{ fontFamily: FONT_BODY, fontSize: '1.2rem' }} />
        <GestionButton onClick={upload} disabled={uploading}>{uploading ? 'Envoi…' : (active ? 'Remplacer' : 'Publier cette image')}</GestionButton>
      </div>

      {items.length > 1 && (
        <div>
          <p style={{ fontFamily: FONT_BODY, fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: COLORS.mutedOnLight, marginBottom: '1rem' }}>
            Anciennes images (non visibles sur le site)
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            {items.filter((i) => !i.is_active).map((i) => (
              <div key={i.id} style={{ position: 'relative' }}>
                <img src={i[field]} alt="" style={{ width: '8rem', height: '5rem', objectFit: 'cover', borderRadius: RADIUS, border: '1px solid #E0D8C8' }} />
                <button onClick={() => remove(i.id)} title="Supprimer définitivement" style={{ position: 'absolute', top: '-0.6rem', right: '-0.6rem', background: '#c0392b', color: '#fff', border: 'none', borderRadius: '50%', width: '2rem', height: '2rem', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {confirmDelete && <ConfirmDialog {...confirmDelete} onCancel={() => setConfirmDelete(null)} />}
    </Panel>
  );
};

const ContenuPage = () => (
  <>
    <PageHeader title="Contenu du site" subtitle="Les visuels affichés sur les pages publiques du site, en dehors des fiches produits." />
    <ImageBlock
      title="Bannière Hero (page d'accueil)"
      description="La grande image affichée en haut de la page d'accueil, à côté du titre « Golden Pousso »."
      endpoint="/gestion/hero-banner/"
      field="image"
    />
    <ImageBlock
      title="Image Atelier (page À propos)"
      description="La photo de l'atelier affichée dans la section « Notre Histoire » de la page À propos."
      endpoint="/gestion/atelier-image/"
      field="image"
    />
  </>
);

export default ContenuPage;
