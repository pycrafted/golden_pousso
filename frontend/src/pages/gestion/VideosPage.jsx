import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../../api/client';
import { COLORS, RADIUS, FONT_BODY } from '../../theme';
import { PageHeader, HelpBox, GestionButton, GestionInput, Field, Badge, GestionTable, Td, EmptyState, ConfirmDialog } from './ui';

const VideoForm = ({ video, onClose, onSaved }) => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(video?.video ?? null);
  const [form, setForm] = useState(video ? { title: video.title, order: video.order, is_active: video.is_active } : { title: '', order: 0, is_active: true });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!video && !file) { toast.error('Choisissez un fichier vidéo'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('order', form.order);
      fd.append('is_active', form.is_active);
      if (file) fd.append('video', file);
      const res = video
        ? await apiClient.patch(`/gestion/videos/${video.id}/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        : await apiClient.post('/gestion/videos/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(video ? 'Vidéo mise à jour' : 'Vidéo ajoutée');
      onSaved(res.data);
    } catch (err) {
      toast.error(err.response?.data?.video?.[0] || 'Erreur lors de l’envoi — le fichier est peut-être trop volumineux.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(26,18,8,0.5)' }} />
      <div style={{ position: 'relative', width: '52rem', maxWidth: '100%', background: '#FAF6EE', height: '100vh', overflowY: 'auto', padding: '3.2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.4rem' }}>
          <h2 style={{ fontFamily: FONT_BODY, fontSize: '2rem', fontWeight: 700, color: COLORS.ink }}>{video ? 'Modifier la vidéo' : 'Ajouter une vidéo'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer', color: COLORS.mutedOnLight }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <Field label={video ? 'Remplacer le fichier vidéo (optionnel)' : 'Fichier vidéo *'}>
            <input type="file" accept="video/*" onChange={handleFileChange} style={{ fontFamily: FONT_BODY, fontSize: '1.2rem' }} />
          </Field>

          {previewUrl && (
            <div style={{ marginBottom: '2rem' }}>
              <video src={previewUrl} controls muted style={{ width: '18rem', aspectRatio: '9/16', objectFit: 'cover', borderRadius: RADIUS, background: '#1A1208', display: 'block' }} />
            </div>
          )}

          <Field label="Repère interne (optionnel, non affiché sur le site)">
            <GestionInput value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Ex. Défilé Korité — mars 2026" />
          </Field>
          <Field label="Ordre d'affichage">
            <GestionInput type="number" value={form.order} onChange={(e) => set('order', Number(e.target.value))} />
          </Field>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontFamily: FONT_BODY, fontSize: '1.3rem', marginBottom: '2.4rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} style={{ accentColor: COLORS.gold, width: '1.6rem', height: '1.6rem' }} />
            Visible sur le site
          </label>
          <GestionButton type="submit" disabled={saving}>{saving ? 'Envoi en cours…' : 'Enregistrer'}</GestionButton>
        </form>
      </div>
    </div>
  );
};

const VideosPage = () => {
  const [videos, setVideos] = useState([]);
  const [editing, setEditing] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = useCallback(() => {
    apiClient.get('/gestion/videos/?page_size=200').then((r) => setVideos(r.data.results ?? r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = (video) => {
    setConfirmDelete({
      title: 'Supprimer cette vidéo ?',
      description: "Elle disparaîtra immédiatement de la section « Nos Créations en Mouvement » sur le site.",
      onConfirm: async () => {
        await apiClient.delete(`/gestion/videos/${video.id}/`);
        toast.success('Vidéo supprimée');
        setConfirmDelete(null);
        load();
      },
    });
  };

  if (loading) return null;

  return (
    <>
      <PageHeader
        title="Vidéos"
        subtitle="Les vidéos affichées dans la section « Nos Créations en Mouvement » de la page d'accueil (défilés, coulisses d'atelier, etc.)."
        action={<GestionButton onClick={() => setEditing(null)}>+ Ajouter une vidéo</GestionButton>}
      />
      <HelpBox>
        Envoyez directement un fichier vidéo depuis votre ordinateur (format MP4 recommandé). Pour un rendu optimal, privilégiez des vidéos verticales et courtes (quelques dizaines de secondes).
      </HelpBox>

      {videos.length === 0 ? (
        <EmptyState
          icon="bx-video"
          title="Aucune vidéo"
          description="Tant qu'aucune vidéo n'est ajoutée, la section « Nos Créations en Mouvement » n'apparaît pas du tout sur le site."
          action={<GestionButton onClick={() => setEditing(null)}>+ Ajouter ma première vidéo</GestionButton>}
        />
      ) : (
        <GestionTable columns={['', 'Repère', 'Ordre', 'Statut', 'Actions']}>
          {videos.map((v) => (
            <tr key={v.id}>
              <Td style={{ width: '6rem' }}>
                <video src={v.video} muted preload="metadata" style={{ width: '5rem', height: '7rem', objectFit: 'cover', borderRadius: RADIUS, background: '#1A1208', display: 'block' }} />
              </Td>
              <Td>{v.title || <span style={{ color: COLORS.mutedOnLight }}>—</span>}</Td>
              <Td>{v.order}</Td>
              <Td>{v.is_active ? <Badge tone="success">Visible</Badge> : <Badge>Masquée</Badge>}</Td>
              <Td>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                  <GestionButton variant="outline" onClick={() => setEditing(v)} style={{ padding: '0.6rem 1.4rem' }}>Modifier</GestionButton>
                  <GestionButton variant="danger" onClick={() => handleDelete(v)} style={{ padding: '0.6rem 1.4rem' }}>Supprimer</GestionButton>
                </div>
              </Td>
            </tr>
          ))}
        </GestionTable>
      )}

      {confirmDelete && <ConfirmDialog {...confirmDelete} onCancel={() => setConfirmDelete(null)} />}
      {editing !== undefined && (
        <VideoForm video={editing} onClose={() => { setEditing(undefined); load(); }} onSaved={(saved) => { setEditing(saved); load(); }} />
      )}
    </>
  );
};

export default VideosPage;
