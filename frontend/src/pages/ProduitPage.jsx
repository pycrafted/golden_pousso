import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import CldImg from '../components/CldImg';
import ProductCard from '../components/ProductCard';
import SEOHead from '../components/SEOHead';
import SizeGuideModal from '../components/SizeGuideModal';
import StockAlertForm from '../components/StockAlertForm';
import apiClient from '../api/client';
import useCartStore from '../store/cartStore';
import useFavorisStore from '../store/favorisStore';
import useSettingsStore, { formatPrice } from '../store/settingsStore';

/**
 * Fiche produit.
 * ---------------------------------------------------------------------------
 * La mise en page vient du transfert de `ProductDetail` de
 * `Redesign_mcommaman.com` : fil d'Ariane, grille 1,05 / 0,95, visuel en 4/5,
 * colonne d'achat à droite, « Dans le même esprit » en pied. Cette ossature
 * n'a pas bougé.
 *
 * Ce qui a changé, à la demande : la PALETTE et le CONTENU de la colonne de
 * droite. La page était restée dans le rose de la source (`--fp-rose`,
 * `--fp-stone`) sur fond blanc, avec une colonne qui ne disait rien de plus
 * qu'un titre, un prix et un bouton. Elle lit maintenant les tokens Or &
 * Indigo comme le reste du site : plus une seule couleur en dur ici.
 *
 * ── Ce que la colonne dit, et ce qu'elle ne dit plus ────────────────────────
 * L'ordre : rayon (en tête de page) · titre · avis · prix · description ·
 * couleur · taille · quantité, panier, cœur · stock.
 * La description est lue TÔT, entre le prix et les choix : on sait ce qu'on
 * achète avant de choisir une taille, pas après avoir déplié un accordéon.
 *
 * ⚠ La colonne ne porte AUCUNE information de service. Elle a porté un temps
 * une carte de trois promesses — prêt-à-porter ou sur-mesure, moyens de
 * paiement, retouches — retirée à la demande, après la suppression des pages
 * /faq et /livraison-retours qui portaient les mêmes faits.
 *
 * Conséquence à connaître avant de toucher à cette page : rien sur le site
 * n'annonce plus les FRAIS ni les DÉLAIS de livraison, les MOYENS DE PAIEMENT,
 * le SUR-MESURE ni les CONDITIONS DE RETOUR avant l'étape de validation de la
 * commande. Le seul écrit qui subsiste est celui des CGV, dans
 * `MentionsLegalesPage`. Si les paniers se mettent à être abandonnés au moment
 * de découvrir les frais, c'est la première chose à remettre : les montants
 * vivent dans `Order.DELIVERY_FEES` et les moyens de paiement dans
 * `Order.PAYMENT_CHOICES`, côté backend.
 *
 * ── Ce qui a été ajouté côté fonction ───────────────────────────────────────
 * • La QUANTITÉ. On ne pouvait ajouter qu'une pièce à la fois, alors que
 *   `cartStore.addItem` accepte une quantité depuis toujours. Pour un boubou
 *   de cérémonie commandé en plusieurs exemplaires, c'était le parcours du
 *   combattant.
 * • Le CŒUR. Il existait sur la carte produit et disparaissait sur la fiche —
 *   soit exactement là où l'on hésite.
 * • Le SUPPLÉMENT DE VARIANTE. La colonne affichait `product.price` pendant
 *   que le panier facturait `price + variant.price_adjustment` : la fiche
 *   annonçait un prix, le panier en réclamait un autre. Le prix suit
 *   maintenant la variante choisie, et le supplément est dit à voix haute.
 * • Le STOCK RÉEL de la variante. `variants.find()` renvoyait la première
 *   variante même sans aucune sélection : la fiche pouvait annoncer « épuisé »
 *   sur la foi d'une taille que le client n'avait pas demandée.
 *
 * ── Ce qui n'a pas été ajouté, volontairement ───────────────────────────────
 * • Pas de bouton WhatsApp : il avait été retiré à la demande, et le Layout
 *   pose déjà une bulle WhatsApp flottante sur toutes les pages.
 * • Pas de référence article : le modèle `Product` n'a pas de SKU.
 * • Pas de note en dur. La ligne d'avis ne s'affiche que s'il existe vraiment
 *   des avis approuvés (`rating_avg`, `review_count`).
 * • Les couleurs restent des boutons de texte : elles sont saisies en texte
 *   libre en admin, sans code hexadécimal. Le jour où `ProductVariant` gagne
 *   un champ couleur, la pastille ronde devient possible.
 */

const ProduitPage = () => {
  const { slug } = useParams();
  const addItem = useCartStore((s) => s.addItem);
  const currency = useSettingsStore((s) => s.currency);

  const [product, setProduct] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantite, setQuantite] = useState(1);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  /* ── Loupe ──────────────────────────────────────────────────────────────
     `zoom` : la loupe est active. `origine` : le point de la photo, en %, que
     le pointeur désigne — c'est le `transform-origin` de l'agrandissement,
     donc le détail reste sous le curseur au lieu de fuir vers un coin.
     `hdDemandee` ne redescend jamais à false : la variante haute définition
     est montée au premier survol et le reste, sinon chaque entrée dans la
     photo relancerait un téléchargement et ferait clignoter le détail. */
  const [zoom, setZoom] = useState(false);
  const [origine, setOrigine] = useState({ x: 50, y: 50 });
  const [hdDemandee, setHdDemandee] = useState(false);

  // Un booléen et non l'objet du magasin : un sélecteur qui renvoie un nouvel
  // objet à chaque rendu ferait boucler zustand.
  const aime = useFavorisStore((s) => s.items.some((f) => f.id === product?.id));
  const basculerFavori = useFavorisStore((s) => s.basculer);

  useEffect(() => {
    setLoading(true);
    setError(false);
    setSelectedImage(0);
    setSelectedSize('');
    setSelectedColor('');
    setQuantite(1);
    setZoom(false);
    setHdDemandee(false);

    apiClient.get(`/products/${slug}/`)
      .then((r) => {
        setProduct(r.data);
        return apiClient.get('/products/', { params: { category: r.data.category.slug } });
      })
      .then((r) => {
        const all = r.data.results ?? r.data;
        setSimilar(all.filter((p) => p.slug !== slug).slice(0, 4));
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="fp fp-etat">
        <p className="fp-etat-texte">Chargement…</p>
        <style>{FEUILLE}</style>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="fp fp-etat">
        <h1>Pièce introuvable</h1>
        <Link to="/boutique" className="btn btn--primary btn--auto">Retour à la boutique</Link>
        <style>{FEUILLE}</style>
      </div>
    );
  }

  // La vidéo, quand le produit en a une, occupe la première place de la galerie.
  const media = [
    ...(product.video_url ? [{ type: 'video', key: 'video', src: product.video_url }] : []),
    ...(product.images ?? []).map((img) => ({
      type: 'image', key: `img-${img.id}`, src: img.image, alt: img.alt_text,
    })),
  ];
  const courant = media[selectedImage];
  // On garde l'index d'origine : c'est lui qui pilote le visuel principal.
  const vues = media.map((m, index) => ({ media: m, index }));

  const tailles = [...new Set(product.variants?.map((v) => v.size).filter(Boolean))];
  const couleurs = [...new Set(product.variants?.map((v) => v.color).filter(Boolean))];

  /* La variante n'existe QUE si le client a choisi quelque chose. Sans ce
     garde-fou, `find()` renvoie la première variante du produit et la fiche
     parle du stock d'une taille que personne n'a demandée. */
  const aChoisi = Boolean(selectedSize || selectedColor);
  const variante = aChoisi
    ? product.variants?.find(
        (v) => (!selectedSize || v.size === selectedSize) && (!selectedColor || v.color === selectedColor)
      ) ?? null
    : null;

  const stockDispo = variante ? variante.stock : product.stock;
  const epuise = stockDispo === 0;
  // Sous ce seuil, le dire est une information ; au-dessus, c'est une ficelle.
  const presqueEpuise = stockDispo > 0 && stockDispo <= 3;

  /* La quantité est BORNÉE au rendu, pas remise à 1 par un effet. Changer de
     taille change le stock : une quantité de 4 retenue d'une taille où il en
     restait 6 n'a plus de sens sur une taille où il en reste 1. La borner ici
     la ramène à ce qui est réellement disponible sans effacer le choix du
     client quand la nouvelle taille en a assez — et évite le rendu en cascade
     qu'un `setQuantite` dans un effet provoquerait. */
  const qte = Math.min(quantite, Math.max(1, stockDispo));

  /* Le panier facture `price + price_adjustment`. La fiche doit donc annoncer
     la même chose, supplément compris, sinon le montant change en cours de
     route. L'ancien prix suit le même décalage : la remise reste calculée sur
     les deux nombres réellement affichés. */
  const supplement = Number(variante?.price_adjustment ?? 0);
  const prix = Number(product.price) + supplement;
  const prixAvant = product.old_price ? Number(product.old_price) + supplement : null;
  const remise = prixAvant && prixAvant > prix
    ? Math.round((1 - prix / prixAvant) * 100)
    : 0;

  const ajouterAuPanier = () => {
    if (tailles.length > 0 && !selectedSize) {
      toast.error('Choisissez une taille');
      return;
    }
    addItem(product, variante, qte);
    toast.success(qte > 1
      ? `${qte} × ${product.name} ajoutés au panier`
      : `${product.name} ajouté au panier`);
  };

  const changerQuantite = (delta) => {
    setQuantite(Math.min(Math.max(1, qte + delta), Math.max(1, stockDispo)));
  };

  /* La loupe ne vaut que pour une photo : sur une vidéo elle masquerait les
     contrôles natifs, qui occupent précisément la bande où l'on pointe. */
  const zoomable = courant?.type === 'image';

  const suivrePointeur = (e) => {
    if (!zoomable || !MQ_POINTEUR_FIN?.matches) return;
    // La bande de vues est posée EN SURIMPRESSION sur le bas du visuel : sans
    // cette sortie, viser une miniature ferait plonger l'agrandissement vers
    // le bas de la photo au moment même où l'on s'apprête à en changer.
    if (e.target.closest('.fp-vues')) { setZoom(false); return; }
    const r = e.currentTarget.getBoundingClientRect();
    setOrigine({
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    });
    setZoom(true);
    setHdDemandee(true);
  };

  const note = product.rating_avg;
  const nbAvis = product.review_count;

  return (
    <div className="fp">
      <SEOHead
        title={product.name}
        description={product.description ? product.description.slice(0, 155) : undefined}
        image={product.primary_image}
        url={`/produit/${product.slug}`}
        type="product"
      />

      <div className="fp-shell">
        {/* Le fil d'Ariane complet a été retiré à la demande. Il ne reste que
            le rayon : « Accueil » est déjà dans la navigation permanente, et
            le dernier maillon répétait le titre affiché deux lignes plus bas.
            Ce qui restait d'utile — repartir vers le rayon — tient en un mot. */}
        <nav className="fp-fil" aria-label="Rayon">
          <Link to={`/categorie/${product.category?.slug}`} className="eyebrow">
            {product.category?.name}
          </Link>
        </nav>

        <div className="fp-grille">
          {/* ── Galerie ── */}
          {/* Le point de mire descend en variables CSS plutôt qu'en transform
              inline : la règle de grossissement reste dans la feuille, avec le
              garde-fou « pointeur fin » qu'un style inline ne saurait pas
              porter. */}
          <div
            className={`fp-visuel ${zoomable ? 'peut-zoomer' : ''} ${zoom ? 'est-zoom' : ''}`}
            style={{ '--zx': `${origine.x}%`, '--zy': `${origine.y}%` }}
            onMouseMove={suivrePointeur}
            onMouseLeave={() => setZoom(false)}
          >
            {courant?.type === 'video' ? (
              <video
                key={courant.src}
                src={courant.src}
                controls autoPlay muted loop playsInline
              />
            ) : courant ? (
              <>
                <CldImg
                  src={courant.src}
                  alt={courant.alt || product.name}
                  eager
                  sizes="(max-width: 900px) 100vw, 50vw"
                  widths={[800, 1600]}
                />
                {/* Sans cette seconde couche, la loupe agrandirait la variante
                    choisie pour l'affichage — 800 px étirés sur 1 240, soit
                    une broderie plus floue une fois grossie qu'à plat. On ne
                    la télécharge qu'au premier survol : sur une 3G, personne
                    ne paie 1 600 px pour une loupe dont il ne se sert pas. */}
                {hdDemandee && (
                  <CldImg
                    className="fp-hd"
                    src={courant.src}
                    alt=""
                    aria-hidden="true"
                    eager
                    sizes="1600px"
                    widths={[1600]}
                  />
                )}
              </>
            ) : (
              <span className="fp-vide">Photo bientôt</span>
            )}

            {/* La bande montre TOUTES les vues, y compris celle affichée :
                masquer la première la rendait inatteignable dès le premier
                clic sur une autre. Quand la vue courante est une vidéo, la
                bande se relève pour ne pas couvrir les contrôles natifs. */}
            {vues.length > 1 && (
              <div className={`fp-vues ${courant?.type === 'video' ? 'est-video' : ''}`}>
                {vues.map(({ media: m, index: i }) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => { setSelectedImage(i); setZoom(false); }}
                    aria-label={`Afficher la vue ${i + 1} de ${product.name}`}
                    aria-current={selectedImage === i}
                    className={`fp-vue ${selectedImage === i ? 'is-active' : ''}`}
                  >
                    {m.type === 'video'
                      ? <video src={m.src} muted playsInline preload="metadata" />
                      : <CldImg src={m.src} alt="" sizes="72px" widths={[160, 320]} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Colonne d'achat ── */}
          <div className="fp-achat">
            {/* La colonne s'ouvre sur le titre : le rayon est déjà en tête de
                page, au même dessin et à la même taille, et deux fois le même
                mot à trois centimètres d'écart ne se lit qu'une. */}
            <h1 className="fp-titre">{product.name}</h1>

            {/* La ligne ne s'affiche que s'il existe vraiment des avis. */}
            {note && nbAvis > 0 && (
              <div className="fp-note">
                <span className="fp-etoiles" aria-hidden="true">
                  {'★'.repeat(Math.round(note))}{'☆'.repeat(5 - Math.round(note))}
                </span>
                <span className="fp-note-texte">
                  {String(note).replace('.', ',')} · {nbAvis} avis
                </span>
              </div>
            )}

            <div className="fp-prix-ligne">
              <span className="fp-prix">{formatPrice(prix, currency)}</span>
              {prixAvant && prixAvant > prix && (
                <span className="fp-prix-avant">
                  <span className="visually-hidden">Ancien prix : </span>
                  {formatPrice(prixAvant, currency)}
                </span>
              )}
              {remise > 0 && <span className="badge badge--promo">−{remise} %</span>}
            </div>

            {/* Un prix qui bouge quand on choisit une taille, sans qu'on dise
                pourquoi, passe pour une erreur — ou pour un piège. */}
            {supplement !== 0 && (
              <p className="fp-supplement">
                {supplement > 0 ? 'Dont ' : 'Remise de '}
                {formatPrice(Math.abs(supplement), currency)} pour cette variante.
              </p>
            )}

            {/* La description est lue directement, et lue TÔT : elle tient la
                place du chapô, entre le prix et les choix. On sait ce qu'on
                achète avant de choisir une taille, pas après avoir cliqué sur
                un accordéon en bas de colonne. */}
            <div className="fp-description">
              <span className="eyebrow">La pièce</span>
              <p>{product.description || 'Description à venir.'}</p>
            </div>

            {couleurs.length > 0 && (
              <div className="fp-bloc-choix">
                <div className="fp-bloc-entete">
                  <span className="fp-bloc-titre">Couleur</span>
                  <span className="fp-bloc-valeur">{selectedColor || 'Au choix'}</span>
                </div>
                <div className="fp-options">
                  {couleurs.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(selectedColor === c ? '' : c)}
                      aria-pressed={selectedColor === c}
                      className={`fp-option ${selectedColor === c ? 'is-active' : ''}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {tailles.length > 0 && (
              <div className="fp-bloc-choix">
                <div className="fp-bloc-entete">
                  <span className="fp-bloc-titre">Taille</span>
                  <button
                    type="button"
                    onClick={() => setSizeGuideOpen(true)}
                    className="fp-lien-bouton link-reveal"
                  >
                    Guide des tailles
                  </button>
                </div>
                <div className="fp-options">
                  {tailles.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedSize(selectedSize === t ? '' : t)}
                      aria-pressed={selectedSize === t}
                      className={`fp-option ${selectedSize === t ? 'is-active' : ''}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {/* Le sur-mesure était redit ici. Il ouvre maintenant la carte
                    des promesses, à quelques centimètres sous le bouton : le
                    répéter deux fois dans une colonne le fait lire zéro. */}
              </div>
            )}

            {epuise ? (
              <div className="fp-rupture">
                <p className="fp-rupture-titre">
                  {selectedSize
                    ? `Taille ${selectedSize} épuisée pour le moment.`
                    : 'Pièce épuisée pour le moment.'}
                </p>
                <p className="fp-rupture-texte">
                  Laissez votre e-mail : vous serez prévenu(e) dès le retour en atelier.
                </p>
                <StockAlertForm productSlug={product.slug} />
              </div>
            ) : (
              <>
                <div className="fp-actions">
                  <div className="fp-qte" role="group" aria-label="Quantité">
                    <button
                      type="button"
                      onClick={() => changerQuantite(-1)}
                      disabled={qte <= 1}
                      aria-label="Retirer une pièce"
                    >−</button>
                    <span className="fp-qte-valeur" aria-live="polite">{qte}</span>
                    <button
                      type="button"
                      onClick={() => changerQuantite(1)}
                      disabled={qte >= stockDispo}
                      aria-label="Ajouter une pièce"
                    >+</button>
                  </div>

                  <button type="button" onClick={ajouterAuPanier} className="btn btn--primary fp-cta">
                    Ajouter au panier
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      basculerFavori(product);
                      toast(aime
                        ? `${product.name} retiré des favoris`
                        : `${product.name} mis de côté`);
                    }}
                    aria-pressed={aime}
                    aria-label={aime
                      ? `Retirer ${product.name} des favoris`
                      : `Mettre ${product.name} de côté`}
                    className={`fp-coeur ${aime ? 'is-aime' : ''}`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24"
                         fill={aime ? 'currentColor' : 'none'}
                         stroke="currentColor" strokeWidth="1.8"
                         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8z" />
                    </svg>
                  </button>
                </div>

                {presqueEpuise && (
                  <p className="fp-tension">
                    Plus que {stockDispo} {stockDispo > 1 ? 'pièces disponibles' : 'pièce disponible'}
                    {selectedSize ? ` en taille ${selectedSize}` : ''}.
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {similar.length > 0 && (
          <div className="fp-recos">
            <h2 className="fp-recos-titre">Dans le même esprit</h2>
            <div className="fp-recos-grille">
              {similar.map((p, i) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  index={i}
                  sizes="(max-width: 640px) 72vw, (max-width: 1024px) 40vw, 22vw"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {sizeGuideOpen && (
        <SizeGuideModal
          categorySlug={product.category?.slug}
          onClose={() => setSizeGuideOpen(false)}
        />
      )}

      <style>{FEUILLE}</style>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   Plus une seule couleur en dur : tout passe par les tokens Or & Indigo de
   styles.css. Les longueurs sont en rem — la racine du site est à 62,5 %,
   donc `--s-4` vaut bien 16 px, contrairement aux valeurs en pixels de la
   source qui étaient calées sur une racine à 16 px.
   ═══════════════════════════════════════════════════════════════════════════ */
/* La loupe suppose un survol. Au doigt il n'existe pas : un effleurement
   figerait la photo agrandie sans moyen d'en sortir, et ferait télécharger
   pour rien la variante 1 600 px. Le même test garde la règle CSS plus bas —
   les deux doivent rester d'accord. */
const MQ_POINTEUR_FIN = typeof window !== 'undefined'
  ? window.matchMedia('(hover: hover) and (pointer: fine)')
  : null;

const FEUILLE = `
  .fp {
    background: var(--surface);
    color: var(--text);
    font-family: var(--font-body);
    min-height: 100vh;
    padding-top: 9.6rem;
  }

  .fp-etat {
    display: grid;
    place-items: center;
    gap: var(--s-5);
    text-align: center;
    padding: var(--s-10) var(--page-pad);
  }
  .fp-etat-texte { color: var(--text-muted); }

  .fp-shell {
    margin: 0 auto;
    max-width: var(--page-max);
    padding: var(--s-5) var(--page-pad) var(--s-8);
  }

  /* ── Rayon ──────────────────────────────────────────────────────────────
     Seul fil d'Ariane de la page. La classe .eyebrow du système porte la
     taille, la graisse, les capitales et l'interlettrage ; il ne reste ici
     que le survol.
     (Pas de backticks dans ce commentaire : il vit dans un template literal,
     le premier backtick fermerait la chaîne.) */
  .fp-fil .eyebrow { transition: color var(--dur-1) var(--ease); }
  .fp-fil a.eyebrow:hover { color: var(--text); }

  .fp-grille {
    display: grid;
    grid-template-columns: 1.05fr 0.95fr;
    gap: var(--s-7);
    padding-top: var(--s-5);
    align-items: start;
  }

  /* ── Galerie ── */
  .fp-visuel {
    position: relative;
    aspect-ratio: 4 / 5;
    overflow: hidden;
    border-radius: var(--r-3);
    background: var(--surface-sunk);
    display: grid;
    place-items: center;
  }
  .fp-visuel > img,
  .fp-visuel > video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* ── Loupe ────────────────────────────────────────────────────────────────
     1,55 et pas davantage : au-delà, le cadrage 4/5 ne montre plus la pièce
     mais un morceau de tissu hors contexte, et le moindre geste de la main
     balaye la moitié du vêtement. À 1,55 on lit la trame d'un bazin et la
     broderie sans perdre de vue ce qu'on regarde.

     La propriété scale, et non transform : le point de mire
     (transform-origin) doit suivre la main SANS retard, alors que le
     grossissement gagne à s'installer en douceur. Une transition posée sur
     transform les traiterait ensemble et l'image traînerait derrière le
     curseur.
     (Pas de backticks ici : ce commentaire vit dans un template literal.)

     Réservé au pointeur fin. Au doigt il n'existe pas de survol : la règle ne
     ferait que figer la photo agrandie au premier effleurement, sans moyen
     d'en sortir. */
  /* La haute définition ne se montre qu'agrandie : à plat elle n'apporte rien
     que le poids d'un second décodage à l'écran. */
  .fp-hd { opacity: 0; }

  @media (hover: hover) and (pointer: fine) {
    .fp-visuel.peut-zoomer { cursor: zoom-in; }
    .fp-visuel > img {
      transform-origin: var(--zx, 50%) var(--zy, 50%);
      transition: scale var(--dur-2) var(--ease), opacity var(--dur-1) var(--ease);
    }
    .fp-visuel.est-zoom > img { scale: 1.55; }

    .fp-visuel.est-zoom .fp-hd { opacity: 1; }
  }

  /* Le grossissement reste — c'est la fonction même de la loupe ; seule sa
     mise en route cesse d'être animée. */
  @media (prefers-reduced-motion: reduce) {
    .fp-visuel > img { transition: none; }
  }
  .fp-vide {
    font-size: var(--t-xs);
    text-transform: uppercase;
    letter-spacing: var(--ls-eyebrow);
    color: var(--text-muted);
  }

  /* ── Colonne d'achat ── */
  .fp-achat { padding-top: var(--s-1); }

  /* Capitales, comme le h1 de la boutique.
     ⚠ L'interlettrage passe de --ls-display (-0,02em) à +0,02em, et ce n'est
     pas un détail de goût : un chasse resserrée est faite pour les bas de
     casse, dont les jambages creusent l'espace. En capitales, toutes les
     lettres ont la même hauteur et le négatif les fait se toucher. C'est la
     valeur qu'emploient déjà les autres titres en capitales du site. */
  .fp-titre {
    margin-top: var(--s-4);
    font-family: var(--font-display);
    font-size: var(--t-h2);
    font-weight: 600;
    line-height: 1.1;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    color: var(--text);
    text-wrap: balance;
  }

  .fp-note { display: flex; align-items: center; gap: var(--s-3); margin-top: var(--s-3); }
  .fp-etoiles { font-size: var(--t-sm); letter-spacing: 2px; color: var(--text-accent); }
  .fp-note-texte { font-size: var(--t-xs); color: var(--text-muted); }

  .fp-prix-ligne {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: var(--s-3);
    margin-top: var(--s-4);
  }
  .fp-prix {
    font-size: 3.2rem;
    font-weight: 600;
    letter-spacing: var(--ls-tight);
    font-variant-numeric: tabular-nums;
    color: var(--text-accent);
  }
  /* La barre est purement visuelle : aucun lecteur d'écran n'annonce un
     line-through, d'où le libellé « Ancien prix » posé en visually-hidden. */
  .fp-prix-avant {
    font-size: var(--t-body);
    color: var(--text-muted);
    text-decoration: line-through;
    text-decoration-thickness: 1px;
    font-variant-numeric: tabular-nums;
  }
  .fp-supplement {
    margin-top: var(--s-2);
    font-size: var(--t-xs);
    color: var(--text-muted);
  }

  /* ── Choix ── */
  .fp-bloc-choix { margin-top: var(--s-6); }
  .fp-bloc-entete {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--s-4);
    margin-bottom: var(--s-3);
  }
  .fp-bloc-titre {
    font-size: var(--t-xs);
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-muted);
  }
  .fp-bloc-valeur { font-size: var(--t-sm); color: var(--text); }

  .fp-lien-bouton {
    font-family: var(--font-body);
    font-size: var(--t-xs);
    font-weight: 600;
    color: var(--text-accent);
    background: none;
    cursor: pointer;
  }

  /* Le rôle décide du rayon : ce sont des actions, donc des pilules. */
  .fp-options { display: flex; flex-wrap: wrap; gap: var(--s-2); }
  .fp-option {
    border: 1px solid var(--line);
    background: transparent;
    border-radius: var(--r-pill);
    padding: 1.1rem var(--s-5);
    min-height: 4.4rem;
    font-family: var(--font-body);
    font-size: var(--t-sm);
    font-weight: 600;
    color: var(--text);
    cursor: pointer;
    transition: border-color var(--dur-1) var(--ease),
                background var(--dur-1) var(--ease),
                color var(--dur-1) var(--ease);
  }
  .fp-option:hover { border-color: var(--gp-brass-700); }
  .fp-option.is-active {
    border-color: var(--action-fill);
    background: var(--action-fill);
    color: var(--action-fill-text);
  }

  /* ── Actions ── */
  .fp-actions {
    display: flex;
    align-items: stretch;
    gap: var(--s-3);
    margin-top: var(--s-6);
  }

  .fp-qte {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    border: 1px solid var(--line);
    border-radius: var(--r-pill);
    overflow: hidden;
  }
  .fp-qte button {
    width: 4.4rem;
    min-height: 4.8rem;
    background: none;
    font-family: var(--font-body);
    font-size: 1.8rem;
    line-height: 1;
    color: var(--text);
    cursor: pointer;
    transition: background var(--dur-1) var(--ease);
  }
  .fp-qte button:hover:not(:disabled) { background: var(--surface-sunk); }
  .fp-qte button:disabled { opacity: 0.3; cursor: not-allowed; }
  .fp-qte-valeur {
    min-width: 3rem;
    text-align: center;
    font-size: var(--t-body);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  /* .btn porte width:100% sous 768 px : le flex:1 le laisse partager la
     rangée avec le sélecteur de quantité et le cœur. */
  .fp-cta { flex: 1; min-width: 0; }

  .fp-coeur {
    display: grid;
    place-items: center;
    flex-shrink: 0;
    width: 4.8rem;
    min-height: 4.8rem;
    border: 1px solid var(--line);
    border-radius: var(--r-pill);
    background: transparent;
    color: var(--text);
    cursor: pointer;
    transition: border-color var(--dur-1) var(--ease),
                color var(--dur-1) var(--ease),
                transform var(--dur-1) var(--ease);
  }
  .fp-coeur:hover  { border-color: var(--gp-brass-700); }
  .fp-coeur:active { transform: scale(0.92); }
  .fp-coeur.is-aime { color: var(--text-promo); border-color: var(--text-promo); }

  /* La rareté se dit en terre cuite : c'est le rôle de l'accent secondaire —
     promo, solde, urgence douce. */
  .fp-tension {
    margin-top: var(--s-3);
    font-size: var(--t-xs);
    font-weight: 600;
    color: var(--text-promo);
  }

  /* ── Rupture ── */
  .fp-rupture {
    margin-top: var(--s-6);
    padding: var(--s-5);
    border: 1px solid var(--line);
    border-radius: var(--r-3);
    background: var(--surface-sunk);
  }
  .fp-rupture-titre { font-size: var(--t-body); font-weight: 600; color: var(--text); }
  .fp-rupture-texte {
    margin: var(--s-2) 0 var(--s-4);
    font-size: var(--t-xs);
    color: var(--text-muted);
  }

  /* ── Description ──────────────────────────────────────────────────────────
     Ni filet ni bordure : posée sous le prix, une ligne horizontale
     enfermerait le prix dans le bloc du titre au lieu d'ouvrir le texte.
     L'écart seul suffit à séparer. */
  .fp-description { margin-top: var(--s-5); }
  .fp-description p {
    margin-top: var(--s-3);
    white-space: pre-line;
    font-size: var(--t-body);
    line-height: var(--lh-body);
    color: var(--text-muted);
  }

  /* ── Les vues, en surimpression sur le bas du visuel ──────────────────────
     Posée en absolu, la bande ne prend aucune hauteur dans la colonne : le
     visuel garde son 4/5 exact. Le dégradé n'est pas décoratif — sans lui, une
     miniature claire posée sur un bazin blanc n'a plus de contour. */
  .fp-vues {
    position: absolute;
    inset: auto 0 0 0;
    z-index: 2;
    display: flex;
    gap: var(--s-2);
    padding: var(--s-7) var(--s-3) var(--s-3);
    overflow-x: auto;
    scrollbar-width: none;
    background: linear-gradient(to top, rgba(15, 19, 32, 0.58), rgba(15, 19, 32, 0));
  }
  .fp-vues::-webkit-scrollbar { display: none; }
  /* Les contrôles natifs d'une vidéo occupent la même bande basse. */
  .fp-vues.est-video { padding-bottom: 5.6rem; }

  .fp-vue {
    position: relative;
    flex: 0 0 auto;
    width: 5.6rem;
    aspect-ratio: 3 / 4;
    overflow: hidden;
    border-radius: 1rem;
    background: var(--surface-sunk);
    cursor: pointer;
    opacity: 0.82;
    box-shadow: 0 0 0 1.5px rgba(250, 246, 238, 0.45);
    transition: opacity var(--dur-1) var(--ease), box-shadow var(--dur-1) var(--ease);
  }
  .fp-vue:hover { opacity: 1; }
  .fp-vue.is-active { opacity: 1; box-shadow: 0 0 0 2px var(--gp-brass-400); }
  .fp-vue img,
  .fp-vue video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* ── Recommandations ── */
  .fp-recos { padding-top: var(--section-y); }
  .fp-recos-titre {
    margin-bottom: var(--s-5);
    font-family: var(--font-display);
    font-size: var(--t-h3);
    color: var(--text);
  }
  .fp-recos-grille {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--s-5);
  }

  @media (max-width: 900px) {
    .fp { padding-top: 8rem; }
    .fp-grille { grid-template-columns: 1fr; gap: var(--s-6); }
    .fp-recos-grille { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .fp-vues { gap: 0.6rem; padding: var(--s-6) var(--s-2) var(--s-2); }
    .fp-vue { width: 4.6rem; }
  }

  /* Au doigt, la rangée d'action tient mal à trois : le bouton passe sous le
     couple quantité + cœur plutôt que d'être écrasé entre les deux. */
  @media (max-width: 480px) {
    .fp-actions { flex-wrap: wrap; }
    .fp-qte { order: 1; }
    .fp-coeur { order: 2; margin-left: auto; }
    .fp-cta { order: 3; flex: 1 0 100%; }
  }
`;

export default ProduitPage;
