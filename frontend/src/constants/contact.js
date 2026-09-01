/**
 * Les coordonnées de la maison, en un seul endroit.
 * ---------------------------------------------------------------------------
 * Le numéro WhatsApp était écrit en dur dans deux fichiers (Layout, ProduitPage)
 * et la page /contact en portait une troisième copie. Un numéro qui change et
 * qu'on oublie de changer partout renvoie les clients dans le vide : il n'a
 * donc qu'une seule déclaration, ici.
 *
 * Format international sans espaces ni signe plus : c'est ce qu'attend wa.me.
 */
export const WHATSAPP_NUMBER = '221781263535';

export const LIEN_WHATSAPP = `https://wa.me/${WHATSAPP_NUMBER}`;

const EMAIL = 'contact@goldenpousso.sn';

/**
 * Les coordonnées telles qu'elles s'affichent, lues par le hero ET par le
 * bandeau défilant qui le suit. Une seule liste pour les deux : affichées à
 * quelques centimètres l'une de l'autre, deux copies divergentes seraient
 * visibles d'un coup d'œil.
 *
 * ⚠ Le lien tel: est au format international, préfixe +221 (Sénégal), sans
 * espaces : c'est la seule forme qu'un téléphone compose de façon fiable
 * depuis l'étranger. Le texte affiché garde la présentation locale.
 */
export const COORDONNEES = [
  { libelle: 'Adresse',   texte: 'Pikine Tally Boumack' },
  { libelle: 'Téléphone', texte: '33 834 10 17', lien: 'tel:+221338341017' },
  { libelle: 'Email',     texte: EMAIL,          lien: `mailto:${EMAIL}` },
];
