import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import ProductCardMedia from './ProductCardMedia';
import CldImg from './CldImg';
import PastillesPiece from './PastillesPiece';
import useCartStore from '../store/cartStore';
import useSettingsStore, { formatPrice } from '../store/settingsStore';

/**
 * Carte produit — LA carte produit.
 * ---------------------------------------------------------------------------
 * Le site en comptait cinq versions ; celle-ci les remplace toutes. Elle sert
 * l'accueil, la boutique, les catégories et les pièces similaires : la même pièce doit se présenter pareil partout.
 *
 * Nom et prix vivent dans un panneau vitré au pied de la photo — le
 * traitement de la section « Nos créations » de l'accueil, rapporté ici pour
 * que la même pièce se présente pareil d'une page à l'autre. Le flou
 * d'arrière-plan fait le travail qu'un dégradé noir faisait mal : il garde le
 * texte lisible sans éteindre la photo.
 *
 * ── Les deux pastilles ──────────────────────────────────────────────────────
 * Reprises de la carte du dépôt redesign, dans la palette de la maison :
 *
 * Empilées en haut à droite, TOUTES DEUX visibles en permanence — le coin
 * haut-gauche reste au badge « −X % ».
 *
 *   cœur     mise de côté ;
 *   panier   ajout direct.
 *
 * La source les révélait au survol. Sur une grille de vingt-quatre pièces,
 * cela oblige à promener la souris pour découvrir qu'une action existe — et
 * au doigt, le survol n'existant pas, elle reste introuvable.
 *
 * Pour un compte `is_staff`, un TROISIÈME bouton, le stylo, à la demande :
 * même pastille, sous le panier. Il ouvre le formulaire produit en
 * modification (pages/gestion/EditionPiece.jsx), puis `onModifie` fait relire
 * la grille à la page. Il reste posé sur une pièce épuisée, seule des trois :
 * la mettre à jour est justement ce qu'on veut y faire. Sous le stylo, la
 * POUBELLE, à la demande (pages/gestion/SuppressionPiece.jsx) : confirmation,
 * suppression définitive, puis `onModifie` fait relire la grille.
 *
 * Le bouton « plein écran » de la source a été retiré : la photo en grand
 * n'apportait rien que la fiche produit ne montre déjà mieux.
 *
 * Le cœur écrit dans `store/favorisStore` et se retrouve sur /favoris. Il ne
 * dure que dans CE navigateur : les favoris ne sont pas rattachés au compte
 * client, le modèle `Customer` n'ayant pas de champ pour ça.
 *
 * ── Pourquoi la carte n'est plus un `<Link>` ────────────────────────────────
 * Elle l'était, ce qui rendait tout cliquable d'un bloc — impossible d'y poser
 * des boutons : un bouton dans un lien est un imbriquement interdit, que
 * chaque navigateur résout à sa façon. Le lien couvre donc la photo
 * (`.pc-surface`), les pastilles passent au-dessus, et le titre reste un lien
 * à part. Deux liens par carte, tous deux nommés par la pièce.
 *
 * @param {object}  product        Produit sérialisé par l'API
 * @param {number}  index          Position dans la grille — pilote le délai
 *                                 d'apparition et le chargement anticipé
 * @param {boolean} animate        Apparition en fondu montant
 * @param {string}  sizes          Attribut `sizes` transmis au média
 * @param {func}    onModifie      Appelé après une modification par le stylo
 */
const ProductCard = ({
  product,
  index = 0,
  animate = true,
  /* Suit les colonnes de `.catalogue-grille` : une pièce par ligne au
     téléphone (sous 560 px, à la demande), deux jusqu'à 900, puis trois et
     quatre. Une valeur qui annoncerait 50vw en une colonne ferait choisir au
     navigateur une photo deux fois trop petite, donc molle. */
  sizes = '(max-width: 560px) 92vw, (max-width: 900px) 50vw, (max-width: 1280px) 33vw, 25vw',
  onModifie,
}) => {
  const [hovered, setHovered] = useState(false);
  const currency = useSettingsStore((s) => s.currency);
  const addItem = useCartStore((s) => s.addItem);

  const outOfStock = product.stock === 0;
  const href = `/produit/${product.slug}`;

  const discountPercent =
    product.old_price && product.old_price > product.price
      ? Math.round(((product.old_price - product.price) / product.old_price) * 100)
      : null;

  // Une pièce à variantes exige une taille. On ne peut pas la deviner depuis
  // une grille : on renvoie choisir sur la fiche plutôt que d'ajouter au
  // panier une ligne que le tunnel refusera plus loin.
  const aDesVariantes = (product.variants?.length ?? 0) > 0;

  const ajouterAuPanier = () => {
    if (aDesVariantes) {
      toast('Choisissez une taille sur la fiche produit');
      return;
    }
    addItem(product, null, 1);
    toast.success(`${product.name} ajouté au panier`);
  };

  return (
    <article
      className="pc"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        opacity: outOfStock ? 0.55 : 1,
        transform: hovered && !outOfStock ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'transform var(--dur-2) var(--ease)',
        // Le délai en cascade s'arrête à la quatrième carte : au-delà, la
        // dernière d'une grille de 24 attendrait près de deux secondes.
        animation: animate ? 'fadeUp var(--dur-3) var(--ease) backwards' : undefined,
        animationDelay: animate ? `${(index % 4) * 0.07}s` : undefined,
      }}
    >
      <div className="media media--portrait">
        <ProductCardMedia
          product={product}
          hovered={hovered}
          eager={index < 4}
          sizes={sizes}
          widths={[300, 600]}
        />

        {/* Toute la photo mène à la fiche ; les pastilles passent au-dessus.
            Épuisé : la carte reste cliquable, la fiche accueille le formulaire
            d'alerte de réassort. */}
        <Link to={href} className="pc-surface" aria-label={product.name} />

        {/* La remise — seul badge restant : « Nouveauté » a été retiré du
            site à la demande, avec le champ qui le portait. */}
        {discountPercent && !outOfStock && (
          <div className="pc-badges">
            <span className="badge badge--promo">−{discountPercent}%</span>
          </div>
        )}

        {/* Cœur, panier, et pour un admin stylo et poubelle : un seul
            composant, partagé avec la fiche produit. */}
        <PastillesPiece
          product={product}
          epuise={outOfStock}
          onAjouterPanier={ajouterAuPanier}
          onModifie={onModifie}
          onSupprime={onModifie}
        />

        {/* Nom et prix dans un panneau vitré posé au pied de la photo — le
            traitement de la section « Nos créations » de l'accueil. La
            vignette montre la SECONDE photo de la pièce : y remettre la
            principale, déjà en grand derrière, ne dirait rien. */}
        <div className="pc-panneau">
          {(product.secondary_image || product.primary_image) && (
            <span className="pc-vignette">
              {/* ⚠ `CldImg` et NON un `<img>` brut, comme partout ailleurs sur
                  le site. C'était le seul `<img>` direct du catalogue : il
                  servait l'URL Cloudinary d'ORIGINE — une photo de catalogue
                  d'un à trois mégaoctets — pour peindre une vignette de
                  36 x 44 px. À 24 cartes par page, la boutique réclamait donc
                  24 originaux pour des images de la taille d'un ongle, et le
                  `loading="lazy"` ne faisait qu'étaler la facture sans la
                  réduire. Sur une connexion dakaroise, c'est la différence
                  entre une boutique qui s'affiche et une boutique qu'on
                  quitte. `CldImg` réécrit l'URL en `w_80` / `w_160`. */}
              <CldImg
                src={product.secondary_image || product.primary_image}
                alt=""
                sizes="44px"
                widths={[80, 160]}
              />
            </span>
          )}
          <span className="pc-texte">
            <span className="pc-nom">{product.name}</span>
            {/* Un badge « −17 % » qui n'est adossé à aucun prix barré est une
                affirmation sans preuve : le visiteur voit la remise annoncée
                mais jamais ce qu'il économise. Les deux vont ensemble. */}
            <span className="pc-prix">
              {formatPrice(product.price, currency)}
              {discountPercent && (
                <span className="pc-prix-avant">
                  <span className="visually-hidden">Ancien prix : </span>
                  {formatPrice(product.old_price, currency)}
                </span>
              )}
            </span>
          </span>
          <span className="pc-fleche" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
                 strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h13.5" /><path d="m13 6.5 5.5 5.5-5.5 5.5" />
            </svg>
          </span>
        </div>

        {outOfStock && (
          <div className="pc-epuise">
            <span className="badge badge--out" style={{ padding: 'var(--s-2) var(--s-5)', fontSize: 'var(--t-xs)' }}>
              Épuisé
            </span>
          </div>
        )}
      </div>


      <style>{`
        .pc-surface { position: absolute; inset: 0; z-index: 1; }

        .pc-badges {
          position: absolute;
          top: var(--s-3);
          left: var(--s-3);
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: var(--s-1);
        }

        .pc-epuise {
          position: absolute;
          inset: 0;
          z-index: 2;
          display: grid;
          place-items: center;
          background: rgba(15, 19, 32, 0.55);
        }

        /* Les pastilles — cœur, panier, stylo, poubelle — et leur dessin
           vivent dans PastillesPiece.jsx, partagé avec la fiche produit. */

        /* ── Panneau nom + prix, repris de « Nos créations » ────────────────
           Valeurs en pixels : elles viennent d'une section calée sur une
           racine à 16 px, alors que ce site est à 62,5 %.
           Le flou d'arrière-plan n'est pas décoratif — un aplat fixe devient
           illisible dès qu'une photo est claire en bas, ce qui arrive tout le
           temps sur des tissus écrus. */
        .pc-panneau {
          position: absolute;
          left: 12px;
          right: 12px;
          bottom: 12px;
          z-index: 2;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px;
          border-radius: 16px;
          border: 1px solid rgba(250, 246, 238, 0.15);
          background: rgba(15, 19, 32, 0.45);
          backdrop-filter: blur(12px);
          color: var(--gp-ecru-50);
          /* Présentationnel : c'est le lien sous la photo qui reçoit le clic,
             sinon on empilerait un lien sur un lien. */
          pointer-events: none;
          transition: background var(--dur-2) var(--ease), border-color var(--dur-2) var(--ease);
        }
        .pc:hover .pc-panneau {
          border-color: rgba(250, 246, 238, 0.4);
          background: rgba(15, 19, 32, 0.65);
        }

        .pc-vignette {
          position: relative;
          width: 36px;
          height: 44px;
          flex-shrink: 0;
          overflow: hidden;
          border-radius: 8px;
          background: var(--surface-sunk);
        }
        .pc-vignette img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .pc-texte { min-width: 0; flex: 1; }
        .pc-nom {
          display: block;
          font-family: var(--font-body);
          font-size: 12.5px;
          font-weight: 600;
          line-height: 1.375;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .pc-prix {
          display: flex;
          align-items: baseline;
          flex-wrap: wrap;
          gap: 8px;
          font-family: var(--font-body);
          font-size: 12.5px;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
          color: var(--gp-brass-400);
        }

        /* L'ancien prix : barré, plus petit, en retrait. L'écru à 72 % le fait
           lire comme une information secondaire sans le rendre illisible —
           8,77:1 sur l'indigo du panneau, largement au-dessus du seuil.

           La barre est purement visuelle : aucun lecteur d'écran courant
           n'annonce un line-through. C'est pourquoi le libellé « Ancien prix »
           est écrit à côté en visually-hidden — sans lui, la synthèse vocale
           lit deux montants à la suite sans dire lequel on paye. */
        .pc-prix-avant {
          font-size: 11px;
          font-weight: 600;
          color: rgba(250, 246, 238, 0.72);
          text-decoration: line-through;
          text-decoration-thickness: 1px;
        }

        .pc-fleche {
          display: grid;
          place-items: center;
          flex-shrink: 0;
          opacity: 0;
          transform: translateX(-4px);
          transition: opacity var(--dur-2) var(--ease), transform var(--dur-2) var(--ease);
        }
        .pc-fleche svg { width: 16px; height: 16px; }
        .pc:hover .pc-fleche { opacity: 1; transform: translateX(0); }

        /* Au doigt il n'y a pas de survol : la flèche resterait invisible et
           le panneau à son opacité la plus basse. */
        @media (hover: none) {
          .pc-fleche { opacity: 1; transform: translateX(0); }
          .pc-panneau { background: rgba(15, 19, 32, 0.62); }
        }

        /* ── Le panneau à deux colonnes de grille ───────────────────────────
           La grille tient deux colonnes jusqu'aux plus petits écrans : une
           carte y fait ~159 px de large, et le panneau n'en a que 143 une
           fois son padding retiré. Sa rangée d'origine — vignette de 36 px,
           gouttière, texte, flèche de 16 px — n'y laissait que 71 px au nom
           et au prix : le nom, tronqué en ellipse, serait tombé à trois
           lettres.

           La vignette et la flèche s'effacent donc : la vignette montre la
           seconde photo de la pièce, un agrément, et la flèche ne fait que
           répéter que la carte est cliquable. Le nom passe sur deux lignes,
           le prix dessous. Ce qui reste est ce qu'on lit vraiment pour
           choisir. */
        @media (max-width: 560px) {
          .pc-panneau {
            left: 8px; right: 8px; bottom: 8px;
            gap: 4px;
            padding: 8px 10px;
            flex-direction: column;
            align-items: stretch;
          }
          .pc-vignette, .pc-fleche { display: none; }
          .pc-nom {
            white-space: normal;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            line-height: 1.3;
          }
        }
      `}</style>
    </article>
  );
};

export default ProductCard;
