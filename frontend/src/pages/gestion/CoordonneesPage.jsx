import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../../api/client';
import useCoordonneesStore from '../../store/coordonneesStore';
import { PageHeader, GestionButton, GestionInput, Field, Chargement } from './ui';

/**
 * Les coordonnées de la boutique.
 * ---------------------------------------------------------------------------
 * Adresse, téléphone, e-mail : les trois valeurs de la bande qui coiffe toutes
 * les pages du site. Elles étaient écrites dans le code du frontend — les
 * changer demandait un déploiement. Elles vivent maintenant en base, sur une
 * ligne unique (`Coordonnees`), lue par `GET /coordonnees/` et écrite ici par
 * `PATCH /gestion/coordonnees/`.
 *
 * ── Pas de tiroir ──────────────────────────────────────────────────────────
 * Il n'y a rien à lister : une seule fiche, toujours la même. Le formulaire
 * est donc la page elle-même. Un tiroir supposerait une liste derrière lui, et
 * un bouton de plus pour l'ouvrir.
 *
 * ── Le WhatsApp du site suit ce téléphone ──────────────────────────────────
 * L'icône de la barre de navigation, l'entrée « WhatsApp » du menu mobile et
 * le lien des mentions légales ouvrent wa.me sur CE numéro (`whatsapp`,
 * calculé par le serveur). Il n'y a rien de plus à saisir — et donc rien de
 * plus à oublier de changer.
 *
 * ── Ni aperçu, ni texte d'aide ─────────────────────────────────────────────
 * Retirés à la demande : la carte « Aperçu » de la bande, le sous-titre et les
 * aides sous les champs. La bande elle-même est en tête de page, et suit
 * l'enregistrement.
 *
 * ── Le bouton reste après l'enregistrement ─────────────────────────────────
 * Comme le formulaire produit : il passe à « ✓ Enregistré » jusqu'au prochain
 * changement d'un champ. Rien d'autre n'indiquerait que c'est parti — la page
 * ne se ferme pas.
 */

/* Le message du serveur, lisible : `detail`, ou les erreurs par champ. */
const messageErreur = (err) => {
  const donnees = err.response?.data;
  if (!donnees) return 'Erreur réseau — réessayez.';
  if (typeof donnees === 'string') return donnees;
  return donnees.detail || Object.values(donnees).flat().join(' ') || 'Erreur';
};

const VIDE = { adresse: '', telephone: '', email: '', telephone_lien: '', whatsapp: '' };

const CoordonneesPage = () => {
  const poser = useCoordonneesStore((s) => s.poser);

  const [form, setForm] = useState(VIDE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enregistre, setEnregistre] = useState(false);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setEnregistre(false);
  };

  const load = useCallback(() => {
    apiClient.get('/gestion/coordonnees/')
      .then(({ data }) => setForm({ ...VIDE, ...data }))
      .catch((err) => toast.error(messageErreur(err), { duration: 8000 }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      adresse: form.adresse.trim(),
      telephone: form.telephone.trim(),
      email: form.email.trim(),
    };
    if (!payload.adresse || !payload.telephone || !payload.email) {
      toast.error('Les trois coordonnées sont requises');
      return;
    }
    setSaving(true);
    try {
      const { data } = await apiClient.patch('/gestion/coordonnees/', payload);
      setForm({ ...VIDE, ...data });
      /* La bande, juste au-dessus, suit sans rechargement de page. */
      poser(data);
      setEnregistre(true);
      toast.success('Coordonnées mises à jour');
    } catch (err) {
      toast.error(messageErreur(err), { duration: 8000 });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Coordonnées" />

      {loading ? <Chargement lignes={3} /> : (
        <div className="coord-colonne">
          <form className="gx-cadre gx-panneau" onSubmit={handleSubmit}>
            <Field label="Adresse">
              <GestionInput
                value={form.adresse}
                onChange={(e) => set('adresse', e.target.value)}
                placeholder="Ex. Pikine Tally Boumack"
                maxLength={200}
                autoComplete="off"
                required
              />
            </Field>

            <Field label="Téléphone">
              <GestionInput
                type="tel"
                value={form.telephone}
                onChange={(e) => set('telephone', e.target.value)}
                placeholder="Ex. 77 751 47 95"
                maxLength={40}
                autoComplete="off"
                required
              />
            </Field>

            <Field label="Email">
              <GestionInput
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="Ex. contact@golden-pousso.com"
                maxLength={254}
                autoComplete="off"
                required
              />
            </Field>

            <div className="coord-pied">
              <GestionButton
                type="submit"
                variant={enregistre ? 'outline' : 'primary'}
                disabled={saving}
                icone={enregistre ? 'bx-check' : undefined}
              >
                {saving ? 'Enregistrement…' : enregistre ? 'Enregistré' : 'Enregistrer'}
              </GestionButton>
            </div>
          </form>
        </div>
      )}

      <style>{`
        /* La carte est centrée dans la page, à la demande. */
        .coord-colonne {
          display: grid;
          gap: var(--s-5);
          max-width: 64rem;
          margin-inline: auto;
        }
        .coord-pied {
          display: flex;
          justify-content: flex-end;
          padding-top: 0.8rem;
        }
        /* Le dernier champ porte déjà sa marge (.gx-champ) : le pied n'en
           rajoute pas, sinon le bouton flotte loin sous l'e-mail. */
        .coord-colonne .gx-champ:last-of-type { margin-bottom: 0; }
      `}</style>
    </>
  );
};

export default CoordonneesPage;
