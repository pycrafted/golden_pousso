import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../../api/client';
import useAuthStore from '../../store/authStore';
import {
  PageHeader, GestionButton, IconButton, GestionInput, Field, Recherche, Pilules, Badge,
  GestionTable, Td, EmptyState, ConfirmDialog, Chargement, Tiroir, Bloc,
} from './ui';

/**
 * Comptes utilisateurs.
 * ---------------------------------------------------------------------------
 * À la demande : la page s'appelait « Clients » (/gestion/clients, qui
 * redirige ici), et chaque compte a un TYPE, « Client » ou « Admin » — l'admin
 * étant un compte `is_staff`, qui a accès à l'Espace Gestion. Plus de colonnes
 * « Commandes » ni « Total dépensé », retirées front et back.
 *
 * Un compte se CRÉE, se MODIFIE, se DÉSACTIVE (il ne peut plus se connecter,
 * rien n'est effacé, on le réactive d'un clic) et se SUPPRIME (définitif), à
 * la demande. Ses commandes restent : elles sont liées par téléphone, pas au
 * compte.
 *
 * La création est le seul moyen d'ouvrir l'accès à un second admin sans passer
 * par `createsuperuser`. ⚠ Le TÉLÉPHONE est l'identifiant de connexion : le
 * changer ici change le numéro avec lequel la personne se connecte. Le mot de
 * passe, lui, ne se lit jamais — il se remplace, et c'est le seul dépannage
 * possible pour un client qui a perdu le sien (le site n'a pas de
 * réinitialisation par e-mail).
 *
 * Sur son propre compte, le STYLO seul est proposé, à la demande : on y
 * corrige son nom, son numéro ou son mot de passe, et le bloc « Type de
 * compte » n'y est pas. Changer son type, se désactiver ou se supprimer reste
 * impossible — le serveur le refuse, donc les boutons n'y sont pas.
 *
 * ── Le dessin ──
 * Refonte dans le dessin du site, à la demande : pastille d'initiales, filtres
 * en pilules comptées (Tous, Clients, Admins, Désactivés) et recherche, comme
 * sur la page des commandes.
 */

const nomDe = (c) => [c.first_name, c.last_name].filter(Boolean).join(' ') || c.phone;
const initiales = (c) => ([c.first_name?.[0], c.last_name?.[0]].filter(Boolean).join('') || '·').toUpperCase();

/* Le message du serveur, lisible. Les erreurs par CHAMP (numéro déjà pris,
   mot de passe trop court) sont le cas ordinaire du formulaire : sans elles,
   l'admin ne lirait qu'« Erreur » et ne saurait pas quoi corriger. */
const messageErreur = (err) => {
  const d = err.response?.data;
  if (!d) return 'Erreur réseau — réessayez.';
  if (typeof d === 'string') return d;
  if (Array.isArray(d)) return d[0];
  return d.detail || Object.values(d).flat().join(' ') || 'Erreur';
};

const FILTRES = {
  '': () => true,
  clients: (c) => !c.is_staff,
  admins: (c) => c.is_staff,
  desactives: (c) => !c.is_active,
};

/* Le formulaire d'un compte — création et modification, même tiroir : les
   champs sont les mêmes, seuls le titre, le bouton et le mot de passe
   changent (obligatoire à la création, facultatif ensuite).

   ⚠ Aucun texte d'aide sous les champs, à la demande : le tiroir ne porte que
   ses libellés. Les règles qu'ils rappelaient tiennent toujours et sont
   vérifiées par le serveur — l'e-mail est facultatif (un e-mail interne est
   posé à sa place), le téléphone est l'identifiant de connexion et doit être
   unique, le mot de passe fait six caractères au moins et, laissé vide en
   modification, n'est pas touché. Une erreur se lit dans la notification. */
const CompteForm = ({ compte, soiMeme = false, onClose, onSaved }) => {
  const [form, setForm] = useState({
    first_name: compte?.first_name ?? '',
    last_name: compte?.last_name ?? '',
    phone: compte?.phone ?? '',
    /* L'e-mail interne (<numéro>@goldenpousso.local) est posé par le serveur
       quand on ne saisit rien : il n'a pas à être montré comme une saisie. */
    email: compte?.email?.endsWith('@goldenpousso.local') ? '' : (compte?.email ?? ''),
    is_staff: compte?.is_staff ?? false,
    password: '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.first_name.trim()) { toast.error('Le prénom est requis'); return; }
    if (!form.phone.trim()) { toast.error('Le téléphone est requis'); return; }
    if (!compte && form.password.length < 6) {
      toast.error('Le mot de passe fait au moins 6 caractères');
      return;
    }
    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
    };
    /* Sur son propre compte, le type n'est pas envoyé : le serveur refuse
       qu'un admin se repasse client, et le champ n'est pas proposé. */
    if (!soiMeme) payload.is_staff = form.is_staff;
    /* Vide en modification : le mot de passe n'est pas touché. */
    if (form.password) payload.password = form.password;

    setSaving(true);
    try {
      if (compte) {
        await apiClient.patch(`/gestion/customers/${compte.id}/`, payload);
        toast.success('Compte mis à jour');
      } else {
        await apiClient.post('/gestion/customers/', payload);
        toast.success('Compte créé');
      }
      onSaved();
    } catch (err) {
      toast.error(messageErreur(err), { duration: 8000 });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Tiroir
      titre={compte ? 'Modifier le compte' : 'Nouveau compte'}
      sousTitre={compte ? nomDe(compte) : 'Client ou admin'}
      onClose={onClose}
      pied={(
        <GestionButton onClick={handleSubmit} disabled={saving}>
          {saving ? 'Un instant…' : compte ? 'Enregistrer' : 'Créer le compte'}
        </GestionButton>
      )}
    >
      <form onSubmit={handleSubmit}>
        <Bloc titre="Identité">
          <Field label="Prénom">
            <GestionInput value={form.first_name} onChange={(e) => set('first_name', e.target.value)} autoComplete="off" required />
          </Field>
          <Field label="Nom">
            <GestionInput value={form.last_name} onChange={(e) => set('last_name', e.target.value)} autoComplete="off" />
          </Field>
          <Field label="Email">
            <GestionInput type="email" value={form.email} onChange={(e) => set('email', e.target.value)} autoComplete="off" />
          </Field>
        </Bloc>

        <Bloc titre="Connexion">
          <Field label="Téléphone">
            <GestionInput type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} autoComplete="off" required />
          </Field>
          <Field label={compte ? 'Nouveau mot de passe' : 'Mot de passe'}>
            <GestionInput
              type="password"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              autoComplete="new-password"
              minLength={6}
              required={!compte}
            />
          </Field>
        </Bloc>

        {!soiMeme && (
        <Bloc titre="Type de compte">
          <Field label="Type" groupe>
            <Pilules
              label="Type de compte"
              options={[
                { valeur: 'client', libelle: 'Client' },
                { valeur: 'admin', libelle: 'Admin' },
              ]}
              valeur={form.is_staff ? 'admin' : 'client'}
              onChange={(v) => set('is_staff', v === 'admin')}
            />
          </Field>
        </Bloc>
        )}
      </form>
    </Tiroir>
  );
};

const ClientsPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);
  const [filtre, setFiltre] = useState('');
  const [recherche, setRecherche] = useState('');
  /* `undefined` : tiroir fermé. `{ compte }` : ouvert — `compte` nul en
     création. */
  const [edition, setEdition] = useState(undefined);
  const currentUser = useAuthStore((s) => s.user);

  const load = useCallback(() => {
    apiClient.get('/gestion/customers/?page_size=200').then((r) => setCustomers(r.data.results ?? r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  /* Une action confirmée : l'appel, le message, la liste relue. */
  const confirmer = ({ title, description, danger, confirmLabel, appel, succes }) => {
    setConfirm({
      title, description, danger, confirmLabel,
      onConfirm: async () => {
        try {
          await appel();
          toast.success(succes);
          load();
        } catch (err) {
          toast.error(messageErreur(err));
        }
        setConfirm(null);
      },
    });
  };

  const changerType = (c) => {
    const versAdmin = !c.is_staff;
    confirmer({
      title: versAdmin ? `Passer ${nomDe(c)} en admin ?` : `Repasser ${nomDe(c)} en client ?`,
      description: versAdmin
        ? "Un admin accède à l'Espace Gestion : catégories, commandes et comptes utilisateurs — exactement comme vous — et gère les pièces et les vidéos depuis le site. À réserver aux personnes de confiance."
        : "Ce compte perdra immédiatement l'accès à l'Espace Gestion. Il reste un compte client.",
      danger: !versAdmin,
      confirmLabel: versAdmin ? 'Passer admin' : 'Repasser client',
      appel: () => apiClient.patch(`/gestion/customers/${c.id}/`, { is_staff: versAdmin }),
      succes: versAdmin ? 'Compte passé admin' : 'Compte repassé client',
    });
  };

  const changerEtat = (c) => {
    const desactiver = c.is_active;
    confirmer({
      title: desactiver ? `Désactiver le compte de ${nomDe(c)} ?` : `Réactiver le compte de ${nomDe(c)} ?`,
      description: desactiver
        ? "Ce compte ne pourra plus se connecter, et sa session en cours sera refusée. Rien n'est effacé : vous pourrez le réactiver."
        : 'Ce compte pourra de nouveau se connecter.',
      danger: desactiver,
      confirmLabel: desactiver ? 'Désactiver' : 'Réactiver',
      appel: () => apiClient.patch(`/gestion/customers/${c.id}/`, { is_active: !desactiver }),
      succes: desactiver ? 'Compte désactivé' : 'Compte réactivé',
    });
  };

  const supprimer = (c) => {
    confirmer({
      title: `Supprimer définitivement le compte de ${nomDe(c)} ?`,
      description: "Le compte est effacé et ne pourra pas être récupéré. Ses commandes restent dans la liste des commandes. Pour seulement l'empêcher de se connecter, désactivez-le plutôt.",
      danger: true,
      confirmLabel: 'Supprimer',
      appel: () => apiClient.delete(`/gestion/customers/${c.id}/`),
      succes: 'Compte supprimé',
    });
  };

  /* Nom, e-mail sans casse ; téléphone sur ses seuls chiffres. */
  const terme = recherche.trim().toLowerCase();
  const chiffres = terme.replace(/\D/g, '');
  const trouves = customers.filter((c) => !terme
    || [nomDe(c), c.email].some((v) => (v || '').toLowerCase().includes(terme))
    || (chiffres.length > 0 && (c.phone || '').replace(/\D/g, '').includes(chiffres)));
  const affiches = trouves.filter(FILTRES[filtre]);

  const nb = (cle) => trouves.filter(FILTRES[cle]).length;
  const options = [
    { valeur: '', libelle: 'Tous', nb: nb('') },
    { valeur: 'clients', libelle: 'Clients', nb: nb('clients') },
    { valeur: 'admins', libelle: 'Admins', nb: nb('admins') },
    { valeur: 'desactives', libelle: 'Désactivés', nb: nb('desactives') },
  ];

  const nbAdmins = customers.filter((c) => c.is_staff).length;
  const compte = loading || customers.length === 0 ? null
    : `${customers.length} compte${customers.length > 1 ? 's' : ''} · ${nbAdmins} admin${nbAdmins > 1 ? 's' : ''}`;

  return (
    <>
      <PageHeader
        title="Comptes utilisateurs"
        compte={compte}
        action={(
          <>
            {customers.length > 0 && (
              <>
                <Recherche label="Rechercher : nom, téléphone, email" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
                <Pilules label="Filtrer les comptes" options={options} valeur={filtre} onChange={setFiltre} />
              </>
            )}
            <GestionButton icone="bx-plus" onClick={() => setEdition({ compte: null })}>Nouveau compte</GestionButton>
          </>
        )}
      />

      {loading ? <Chargement /> : customers.length === 0 ? (
        <EmptyState
          icon="bx-user"
          title="Aucun compte pour l'instant"
          description="Les comptes créés sur le site apparaissent ici automatiquement. Vous pouvez aussi en créer un — c'est ainsi qu'on ouvre l'accès à un second admin."
          action={<GestionButton icone="bx-plus" onClick={() => setEdition({ compte: null })}>Nouveau compte</GestionButton>}
        />
      ) : affiches.length === 0 ? (
        <EmptyState
          icon="bx-search"
          title="Aucun compte trouvé"
          description="Modifiez la recherche, ou revenez à « Tous »."
          action={<GestionButton variant="outline" onClick={() => { setRecherche(''); setFiltre(''); }}>Tout afficher</GestionButton>}
        />
      ) : (
        <GestionTable columns={['Compte', 'Téléphone', 'Email', 'Type', '']}>
          {affiches.map((c) => {
            const isSelf = currentUser?.id === c.id;
            return (
              <tr key={c.id} className={c.is_active ? undefined : 'cpt-inactif'}>
                <Td intitule="Compte">
                  <span className="cpt-identite">
                    <span className={`cpt-initiales${c.is_staff ? ' cpt-initiales--admin' : ''}`} aria-hidden="true">{initiales(c)}</span>
                    <span>
                      {[c.first_name, c.last_name].filter(Boolean).join(' ') || '—'}
                      {isSelf && <span className="cpt-vous">vous</span>}
                      <span className="gx-secondaire gx-num">
                        Inscrit le {new Date(c.date_joined).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </span>
                  </span>
                </Td>
                <Td intitule="Téléphone" className="gx-num">{c.phone || '—'}</Td>
                <Td intitule="Email" className="cpt-email">{c.email || <span className="gx-attenue">—</span>}</Td>
                <Td intitule="Type">
                  <span className="cpt-pastilles">
                    {c.is_staff ? <Badge tone="warning">Admin</Badge> : <Badge>Client</Badge>}
                    {!c.is_active && <Badge tone="danger">Désactivé</Badge>}
                  </span>
                </Td>
                <Td>
                  {/* Sur son propre compte, le stylo seul : on corrige son nom,
                      son numéro ou son mot de passe. Changer son type, se
                      désactiver ou se supprimer reste impossible — le serveur
                      le refuse, le bouton n'est donc pas proposé. */}
                  <div className="gx-actions">
                    <IconButton icone="bx-pencil" label={`Modifier le compte de ${nomDe(c)}`} onClick={() => setEdition({ compte: c })} />
                    {!isSelf && (
                      <>
                        <GestionButton variant="outline" petit onClick={() => changerType(c)}>
                          {c.is_staff ? 'Repasser client' : 'Passer admin'}
                        </GestionButton>
                        <GestionButton variant="outline" petit onClick={() => changerEtat(c)}>
                          {c.is_active ? 'Désactiver' : 'Réactiver'}
                        </GestionButton>
                        <IconButton icone="bx-trash" danger label={`Supprimer le compte de ${nomDe(c)}`} onClick={() => supprimer(c)} />
                      </>
                    )}
                  </div>
                </Td>
              </tr>
            );
          })}
        </GestionTable>
      )}

      {confirm && <ConfirmDialog {...confirm} onCancel={() => setConfirm(null)} />}

      {edition !== undefined && (
        <CompteForm
          key={edition.compte?.id ?? 'nouveau'}
          compte={edition.compte}
          soiMeme={Boolean(edition.compte && currentUser?.id === edition.compte.id)}
          onClose={() => setEdition(undefined)}
          onSaved={() => { setEdition(undefined); load(); }}
        />
      )}

      <style>{`
        .cpt-identite { display: inline-flex; align-items: center; gap: 1.4rem; text-align: left; }
        .cpt-initiales {
          display: grid;
          place-items: center;
          flex-shrink: 0;
          width: 4.4rem;
          height: 4.4rem;
          border: 1px solid var(--line-dark-accent);
          border-radius: 50%;
          font-family: var(--font-display);
          font-size: 1.5rem;
          letter-spacing: 0.04em;
          color: var(--text-muted);
        }
        /* Un admin : pastille pleine, indigo sur laiton, 7,74:1. */
        .cpt-initiales--admin {
          border-color: var(--gp-brass-400);
          background: var(--gp-brass-400);
          color: var(--gp-indigo-900);
        }
        .cpt-vous {
          margin-left: 0.8rem;
          padding: 0.2rem 0.8rem;
          border: 1px solid var(--line-dark-accent);
          border-radius: var(--r-pill);
          font-size: 1.1rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--gp-brass-400);
          vertical-align: middle;
        }
        .cpt-email { overflow-wrap: anywhere; }
        .cpt-pastilles { display: inline-flex; flex-wrap: wrap; gap: 0.6rem; }
        /* Un compte désactivé : nom atténué (6,79:1) et initiales en
           pointillé, en plus de sa pastille. Pas d'opacité sur la ligne : le
           texte atténué y tombait sous 4,5:1. */
        .cpt-inactif .cpt-identite { color: var(--text-muted); }
        .cpt-inactif .cpt-initiales { border-style: dashed; }
      `}</style>
    </>
  );
};

export default ClientsPage;
