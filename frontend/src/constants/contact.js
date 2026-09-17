/**
 * Les coordonnées de la maison — le repli, et la mise en forme.
 * ---------------------------------------------------------------------------
 * Adresse, téléphone, e-mail ET numéro WhatsApp se saisissent maintenant dans
 * l'Espace Gestion (`/gestion/coordonnees`) et sont servis par
 * `GET /coordonnees/`. Ce fichier ne porte plus de valeur vivante : il porte
 * le REPLI et les deux fonctions qui mettent ces valeurs en forme.
 *
 * ── Un seul numéro, pour le téléphone et pour WhatsApp ─────────────────────
 * C'est déjà le cas dans la maison — le 77 751 47 95 a remplacé le
 * 33 834 10 17 (téléphone) et le 78 126 35 35 (WhatsApp). Le lien wa.me est
 * donc FABRIQUÉ à partir du téléphone saisi (`whatsapp`, calculé par le
 * serveur : international, sans « + » ni espaces — la seule forme qu'accepte
 * wa.me). Un second champ à saisir, c'est un second numéro à oublier de
 * changer, et une boutique qui publie deux numéros en a toujours un de faux.
 *
 * Côté serveur, les e-mails de commande lisent encore `settings.CONTACT_PHONE`.
 */

/**
 * Le REPLI : ce qui s'affiche tant que la réponse n'est pas arrivée, et si
 * elle n'arrive jamais. La bande coiffe toutes les pages et l'icône WhatsApp
 * est dans la barre de navigation ; un trou à leur place se verrait avant
 * tout le reste.
 *
 * Même forme que la réponse de l'API, à la clé près : un seul objet à lire,
 * qu'il vienne du réseau ou d'ici.
 */
export const COORDONNEES_DEFAUT = {
  adresse: 'Pikine Tally Boumack',
  telephone: '77 751 47 95',
  telephone_lien: '+221777514795',
  whatsapp: '221777514795',
  email: 'contact@golden-pousso.com',
};

/**
 * Les coordonnées telles qu'elles s'affichent : un libellé, une valeur, et le
 * lien qui la rend actionnable quand il y en a un.
 *
 * ⚠ Le lien tel: est au format international, préfixe +221 (Sénégal), sans
 * espaces : c'est la seule forme qu'un téléphone compose de façon fiable
 * depuis l'étranger. Il est fabriqué par le serveur à partir du numéro saisi
 * (`Coordonnees.telephone_lien`), le texte affiché gardant la présentation
 * locale. Une entrée sans valeur est retirée : mieux vaut deux coordonnées
 * qu'un libellé suivi de rien.
 */
export const entreesCoordonnees = (c = COORDONNEES_DEFAUT) => [
  { libelle: 'Adresse',   texte: c.adresse },
  { libelle: 'Téléphone', texte: c.telephone, lien: c.telephone_lien ? `tel:${c.telephone_lien}` : undefined },
  { libelle: 'Email',     texte: c.email,     lien: c.email ? `mailto:${c.email}` : undefined },
].filter((e) => e.texte);

/**
 * Le lien wa.me, fabriqué à partir du numéro de la boutique.
 *
 * `texte` est le message pré-rempli de la conversation (celui de l'icône de la
 * barre de navigation). Sans lui, le lien ouvre une conversation vide.
 *
 * ⚠ Passer par `useLienWhatsApp` (store/coordonneesStore.js) dans un
 * composant : c'est lui qui déclenche la lecture des coordonnées. Cette
 * fonction-ci ne sait rien du réseau.
 */
export const lienWhatsApp = (coordonnees = COORDONNEES_DEFAUT, texte) => {
  const numero = coordonnees?.whatsapp || COORDONNEES_DEFAUT.whatsapp;
  const base = `https://wa.me/${numero}`;
  return texte ? `${base}?text=${encodeURIComponent(texte)}` : base;
};
