import { useEffect, useState } from 'react';

/**
 * L'installation de l'application — un seul endroit pour tout le site.
 * ---------------------------------------------------------------------------
 * Deux surfaces la consultent : la bannière d'invitation et l'entrée
 * « Installer l'application » du menu mobile. L'événement `beforeinstallprompt`
 * n'étant envoyé QU'UNE FOIS par Chrome, il ne peut pas être capté dans deux
 * composants : il l'est ici, au chargement du module, et chacun s'y abonne.
 *
 * ── Ce que le navigateur permet ────────────────────────────────────────────
 * ANDROID / CHROME : `beforeinstallprompt` est retenu, et son `prompt()` ouvre
 * la vraie boîte du système. ⚠ Chrome EXIGE un geste de l'utilisateur pour
 * l'appeler — impossible de l'ouvrir au chargement.
 *
 * IPHONE / SAFARI : l'événement n'existe pas. Apple n'offre aucune API :
 * l'ajout passe par le menu « Partager » de l'utilisateur, on ne peut que
 * l'expliquer.
 *
 * AILLEURS (navigateurs de Facebook, Instagram, WhatsApp, Firefox Android,
 * ordinateurs) : aucune installation possible. Rien ne doit être proposé —
 * une invitation qui ne mène nulle part est pire que pas d'invitation.
 */

const CLE_REFUS = 'gp_installation_refusee';
const CLE_PAGES = 'gp_pages_vues';

/* Un refus vaut trente jours. Redemander à chaque visite est le comportement
   qui fait désinstaller — et que Google pénalise. */
const JOURS_DE_SILENCE = 30;

/* L'invitation attend que le visiteur ait montré de l'intérêt. Trois pages,
   c'est quelqu'un qui parcourt vraiment la boutique, pas quelqu'un qui vient
   d'arriver et ne sait pas encore chez qui il est. */
const PAGES_AVANT_INVITATION = 3;

const lireJSON = (cle) => {
  try { return JSON.parse(localStorage.getItem(cle) ?? 'null'); } catch { return null; }
};
const ecrire = (cle, valeur) => {
  try { localStorage.setItem(cle, JSON.stringify(valeur)); } catch { /* navigation privée */ }
};

export const estInstallee = () =>
  typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches
    || window.matchMedia('(display-mode: fullscreen)').matches
    || window.navigator.standalone === true
  );

/* iPhone et iPad — `maxTouchPoints` rattrape les iPad récents, qui se
   présentent comme des Mac. Safari seul sait ajouter à l'écran d'accueil :
   les navigateurs intégrés aux applications n'exposent pas
   `navigator.standalone`, c'est le signal qui les distingue. */
export const estSafariIOS = () => {
  if (typeof navigator === 'undefined') return false;
  const ios = /iphone|ipod|ipad/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return ios && typeof navigator.standalone === 'boolean';
};

/* ── L'événement, capté une fois pour tout le site ─────────────────────────*/
let differe = null;
const abonnes = new Set();
const prevenir = () => abonnes.forEach((f) => f());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Retenu : sans cela Chrome pose sa propre bannière, hors de notre dessin
    // et à un moment que nous ne choisissons pas.
    e.preventDefault();
    differe = e;
    prevenir();
  });
  window.addEventListener('appinstalled', () => {
    differe = null;
    ecrire(CLE_REFUS, null);
    prevenir();
  });
}

/** `true` si l'installation est réellement possible sur cet appareil. */
export const useInstallable = () => {
  const [, forcer] = useState(0);
  useEffect(() => {
    const f = () => forcer((n) => n + 1);
    abonnes.add(f);
    return () => { abonnes.delete(f); };
  }, []);
  if (estInstallee()) return false;
  return Boolean(differe) || estSafariIOS();
};

/**
 * Lance l'installation.
 * @returns {Promise<'installee'|'refusee'|'expliquer'>} — `expliquer` sur
 *   iPhone, où il n'y a rien à lancer : il faut montrer la marche à suivre.
 */
export const lancerInstallation = async () => {
  if (!differe) return 'expliquer';
  const evt = differe;
  differe = null;
  prevenir();
  evt.prompt();
  const { outcome } = await evt.userChoice;
  return outcome === 'accepted' ? 'installee' : 'refusee';
};

export const refuser = () => ecrire(CLE_REFUS, Date.now());

export const silenceEnCours = () => {
  const quand = lireJSON(CLE_REFUS);
  if (!quand) return false;
  return Date.now() - quand < JOURS_DE_SILENCE * 24 * 60 * 60 * 1000;
};

/** Compte les pages vues, toutes visites confondues. */
export const compterPage = () => {
  const n = (lireJSON(CLE_PAGES) ?? 0) + 1;
  ecrire(CLE_PAGES, n);
  return n;
};

export const assezParcouru = () => (lireJSON(CLE_PAGES) ?? 0) >= PAGES_AVANT_INVITATION;
