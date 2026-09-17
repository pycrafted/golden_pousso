import { useState, useEffect, useCallback, useId, useRef } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../../api/client';
import { reduirePourEnvoi } from '../../utils/imageUpload';
import { ConfirmDialog } from './ui';

/**
 * Le formulaire produit — création et édition.
 * ---------------------------------------------------------------------------
 * Ouvert par le stylo posé à côté du titre d'un rayon (`/categorie/:slug`) et
 * de la boutique (`/boutique`), visible des seuls comptes `is_staff`. Il
 * vivait dans ProduitsPage.jsx — la page Espace Gestion → Produits, supprimée
 * à la demande —, et en était sorti pour que la page du rayon ne le recopie
 * pas : deux formulaires divergent au premier champ ajouté.
 *
 * Ces stylos CRÉENT des pièces. Une pièce existante se MODIFIE par le stylo
 * posé sur sa carte (EditionPiece.jsx, à la demande) ; la supprimer ne se
 * fait que dans /admin/.
 *
 * ── Création en UNE étape ──────────────────────────────────────────────────
 * À la demande : fiche, photos et variantes se remplissent ensemble, et
 * « Créer la pièce » envoie tout d'un coup. Photos et variantes ont besoin de
 * l'identifiant du produit : elles attendent donc dans le panneau
 * (`MediasBrouillon`) et partent APRÈS la fiche, dans l'ordre — la fiche,
 * les photos (la première est la principale), les variantes. Puis
 * le panneau se vide pour la pièce suivante, rayon conservé.
 *
 * Il se créait en deux temps : la fiche d'abord, puis le panneau passait en
 * édition pour recevoir les médias.
 *
 * Si un envoi échoue après la création, la pièce existe déjà : le panneau
 * passe en modification de CETTE pièce (`ProductAssets`, envoi immédiat),
 * pour la compléter, au lieu de se vider en perdant ce qui manque.
 *
 * Une pièce ouverte pour être modifiée garde l'envoi immédiat : chaque photo
 * ou variante part dès qu'on la choisit.
 *
 * La VIDÉO de produit a été retirée, front et back, à la demande : une pièce
 * ne se présente plus que par ses photos.
 *
 * `categorieFixe` — un objet catégorie `{ id, name }`. Quand il est fourni, le
 * rayon est posé d'office et le menu des rayons n'est pas proposé : c'est le
 * cas de la page du rayon, où la pièce ajoutée est destinée à CE rayon. Il
 * n'est plus affiché — la pastille de l'en-tête a été retirée à la demande.
 *
 * ── Le dessin : celui du tiroir du panier ─────────────────────────────────
 * À la demande, le panneau reprend le tiroir du panier (Navbar) : indigo
 * #161B2D glissant de la droite sur un voile noir flouté, en-tête au titre de
 * laiton, croix ronde, corps qui défile seul, pied fixe
 * portant l'action en pilule de laiton sur toute la largeur. Il était écru,
 * en îlot clair (`theme-clair`), avec des panneaux blancs.
 *
 * Il porte ses propres tokens sombres (`.pf-tiroir.on-dark`) : il s'ouvre dans
 * le site indigo comme dans l'Espace Gestion écru, et doit se dessiner pareil
 * dans les deux.
 *
 * « Vedette » et « Nouveauté » ont été retirées du site à la demande : les
 * deux cases ne sont plus proposées, les champs n'existent plus.
 */

const emptyForm = {
  name: '', category: '', description: '',
  price: '', old_price: '', stock: 0,
};

/* Photos et variantes d'une pièce PAS ENCORE créée. Les photos gardent leur
   fichier et une adresse locale pour l'aperçu ; la première est la
   principale. */
const brouillonVide = { photos: [], variantes: [] };
let derniereCle = 0;
const nouvelleCle = () => { derniereCle += 1; return derniereCle; };

/* Les adresses locales (`blob:`) retiennent le fichier en mémoire tant
   qu'elles ne sont pas rendues : on les rend au retrait, au vidage et à la
   fermeture. */
const liberer = (b) => {
  b.photos.forEach((p) => URL.revokeObjectURL(p.url));
};

const nomVariante = (v) => [v.size, v.color].filter(Boolean).join(' · ') || '—';

/* Le menu des rayons, en arbre : chaque catégorie principale suivie de ses
   sous-catégories, en retrait. Une pièce se range dans l'une comme dans
   l'autre. */
const rayonsEnArbre = (categories) => categories
  .filter((c) => !c.parent)
  .flatMap((c) => [
    { id: c.id, libelle: c.name },
    ...categories
      .filter((s) => s.parent === c.id)
      // Retrait en espaces INSÉCABLES : un <option> écrase les espaces
      // ordinaires en tête de libellé. Construits par leur code (160) plutôt
      // qu'écrits tels quels, invisibles et refusés par ESLint.
      .map((s) => ({ id: s.id, libelle: `${String.fromCharCode(160).repeat(3)}↳ ${s.name}` })),
  ]);

/* ── Petites pièces du tiroir ── */
const Champ = ({ label, children }) => (
  <label className="pf-champ">
    <span className="pf-label">{label}</span>
    {children}
  </label>
);

/* Sans texte d'aide sous le titre : les consignes des photos ont été retirées
   à la demande — l'étiquette « Principale » et le bouton étoile (nommé au
   survol) disent seuls ce qu'ils font. */
const Bloc = ({ titre, children }) => (
  <section className="pf-bloc">
    <h3 className="pf-bloc-titre">{titre}</h3>
    {children}
  </section>
);

/* Un bouton d'envoi de fichier : le champ natif, masqué, reste dans le
   libellé — il garde le clavier et le lecteur d'écran, le libellé porte le
   dessin. */
const BoutonFichier = ({ accept, onChange, disabled, multiple, children }) => (
  <label className="pf-secondaire" aria-disabled={disabled || undefined}>
    <input type="file" accept={accept} onChange={onChange} disabled={disabled} multiple={multiple} className="visually-hidden" />
    <i className="bx bx-upload" aria-hidden="true" />
    {children}
  </label>
);

/* ── Médias d'une pièce en création — gardés dans le panneau ─────────────────
   Rien ne part au serveur ici : tout attend « Créer la pièce ». */
const MediasBrouillon = ({ brouillon, setBrouillon }) => {
  const [taille, setTaille] = useState('');
  const [couleur, setCouleur] = useState('');
  const [stockV, setStockV] = useState(0);
  const { photos, variantes } = brouillon;
  const maj =(champ, f) => setBrouillon((b) => ({ ...b, [champ]: f(b[champ]) }));

  const ajouterPhotos = (e) => {
    const fichiers = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!fichiers.length) return;
    // Adresses créées ICI et non dans la mise à jour d'état : React peut
    // appeler celle-ci deux fois, et la seconde adresse ne serait jamais rendue.
    const ajout = fichiers.map((file) => ({ cle: nouvelleCle(), file, url: URL.createObjectURL(file) }));
    maj('photos', (ph) => [...ph, ...ajout]);
  };

  const rendrePrincipale = (cle) => maj('photos', (ph) => [
    ...ph.filter((p) => p.cle === cle),
    ...ph.filter((p) => p.cle !== cle),
  ]);

  const retirerPhoto = (cle) => {
    const photo = photos.find((p) => p.cle === cle);
    if (photo) URL.revokeObjectURL(photo.url);
    maj('photos', (ph) => ph.filter((p) => p.cle !== cle));
  };

  const ajouterVariante = () => {
    if (!taille && !couleur) { toast.error('Renseignez taille ou couleur'); return; }
    maj('variantes', (vs) => [...vs, { cle: nouvelleCle(), size: taille || null, color: couleur || null, stock: stockV }]);
    setTaille(''); setCouleur(''); setStockV(0);
  };

  return (
    <>
      {/* « Variante » avant « Photos », à la demande — dans les deux modes,
          création et modification. */}
      <Bloc titre="Variante">
        {variantes.length > 0 && (
          <ul className="pf-variantes">
            {variantes.map((v) => (
              <li key={v.cle} className="pf-variante">
                <span className="pf-variante-nom">{nomVariante(v)}</span>
                <input
                  type="number"
                  className="field pf-stock"
                  aria-label={`Stock ${nomVariante(v)}`}
                  value={v.stock}
                  onChange={(e) => {
                    const stock = Number(e.target.value);
                    maj('variantes', (vs) => vs.map((x) => (x.cle === v.cle ? { ...x, stock } : x)));
                  }}
                />
                <button type="button" className="pf-icone pf-icone--danger"
                        onClick={() => maj('variantes', (vs) => vs.filter((x) => x.cle !== v.cle))}
                        aria-label={`Retirer la variante ${nomVariante(v)}`} title="Retirer">
                  <i className="bx bx-trash" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {/* Libellés au-dessus des champs, comme « Prix (FCFA) » et « Stock »
            de la fiche, à la demande. */}
        <div className="pf-variante-ajout">
          <Champ label="Taille">
            <input className="field" value={taille} onChange={(e) => setTaille(e.target.value)} />
          </Champ>
          <Champ label="Couleur">
            <input className="field" value={couleur} onChange={(e) => setCouleur(e.target.value)} />
          </Champ>
          <Champ label="Stock">
            <input type="number" className="field" value={stockV} onChange={(e) => setStockV(Number(e.target.value))} />
          </Champ>
          <button type="button" className="pf-secondaire" onClick={ajouterVariante}>Ajouter</button>
        </div>
      </Bloc>

      <Bloc titre="Photos">
        {photos.length > 0 && (
          <ul className="pf-photos">
            {photos.map((p, i) => (
              <li key={p.cle} className={i === 0 ? 'pf-photo is-principale' : 'pf-photo'}>
                <img src={p.url} alt={`Photo ${i + 1}`} />
                {i === 0 && <span className="pf-photo-etiquette">Principale</span>}
                <div className="pf-photo-actions">
                  {i > 0 && (
                    <button type="button" className="pf-icone" onClick={() => rendrePrincipale(p.cle)}
                            aria-label="Définir comme photo principale" title="Définir comme principale">
                      <i className="bx bx-star" aria-hidden="true" />
                    </button>
                  )}
                  <button type="button" className="pf-icone pf-icone--danger" onClick={() => retirerPhoto(p.cle)}
                          aria-label="Retirer la photo" title="Retirer">
                    <i className="bx bx-trash" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="pf-ajout">
          <BoutonFichier accept="image/*" onChange={ajouterPhotos} multiple>Ajouter des photos</BoutonFichier>
        </div>
      </Bloc>
    </>
  );
};

/* ── Images & variantes d'un produit existant — envoi immédiat ── */
const ProductAssets = ({ product, onChanged }) => {
  const [images, setImages] = useState([]);
  const [variants, setVariants] = useState([]);
  const [newSize, setNewSize] = useState('');
  const [newColor, setNewColor] = useState('');
  const [newVStock, setNewVStock] = useState(0);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const load = useCallback(() => {
    apiClient.get(`/gestion/product-images/?product=${product.id}`).then((r) => setImages(r.data.results ?? r.data));
    apiClient.get(`/gestion/product-variants/?product=${product.id}`).then((r) => setVariants(r.data.results ?? r.data));
  }, [product.id]);

  useEffect(() => { load(); }, [load]);

  /* ⚠ PLUSIEURS PHOTOS A LA FOIS, et une jauge par photo.
     Le champ n'acceptait qu'un fichier en modification (`multiple` n'etait
     passe qu'a la creation) : pour ajouter cinq photos a une piece
     existante, il fallait ouvrir la galerie, choisir, ATTENDRE LA FIN DE
     L'ENVOI, recommencer. Cinq fois.

     Et rien n'indiquait l'avancement : sur une 3G dakaroise, une photo
     reduite pese 400 a 900 Ko, soit 15 a 70 secondes — pendant lesquelles
     l'ecran ne bougeait pas. On ne pouvait pas distinguer un envoi lent
     d'un envoi bloque. `onUploadProgress` d'axios donne le pourcentage. */
  const uploadImage = async (e) => {
    const fichiers = Array.from(e.target.files || []);
    if (fichiers.length === 0) return;
    // Le champ se vide TOUT DE SUITE : l'envoi peut durer, et un fichier qui
    // reste affiche pendant qu'il ne se passe rien laisse croire a un blocage.
    e.target.value = '';

    const attente = toast.loading('Preparation...');
    const plusieurs = fichiers.length > 1;
    let deja = images.length;

    for (let i = 0; i < fichiers.length; i += 1) {
      const brut = fichiers[i];
      const rang = plusieurs ? `Photo ${i + 1}/${fichiers.length} — ` : '';
      try {
        // Reduite ici, avant l'envoi : une photo de boitier fait 35 Mo, dont
        // le serveur ne tire jamais plus de 750 Ko. Voir utils/imageUpload.js.
        const file = await reduirePourEnvoi(brut);
        toast.loading(`${rang}envoi...`, { id: attente });

        const fd = new FormData();
        fd.append('product', product.id);
        fd.append('image', file);
        fd.append('is_primary', deja === 0);
        await apiClient.post('/gestion/product-images/', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (ev) => {
            if (!ev.total) return;
            toast.loading(`${rang}${Math.round((ev.loaded / ev.total) * 100)} %`, { id: attente });
          },
        });
        deja += 1;
      } catch (err) {
        // Le message du serveur plutot qu'un « erreur » muet : sans lui, on
        // ne peut pas distinguer un fichier trop lourd d'une session expiree.
        const detail = err.response?.data;
        const msg = typeof detail === 'string'
          ? detail
          : detail?.image?.[0] || detail?.detail || err.message;
        toast.error(`${rang}echec : ${msg}`, { id: attente, duration: 8000 });
        break;
      }
    }

    if (deja > images.length) {
      toast.success(deja - images.length > 1 ? `${deja - images.length} photos ajoutees` : 'Photo ajoutee', { id: attente });
      load();
      onChanged?.();
    }
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
      <Bloc titre="Variante">
        {variants.length > 0 && (
          <ul className="pf-variantes">
            {variants.map((v) => (
              <li key={v.id} className="pf-variante">
                <span className="pf-variante-nom">{nomVariante(v)}</span>
                <input
                  type="number"
                  className="field pf-stock"
                  aria-label={`Stock ${nomVariante(v)}`}
                  value={v.stock}
                  onChange={(e) => updateVariantStock(v.id, Number(e.target.value))}
                />
                <button type="button" className="pf-icone pf-icone--danger" onClick={() => deleteVariant(v.id)}
                        aria-label={`Supprimer la variante ${nomVariante(v)}`} title="Supprimer">
                  <i className="bx bx-trash" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="pf-variante-ajout">
          <Champ label="Taille">
            <input className="field" value={newSize} onChange={(e) => setNewSize(e.target.value)} />
          </Champ>
          <Champ label="Couleur">
            <input className="field" value={newColor} onChange={(e) => setNewColor(e.target.value)} />
          </Champ>
          <Champ label="Stock">
            <input type="number" className="field" value={newVStock} onChange={(e) => setNewVStock(Number(e.target.value))} />
          </Champ>
          <button type="button" className="pf-secondaire" onClick={addVariant}>Ajouter</button>
        </div>
      </Bloc>

      <Bloc titre="Photos">
        {images.length > 0 && (
          <ul className="pf-photos">
            {images.map((img, i) => (
              <li key={img.id} className={img.is_primary ? 'pf-photo is-principale' : 'pf-photo'}>
                <img src={img.image} alt={`Photo ${i + 1}`} />
                {img.is_primary && <span className="pf-photo-etiquette">Principale</span>}
                <div className="pf-photo-actions">
                  {!img.is_primary && (
                    <button type="button" className="pf-icone" onClick={() => setPrimary(img.id)}
                            aria-label="Définir comme photo principale" title="Définir comme principale">
                      <i className="bx bx-star" aria-hidden="true" />
                    </button>
                  )}
                  <button type="button" className="pf-icone pf-icone--danger" onClick={() => deleteImage(img.id)}
                          aria-label="Supprimer la photo" title="Supprimer">
                    <i className="bx bx-trash" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="pf-ajout">
          <BoutonFichier accept="image/*" multiple onChange={uploadImage}>Ajouter des photos</BoutonFichier>
        </div>
      </Bloc>

      {confirmTarget && <ConfirmDialog {...confirmTarget} onCancel={() => setConfirmTarget(null)} />}
    </>
  );
};

/* ── Formulaire produit (création / édition) ── */
const ProductForm = ({ product, categories, categorieFixe, onClose, onSaved }) => {
  const titreId = useId();
  const formId = useId();
  const [form, setForm] = useState(product ? {
    name: product.name, category: product.category,
    description: product.description, price: product.price, old_price: product.old_price ?? '',
    stock: product.stock,
  } : { ...emptyForm, category: categorieFixe?.id ?? '' });
  const [saving, setSaving] = useState(false);
  /* Une modification enregistrée : le panneau reste ouvert, à la demande, et
     le bouton dit « Enregistré » jusqu'au prochain changement d'un champ —
     c'est à l'admin, pas au formulaire, de décider qu'il a fini. */
  const [enregistre, setEnregistre] = useState(false);
  const set = (k, v) => { setEnregistre(false); setForm((f) => ({ ...f, [k]: v })); };

  // Médias de la pièce en création — voir « Création en UNE étape ».
  const [brouillon, setBrouillon] = useState(brouillonVide);
  // Incrémenté à chaque vidage : remonte le bloc des médias, champs compris.
  const [tour, setTour] = useState(0);

  const corps = useRef(null);
  const champNom = useRef(null);
  /* Un envoi en cours ne se ferme pas : fermé en route, le panneau se
     rouvrirait à l'arrivée — le parent le remet en création quand la pièce
     est enregistrée. */
  const enCours = useRef(false);
  const fermer = () => { if (!enCours.current) onClose(); };

  const brouillonRef = useRef(brouillon);
  useEffect(() => { brouillonRef.current = brouillon; }, [brouillon]);
  useEffect(() => () => liberer(brouillonRef.current), []);

  /* Échap ferme le panneau, comme toute fenêtre modale. Il ne se fermait
     jusqu'ici qu'à la croix ou d'un clic sur le fond. */
  useEffect(() => {
    const surTouche = (e) => { if (e.key === 'Escape' && !enCours.current) onClose(); };
    window.addEventListener('keydown', surTouche);
    return () => window.removeEventListener('keydown', surTouche);
  }, [onClose]);

  const viderBrouillon = () => {
    liberer(brouillon);
    setBrouillon(brouillonVide);
    setTour((t) => t + 1);
  };

  /* ── La création : tout part d'un coup ──────────────────────────────────
     La fiche d'abord — les médias ont besoin de son identifiant —, puis les
     photos une à une (réduites avant l'envoi, voir utils/imageUpload.js), les
     variantes. Un seul message suit l'avancement. */
  const creer = async (payload) => {
    const attente = toast.loading('Création de la pièce…');
    let cree;
    try {
      cree = (await apiClient.post('/gestion/products/', payload)).data;
    } catch (err) {
      toast.error(JSON.stringify(err.response?.data) || 'Erreur', { id: attente, duration: 8000 });
      return;
    }

    const echecs = [];
    const { photos, variantes } = brouillon;
    for (const [i, photo] of photos.entries()) {
      toast.loading(`Envoi des photos (${i + 1}/${photos.length})…`, { id: attente });
      try {
        const file = await reduirePourEnvoi(photo.file);
        const fd = new FormData();
        fd.append('product', cree.id);
        fd.append('image', file);
        fd.append('is_primary', i === 0);
        await apiClient.post('/gestion/product-images/', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } catch {
        echecs.push(`la photo ${i + 1}`);
      }
    }
    if (variantes.length) toast.loading('Envoi des tailles et couleurs…', { id: attente });
    for (const v of variantes) {
      try {
        await apiClient.post('/gestion/product-variants/', {
          product: cree.id, size: v.size, color: v.color, stock: v.stock, price_adjustment: 0,
        });
      } catch {
        echecs.push(`la variante ${nomVariante(v)}`);
      }
    }
    viderBrouillon();
    if (echecs.length) {
      /* La pièce existe : on l'ouvre en modification pour la compléter,
         plutôt que de vider le panneau en perdant ce qui n'est pas parti. */
      toast.error(
        `« ${cree.name} » est créée, mais ${echecs.join(', ')} n'a pas pu être envoyé. Complétez-la ci-dessous.`,
        { id: attente, duration: 10000 },
      );
      onSaved(cree);
      return;
    }

    toast.success(`« ${cree.name} » est créée — le formulaire est prêt pour la suivante`, { id: attente });
    // Le rayon reste celui de la précédente : on en saisit souvent plusieurs
    // d'affilée. `onSaved(null)` relit la liste du parent et le garde en
    // création — sa convention, `null` = nouvelle pièce.
    setForm({ ...emptyForm, category: form.category });
    onSaved(null);
    corps.current?.scrollTo({ top: 0 });
    champNom.current?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.category || !form.price) { toast.error('Nom, catégorie et prix sont requis'); return; }
    setSaving(true);
    enCours.current = true;
    const payload = { ...form, old_price: form.old_price || null };
    try {
      if (product) {
        const res = await apiClient.patch(`/gestion/products/${product.id}/`, payload);
        toast.success('Produit mis à jour');
        setEnregistre(true);
        onSaved(res.data);
      } else {
        await creer(payload);
      }
    } catch (err) {
      toast.error(JSON.stringify(err.response?.data) || 'Erreur');
    } finally {
      enCours.current = false;
      setSaving(false);
    }
  };

  const titre = product ? 'Modifier la pièce' : 'Nouvelle pièce';

  return (
    <>
      <div className="pf-voile" onClick={fermer} />
      <div role="dialog" aria-modal="true" aria-labelledby={titreId} className="pf-tiroir on-dark">

        {/* ── En-tête — celui du panier : titre de laiton, pastille, croix ── */}
        <header className="pf-tete">
          <div className="pf-tete-titre">
            <h2 id={titreId} className="pf-titre">{titre}</h2>
            {/* Plus de pastille au nom du rayon, à la demande. Depuis la page
                d'un rayon, le rayon reste posé d'office et le menu n'est pas
                proposé : la pièce va dans le rayon d'où l'on est parti. */}
          </div>
          <button type="button" className="pf-fermer" onClick={fermer} disabled={saving} aria-label="Fermer">✕</button>
        </header>

        {/* ── Corps — il défile seul, en-tête et pied restent en place ── */}
        <div className="pf-corps" ref={corps}>
          <form id={formId} onSubmit={handleSubmit}>
            <Champ label="Nom *">
              <input ref={champNom} className="field" value={form.name} onChange={(e) => set('name', e.target.value)} required />
            </Champ>
            {!categorieFixe && (
              <Champ label="Catégorie *">
                <select className="field" value={form.category} onChange={(e) => set('category', e.target.value)} required>
                  <option value="">— Choisir —</option>
                  {rayonsEnArbre(categories).map((c) => <option key={c.id} value={c.id}>{c.libelle}</option>)}
                </select>
              </Champ>
            )}
            <Champ label="Description">
              <textarea className="field pf-texte" rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} />
            </Champ>
            <div className="pf-grille">
              <Champ label="Prix (FCFA) *">
                <input type="number" className="field" value={form.price} onChange={(e) => set('price', e.target.value)} required />
              </Champ>
              <Champ label="Ancien prix">
                <input type="number" className="field" value={form.old_price} onChange={(e) => set('old_price', e.target.value)} />
              </Champ>
              <Champ label="Stock">
                <input type="number" className="field" value={form.stock} onChange={(e) => set('stock', Number(e.target.value))} />
              </Champ>
            </div>
          </form>

          {product
            ? <ProductAssets product={product} onChanged={() => onSaved(product)} />
            : <MediasBrouillon key={tour} brouillon={brouillon} setBrouillon={setBrouillon} />}
        </div>

        {/* ── Pied — l'action, en pilule de laiton, comme « Procéder au
            paiement ». Le bouton est hors du <form> : l'attribut `form` l'y
            rattache. ── */}
        <footer className="pf-pied">
          <button type="submit" form={formId} className={`pf-enregistrer${enregistre ? ' is-enregistre' : ''}`} disabled={saving}>
            {saving ? 'Enregistrement…' : enregistre ? '✓ Enregistré' : product ? 'Enregistrer' : 'Créer la pièce'}
          </button>
        </footer>
      </div>

      <style>{`
        /* ── Le voile et le tiroir ─────────────────────────────────────────
           Mêmes valeurs que le tiroir du panier (Navbar) : voile noir à 60 %
           flouté, panneau #161B2D glissant de la droite en 380 ms, ombre
           portée à gauche. Plus large que le panier (52 rem contre 44) : le
           formulaire aligne trois champs de prix sur une ligne. */
        .pf-voile {
          position: fixed;
          inset: 0;
          z-index: 2000;
          background: rgba(0, 0, 0, 0.6);
          -webkit-backdrop-filter: blur(4px);
          backdrop-filter: blur(4px);
          animation: pf-fondu 300ms ease both;
        }

        /* Ses propres tokens sombres : il s'ouvre aussi dans l'Espace Gestion,
           écru. « .on-dark » bascule le texte et les filets ; cette double
           classe reprend le fond au chrome (« .on-dark » seul poserait
           #0F1320) et les contours de champ du site sombre — écru à 40 %,
           3,60:1 ; laiton clair au survol et au focus ; rouge clair en
           erreur, 7,01:1. « color-scheme » rend sombres les menus natifs, les
           cases et les flèches des champs numériques. */
        .pf-tiroir.on-dark {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          z-index: 2001;
          width: 52rem;
          max-width: 100vw;
          display: flex;
          flex-direction: column;
          background: var(--surface-chrome);
          --surface: var(--surface-chrome);
          --surface-sunk: var(--gp-indigo-700);
          --field-bord: rgba(250, 246, 238, 0.4);
          --field-bord-survol: var(--gp-brass-400);
          --field-bord-focus: var(--gp-brass-400);
          --field-bord-erreur: var(--gp-danger-300);
          color-scheme: dark;
          box-shadow: -12px 0 60px rgba(0, 0, 0, 0.6);
          animation: pf-entree 380ms cubic-bezier(0.4, 0, 0.2, 1) both;
        }
        @keyframes pf-fondu { from { opacity: 0; } }
        @keyframes pf-entree { from { transform: translateX(100%); } }

        /* ── En-tête ── Titre en laiton, 7,14:1 sur #161B2D. Préfixé du
           tiroir : « .on-dark h2 » le repeindrait en écru. */
        .pf-tete {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.6rem;
          padding: 2.4rem;
          border-bottom: 1px solid var(--line);
          flex-shrink: 0;
        }
        .pf-tete-titre {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 1.2rem;
          min-width: 0;
        }
        .pf-tiroir .pf-titre {
          font-family: var(--font-display);
          font-size: 1.9rem;
          font-weight: 400;
          letter-spacing: 0.04em;
          color: var(--gp-brass-400);
        }
        .pf-fermer {
          display: grid;
          place-items: center;
          flex-shrink: 0;
          width: 3.6rem;
          height: 3.6rem;
          padding: 0;
          border: 1px solid var(--line);
          border-radius: var(--r-pill);
          background: none;
          color: var(--text-muted);
          font-size: 1.6rem;
          cursor: pointer;
          transition: border-color var(--dur-2) var(--ease), color var(--dur-2) var(--ease);
        }
        .pf-fermer:hover:not([disabled]) { border-color: var(--gp-brass-400); color: var(--gp-ecru-50); }
        .pf-fermer[disabled] { opacity: 0.4; cursor: not-allowed; }

        /* ── Corps ── */
        .pf-corps {
          flex: 1;
          overflow-y: auto;
          overscroll-behavior: contain;
          padding: 2.4rem;
        }

        /* Libellés : écru à 62 %, 6,78:1. 12 px et non 11 : Fraunces se
           brouille en dessous. */
        .pf-champ { display: block; margin-bottom: 2rem; }
        .pf-label {
          display: block;
          margin-bottom: 0.8rem;
          font-family: var(--font-body);
          font-size: 1.2rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--text-muted);
        }
        /* Champs arrondis, à la demande — 1,2 rem, au lieu des 2 px (--r-1)
           des champs du site : ils répondent aux pilules du tiroir. */
        .pf-tiroir .field { font-size: 1.4rem; border-radius: 1.2rem; }
        /* 16 px sous le seuil tactile : en dessous, iOS Safari zoome au
           focus, le tiroir déborde de l'écran et le bouton d'enregistrement
           sort de vue. Voir styles.css, près de .field. */
        @media (max-width: 767px) {
          .pf-tiroir .field { font-size: 1.6rem; }
        }
        .pf-tiroir input[type="number"] { font-variant-numeric: tabular-nums; }
        .pf-texte { min-height: 10rem; resize: vertical; }

        .pf-grille {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.6rem;
        }

        /* ── Photos, variantes, vidéo — séparées par un filet, comme les
           lignes du panier. ── */
        .pf-bloc {
          margin-top: 2.8rem;
          padding-top: 2.4rem;
          border-top: 1px solid var(--line);
        }
        .pf-tiroir .pf-bloc-titre {
          margin-bottom: 1.2rem;
          font-family: var(--font-display);
          font-size: 1.6rem;
          font-weight: 400;
          letter-spacing: 0.02em;
          color: var(--gp-ecru-50);
        }

        /* Bouton secondaire — contour de laiton, texte écru : l'envoi d'un
           fichier, l'ajout d'une variante. */
        .pf-secondaire {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.8rem;
          min-height: 4.4rem;
          padding: 0 2rem;
          border: 1px solid rgba(198, 164, 61, 0.5);
          border-radius: var(--r-pill);
          background: transparent;
          color: var(--gp-ecru-50);
          font-family: var(--font-body);
          font-size: 1.2rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          white-space: nowrap;
          cursor: pointer;
          transition: border-color var(--dur-2) var(--ease), background var(--dur-2) var(--ease);
        }
        .pf-secondaire:hover { border-color: var(--gp-brass-400); background: rgba(198, 164, 61, 0.1); }
        /* Anneau collé à la pilule : décalé, il doublait sa bordure. */
        .pf-secondaire:focus-within { outline: 2px solid var(--gp-brass-400); outline-offset: 0; }
        .pf-secondaire[aria-disabled="true"] { opacity: 0.5; pointer-events: none; }
        .pf-secondaire .bx { font-size: 1.6rem; }

        /* Bouton rond sur photo — voile d'indigo à 80 % : écru 16,9:1. */
        .pf-icone {
          display: grid;
          place-items: center;
          width: 3.2rem;
          height: 3.2rem;
          padding: 0;
          border: 1px solid rgba(250, 246, 238, 0.2);
          border-radius: 50%;
          background: rgba(15, 19, 32, 0.8);
          color: var(--gp-ecru-50);
          font-size: 1.6rem;
          cursor: pointer;
          transition: background var(--dur-2) var(--ease), color var(--dur-2) var(--ease), border-color var(--dur-2) var(--ease);
        }
        .pf-icone:hover { background: var(--gp-brass-400); border-color: var(--gp-brass-400); color: var(--gp-indigo-900); }
        /* Rouge clair, encre dessus au survol : 7,01:1 sur l'indigo. */
        .pf-icone--danger:hover { background: var(--gp-danger-300); border-color: var(--gp-danger-300); color: var(--gp-ink); }

        /* Photos — vignettes 3/4, la principale cernée de laiton. */
        .pf-photos {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(9.6rem, 1fr));
          gap: 1.2rem;
          margin: 0 0 1.6rem;
          padding: 0;
          list-style: none;
        }
        .pf-photo {
          position: relative;
          aspect-ratio: 3 / 4;
          overflow: hidden;
          border: 1px solid var(--line);
          border-radius: 1.2rem;
          background: var(--surface-sunk);
        }
        .pf-photo.is-principale { border: 2px solid var(--gp-brass-400); }
        .pf-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
        /* Indigo sur laiton : 7,74:1. */
        .pf-photo-etiquette {
          position: absolute;
          top: 0.6rem;
          left: 0.6rem;
          padding: 0.3rem 0.7rem;
          border-radius: var(--r-pill);
          background: var(--gp-brass-400);
          color: var(--gp-indigo-900);
          font-family: var(--font-body);
          font-size: 1.1rem;
          font-weight: 700;
          letter-spacing: 0.06em;
        }
        .pf-photo-actions {
          position: absolute;
          right: 0.6rem;
          bottom: 0.6rem;
          display: flex;
          gap: 0.4rem;
        }
        .pf-ajout { display: flex; flex-wrap: wrap; gap: 1rem; }

        /* Variantes — une ligne par taille/couleur, filets du panier. */
        .pf-variantes { margin: 0 0 1.6rem; padding: 0; list-style: none; }
        .pf-variante {
          display: flex;
          align-items: center;
          gap: 1.2rem;
          padding: 1rem 0;
          border-bottom: 1px solid var(--line);
        }
        .pf-variante:first-child { border-top: 1px solid var(--line); }
        .pf-variante-nom {
          flex: 1;
          min-width: 0;
          font-family: var(--font-body);
          font-size: 1.4rem;
          color: var(--text);
        }
        .pf-tiroir .pf-stock { width: 8.4rem; min-height: 4rem; padding-block: 0.8rem; }
        /* Champs libellés : le bouton se cale sur leur pied, à leur hauteur
           (4,8 rem, celle de « .field »). */
        .pf-variante-ajout {
          display: grid;
          grid-template-columns: 1fr 1fr 8.4rem auto;
          align-items: end;
          gap: 0.8rem;
        }
        .pf-variante-ajout .pf-champ { margin-bottom: 0; min-width: 0; }
        .pf-variante-ajout .pf-secondaire { min-height: 4.8rem; }

        /* ── Pied — l'action du panier : pilule de laiton pleine largeur,
           indigo dessus, 7,74:1. Au survol, écru et encre, 17,05:1 — le
           panier passe à la terre cuite, où l'écru ne tient que 3,72:1. ── */
        .pf-pied {
          flex-shrink: 0;
          padding: 2rem 2.4rem calc(2rem + env(safe-area-inset-bottom, 0px));
          border-top: 1px solid var(--line);
          background: var(--surface-chrome);
        }
        .pf-enregistrer {
          width: 100%;
          padding: 1.6rem;
          border: 0;
          border-radius: var(--r-pill);
          background: var(--gp-brass-400);
          color: var(--gp-indigo-900);
          font-family: var(--font-body);
          font-size: 1.2rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background var(--dur-2) var(--ease), color var(--dur-2) var(--ease);
        }
        .pf-enregistrer:hover:not([disabled]) { background: var(--gp-ecru-50); color: var(--gp-ink); }
        .pf-enregistrer[disabled] { opacity: 0.6; cursor: progress; }
        /* Enregistré : contour de laiton, texte laiton clair (7,14:1). */
        .pf-enregistrer.is-enregistre {
          background: transparent;
          box-shadow: inset 0 0 0 1px var(--gp-brass-400);
          color: var(--gp-brass-400);
        }

        @media (max-width: 480px) {
          .pf-tete, .pf-corps { padding-inline: 1.6rem; }
          .pf-pied { padding-inline: 1.6rem; }
          .pf-grille { grid-template-columns: 1fr 1fr; gap: 0 1.2rem; }
          .pf-variante-ajout { grid-template-columns: 1fr 1fr; }
        }

        @media (prefers-reduced-motion: reduce) {
          .pf-voile, .pf-tiroir.on-dark { animation: none; }
        }
      `}</style>
    </>
  );
};

export default ProductForm;
