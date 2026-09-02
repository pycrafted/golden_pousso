import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import axios from 'axios';
import apiClient from '../../api/client';
import { reduirePourEnvoi } from '../../utils/imageUpload';
import { COLORS, RADIUS, FONT_BODY } from '../../theme';
import { PageHeader, HelpBox, GestionButton, GestionInput, Field, Badge, GestionTable, Td, EmptyState, ConfirmDialog } from './ui';

const VideoForm = ({ video, produits, onClose, onSaved }) => {
  const [file, setFile] = useState(null);
  const [poster, setPoster] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(video?.video ?? null);
  const [form, setForm] = useState(video
    ? { title: video.title, order: video.order, is_active: video.is_active, product: video.product ?? '' }
    : { title: '', order: 0, is_active: true, product: '' });
  const [saving, setSaving] = useState(false);
  /* Une vidéo met des minutes à partir depuis une connexion sénégalaise. Sans
     ce compteur, le bouton dit « Envoi en cours… » sans bouger et on ne peut
     pas distinguer un envoi qui avance d'un envoi bloqué. */
  const [avancement, setAvancement] = useState(0);
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
      const suivre = ({ loaded, total }) => {
        if (total) setAvancement(Math.round((loaded / total) * 100));
      };

      /* ── Le fichier ne passe pas par notre serveur ──────────────────────
         Il n'y arrivait pas : l'envoi répondait 502 sans laisser la moindre
         trace dans les journaux, l'instance s'endormant au bout de quinze
         minutes et le proxy ne pouvant pas retenir des dizaines de mégaoctets
         le temps du réveil. Et même éveillée, la route était absurde — Dakar
         vers l'Oregon, puis l'Oregon vers un bucket européen, pour un fichier
         qui doit finir chez Cloudflare, présent à Dakar même.

         Le serveur délivre donc une autorisation d'écriture d'une heure sur
         une clé qu'il choisit, le navigateur y dépose, et on ne poste ensuite
         que cette clé. `axios` nu et non `apiClient` : l'intercepteur y
         ajouterait l'en-tête Authorization, que R2 lirait à la place de la
         signature — et rejetterait. */
      let cleDeposee = '';
      if (file) {
        const { data: lien } = await apiClient.post('/gestion/videos/lien-envoi/', {
          nom: file.name,
          type: file.type || 'video/mp4',
        });
        if (lien.disponible) {
          await axios.put(lien.url, file, {
            // Exactement le type signé par le serveur, sinon la signature ne
            // correspond plus.
            headers: { 'Content-Type': lien.type },
            onUploadProgress: suivre,
          });
          cleDeposee = lien.cle;
        }
      }

      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('order', form.order);
      fd.append('is_active', form.is_active);
      if (cleDeposee) fd.append('video_cle', cleDeposee);
      // Repli quand R2 n'est pas configuré (développement) : l'envoi classique.
      else if (file) fd.append('video', file);
      // L'affiche est une image : elle passe par la réduction commune, ce qui
      // la ramène sous le mégaoctet et lui permet de voyager avec le reste.
      if (poster) fd.append('poster', await reduirePourEnvoi(poster));
      // Chaîne vide = « aucune pièce » : le champ est facultatif côté
      // modèle, il faut donc envoyer un vide explicite pour le détacher.
      fd.append('product', form.product || '');
      const options = {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: cleDeposee ? undefined : suivre,
      };
      const res = video
        ? await apiClient.patch(`/gestion/videos/${video.id}/`, fd, options)
        : await apiClient.post('/gestion/videos/', fd, options);
      toast.success(video ? 'Vidéo mise à jour' : 'Vidéo ajoutée');
      onSaved(res.data);
    } catch (err) {
      // Un dépôt direct qui échoue ne renvoie pas de réponse lisible : le
      // navigateur bloque la lecture d'une réponse sans en-têtes CORS. Dire
      // « fichier trop volumineux » dans ce cas enverrait chercher au mauvais
      // endroit — c'est la configuration du bucket qu'il faut regarder.
      const messageApi = err.response?.data?.video?.[0] || err.response?.data?.detail;
      toast.error(
        messageApi
        || (err.config?.url?.startsWith('http')
          ? 'Le dépôt sur le stockage a été refusé — vérifiez la règle CORS du bucket.'
          : 'Erreur lors de l’envoi — le fichier est peut-être trop volumineux.'),
      );
    } finally {
      setSaving(false);
      setAvancement(0);
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

          <Field label="Affiche (optionnel)">
            <input type="file" accept="image/*" onChange={(e) => setPoster(e.target.files?.[0] ?? null)} style={{ fontFamily: FONT_BODY, fontSize: '1.2rem' }} />
            <p style={{ fontFamily: FONT_BODY, fontSize: '1.15rem', color: COLORS.mutedOnLight, marginTop: '0.6rem' }}>
              Image fixe montrée avant que la vidéo ne démarre. Sans elle, la tuile reste vide le temps du chargement.
            </p>
            {video?.poster && !poster && (
              <img src={video.poster} alt="" style={{ width: '10rem', aspectRatio: '3/4', objectFit: 'cover', borderRadius: RADIUS, marginTop: '1rem', display: 'block' }} />
            )}
          </Field>

          <Field label="Pièce présentée (optionnel)">
            <select
              value={form.product}
              onChange={(e) => set('product', e.target.value)}
              style={{ width: '100%', padding: '1.1rem 1.4rem', fontFamily: FONT_BODY, fontSize: '1.3rem', border: `1px solid ${COLORS.line}`, borderRadius: RADIUS, background: '#fff', color: COLORS.ink }}
            >
              <option value="">Aucune</option>
              {produits.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <p style={{ fontFamily: FONT_BODY, fontSize: '1.15rem', color: COLORS.mutedOnLight, marginTop: '0.6rem' }}>
              Fait apparaître une carte cliquable — photo, nom, prix — au bas de la vidéo sur la page d’accueil.
            </p>
          </Field>

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
          <GestionButton type="submit" disabled={saving}>{saving
              // 100 % ne veut pas dire fini : le fichier est arrivé au serveur,
              // qui doit encore le repousser vers le stockage. D'où « Traitement ».
              ? (avancement >= 100 ? 'Traitement…' : `Envoi ${avancement} %`)
              : 'Enregistrer'}</GestionButton>
        </form>
      </div>
    </div>
  );
};

const VideosPage = () => {
  const [videos, setVideos] = useState([]);
  const [produits, setProduits] = useState([]);
  const [editing, setEditing] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = useCallback(() => {
    apiClient.get('/gestion/videos/?page_size=200').then((r) => setVideos(r.data.results ?? r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Le sélecteur de pièce a besoin du catalogue. Chargé une seule fois
  // pour la page, pas à chaque ouverture du panneau.
  useEffect(() => {
    apiClient.get('/gestion/products/?page_size=500')
      .then((r) => setProduits(r.data.results ?? r.data))
      .catch(() => {});
  }, []);

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
        <VideoForm produits={produits} video={editing} onClose={() => { setEditing(undefined); load(); }} onSaved={(saved) => { setEditing(saved); load(); }} />
      )}
    </>
  );
};

export default VideosPage;
