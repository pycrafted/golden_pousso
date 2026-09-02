import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../../api/client';
import { COLORS, RADIUS, FONT_BODY } from '../../theme';
import { PageHeader, GestionButton, Badge, Panel, ConfirmDialog } from './ui';

const ImageBlock = ({ title, description, endpoint, field, extra, filtre }) => {
  const [items, setItems] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Le filtre est passé à part de l'URL : concaténé dedans, il produirait
  // un second « ? » et le paramètre de pagination serait ignoré.
  const load = useCallback(() => {
    apiClient
      .get(endpoint, { params: { page_size: 50, ...(filtre ?? {}) } })
      .then((r) => setItems(r.data.results ?? r.data));
  }, [endpoint, filtre]);

  useEffect(() => { load(); }, [load]);

  const upload = async () => {
    if (!file) { toast.error('Choisissez une image'); return; }
    setUploading(true);
    const fd = new FormData();
    fd.append(field, file);
    fd.append('is_active', true);
    // L'ordre suit l'ordre d'envoi. Sans lui, toutes les images tombent a 0 et
    // l'API les rend par date decroissante : le defile du hero jouerait les
    // tableaux a l'envers, et l'ordre changerait au moindre reenregistrement.
    fd.append('order', items.length);
    // Champs propres au bloc — l'emplacement, par exemple : sans lui
    // l'image partirait dans le tas par défaut.
    Object.entries(extra ?? {}).forEach(([cle, valeur]) => fd.append(cle, valeur));
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

/* ── Bloc à deux emplacements ───────────────────────────────────────────────
   `ImageBlock` gère UNE image en ligne : la dernière publiée remplace la
   précédente. La section « Notre savoir-faire » en montre deux côte à côte,
   qui doivent pouvoir être changées indépendamment — d'où ce bloc à part.

   Les deux emplacements sont distingués par le champ `order` du modèle : 0
   pour la gauche, 1 pour la droite. Publier dans un emplacement remplace ce
   qui s'y trouvait, sans toucher à l'autre. */
const EMPLACEMENTS_PAIRE = [
  { ordre: 0, libelle: 'Photo de gauche', aide: 'Celle qui est décalée vers le bas.' },
  { ordre: 1, libelle: 'Photo de droite', aide: 'Celle qui reste alignée en haut.' },
];

const PaireImageBlock = ({ title, description, endpoint, field, filtre }) => {
  const [items, setItems] = useState([]);
  const [enCours, setEnCours] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = useCallback(() => {
    apiClient
      .get(endpoint, { params: { page_size: 50, ...(filtre ?? {}) } })
      .then((r) => setItems(r.data.results ?? r.data));
  }, [endpoint, filtre]);

  useEffect(() => { load(); }, [load]);

  const publier = async (ordre, fichier, ancienne) => {
    if (!fichier) return;
    setEnCours(ordre);
    const fd = new FormData();
    fd.append(field, fichier);
    fd.append('is_active', true);
    fd.append('order', ordre);
    Object.entries(filtre ?? {}).forEach(([cle, valeur]) => fd.append(cle, valeur));
    try {
      await apiClient.post(endpoint, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      // L'ancienne occupante est retirée : sans ça, deux images porteraient le
      // même ordre et l'accueil en choisirait une au hasard.
      if (ancienne) await apiClient.delete(`${endpoint}${ancienne.id}/`);
      toast.success('Photo mise à jour sur le site');
      load();
    } catch {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setEnCours(null);
    }
  };

  const retirer = (image) => {
    setConfirmDelete({
      title: 'Retirer cette photo ?',
      description: "Elle disparaîtra de la page d'accueil. L'emplacement affichera une image de secours tant que vous n'en aurez pas publié une autre.",
      onConfirm: async () => {
        await apiClient.delete(`${endpoint}${image.id}/`);
        setConfirmDelete(null);
        load();
      },
    });
  };

  return (
    <Panel style={{ marginBottom: '2.4rem' }}>
      <p style={{ fontFamily: FONT_BODY, fontSize: '1.5rem', fontWeight: 700, color: COLORS.ink, marginBottom: '0.4rem' }}>{title}</p>
      {description && <p style={{ fontFamily: FONT_BODY, fontSize: '1.2rem', color: COLORS.mutedOnLight, marginBottom: '2rem' }}>{description}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(26rem, 1fr))', gap: '2.4rem' }}>
        {EMPLACEMENTS_PAIRE.map(({ ordre, libelle, aide }) => {
          const image = items.find((i) => i.is_active && i.order === ordre);
          return (
            <div key={ordre}>
              <p style={{ fontFamily: FONT_BODY, fontSize: '1.3rem', fontWeight: 700, color: COLORS.ink, marginBottom: '0.2rem' }}>{libelle}</p>
              <p style={{ fontFamily: FONT_BODY, fontSize: '1.15rem', color: COLORS.mutedOnLight, marginBottom: '1.2rem' }}>{aide}</p>

              {image ? (
                <div style={{ marginBottom: '1.2rem', position: 'relative', width: 'fit-content' }}>
                  <img src={image[field]} alt="" style={{ width: '18rem', aspectRatio: '2/3', objectFit: 'cover', borderRadius: RADIUS, display: 'block', marginBottom: '0.8rem' }} />
                  <Badge tone="success">En ligne</Badge>
                  <button
                    onClick={() => retirer(image)}
                    title="Retirer cette photo"
                    style={{ position: 'absolute', top: '-0.6rem', right: '-0.6rem', background: '#c0392b', color: '#fff', border: 'none', borderRadius: '50%', width: '2.2rem', height: '2.2rem', cursor: 'pointer', fontSize: '1.2rem' }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <p style={{ fontFamily: FONT_BODY, fontSize: '1.25rem', color: COLORS.mutedOnLight, marginBottom: '1.2rem', fontStyle: 'italic' }}>
                  Vide — le site affiche une image de secours à cet emplacement.
                </p>
              )}

              <input
                type="file"
                accept="image/*"
                disabled={enCours === ordre}
                onChange={(e) => publier(ordre, e.target.files?.[0] ?? null, image)}
                style={{ fontFamily: FONT_BODY, fontSize: '1.2rem' }}
              />
              {enCours === ordre && (
                <p style={{ fontFamily: FONT_BODY, fontSize: '1.15rem', color: COLORS.mutedOnLight, marginTop: '0.6rem' }}>Envoi…</p>
              )}
            </div>
          );
        })}
      </div>

      {confirmDelete && <ConfirmDialog {...confirmDelete} onCancel={() => setConfirmDelete(null)} />}
    </Panel>
  );
};

/* Figés hors du rendu : un objet littéral recréé à chaque passage
   changerait la dépendance du useCallback et relancerait la requête.

   Le filtre « apropos » a disparu avec la page À propos. L'emplacement existe
   toujours côté modèle et l'API le renvoie encore : les photos déjà publiées
   là sont conservées, simplement plus affichées ni modifiables ici. */
const FILTRE_ACCUEIL = { emplacement: 'accueil' };
const FILTRE_PROMO = { emplacement: 'promotion' };

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
      title="Fond du hero — défilé (page d'accueil)"
      description="Le fond du hero. Publiez-en PLUSIEURS : elles défilent en fondu, une toutes les six secondes, dans l'ordre où vous les envoyez. Une seule image donne un hero fixe. Format attendu : large, environ deux fois plus large que haut (2400 × 1037 px), le sujet à gauche et à droite, le milieu laissé libre pour le texte. Sans image ici, le site reprend la bannière du hero."
      endpoint="/gestion/atelier-image/"
      filtre={FILTRE_PROMO}
      extra={FILTRE_PROMO}
      field="image"
    />
    <PaireImageBlock
      title="Notre savoir-faire (page d'accueil)"
      description="Les deux photos de la section qui présente le salon de couture, sur la page d'accueil. Chaque emplacement se change indépendamment de l'autre."
      endpoint="/gestion/atelier-image/"
      filtre={FILTRE_ACCUEIL}
      field="image"
    />
  </>
);

export default ContenuPage;
