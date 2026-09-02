/**
 * Réduit une photo AVANT de l'envoyer au serveur.
 * ===========================================================================
 * Le problème que ça règle : les photos de l'atelier sortent du boîtier en
 * 4016 × 6016 pour 22 à 35 Mo. Envoyées telles quelles depuis Dakar, elles
 * traversent l'Atlantique jusqu'au serveur en Oregon, qui les repousse vers le
 * bucket en Europe de l'Ouest. Sur une connexion mobile, l'envoi dépasse le
 * délai de la requête et échoue — sans que le propriétaire comprenne pourquoi.
 *
 * Le serveur sait déjà fabriquer ses variantes web (400, 800, 1600 px) et ne
 * sert JAMAIS l'original. Transporter 35 Mo pour en tirer 750 Ko est du pur
 * gâchis : autant réduire ici, où l'image est déjà en mémoire.
 *
 * ── Pourquoi createImageBitmap et pas une balise img ─────────────────────────
 * `createImageBitmap(blob, { resizeWidth })` demande au décodeur du navigateur
 * de ne restituer que la taille voulue — l'équivalent exact de `Image.draft()`
 * côté Python. Un `<img>` suivi d'un canvas décoderait d'abord les 24 mégapixels
 * en mémoire, ce qui fait planter l'onglet sur un téléphone d'entrée de gamme.
 *
 * Un repli en `<img>` + canvas existe malgré tout : Safari n'a accepté les
 * options de `createImageBitmap` que tardivement, et un échec de réduction ne
 * doit jamais empêcher d'envoyer une photo.
 */

/** Grand côté conservé. 2400 px : le serveur n'en tire jamais plus de 1600. */
const MAX_COTE = 2400;

/** 0.85 — au-delà, le fichier grossit sans que l'œil y gagne. */
const QUALITE = 0.85;

/** En dessous, l'image est déjà légère : la recompresser ne ferait que l'abîmer. */
const SEUIL_OCTETS = 600 * 1024;

const estUneImage = (fichier) =>
  fichier && fichier.type && fichier.type.startsWith('image/');

/* Un PNG à fond transparent deviendrait noir en JPEG. On ne touche donc qu'aux
   formats sans transparence — les photos, précisément celles qui pèsent. */
const RECOMPRESSABLE = ['image/jpeg', 'image/jpg', 'image/webp'];

const dessiner = (source, largeur, hauteur) => {
  const toile = document.createElement('canvas');
  toile.width = largeur;
  toile.height = hauteur;
  toile.getContext('2d').drawImage(source, 0, 0, largeur, hauteur);
  return toile;
};

const enFichier = (toile, nom) =>
  new Promise((resoudre) => {
    toile.toBlob(
      (blob) => {
        if (!blob) { resoudre(null); return; }
        resoudre(new File([blob], nom, { type: 'image/jpeg', lastModified: Date.now() }));
      },
      'image/jpeg',
      QUALITE,
    );
  });

/* Repli : décodage complet puis canvas. Coûteux en mémoire, mais il ne sert
   que sur les navigateurs qui refusent les options de createImageBitmap. */
const parBalise = (fichier, echelle) =>
  new Promise((resoudre) => {
    const url = URL.createObjectURL(fichier);
    const img = new Image();
    img.onload = async () => {
      URL.revokeObjectURL(url);
      const l = Math.round(img.width * echelle(img.width, img.height));
      const h = Math.round(img.height * echelle(img.width, img.height));
      resoudre(await enFichier(dessiner(img, l, h), fichier.name));
    };
    img.onerror = () => { URL.revokeObjectURL(url); resoudre(null); };
    img.src = url;
  });

/**
 * @param {File} fichier
 * @returns {Promise<File>} la version réduite, ou le fichier d'origine si la
 *   réduction n'a pas lieu d'être ou n'a pas pu se faire.
 */
export async function reduirePourEnvoi(fichier) {
  if (!estUneImage(fichier)) return fichier;
  if (fichier.size <= SEUIL_OCTETS) return fichier;
  if (!RECOMPRESSABLE.includes(fichier.type.toLowerCase())) return fichier;

  const echelle = (l, h) => Math.min(1, MAX_COTE / Math.max(l, h));

  try {
    // Une première lecture de l'en-tête pour connaître les dimensions sans
    // décoder : createImageBitmap sans options est peu coûteux, on le ferme
    // aussitôt.
    const sonde = await createImageBitmap(fichier);
    const { width, height } = sonde;
    sonde.close?.();

    const e = echelle(width, height);
    if (e >= 1) return fichier;   // déjà plus petite que la cible

    const bitmap = await createImageBitmap(fichier, {
      resizeWidth: Math.round(width * e),
      resizeHeight: Math.round(height * e),
      resizeQuality: 'high',
    });
    const reduit = await enFichier(
      dessiner(bitmap, bitmap.width, bitmap.height),
      fichier.name,
    );
    bitmap.close?.();

    // Une réduction qui alourdit le fichier n'en est pas une : on garde
    // l'original. Cela arrive sur des images déjà très compressées.
    return reduit && reduit.size < fichier.size ? reduit : fichier;
  } catch {
    try {
      const reduit = await parBalise(fichier, echelle);
      return reduit && reduit.size < fichier.size ? reduit : fichier;
    } catch {
      // La réduction est un confort, jamais une condition : en cas d'échec on
      // envoie l'original, comme avant.
      return fichier;
    }
  }
}
