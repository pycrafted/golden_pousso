import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import SEOHead from '../components/SEOHead';

/**
 * Mon compte — connexion, profil, mot de passe.
 * ===========================================================================
 * Réécriture complète. La page précédente avait sa propre palette écrite en
 * hexadécimal (`C.bg`, `C.gold`, `C.panel`…), ses propres champs dessinés à la
 * main, ses propres onglets, et 832 lignes de styles en ligne. Elle ne lisait
 * aucun token du système : posée à côté de la page d'accueil ou d'une fiche
 * produit, elle avait l'air d'un autre site.
 *
 * Ici, rien n'est dessiné en propre. La page emprunte ce qui existe :
 *
 *   .catalogue-page / -entete / -titre   le cadre des pages de catalogue,
 *                                        déjà partagé par /boutique, les
 *                                        rayons et les favoris
 *   .filet-titre                         le filet doré sous le titre
 *   .eyebrow                             les intitulés de bloc
 *   .field                               les champs de saisie
 *   .btn --accent / --ghost / --auto     les actions
 *
 * Le seul CSS local est celui de la mise en page — une colonne, des blocs
 * séparés d'un filet — et de l'avatar. Tout le reste vient des tokens.
 *
 * ── Ce qui a été retiré ─────────────────────────────────────────────────────
 * ⚠ L'onglet « Mes commandes » n'est plus ici. Il listait les commandes du
 * client depuis /orders/mes-commandes/, avec leur statut, leur détail
 * dépliable et leurs six couleurs d'état. Il doit devenir une page à lui.
 *
 * ⚠ Et RIEN ne le remplace ici : le bloc qui annonçait la page à venir a été
 * retiré à son tour. Un client connecté n'a donc, depuis cette page, aucun
 * moyen de retrouver ses commandes — ni liste, ni renvoi vers le suivi public
 * (/commande/suivi), qui existe toujours mais réclame un numéro de commande.
 *
 * ── Ce qui a été fusionné ───────────────────────────────────────────────────
 * L'onglet « Mes adresses » ne portait qu'un seul champ, `default_address`. Il
 * a rejoint le bloc Profil : un onglet pour une ligne de texte demandait un
 * clic pour rien.
 */

/* ══════════════════════════════════════════════════════════════════════════
   CONNEXION / INSCRIPTION
   ══════════════════════════════════════════════════════════════════════════ */
const FormulaireAuth = () => {
  const [mode, setMode] = useState('connexion');
  const [chargement, setChargement] = useState(false);
  const { login, register } = useAuthStore();

  const [connexion, setConnexion] = useState({ phone: '', password: '' });
  const [inscription, setInscription] = useState({
    first_name: '', last_name: '', phone: '', password: '',
  });

  const seConnecter = async (e) => {
    e.preventDefault();
    setChargement(true);
    try {
      await login(connexion.phone, connexion.password);
      toast.success('Connexion réussie.');
    } catch {
      toast.error('Numéro de téléphone ou mot de passe incorrect.');
    } finally { setChargement(false); }
  };

  const sInscrire = async (e) => {
    e.preventDefault();
    setChargement(true);
    try {
      await register(inscription);
      toast.success('Compte créé.');
    } catch (err) {
      toast.error(err.response?.data?.phone?.[0] || 'Erreur lors de la création du compte.');
    } finally { setChargement(false); }
  };

  const enConnexion = mode === 'connexion';

  return (
    <div className="compte-colonne compte-colonne--etroite">
      {/* Deux boutons et non des onglets soulignés : le système a déjà des
          actions en pastille, il n'avait pas besoin d'un sixième motif. */}
      <div className="compte-bascule" role="tablist">
        {[['connexion', 'Se connecter'], ['inscription', 'Créer un compte']].map(([cle, label]) => (
          <button
            key={cle}
            type="button"
            role="tab"
            aria-selected={mode === cle}
            onClick={() => setMode(cle)}
            className={`btn btn--auto ${mode === cle ? 'btn--accent' : 'btn--ghost'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {enConnexion ? (
        <form onSubmit={seConnecter} className="compte-champs">
          <label className="compte-champ">
            <span className="eyebrow">Téléphone</span>
            <input
              className="field" type="tel" autoComplete="tel" required
              value={connexion.phone}
              onChange={(e) => setConnexion((d) => ({ ...d, phone: e.target.value }))}
            />
          </label>
          <label className="compte-champ">
            <span className="eyebrow">Mot de passe</span>
            <input
              className="field" type="password" autoComplete="current-password" required
              value={connexion.password}
              onChange={(e) => setConnexion((d) => ({ ...d, password: e.target.value }))}
            />
          </label>
          <button type="submit" className="btn btn--accent" disabled={chargement}>
            {chargement ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      ) : (
        <form onSubmit={sInscrire} className="compte-champs">
          <div className="compte-duo">
            <label className="compte-champ">
              <span className="eyebrow">Prénom</span>
              <input
                className="field" required autoComplete="given-name"
                value={inscription.first_name}
                onChange={(e) => setInscription((d) => ({ ...d, first_name: e.target.value }))}
              />
            </label>
            <label className="compte-champ">
              <span className="eyebrow">Nom</span>
              <input
                className="field" required autoComplete="family-name"
                value={inscription.last_name}
                onChange={(e) => setInscription((d) => ({ ...d, last_name: e.target.value }))}
              />
            </label>
          </div>
          <label className="compte-champ">
            <span className="eyebrow">Téléphone</span>
            <input
              className="field" type="tel" required autoComplete="tel"
              value={inscription.phone}
              onChange={(e) => setInscription((d) => ({ ...d, phone: e.target.value }))}
            />
          </label>
          <label className="compte-champ">
            <span className="eyebrow">Mot de passe</span>
            <input
              className="field" type="password" required autoComplete="new-password"
              value={inscription.password}
              onChange={(e) => setInscription((d) => ({ ...d, password: e.target.value }))}
            />
          </label>
          <button type="submit" className="btn btn--accent" disabled={chargement}>
            {chargement ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   LE COMPTE
   ══════════════════════════════════════════════════════════════════════════ */

/* Les lignes modifiables du profil, dans l'ordre d'affichage. Le mot de passe
   et la photo n'y sont pas : ils ne se modifient pas de la même façon — l'un
   demande trois champs et un autre appel d'API, l'autre ouvre un sélecteur de
   fichier. */
const CHAMPS = [
  { cle: 'phone',           label: 'Téléphone',            autoComplete: 'tel', type: 'tel' },
  { cle: 'default_address', label: 'Adresse de livraison', autoComplete: 'street-address' },
];

/* Le crayon. Un bouton et non une icône décorative : il ouvre l'édition d'une
   ligne, il doit donc être atteignable au clavier et porter un nom — « ✎ »
   seul ne dit rien à un lecteur d'écran. */
const BoutonCrayon = ({ quoi, onClick }) => (
  <button
    type="button"
    className="compte-crayon"
    onClick={onClick}
    aria-label={`Modifier ${quoi}`}
    title={`Modifier ${quoi}`}
  >
    <i className="bx bx-pencil" aria-hidden="true" />
  </button>
);

const Compte = () => {
  const { user, logout, updateProfile, changePassword } = useAuthStore();

  /* Une seule ligne s'ouvre à la fois : deux formulaires ouverts côte à côte
     donnent deux boutons « Enregistrer » et on ne sait plus lequel enregistre
     quoi. `null` = tout est en lecture. */
  const [edite, setEdite] = useState(null);
  const [occupe, setOccupe] = useState(false);

  const valeursProfil = () => ({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    default_address: user?.default_address || '',
  });
  const [profil, setProfil] = useState(valeursProfil);

  const [apercuAvatar, setApercuAvatar] = useState(user?.avatar_url || null);
  const [fichierAvatar, setFichierAvatar] = useState(null);
  const champFichier = useRef(null);

  const [motDePasse, setMotDePasse] = useState({
    current_password: '', new_password: '', confirm_password: '',
  });

  /* Annuler doit rendre la valeur d'AVANT, pas celle qu'on vient de taper :
     on repart de `user`, la seule source qui n'a pas été touchée. */
  const annuler = () => {
    setProfil(valeursProfil());
    setMotDePasse({ current_password: '', new_password: '', confirm_password: '' });
    setFichierAvatar(null);
    setApercuAvatar(user?.avatar_url || null);
    setEdite(null);
  };

  /* Tous les champs partent à chaque enregistrement, même ceux qu'on n'a pas
     ouverts : l'API attend le profil entier, et n'envoyer que la ligne éditée
     viderait les autres. */
  const enregistrerProfil = async (e) => {
    e.preventDefault();
    setOccupe(true);
    try {
      const fd = new FormData();
      Object.entries(profil).forEach(([k, v]) => fd.append(k, v));
      if (fichierAvatar) fd.append('avatar', fichierAvatar);
      await updateProfile(fd);
      setFichierAvatar(null);
      setEdite(null);
      toast.success('Profil mis à jour.');
    } catch {
      toast.error('Erreur lors de la mise à jour.');
    } finally { setOccupe(false); }
  };

  const enregistrerMotDePasse = async (e) => {
    e.preventDefault();
    if (motDePasse.new_password !== motDePasse.confirm_password) {
      toast.error('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setOccupe(true);
    try {
      await changePassword(motDePasse.current_password, motDePasse.new_password);
      setMotDePasse({ current_password: '', new_password: '', confirm_password: '' });
      setEdite(null);
      toast.success('Mot de passe modifié.');
    } catch (err) {
      toast.error(err.response?.data?.current_password?.[0]
        || err.response?.data?.detail
        || 'Erreur lors du changement de mot de passe.');
    } finally { setOccupe(false); }
  };

  const choisirAvatar = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFichierAvatar(f);
    setApercuAvatar(URL.createObjectURL(f));
    setEdite('avatar');
  };

  const initiales = [user?.first_name, user?.last_name]
    .filter(Boolean).map((s) => s[0].toUpperCase()).join('') || '?';

  /* Une fonction qui rend du JSX, PAS un composant defini dans le rendu :
     un composant declare ici change d'identite a chaque rendu, React le
     demonte et le remonte, et le champ voisin perdrait le focus a chaque
     frappe. */
  const actions = (valider) => (
    <div className="compte-actions">
      <button type="button" className="btn btn--accent btn--auto" disabled={occupe} onClick={valider}>
        {occupe ? 'Enregistrement…' : 'Enregistrer'}
      </button>
      <button type="button" className="compte-annuler" onClick={annuler}>Annuler</button>
    </div>
  );

  /* Entree valide, Echap annule : sans formulaire, il faut les cabler a la
     main. C'est ce qu'un visiteur essaie d'abord dans un champ ouvert. */
  const auClavier = (valider) => (ev) => {
    if (ev.key === 'Enter') { ev.preventDefault(); valider(ev); }
    if (ev.key === 'Escape') { ev.preventDefault(); annuler(); }
  };

  return (
    /* `.card` donne le filet et le rayon --r-3 ; `.on-dark` bascule d'un coup
       les tokens de texte, de filet et de surface pour un fond sombre — sans
       elle, il aurait fallu repasser une à une la couleur des libellés, des
       valeurs, des séparateurs et des champs. `.compte-carte` ajoute le
       remplissage et l'indigo exact. */
    <div className="compte-colonne card compte-carte on-dark">

      {/* ── L'avatar, et par où sortir ──
          Le nom et le téléphone ont été retirés : ils sont écrits juste en
          dessous, dans les lignes « Prénom », « Nom » et « Téléphone ». Les
          répéter ici les affichait deux fois à trois centimètres d'écart. */}
      <div className="compte-tete">
        <span className="compte-avatar" aria-hidden="true">
          {apercuAvatar ? <img src={apercuAvatar} alt="" /> : initiales}
        </span>
        <BoutonCrayon quoi="la photo" onClick={() => champFichier.current?.click()} />
        <input ref={champFichier} type="file" accept="image/*" onChange={choisirAvatar} hidden />

        <Link to="/commandes" className="btn btn--ghost btn--auto compte-sortie">
          Mes commandes
        </Link>
        <button type="button" className="btn btn--ghost btn--auto" onClick={logout}>
          Se déconnecter
        </button>
      </div>

      {/* La photo se valide ici, sous l'avatar qu'elle change — et non en pied
          de liste, où l'on ne verrait pas ce qu'on enregistre. */}
      {edite === 'avatar' && (
        <div className="compte-actions compte-actions--photo">
          <button type="button" className="btn btn--accent btn--auto" disabled={occupe}
            onClick={enregistrerProfil}>
            {occupe ? 'Enregistrement…' : 'Enregistrer la photo'}
          </button>
          <button type="button" className="compte-annuler" onClick={annuler}>Annuler</button>
        </div>
      )}

      {/* Plus de titre de bloc : il n'y a plus qu'un bloc, et « Mon compte »
          au-dessus de « Mes informations » disait deux fois la même chose.
          Les lignes remontent donc contre l'identité. */}
      {/* Un <div> et non un <section>. La règle globale donne à toute section
          64 à 80 px de padding en haut — le rythme vertical de la page — et
          c'est ce qui creusait l'écart sous l'avatar. Un bloc à l'intérieur
          d'une carte n'a pas à porter le rythme de la PAGE.

          Et depuis le retrait de son titre, ce n'était plus une section au
          sens du balisage : une section sans en-tête n'apporte rien à la
          structure du document. */}
      <div className="compte-bloc">
        <dl className="compte-lignes">

          {/* Prénom et nom tiennent une seule ligne : ce sont les deux
              moitiés d'une même chose, et deux lignes pour deux mots courts
              étiraient la liste sans rien apprendre de plus. */}
          <div className="compte-ligne">
            <dt className="eyebrow">Prénom et nom</dt>

            {edite === 'identite' ? (
              <dd className="compte-edition">
                <div className="compte-duo">
                  <input
                    className="field" autoComplete="given-name" autoFocus
                    placeholder="Prénom"
                    value={profil.first_name}
                    onChange={(ev) => setProfil((d) => ({ ...d, first_name: ev.target.value }))}
                    onKeyDown={auClavier(enregistrerProfil)}
                  />
                  <input
                    className="field" autoComplete="family-name"
                    placeholder="Nom"
                    value={profil.last_name}
                    onChange={(ev) => setProfil((d) => ({ ...d, last_name: ev.target.value }))}
                    onKeyDown={auClavier(enregistrerProfil)}
                  />
                </div>
                {actions(enregistrerProfil)}
              </dd>
            ) : (
              <>
                <dd className="compte-valeur">
                  {[profil.first_name, profil.last_name].filter(Boolean).join(' ')
                    || <span className="compte-vide">Non renseigné</span>}
                </dd>
                <BoutonCrayon quoi="le prénom et le nom" onClick={() => setEdite('identite')} />
              </>
            )}
          </div>

          {/* Les champs texte */}
          {CHAMPS.map(({ cle, label, type, autoComplete }) => (
            <div className="compte-ligne" key={cle}>
              <dt className="eyebrow">{label}</dt>

              {edite === cle ? (
                <dd className="compte-edition">
                  <input
                    className="field"
                    type={type || 'text'}
                    autoComplete={autoComplete}
                    autoFocus
                    value={profil[cle]}
                    onChange={(ev) => setProfil((d) => ({ ...d, [cle]: ev.target.value }))}
                    onKeyDown={auClavier(enregistrerProfil)}
                  />
                  {actions(enregistrerProfil)}
                </dd>
              ) : (
                <>
                  <dd className="compte-valeur">
                    {profil[cle] || <span className="compte-vide">Non renseigné</span>}
                  </dd>
                  <BoutonCrayon quoi={label.toLowerCase()} onClick={() => setEdite(cle)} />
                </>
              )}
            </div>
          ))}

          {/* Mot de passe — même ligne, même crayon, autre formulaire */}
          <div className="compte-ligne">
            <dt className="eyebrow">Mot de passe</dt>

            {edite === 'motdepasse' ? (
              <dd className="compte-edition">
                <input className="field" type="password" placeholder="Mot de passe actuel"
                  autoComplete="current-password" autoFocus required
                  value={motDePasse.current_password}
                  onChange={(ev) => setMotDePasse((d) => ({ ...d, current_password: ev.target.value }))} />
                <input className="field" type="password" placeholder="Nouveau mot de passe"
                  autoComplete="new-password" required
                  value={motDePasse.new_password}
                  onChange={(ev) => setMotDePasse((d) => ({ ...d, new_password: ev.target.value }))} />
                <input className="field" type="password" placeholder="Confirmer le nouveau"
                  autoComplete="new-password" required
                  value={motDePasse.confirm_password}
                  onChange={(ev) => setMotDePasse((d) => ({ ...d, confirm_password: ev.target.value }))}
                  onKeyDown={auClavier(enregistrerMotDePasse)} />
                {actions(enregistrerMotDePasse)}
              </dd>
            ) : (
              <>
                <dd className="compte-valeur">••••••••</dd>
                <BoutonCrayon quoi="le mot de passe" onClick={() => setEdite('motdepasse')} />
              </>
            )}
          </div>
        </dl>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════ */
const MonComptePage = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <>
      <SEOHead title="Mon compte" url="/profil" noindex />

      <div className="catalogue-page">
        <section className="catalogue-entete">
          <h1 className="catalogue-titre">
            {isAuthenticated ? 'Mon compte' : 'Se connecter'}
          </h1>
          <span className="filet-titre" aria-hidden="true" />
        </section>

        <div className="catalogue-corps">
          {isAuthenticated ? <Compte /> : <FormulaireAuth />}
        </div>
      </div>

      <style>{`
        /* Une colonne, centrée, bornée en largeur : un formulaire étalé sur
           1400 px oblige l'œil à traverser l'écran entre l'intitulé et le
           champ. */
        .compte-colonne {
          max-width: 68rem;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          /* Aucun écart. Il servait à poser un titre de bloc qui n'existe
             plus ; les lignes se rangent directement sous l'identité, dont le
             filet du bas fait déjà la séparation. La première ligne apporte
             sa propre respiration avec son padding. */
          gap: 0;
        }
        .compte-colonne--etroite { max-width: 46rem; }

        /* Le remplissage de la carte. En clamp : 24 px sur un téléphone, où
           64 px de marge intérieure ne laisseraient plus de largeur aux
           champs.

           Le fond est celui du chrome du site — bande de coordonnées, barre de
           navigation, pied de page, hero. La carte se pose donc sur l'écru de
           la page comme un objet de la même famille que l'en-tête.

           « .on-dark » aurait donné « --surface-dark » (#0F1320), un cran plus
           sombre : on redéclare ici pour tenir le même indigo que le reste du
           chrome. Ratios mesurés sur ce fond — écru 15,85:1, laiton 7,14:1,
           texte atténué 6,79:1. */
        .compte-carte {
          padding: clamp(var(--s-5), 4vw, var(--s-8));
          background: var(--surface-chrome);
        }

        /* ── L'identité en tête ── */
        .compte-tete {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: var(--s-4);
          padding-bottom: var(--s-3);
          border-bottom: 1px solid var(--line);
        }
        /* Le crayon suit l'avatar, la déconnexion part au bord droit. */
        .compte-tete .compte-sortie { margin-left: auto; }

        .compte-avatar {
          display: grid;
          place-items: center;
          width: 6.4rem;
          height: 6.4rem;
          flex-shrink: 0;
          overflow: hidden;
          border-radius: var(--r-pill);
          border: 1px solid var(--line-accent);
          /* « --surface-gold » est une carte CLAIRE : les initiales en laiton
             s'y posaient à 2,22:1, illisibles. « --surface-sunk » suit la
             bascule de « .on-dark » et devient l'indigo creusé. */
          background: var(--surface-sunk);
          color: var(--text-accent);
          font-family: var(--font-display);
          font-size: var(--t-h3);
        }
        .compte-avatar img { width: 100%; height: 100%; object-fit: cover; }



        .compte-champs {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: var(--s-4);
        }

        /* ── Les lignes du compte ──
           Une liste de definitions : intitule, valeur, crayon. Le <dl> dit ce
           que la structure est vraiment — des paires libelle/valeur — la ou
           une suite de <div> n'aurait rien dit.

           Trois colonnes : l'intitule a largeur fixe pour que les valeurs
           s'alignent, la valeur prend le reste, le crayon se retracte. */
        .compte-lignes {
          display: flex;
          flex-direction: column;
        }
        .compte-ligne {
          display: grid;
          grid-template-columns: 18rem 1fr auto;
          align-items: center;
          gap: var(--s-4);
          padding: var(--s-4) 0;
          border-top: 1px solid var(--line);
        }
        /* La première ligne ne porte ni filet ni espace au-dessus : le filet
           du bas de l'identité tient déjà le rôle, et son padding faisait
           doublon avec celui de l'identité juste au-dessus. */
        .compte-ligne:first-child { border-top: 0; padding-top: var(--s-2); }
        .compte-ligne > dt { color: var(--text-muted); }
        .compte-ligne > dd { margin: 0; }

        .compte-valeur {
          font-size: var(--t-body);
          overflow-wrap: anywhere;
          font-variant-numeric: tabular-nums;
        }
        .compte-vide { color: var(--text-muted); font-style: italic; }

        /* En edition, la valeur et ses boutons prennent les deux colonnes
           restantes : le crayon disparait, il n'a plus rien a ouvrir. */
        .compte-edition {
          grid-column: 2 / -1;
          display: flex;
          flex-direction: column;
          gap: var(--s-3);
        }

        .compte-actions { display: flex; align-items: center; gap: var(--s-3); }
        .compte-actions--photo { margin-top: var(--s-4); }

        /* Annuler n'est pas un bouton dessine : dans une paire de decision, le
           chemin de retour doit peser moins que celui qui engage. */
        .compte-annuler {
          border: 0;
          background: none;
          padding: var(--s-2);
          font-family: var(--font-body);
          font-size: var(--t-sm);
          color: var(--text-muted);
          cursor: pointer;
        }
        .compte-annuler:hover { color: var(--text); }

        /* Le crayon. Assez grand pour etre vise au doigt — 44 px est le
           minimum recommande pour une cible tactile — mais sans cadre : c'est
           l'icone qui se colore au survol, pas un bouton de plus dans la
           page. */
        .compte-crayon {
          display: grid;
          place-items: center;
          width: 4.4rem;
          height: 4.4rem;
          border: 0;
          background: none;
          border-radius: var(--r-pill);
          color: var(--text-muted);
          font-size: 2rem;
          cursor: pointer;
          transition: color var(--dur-1) var(--ease), background var(--dur-1) var(--ease);
        }
        .compte-crayon:hover {
          color: var(--text-accent);
          background: var(--surface-sunk);
        }

        /* Sous 640 px, l'intitule passe au-dessus : a 18 rem de colonne, il ne
           resterait rien pour la valeur sur un telephone. */
        @media (max-width: 640px) {
          .compte-ligne { grid-template-columns: 1fr auto; }
          .compte-ligne > dt { grid-column: 1 / -1; margin-bottom: calc(var(--s-2) * -1); }
          .compte-edition { grid-column: 1 / -1; }
        }
        .compte-champs > .btn { margin-top: var(--s-2); }

        .compte-champ { display: block; width: 100%; }
        .compte-champ .eyebrow {
          display: block;
          margin-bottom: var(--s-2);
          color: var(--text-muted);
        }

        /* Deux champs par ligne au-delà de 560 px, empilés en dessous : côte à
           côte sur un téléphone, prénom et nom tombent à 12 caractères de
           large. */
        .compte-duo {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--s-4);
          width: 100%;
        }
        @media (min-width: 560px) {
          .compte-duo { grid-template-columns: 1fr 1fr; }
        }

        .compte-bascule {
          display: flex;
          flex-wrap: wrap;
          gap: var(--s-3);
          margin-bottom: var(--s-6);
        }

        .compte-avatar-ligne { display: flex; align-items: center; gap: var(--s-4); }

      `}</style>
    </>
  );
};

export default MonComptePage;
