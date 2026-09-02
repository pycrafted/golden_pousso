/**
 * Contenu de secours, servi par le front quand l'API ne renvoie rien.
 * ===========================================================================
 * ⚠ TEMPORAIRE — À SUPPRIMER APRÈS LA PRÉSENTATION AU CLIENT.
 *
 * ── Pourquoi ce fichier existe ──────────────────────────────────────────────
 * La base de production est vide : aucune campagne, aucun avis. Deux sections
 * de la page d'accueil disparaissent donc entièrement du site en ligne — la
 * bande de promotion et « Elles nous font confiance » — alors qu'elles
 * s'affichent en développement, où la base est peuplée. Impossible de montrer
 * la page au client dans cet état.
 *
 * ── Comment ça marche ───────────────────────────────────────────────────────
 * C'est un REPLI, pas un remplacement. Les composants interrogent l'API comme
 * avant ; ils ne retombent ici que si elle ne répond rien. Le jour où le
 * propriétaire saisit une vraie campagne ou reçoit un vrai avis, son contenu
 * reprend la main tout seul, sans qu'on touche au code.
 *
 * ── Comment le retirer ──────────────────────────────────────────────────────
 * Passer `DEMONSTRATION` à `false` ci-dessous suffit à tout éteindre : les deux
 * sections redeviennent invisibles tant que la base est vide. Pour un retrait
 * définitif, supprimer ce fichier et les trois lignes qui l'importent
 * (`Hero.jsx`, `BandePromo.jsx`, `TestimonialsSection.jsx`).
 *
 * ⚠ LES AVIS CI-DESSOUS SONT INVENTÉS. Ils viennent des données de
 * démonstration et ne correspondent à aucune cliente réelle. Ils doivent
 * disparaître avant que la boutique ne prenne sa première commande : des
 * témoignages fabriqués affichés à de vrais acheteurs, c'est une tromperie, et
 * c'est illégal dans la plupart des juridictions.
 */

/** L'interrupteur unique. `false` éteint tout le contenu de démonstration. */
export const DEMONSTRATION = true;

/**
 * La campagne de repli.
 *
 * Même forme que `/hero-promotion/` — `titre`, `offre`, `accroche`, `lien`,
 * `libelle_lien`, `fin` — pour que le hero et la bande la consomment sans
 * distinguer sa provenance.
 *
 * ⚠ `fin` est une date réelle, relue à chaque heure : passée l'échéance, le
 * hero revient à son message d'accueil et la bande disparaît, exactement comme
 * avec une vraie campagne. La Tabaski suit le calendrier lunaire — cette date
 * se vérifie, elle ne se calcule pas.
 */
export const CAMPAGNE_DEMO = {
  titre: 'Promotion',
  offre: 'Bientôt la Tabaski',
  accroche: '−15 % sur les boubous',
  lien: '/categorie/boubous',
  libelle_lien: 'Voir la sélection',
  fin: '2026-09-14',
};

/**
 * Les avis de repli.
 *
 * Même forme que `/reviews/recents/` : `rating`, `comment`, `customer_name`,
 * `product_name`. Les commentaires sont volontairement inégaux — deux notes à
 * quatre étoiles, une livraison qui traîne, une retouche nécessaire. Six avis
 * parfaits d'affilée ne convainquent personne : c'est le premier signe qu'un
 * lecteur reconnaît comme faux.
 */
export const AVIS_DEMO = [
  {
    id: 'demo-1',
    rating: 5,
    comment: "Commandé le lundi, livré le mercredi à Sacré-Cœur. La coupe tombe exactement comme sur la photo et le tissu ne gratte pas du tout. Je l'ai portée toute la journée sans y penser.",
    customer_name: 'Aminata Fall',
    product_name: 'Boubou 20',
  },
  {
    id: 'demo-2',
    rating: 5,
    comment: "Le boubou a fait son effet à la Tabaski. Trois personnes m'ont demandé où je l'avais trouvé. Les finitions sont propres jusqu'à l'intérieur des coutures.",
    customer_name: 'Bineta Sarr',
    product_name: 'Boubou 19',
  },
  {
    id: 'demo-3',
    rating: 4,
    comment: "Très belle pièce, la broderie est fine. Il m'a fallu une retouche à la taille — faite à l'atelier en deux jours, sans discussion. Juste un peu d'attente sur ma commande.",
    customer_name: 'Khady Ba',
    product_name: 'Boubou 18',
  },
  {
    id: 'demo-4',
    rating: 5,
    comment: "J'hésitais sur la taille, j'ai écrit sur WhatsApp et on m'a répondu dans l'heure avec les mesures exactes. Commandé ensuite les yeux fermés, c'était juste.",
    customer_name: 'Fatou Ndiaye',
    product_name: 'Boubou 17',
  },
  {
    id: 'demo-5',
    rating: 5,
    comment: "La couleur est encore plus belle en vrai qu'à l'écran. Emballage soigné, et le livreur a appelé avant de passer comme annoncé.",
    customer_name: 'Awa Diop',
    product_name: 'Boubou 16',
  },
  {
    id: 'demo-6',
    rating: 4,
    comment: "Deuxième commande. Qualité constante, c'est ce que je cherchais. Le paiement par Wave a fonctionné du premier coup.",
    customer_name: 'Mariama Cissé',
    product_name: 'Boubou 15',
  },
];
