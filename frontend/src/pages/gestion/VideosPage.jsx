import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../../api/client';
import { reduirePourEnvoi } from '../../utils/imageUpload';
import {
  GestionButton, IconButton, GestionInput, Field, ChoixFichier,
  ConfirmDialog, Tiroir, Bloc, Chargement,
} from './ui';

/* ── Une vidéo = un LIEN Cloudflare, rien d'autre ──────────────────────────
   À la demande, plus aucun envoi de fichier vidéo : le propriétaire dépose sa
   vidéo dans Cloudflare et colle ici son adresse publique. L'envoi par fichier
   (multipart, puis dépôt direct sur R2 par URL signée) a été retiré front et
   back (migration 0036) — il échouait sur le bucket sans règle CORS et, en
   production, sur l'instance Render endormie. Seule l'affiche, une image,
   s'envoie encore. */
const VideoForm = ({ video, ordreParDefaut = 0, onClose, onSaved }) => {
  const [poster, setPoster] = useState(null);
  const [lien, setLien] = useState(video?.video_lien ?? '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const adresse = lien.trim();
    if (!adresse) {
      toast.error('Collez le lien Cloudflare de la vidéo.');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('video_lien', adresse);
      if (!video) fd.append('order', ordreParDefaut);
      // L'affiche est une image : elle passe par la réduction commune, ce qui
      // la ramène sous le mégaoctet.
      if (poster) fd.append('poster', await reduirePourEnvoi(poster));
      const options = { headers: { 'Content-Type': 'multipart/form-data' } };
      const res = video
        ? await apiClient.patch(`/gestion/videos/${video.id}/`, fd, options)
        : await apiClient.post('/gestion/videos/', fd, options);
      toast.success(video ? 'Vidéo mise à jour' : 'Vidéo ajoutée');
      onSaved(res.data);
    } catch (err) {
      const donnees = err.response?.data;
      toast.error(
        donnees?.video_lien?.[0] || donnees?.poster?.[0] || donnees?.non_field_errors?.[0]
        || donnees?.detail || 'Erreur lors de l’enregistrement.',
      );
    } finally {
      setSaving(false);
    }
  };

  const adresse = lien.trim();

  return (
    <Tiroir
      titre={video ? 'Modifier la vidéo' : 'Ajouter une vidéo'}
      onClose={onClose}
      fermable={!saving}
      pied={
        <GestionButton type="submit" form="video-form" disabled={saving}>
          {saving ? 'Enregistrement…' : video ? 'Enregistrer' : 'Ajouter la vidéo'}
        </GestionButton>
      }
    >
      <form id="video-form" onSubmit={handleSubmit}>
        <Bloc titre="La vidéo">
          <Field label="Lien Cloudflare de la vidéo *" aide="Déposez la vidéo dans Cloudflare, puis collez ici son adresse publique.">
            <GestionInput
              type="url"
              required
              value={lien}
              onChange={(e) => setLien(e.target.value)}
              placeholder="https://…/ma-video.mp4"
            />
          </Field>

          {/* L'aperçu lit le lien collé : un lien fautif se voit ici, pas
              trois jours plus tard sur l'accueil. */}
          {adresse.startsWith('https://') && (
            <video key={adresse} src={adresse} controls muted className="vid-apercu" />
          )}
        </Bloc>

        <Bloc titre="Affiche">
          <Field groupe label="Image avant lecture (optionnel)" aide="Image fixe montrée avant que la vidéo ne démarre. Sans elle, la tuile reste vide le temps du chargement.">
            <div className="vid-affiche">
              {video?.poster && !poster && <img src={video.poster} alt="" />}
              <ChoixFichier
                libelle={video?.poster ? 'Remplacer l’affiche' : 'Choisir une image'}
                accept="image/*"
                fichier={poster}
                onChange={(e) => setPoster(e.target.files?.[0] ?? null)}
              />
            </div>
          </Field>
        </Bloc>
      </form>
    </Tiroir>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   LA GESTION DES QUATRE VIDÉOS
   ---------------------------------------------------------------------------
   À la demande, l'accueil n'aligne que QUATRE vidéos (`ShowcaseVideo.MAX`,
   vérifié aussi par le serveur), et toutes celles enregistrées sont en ligne :
   l'option « Visible sur le site » a été retirée, front et back.

   Le CRUD ne s'ouvre plus qu'à UN endroit : le stylo de la section « Aperçu
   de la boutique », sur la page d'accueil (`GestionVideosAccueil`), dans un
   tiroir. La page Espace Gestion → Vidéos de l'accueil (`/gestion/videos`,
   `ContenuPage.jsx`, `BlocVideos`) a été supprimée à la demande. Le fichier
   garde son nom, `VideosPage.jsx`.
   Le tiroir montre QUATRE EMPLACEMENTS : les vidéos dans l'ordre de l'accueil,
   puis une case « Ajouter » par place libre. La limite se voit avant d'être
   atteinte, au lieu d'un refus après coup.

   LA PLACE D'UNE TUILE EST SA PLACE SUR L'ACCUEIL, à la demande : on la
   change en GLISSANT la tuile sur une autre (`useGlisser`). Le champ « Ordre
   d'affichage », un nombre tapé à la main, a été retiré du formulaire. Une
   vidéo ajoutée prend la place qui suit la dernière.
   ═══════════════════════════════════════════════════════════════════════════ */

export const MAX_VIDEOS = 4;

const messageErreur = (err) => {
  const d = err.response?.data;
  return d?.detail || d?.non_field_errors?.[0] || (Array.isArray(d) && d[0]) || 'Erreur';
};

/* L'état partagé : la liste, la vidéo ouverte et la suppression confirmée. `onChange` prévient l'appelant
   après chaque écriture (l'accueil relit sa bande). */
const useVideosAccueil = (onChange) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  /* `undefined` : rien d'ouvert ; `null` : ajout ; un objet : modification. */
  const [editing, setEditing] = useState(undefined);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = useCallback(() => {
    apiClient.get('/gestion/videos/?page_size=50')
      .then((r) => setVideos([...(r.data.results ?? r.data)].sort((x, y) => x.order - y.order)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const apresEcriture = () => { load(); onChange?.(); };

  /* Glisser la vidéo de la place `de` à la place `vers` : les autres se
     décalent. La liste change aussitôt à l'écran, puis chaque vidéo dont la
     place a bougé est enregistrée (quatre requêtes au plus). En cas d'échec,
     la liste est relue : l'écran ne ment pas sur l'ordre en ligne. */
  const deplacer = async (de, vers) => {
    const cible = Math.min(Math.max(vers, 0), videos.length - 1);
    if (cible === de) return;
    const liste = [...videos];
    const [bougee] = liste.splice(de, 1);
    liste.splice(cible, 0, bougee);
    const changees = liste.filter((v, i) => v.order !== i);
    setVideos(liste.map((v, i) => ({ ...v, order: i })));
    try {
      await Promise.all(changees.map((v) => apiClient.patch(`/gestion/videos/${v.id}/`, { order: liste.indexOf(v) })));
      onChange?.();
    } catch (err) {
      toast.error(messageErreur(err));
      load();
    }
  };

  const supprimer = (video) => {
    setConfirmDelete({
      title: 'Supprimer cette vidéo ?',
      description: "Elle disparaîtra immédiatement de la section « Aperçu de la boutique », et libère une place.",
      confirmLabel: 'Supprimer',
      onConfirm: async () => {
        try {
          await apiClient.delete(`/gestion/videos/${video.id}/`);
          toast.success('Vidéo supprimée');
          apresEcriture();
        } catch (err) {
          toast.error(messageErreur(err));
        }
        setConfirmDelete(null);
      },
    });
  };

  const pleine = videos.length >= MAX_VIDEOS;
  const compte = `${videos.length} / ${MAX_VIDEOS} vidéo${videos.length > 1 ? 's' : ''}`;

  /* Le formulaire et la confirmation, à poser par l'appelant. Après un ajout
     ou une modification, retour à la liste : il n'y a qu'une vidéo par place. */
  const calques = (
    <>
      {editing !== undefined && (
        <VideoForm
          key={editing?.id ?? 'nouvelle'}
          video={editing}
          ordreParDefaut={videos.reduce((max, v) => Math.max(max, v.order + 1), 0)}
          onClose={() => setEditing(undefined)}
          onSaved={() => { setEditing(undefined); apresEcriture(); }}
        />
      )}
      {confirmDelete && <ConfirmDialog {...confirmDelete} onCancel={() => setConfirmDelete(null)} />}
    </>
  );

  return { videos, loading, editing, setEditing, supprimer, deplacer, pleine, compte, calques };
};

/* Le glisser-déposer des tuiles, à la main — pas de bibliothèque pour quatre
   cases. Événements de POINTEUR, donc souris, doigt et stylet :
     — à la souris, toute la tuile se saisit ;
     — au doigt, seule la poignée (la pastille de place) : ailleurs, le geste
       doit rester libre de faire défiler le tiroir ;
     — au clavier, la poignée est un bouton, et les flèches changent de place.
   La tuile saisie suit le pointeur ; la place survolée — trouvée sous le
   pointeur par `data-place`, la tuile saisie ne captant plus les événements —
   se cerne de laiton. Au lâcher, `onDeplacer(de, vers)`. Un déplacement de
   moins de 6 px reste un clic : le crayon et la corbeille répondent toujours. */
const useGlisser = (onDeplacer) => {
  const [glisse, setGlisse] = useState(null);
  const etat = useRef(null);

  useEffect(() => {
    if (!glisse) return undefined;
    const bouger = (e) => {
      const g = etat.current;
      if (!g) return;
      const dx = e.clientX - g.x0;
      const dy = e.clientY - g.y0;
      if (!g.actif && Math.hypot(dx, dy) < 6) return;
      const sous = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-place]');
      const vers = sous ? Number(sous.dataset.place) : g.vers;
      etat.current = { ...g, actif: true, dx, dy, vers };
      setGlisse(etat.current);
    };
    const lacher = () => {
      const g = etat.current;
      etat.current = null;
      setGlisse(null);
      if (g?.actif && g.vers !== g.de) onDeplacer(g.de, g.vers);
    };
    window.addEventListener('pointermove', bouger);
    window.addEventListener('pointerup', lacher);
    window.addEventListener('pointercancel', lacher);
    return () => {
      window.removeEventListener('pointermove', bouger);
      window.removeEventListener('pointerup', lacher);
      window.removeEventListener('pointercancel', lacher);
    };
  }, [glisse, onDeplacer]);

  const saisir = (e, place, parPoignee) => {
    if (e.button !== 0) return;
    if (!parPoignee && e.pointerType !== 'mouse') return;
    if (e.target.closest('button') && !parPoignee) return;
    e.preventDefault();
    etat.current = { de: place, vers: place, x0: e.clientX, y0: e.clientY, dx: 0, dy: 0, actif: false };
    setGlisse(etat.current);
  };

  return { glisse: glisse?.actif ? glisse : null, saisir };
};

/* Les quatre emplacements. `compacte` : deux colonnes, pour le tiroir. */
const Emplacements = ({ videos, pleine, onAjouter, onModifier, onSupprimer, onDeplacer, compacte = false }) => {
  const { glisse, saisir } = useGlisser(onDeplacer);
  const derniere = videos.length - 1;
  /* Lâchée sur une place libre, la vidéo va en dernière position : les
     vidéos se suivent toujours, sans trou. */
  const survolee = glisse ? Math.min(glisse.vers, derniere) : null;

  return (
    <ul className={`vid-grille${compacte ? ' vid-grille--compacte' : ''}${glisse ? ' is-glisse' : ''}`}>
      {videos.map((v, i) => {
        const saisie = glisse?.de === i;
        const classes = ['gx-cadre', 'vid-carte'];
        if (saisie) classes.push('is-saisie');
        if (glisse && !saisie && survolee === i) classes.push('is-cible');
        return (
          <li
            key={v.id}
            data-place={i}
            className={classes.join(' ')}
            style={saisie ? { transform: `translate(${glisse.dx}px, ${glisse.dy}px)` } : undefined}
            onPointerDown={(e) => saisir(e, i, false)}
          >
            <div className="vid-media">
              <video src={v.video_lien} poster={v.poster || undefined} muted preload="metadata" />
              <button
                type="button"
                className="vid-ordre gx-num"
                aria-label={`Vidéo ${i + 1} sur l’accueil — glisser, ou flèches du clavier, pour changer sa place`}
                title="Glisser pour changer la place"
                onPointerDown={(e) => { e.stopPropagation(); saisir(e, i, true); }}
                onKeyDown={(e) => {
                  const pas = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[e.key];
                  if (!pas) return;
                  e.preventDefault();
                  onDeplacer(i, i + pas);
                }}
              >
                <i className="bx bx-move" aria-hidden="true" />
                {i + 1}
              </button>
            </div>
            <div className="vid-infos">
              <div className="vid-actions">
                <IconButton icone="bx-pencil" label={`Modifier la vidéo ${i + 1}`} onClick={() => onModifier(v)} />
                <IconButton icone="bx-trash" danger label={`Supprimer la vidéo ${i + 1}`} onClick={() => onSupprimer(v)} />
              </div>
            </div>
          </li>
        );
      })}
      {!pleine && Array.from({ length: MAX_VIDEOS - videos.length }, (_, i) => (
        <li key={`libre-${i}`} data-place={videos.length + i}>
          <button type="button" className="vid-libre" onClick={onAjouter}>
            <span className="vid-libre-icone" aria-hidden="true"><i className="bx bx-plus" /></span>
            <span className="vid-libre-texte">Ajouter une vidéo</span>
            <span className="vid-libre-place gx-num">Place {videos.length + i + 1}</span>
          </button>
        </li>
      ))}
    </ul>
  );
};

/* Le stylo de « Aperçu de la boutique », sur l'accueil : la gestion des
   vidéos, dans un tiroir. Chargé au premier clic (VideoCardsSection) — les visiteurs
   ne téléchargent pas ce code. Le formulaire, ouvert, prend la place du
   tiroir de la liste ; le fermer y ramène. */
export const GestionVideosAccueil = ({ onClose, onChange }) => {
  const g = useVideosAccueil(onChange);

  return (
    <>
      {g.editing === undefined && (
        <Tiroir titre="Vidéos de l’accueil" sousTitre={g.loading ? null : g.compte} onClose={onClose}>
          {g.loading ? <Chargement lignes={2} /> : (
            <Emplacements
              compacte
              videos={g.videos}
              pleine={g.pleine}
              onAjouter={() => g.setEditing(null)}
              onModifier={g.setEditing}
              onSupprimer={g.supprimer}
              onDeplacer={g.deplacer}
            />
          )}
        </Tiroir>
      )}
      {g.calques}
      <StylesVideos />
    </>
  );
};

const StylesVideos = () => (
  <style>{`
    .vid-grille {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: var(--s-4);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .vid-grille--compacte { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.2rem; }
    /* Dans le tiroir, des tuiles 3/4 : les quatre places tiennent sans défiler. */
    .vid-grille--compacte .vid-media,
    .vid-grille--compacte .vid-libre { aspect-ratio: 3 / 4; }
    @media (max-width: 1100px) { .vid-grille { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    .vid-grille > li { display: flex; min-width: 0; }
    .vid-carte {
      display: flex;
      flex-direction: column;
      width: 100%;
      overflow: hidden;
      transition: border-color var(--dur-2) var(--ease);
    }
    .vid-carte:hover { border-color: rgba(198, 164, 61, 0.55); }
    /* Le glisser-déposer. À la souris, la tuile entière se saisit. */
    @media (pointer: fine) { .vid-carte { cursor: grab; } }
    .vid-grille.is-glisse, .vid-grille.is-glisse * { cursor: grabbing; user-select: none; }
    .vid-carte.is-saisie {
      position: relative;
      z-index: 5;
      opacity: 0.85;
      pointer-events: none;
      border-color: var(--gp-brass-400);
      box-shadow: var(--shadow-overlay);
      transition: none;
    }
    /* La place où la vidéo tombera : un cadre de laiton de 2 px. */
    .vid-carte.is-cible { border-color: var(--gp-brass-400); box-shadow: inset 0 0 0 1px var(--gp-brass-400); }
    .vid-media {
      position: relative;
      aspect-ratio: 9 / 16;
      background: var(--gp-indigo-700);
    }
    .vid-media video { width: 100%; height: 100%; object-fit: cover; display: block; }
    /* La poignée : indigo sur laiton, 7,74:1. « touch-action: none » — au
       doigt, c'est elle qui se saisit sans faire défiler le tiroir. */
    .vid-ordre {
      position: absolute;
      top: 1.2rem;
      left: 1.2rem;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      height: 3.2rem;
      padding: 0 1rem;
      border: 0;
      font-family: var(--font-body);
      cursor: grab;
      touch-action: none;
      border-radius: var(--r-pill);
      background: var(--gp-brass-400);
      color: var(--gp-indigo-900);
      font-size: 1.3rem;
      font-weight: 700;
    }
    .vid-infos {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.8rem;
      padding: 1rem 1.2rem;
      border-top: 1px solid var(--line-dark-accent);
    }
    .vid-actions { display: flex; gap: 0.6rem; flex-shrink: 0; }
    .vid-grille--compacte .gx-icone { width: 3.2rem; height: 3.2rem; font-size: 1.5rem; }

    /* Une place libre : un cadre en pointillé de laiton, à la taille d'une
       tuile — la limite de quatre se lit sans la dire. */
    .vid-libre {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      width: 100%;
      min-height: 100%;
      aspect-ratio: 9 / 16;
      padding: 1.6rem;
      border: 1px dashed rgba(198, 164, 61, 0.5);
      border-radius: var(--r-3);
      background: transparent;
      color: var(--gp-ecru-50);
      font-family: var(--font-body);
      cursor: pointer;
      transition: border-color var(--dur-2) var(--ease), background var(--dur-2) var(--ease);
    }
    .vid-libre:hover { border-color: var(--gp-brass-400); background: rgba(198, 164, 61, 0.06); }
    .vid-libre-icone {
      display: grid;
      place-items: center;
      width: 4.8rem;
      height: 4.8rem;
      border-radius: 50%;
      background: var(--gp-brass-400);
      color: var(--gp-indigo-900);
      font-size: 2.4rem;
    }
    .vid-libre-texte { font-size: 1.2rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; text-align: center; }
    .vid-libre-place { font-size: 1.25rem; color: var(--text-muted); }

    .vid-apercu {
      display: block;
      width: 18rem;
      aspect-ratio: 9 / 16;
      object-fit: cover;
      border-radius: 1.2rem;
      background: var(--gp-indigo-700);
    }
    .vid-affiche { display: flex; align-items: center; gap: 1.6rem; flex-wrap: wrap; }
    .vid-affiche img {
      width: 7.2rem;
      aspect-ratio: 3 / 4;
      object-fit: cover;
      border: 1px solid var(--line);
      border-radius: 1.2rem;
    }
  `}</style>
);
