import { useState, useCallback, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import useFavorisStore from '../store/favorisStore';

/* Modifier et supprimer, chargés au premier clic — que seul un compte
   `is_staff` peut faire : les visiteurs ne téléchargent pas le code
   d'administration. */
const EditionPiece = lazy(() => import('../pages/gestion/EditionPiece'));
const SuppressionPiece = lazy(() => import('../pages/gestion/SuppressionPiece'));

/**
 * Les pastilles d'une pièce — empilées en haut à droite de sa photo.
 * ---------------------------------------------------------------------------
 * Une seule copie pour la carte produit (ProductCard) ET la fiche produit
 * (ProduitPage), à la demande : « exactement au même endroit », au même
 * dessin. Le coin haut-gauche reste au badge « −X % ».
 *
 *   cœur      mise de côté (store/favorisStore) ;
 *   panier    ajout — la logique vient de l'appelant : la carte renvoie
 *             choisir une taille sur la fiche, la fiche ajoute la taille et
 *             la quantité choisies ;
 *   stylo     modifier la pièce (pages/gestion/EditionPiece.jsx)  — admin ;
 *   poubelle  la supprimer (pages/gestion/SuppressionPiece.jsx)   — admin.
 *
 * Toutes visibles en permanence : révélées au survol, il faudrait promener la
 * souris pour découvrir qu'une action existe, et au doigt elles
 * n'existeraient pas. Sur une pièce épuisée, cœur et panier disparaissent ;
 * stylo et poubelle restent — remettre du stock est justement ce qu'on veut y
 * faire. Le parent doit être positionné (`position: relative`).
 *
 * Panneau et confirmation sont rendus dans <body> : la carte se soulève au
 * survol par `transform`, et les pages de l'accueil sont réduites par `zoom` —
 * l'un comme l'autre enfermerait un calque « fixed ».
 *
 * @param {object} product        la pièce, telle que l'API publique la sert
 * @param {bool}   epuise         masque cœur et panier
 * @param {func}   onAjouterPanier
 * @param {func}   onModifie      après une modification (à la fermeture)
 * @param {func}   onSupprime     après la suppression
 */
const PastillesPiece = ({ product, epuise = false, onAjouterPanier, onModifie, onSupprime }) => {
  const estAdmin = useAuthStore((s) => s.isAuthenticated && Boolean(s.user?.is_staff));
  // Un booléen et non l'objet du magasin : un sélecteur qui renvoie un nouvel
  // objet à chaque rendu ferait boucler zustand.
  const aime = useFavorisStore((s) => s.items.some((f) => f.id === product.id));
  const basculerFavori = useFavorisStore((s) => s.basculer);
  const [edition, setEdition] = useState(false);
  const fermerEdition = useCallback(() => setEdition(false), []);
  const [suppression, setSuppression] = useState(false);

  if (epuise && !estAdmin) return null;

  return (
    <>
      <div className="pc-pastilles">
        {!epuise && (
          <>
            <button
              type="button"
              onClick={() => {
                basculerFavori(product);
                toast(aime
                  ? `${product.name} retiré des favoris`
                  : `${product.name} ajouté à vos favoris`);
              }}
              aria-pressed={aime}
              aria-label={aime
                ? `Retirer ${product.name} des favoris`
                : `Ajouter ${product.name} aux favoris`}
              className={`pc-pastille pc-coeur ${aime ? 'is-aime' : ''}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24"
                   fill={aime ? 'currentColor' : 'none'}
                   stroke="currentColor" strokeWidth="1.8"
                   strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8z" />
              </svg>
            </button>

            <button
              type="button"
              onClick={onAjouterPanier}
              aria-label={`Ajouter ${product.name} au panier`}
              className="pc-pastille pc-action"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="1.8"
                   strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <path d="M3 6h18" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </button>
          </>
        )}

        {estAdmin && (
          <>
            <button
              type="button"
              onClick={() => setEdition(true)}
              aria-label={`Modifier ${product.name}`}
              title="Modifier la pièce"
              className="pc-pastille pc-stylo"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="1.8"
                   strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => setSuppression(true)}
              aria-label={`Supprimer ${product.name}`}
              title="Supprimer la pièce"
              className="pc-pastille pc-poubelle"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="1.8"
                   strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 6h18" />
                <path d="M8 6V4h8v2" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6M14 11v6" />
              </svg>
            </button>
          </>
        )}
      </div>

      {estAdmin && edition && createPortal(
        <Suspense fallback={null}>
          <EditionPiece productId={product.id} onClose={fermerEdition} onModifie={onModifie} />
        </Suspense>,
        document.body,
      )}
      {estAdmin && suppression && createPortal(
        <Suspense fallback={null}>
          <SuppressionPiece product={product} onClose={() => setSuppression(false)} onSupprime={onSupprime} />
        </Suspense>,
        document.body,
      )}

      <style>{`
        /* Au-dessus du voile « Épuisé » de la carte et de la loupe de la
           fiche : le stylo d'un admin y reste cliquable. */
        .pc-pastilles {
          position: absolute;
          top: var(--s-3);
          right: var(--s-3);
          z-index: 3;
          display: flex;
          flex-direction: column;
          gap: var(--s-2);
        }

        /* Fond écru translucide et flou : une pastille opaque ferait un trou
           blanc dans la photo, une pastille transparente disparaîtrait sur une
           dentelle claire. */
        .pc-pastille {
          display: grid;
          place-items: center;
          width: 3.6rem;
          height: 3.6rem;
          border-radius: var(--r-pill);
          background: rgba(250, 246, 238, 0.92);
          backdrop-filter: blur(8px);
          color: var(--gp-indigo-900);
          cursor: pointer;
          transition: background var(--dur-1) var(--ease),
                      color var(--dur-1) var(--ease),
                      opacity var(--dur-1) var(--ease),
                      transform var(--dur-1) var(--ease);
        }
        .pc-pastille:hover  { background: var(--gp-brass-400); }
        /* La poubelle vire au rouge au survol : écru sur --gp-danger, 6,06:1. */
        .pc-poubelle:hover  { background: var(--gp-danger); color: var(--gp-ecru-50); }
        .pc-pastille:active { transform: scale(0.9); }

        .pc-coeur.is-aime { color: var(--gp-terra-700); }

        /* ── Au doigt : 44 px, le minimum tactile ───────────────────────────
           36 px, c'est 8 de moins que le seuil d'Apple et 12 de moins que
           celui de Google, pour une pulpe de pouce qui en couvre 45 a 55. Et
           ces pastilles sont posees SUR une photo elle-meme cliquable : rater
           le coeur d'un demi-centimetre ne fait pas rien, cela CHANGE DE PAGE.
           C'est la pire sorte d'erreur de cible — silencieuse.

           L'icone garde ses 16 px : c'est la zone sensible qui grandit, le
           dessin ne bouge presque pas. */
        @media (pointer: coarse) {
          .pc-pastille { width: 4.4rem; height: 4.4rem; }
        }

        /* ── Deux colonnes de grille : la pile ne peut plus etre une pile ───
           Le catalogue tient deux colonnes jusqu'aux plus petits ecrans, ou
           une carte fait ~159 x 213 px. Un administrateur voit QUATRE
           pastilles : a 44 px avec leurs gouttieres, elles feraient 200 px de
           haut — 94 % de la carte. La photo de la piece disparaitrait sous
           ses propres outils d'administration.

           Elles passent donc en carre de deux sur deux : 96 px de haut, et la
           silhouette reste lisible. Un visiteur, qui n'en voit que deux
           (coeur et panier), garde sa colonne. */
        @media (max-width: 560px) {
          .pc-pastilles {
            top: var(--s-2);
            right: var(--s-2);
            flex-flow: row wrap;
            justify-content: flex-end;
            gap: var(--s-1);
            max-width: calc(2 * 4.4rem + var(--s-1));
          }
        }
      `}</style>
    </>
  );
};

export default PastillesPiece;
