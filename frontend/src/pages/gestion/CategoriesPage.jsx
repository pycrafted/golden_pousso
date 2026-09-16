import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../../api/client';
import { RAYONS } from '../../constants/rayons';
import {
  PageHeader, GestionButton, IconButton, GestionInput, GestionSelect, Field,
  EmptyState, ConfirmDialog, Tiroir, Chargement,
} from './ui';

/* Les cinq rayons de la maison, reconnus par leur slug — la liste même de la
   grille d'accueil. L'API ne sert plus de champ « type » (`structurel`),
   retiré à la demande avec la colonne « Type ». */
const SLUGS_RAYONS = new Set(RAYONS.map((r) => r.slug));
const estRayon = (categorie) => SLUGS_RAYONS.has(categorie?.slug);

/**
 * Les catégories — et leurs sous-catégories.
 * ---------------------------------------------------------------------------
 * À la demande, une catégorie ne se règle plus que par son NOM et, pour une
 * sous-catégorie, sa catégorie PARENTE. La photo, la description, l'ordre
 * d'affichage et le statut « actif » ont été retirés, front et back : on ne
 * masque plus une catégorie, on la supprime.
 *
 * L'arbre n'a qu'un niveau : une sous-catégorie a pour parente une catégorie
 * principale, jamais une autre sous-catégorie. Le serveur le vérifie aussi
 * (`Category.verifier_parent`).
 *
 * Les cinq rayons de la maison (`estRayon`) se renomment, sans plus : pas de
 * suppression — la page d'accueil les attend — ni de parent.
 *
 * ── Le dessin ──
 * Une CARTE par catégorie principale, ses sous-catégories en lignes dessous,
 * à la demande (refonte de l'Espace Gestion dans le dessin du site). C'était
 * un tableau dont les sous-catégories se reconnaissaient à une flèche « ↳ ».
 */

/* Le message du serveur, lisible : `detail`, ou les erreurs par champ. */
const messageErreur = (err) => {
  const donnees = err.response?.data;
  if (!donnees) return 'Erreur réseau — réessayez.';
  if (typeof donnees === 'string') return donnees;
  return donnees.detail || Object.values(donnees).flat().join(' ') || 'Erreur';
};

const CategoryForm = ({ category, parentParDefaut, principales, parentFige, onClose, onSaved }) => {
  const [form, setForm] = useState({
    name: category?.name ?? '',
    parent: category ? (category.parent ?? '') : (parentParDefaut ?? ''),
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  // Une catégorie ne peut pas être sa propre parente.
  const choix = principales.filter((c) => c.id !== category?.id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Le nom est requis'); return; }
    setSaving(true);
    const payload = parentFige
      ? { name: form.name.trim() }
      : { name: form.name.trim(), parent: form.parent || null };
    try {
      if (category) {
        await apiClient.patch(`/gestion/categories/${category.id}/`, payload);
        toast.success('Catégorie mise à jour');
      } else {
        await apiClient.post('/gestion/categories/', payload);
        toast.success(payload.parent ? 'Sous-catégorie créée' : 'Catégorie créée');
      }
      onSaved();
    } catch (err) {
      toast.error(messageErreur(err), { duration: 8000 });
    } finally {
      setSaving(false);
    }
  };

  const titre = category
    ? 'Modifier la catégorie'
    : parentParDefaut ? 'Nouvelle sous-catégorie' : 'Nouvelle catégorie';

  return (
    <Tiroir
      titre={titre}
      onClose={onClose}
      fermable={!saving}
      pied={
        <GestionButton type="submit" form="categorie-form" disabled={saving}>
          {saving ? 'Enregistrement…' : category ? 'Enregistrer' : 'Créer'}
        </GestionButton>
      }
    >
      <form id="categorie-form" onSubmit={handleSubmit}>
        <Field label="Nom *">
          <GestionInput value={form.name} onChange={(e) => set('name', e.target.value)} required autoFocus />
        </Field>

        {/* Pas de texte d'explication quand le parent est figé, à la
            demande : le choix n'est simplement pas proposé. */}
        {!parentFige && (
          <Field label="Catégorie parente">
            <GestionSelect value={form.parent} onChange={(e) => set('parent', e.target.value)}>
              <option value="">— Aucune : catégorie principale —</option>
              {choix.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </GestionSelect>
          </Field>
        )}
      </form>
    </Tiroir>
  );
};

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  /* `undefined` fermé ; sinon `{ category, parent }` — `category` nul en
     création, `parent` posé d'office par le bouton « Sous-catégorie ». */
  const [edition, setEdition] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = useCallback(() => {
    apiClient.get('/gestion/categories/?page_size=200')
      .then((r) => setCategories(r.data.results ?? r.data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const principales = categories.filter((c) => !c.parent);
  const sousCategoriesDe = (id) => categories.filter((c) => c.parent === id);

  const handleDelete = (cat) => {
    const nbSous = sousCategoriesDe(cat.id).length;
    setConfirmDelete({
      title: `Supprimer « ${cat.name} » ?`,
      description: [
        nbSous > 0 && `Ses ${nbSous} sous-catégorie${nbSous > 1 ? 's' : ''} ser${nbSous > 1 ? 'ont' : 'a'} supprimée${nbSous > 1 ? 's' : ''} avec elle.`,
        "Si des pièces y sont encore rangées, la suppression sera refusée : déplacez-les ou supprimez-les d'abord.",
      ].filter(Boolean).join(' '),
      confirmLabel: 'Supprimer',
      onConfirm: async () => {
        try {
          await apiClient.delete(`/gestion/categories/${cat.id}/`);
          toast.success('Catégorie supprimée');
          load();
        } catch (err) {
          toast.error(messageErreur(err), { duration: 8000 });
        }
        setConfirmDelete(null);
      },
    });
  };

  const fermer = () => setEdition(undefined);
  const nouvelle = () => setEdition({ category: null });

  const nbSous = categories.length - principales.length;
  const compte = loading ? null : [
    `${principales.length} catégorie${principales.length > 1 ? 's' : ''}`,
    `${nbSous} sous-catégorie${nbSous > 1 ? 's' : ''}`,
  ].join(' · ');

  return (
    <>
      <PageHeader
        title="Catégories"
        compte={compte}
        action={<GestionButton icone="bx-plus" onClick={nouvelle}>Nouvelle catégorie</GestionButton>}
      />

      {loading ? <Chargement /> : categories.length === 0 ? (
        <EmptyState
          icon="bx-category"
          title="Aucune catégorie"
          description="Créez au moins une catégorie avant d'ajouter des produits — chaque produit doit appartenir à une catégorie."
          action={<GestionButton icone="bx-plus" onClick={nouvelle}>Créer une catégorie</GestionButton>}
        />
      ) : (
        <ul className="cat-grille">
          {principales.map((c) => {
            const sous = sousCategoriesDe(c.id);
            return (
              <li key={c.id} className="gx-cadre cat-carte">
                <div className="cat-tete">
                  <div className="cat-tete-texte">
                    {estRayon(c) && <span className="cat-rayon">Rayon de la maison</span>}
                    <h2 className="cat-nom">{c.name}</h2>
                  </div>
                  <div className="cat-actions">
                    <IconButton icone="bx-pencil" label={`Renommer « ${c.name} »`} onClick={() => setEdition({ category: c })} />
                    {!estRayon(c) && (
                      <IconButton icone="bx-trash" danger label={`Supprimer « ${c.name} »`} onClick={() => handleDelete(c)} />
                    )}
                  </div>
                </div>

                {sous.length > 0 && (
                  <ul className="cat-sous">
                    {sous.map((s) => (
                      <li key={s.id} className="cat-sous-ligne">
                        <span className="cat-sous-nom">{s.name}</span>
                        <div className="cat-actions">
                          <IconButton icone="bx-pencil" label={`Modifier « ${s.name} »`} onClick={() => setEdition({ category: s })} />
                          <IconButton icone="bx-trash" danger label={`Supprimer « ${s.name} »`} onClick={() => handleDelete(s)} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <button type="button" className="cat-ajout" onClick={() => setEdition({ category: null, parent: c.id })}>
                  <i className="bx bx-plus" aria-hidden="true" /> Sous-catégorie
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {confirmDelete && <ConfirmDialog {...confirmDelete} onCancel={() => setConfirmDelete(null)} />}
      {edition !== undefined && (
        <CategoryForm
          key={edition.category?.id ?? `nouvelle-${edition.parent ?? ''}`}
          category={edition.category}
          parentParDefaut={edition.parent}
          principales={principales}
          parentFige={Boolean(edition.category && (estRayon(edition.category) || sousCategoriesDe(edition.category.id).length > 0))}
          onClose={fermer}
          onSaved={() => { fermer(); load(); }}
        />
      )}

      <style>{`
        .cat-grille {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(30rem, 1fr));
          gap: var(--s-4);
          margin: 0;
          padding: 0;
          list-style: none;
        }
        .cat-carte {
          display: flex;
          flex-direction: column;
          padding: var(--s-5);
          transition: border-color var(--dur-2) var(--ease);
        }
        .cat-carte:hover { border-color: rgba(198, 164, 61, 0.55); }
        .cat-tete {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: var(--s-3);
        }
        .cat-tete-texte { min-width: 0; }
        .cat-rayon {
          display: block;
          margin-bottom: 0.6rem;
          font-size: 1.1rem;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--gp-brass-400);
        }
        .gl .cat-nom {
          font-family: var(--font-display);
          font-size: 2.2rem;
          font-weight: 500;
          line-height: 1.2;
          overflow-wrap: anywhere;
        }
        .cat-actions { display: flex; gap: 0.6rem; flex-shrink: 0; }
        .cat-sous {
          margin: var(--s-4) 0 0;
          padding: 0;
          list-style: none;
          border-top: 1px solid var(--line);
        }
        .cat-sous-ligne {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--s-3);
          padding: 0.8rem 0 0.8rem var(--s-3);
          border-bottom: 1px solid var(--line);
        }
        .cat-sous-nom {
          position: relative;
          min-width: 0;
          font-size: 1.5rem;
          overflow-wrap: anywhere;
        }
        /* Le losange du filet de titre, en puce : le signe de la maison. */
        .cat-sous-nom::before {
          content: "";
          position: absolute;
          top: 50%;
          left: -1.4rem;
          width: 5px;
          height: 5px;
          background: var(--gp-brass-400);
          transform: translateY(-50%) rotate(45deg);
        }
        .cat-sous-ligne .gx-icone { width: 3.2rem; height: 3.2rem; font-size: 1.5rem; }
        .cat-ajout {
          align-self: flex-start;
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          margin-top: auto;
          padding: var(--s-4) 0 0;
          border: 0;
          background: none;
          font-family: var(--font-body);
          font-size: 1.15rem;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--gp-brass-400);
          cursor: pointer;
        }
        .cat-ajout .bx { font-size: 1.6rem; }
        .cat-ajout:hover { color: var(--gp-ecru-50); }
        @media (max-width: 480px) {
          .cat-grille { grid-template-columns: minmax(0, 1fr); }
        }
      `}</style>
    </>
  );
};

export default CategoriesPage;
