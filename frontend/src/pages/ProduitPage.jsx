import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import CldImg from '../components/CldImg';
import ProductCard from '../components/ProductCard';
import PastillesPiece from '../components/PastillesPiece';
import SEOHead from '../components/SEOHead';
import StockAlertForm from '../components/StockAlertForm';
import apiClient from '../api/client';
import { useEstVisible } from '../hooks/useInView';
import useCartStore from '../store/cartStore';
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
 * L'ordre : rayon (en tête de page) · titre · prix · description ·
 * couleur · taille · quantité et panier · stock.
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
 *   soit exactement là où l'on hésite. Il est posé sur la photo, avec les
 *   autres pastilles de la carte (PastillesPiece) ; celui de la colonne
 *   d'achat, à côté du panier, a été retiré à la demande : il faisait
 *   doublon.
 * • Le SUPPLÉMENT DE VARIANTE. La colonne affichait `product.price` pendant
 *   que le panier facturait `price + variant.price_adjustment` : la fiche
 *   annonçait un prix, le panier en réclamait un autre. Le prix suit
 *   maintenant la variante choisie, et le supplément est dit à voix haute.
 * • Le STOCK RÉEL de la variante. `variants.find()` renvoyait la première
 *   variante même sans aucune sélection : la fiche pouvait annoncer « épuisé »
 *   sur la foi d'une taille que le client n'avait pas demandée.
 *
 * ── Ce qui n'a pas été ajouté, volontairement ───────────────────────────────
 * • Pas de bouton WhatsApp : il avait été retiré à la demande, et la barre de
 *   navigation porte déjà l'icône WhatsApp sur toutes les pages.
 * • Pas de référence article : le modèle `Product` n'a pas de SKU.
 * • Pas d'avis : la note, les étoiles et le nombre d'avis ont été retirés du
 *   site, front et back, à la demande.
 * • Les couleurs restent des boutons de texte : elles sont saisies en texte
 *   libre en admin, sans code hexadécimal. Le jour où `ProductVariant` gagne
 *   un champ couleur, la pastille ronde devient possible.
 */

const ProduitPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);
  /* Relit la pièce après une modification par le stylo de la photo. */
  const [version, setVersion] = useState(0);
  const currency = useSettingsStore((s) => s.currency);

  const [product, setProduct] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantite, setQuantite] = useState(1);

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
  /* Le point de depart d'un geste tactile, pour distinguer une tape — qui
     bascule le zoom — d'un deplacement, qui promene la zone regardee. */
  const departTouche = useRef(null);

  /* La barre d'achat collante n'apparait que lorsque le bouton d'origine a
     quitte l'ecran : tant qu'il est visible, deux boutons identiques a
     quelques centimetres l'un de l'autre ne feraient que du bruit.

     ⚠ Declare ICI, avec les autres hooks : la page sort par plusieurs
     `return` anticipes — chargement, erreur — et un hook appele apres l'un
     d'eux ne serait pas execute au meme rang a chaque rendu. */
  const [refActions, actionsVisibles] = useEstVisible();

  /* La hauteur de la barre d'achat, publiee pour que l'invitation a
     installer l'application se pose AU-DESSUS et non par-dessus. */
  const barreAchat = useRef(null);
  useEffect(() => {
    const el = barreAchat.current;
    const racine = document.documentElement;
    if (!el) { racine.style.removeProperty('--barre-achat-h'); return undefined; }
    const publier = () => racine.style.setProperty(
      '--barre-achat-h', `${Math.ceil(el.getBoundingClientRect().height)}px`,
    );
    publier();
    const obs = new ResizeObserver(publier);
    obs.observe(el);
    return () => { obs.disconnect(); racine.style.removeProperty('--barre-achat-h'); };
  }, [actionsVisibles]);

  /* Le NIVEAU de la loupe se règle, à la demande : molette sur la photo, ou
     « − / + » en haut à gauche. Il valait 1,55, fixe. Au bout de la plage,
     la molette rend la main à la page : tourner vers le bas au niveau le plus
     faible fait défiler, au lieu de bloquer le défilement tant que le
     pointeur est sur la grande photo. */
  const [niveau, setNiveau] = useState(LOUPE.defaut);
  const niveauRef = useRef(niveau);
  useEffect(() => { niveauRef.current = niveau; }, [niveau]);
  const visuelRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setError(false);
    setSelectedImage(0);
    setSelectedSize('');
    setSelectedColor('');
    setQuantite(1);
    setZoom(false);
    setHdDemandee(false);
    setNiveau(LOUPE.defaut);

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
  }, [slug, version]);

  useEffect(() => {
    const el = visuelRef.current;
    if (!el) return undefined;
    const surRoue = (e) => {
      if (!MQ_POINTEUR_FIN?.matches || !el.classList.contains('peut-zoomer')) return;
      if (e.target.closest('.fp-vues, .pc-pastilles')) return;
      const n = niveauRef.current;
      if ((e.deltaY > 0 && n <= LOUPE.min) || (e.deltaY < 0 && n >= LOUPE.max)) return;
      e.preventDefault();
      // Proportionnel au geste : un cran de molette (~100) vaut un pas ; un
      // pavé tactile, qui envoie une pluie de petits écarts, zoome en douceur.
      setNiveau(borner(n - e.deltaY * (LOUPE.pas / 100)));
      setZoom(true);
      setHdDemandee(true);
    };
    el.addEventListener('wheel', surRoue, { passive: false });
    return () => el.removeEventListener('wheel', surRoue);
  }, [loading, error]);

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

  // Les photos seules : la vidéo de produit, qui ouvrait la galerie, a été
  // retirée, front et back, à la demande.
  const media = [
    ...(product.images ?? []).map((img) => ({
      // Le nom de la pièce décrit la photo : le texte alternatif saisi à la
      // main a été retiré, front et back, à la demande.
      type: 'image', key: `img-${img.id}`, src: img.image, alt: product.name,
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

  // Toute vue est une photo : la loupe vaut dès qu'il y en a une.
  const zoomable = Boolean(courant);

  const suivrePointeur = (e) => {
    if (!zoomable || !MQ_POINTEUR_FIN?.matches) return;
    // La bande de vues est posée EN SURIMPRESSION sur le bas du visuel : sans
    // cette sortie, viser une miniature ferait plonger l'agrandissement vers
    // le bas de la photo au moment même où l'on s'apprête à en changer.
    if (e.target.closest('.fp-vues, .pc-pastilles')) { setZoom(false); return; }
    // Sur la commande du zoom, l'agrandissement reste tel quel : on voit
    // l'effet du clic sans que le point de mire saute vers le coin.
    if (e.target.closest('.fp-loupe')) return;
    const r = e.currentTarget.getBoundingClientRect();
    setOrigine({
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    });
    setZoom(true);
    setHdDemandee(true);
  };

  const changerNiveau = (delta) => {
    setNiveau((n) => borner(n + delta));
    setZoom(true);
    setHdDemandee(true);
  };

  /* ── LA LOUPE AU DOIGT ─────────────────────────────────────────────────
     Elle n'existait QUE pour le pointeur fin : quatre verrous concordants
     — la molette, le suivi du pointeur, la regle de grossissement et
     l'affichage meme de la commande — etaient enfermes dans la meme media
     query. Sur un telephone, aucun moyen d'approcher une piece. On vend du
     bazin brode et de la couture main : un client qui ne peut pas voir le
     tissu ne peut pas decider, et c'est 80 % des visiteurs.

     Le plus cher etait deja paye : sur un ecran a trois fois la densite, le
     navigateur reclame ~1 125 px et telecharge donc DEJA la variante
     1 600 px. Les pixels etaient la, c'est l'interface qui etait fermee.

     Au doigt il n'y a pas de survol : le modele souris — la photo suit le
     curseur — n'a pas d'equivalent. On le remplace par le geste attendu sur
     un telephone : une tape agrandit au point touche, une seconde tape rend
     la vue d'ensemble, et le doigt pose deplace la zone regardee. Les
     boutons « moins / plus » reglent le facteur, comme a la souris. */
  const tactile = () => !MQ_POINTEUR_FIN?.matches;

  const pointEnPourcents = (touche, el) => {
    const r = el.getBoundingClientRect();
    return {
      x: Math.min(100, Math.max(0, ((touche.clientX - r.left) / r.width) * 100)),
      y: Math.min(100, Math.max(0, ((touche.clientY - r.top) / r.height) * 100)),
    };
  };

  const surToucheDebut = (e) => {
    if (!zoomable || !tactile()) return;
    if (e.target.closest('.fp-vues, .pc-pastilles, .fp-loupe')) return;
    const t = e.touches[0];
    departTouche.current = { x: t.clientX, y: t.clientY, bouge: false };
    if (zoom) setOrigine(pointEnPourcents(t, e.currentTarget));
  };

  const surToucheBouge = (e) => {
    if (!zoom || !tactile() || !departTouche.current) return;
    const t = e.touches[0];
    // Au-dela de 8 px, le geste est un deplacement et non une tape : il ne
    // doit donc plus basculer le zoom quand le doigt se leve.
    if (Math.hypot(t.clientX - departTouche.current.x, t.clientY - departTouche.current.y) > 8) {
      departTouche.current.bouge = true;
    }
    setOrigine(pointEnPourcents(t, e.currentTarget));
  };

  const surToucheFin = (e) => {
    if (!zoomable || !tactile()) return;
    const depart = departTouche.current;
    departTouche.current = null;
    if (!depart || depart.bouge) return;
    if (e.target.closest('.fp-vues, .pc-pastilles, .fp-loupe')) return;
    if (zoom) { setZoom(false); return; }
    const t = e.changedTouches[0];
    setOrigine(pointEnPourcents(t, e.currentTarget));
    setZoom(true);
    setHdDemandee(true);
  };

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
          {/* ⚠ La bande de vues est SOEUR du visuel, pas son enfant.
              Elle y etait, posee en surimpression sur le bas de la photo.
              Mais `.fp-visuel` porte un `aspect-ratio` et un
              `overflow: hidden` : elle ne pouvait donc pas en sortir pour
              passer dessous en petit ecran, elle y aurait ete rognee.

              Ce conteneur est `position: relative` et le visuel le remplit
              entierement : la bande, en `inset: auto 0 0 0`, se pose donc
              exactement au meme endroit qu'avant sur un grand ecran. Le
              dessin de bureau ne bouge pas d'un pixel. */}
          <div className="fp-galerie">
          <div
            ref={visuelRef}
            className={`fp-visuel ${zoomable ? 'peut-zoomer' : ''} ${zoom ? 'est-zoom' : ''}`}
            style={{ '--zx': `${origine.x}%`, '--zy': `${origine.y}%`, '--zniveau': niveau }}
            onMouseMove={suivrePointeur}
            onMouseLeave={() => setZoom(false)}
            onTouchStart={surToucheDebut}
            onTouchMove={surToucheBouge}
            onTouchEnd={surToucheFin}
            onTouchCancel={() => { departTouche.current = null; }}
          >
            {courant ? (
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

            {/* Les quatre pastilles de la carte produit — cœur, panier, et
                pour un admin stylo et poubelle —, au même endroit et au même
                dessin, à la demande (PastillesPiece). Le panier ajoute la
                taille et la quantité choisies ; une pièce supprimée renvoie
                vers son rayon. */}
            <PastillesPiece
              product={product}
              epuise={product.stock === 0}
              onAjouterPanier={ajouterAuPanier}
              onModifie={() => setVersion((v) => v + 1)}
              onSupprime={() => navigate(`/categorie/${product.category?.slug ?? ''}`, { replace: true })}
            />

            {/* Le réglage de la loupe — pointeur fin seulement, comme la
                loupe elle-même (voir la feuille). */}
            {zoomable && (
              <div className="fp-loupe" role="group" aria-label="Zoom de la photo">
                <button type="button" onClick={() => changerNiveau(-LOUPE.pas)} disabled={niveau <= LOUPE.min} aria-label="Diminuer le zoom">−</button>
                <span className="fp-loupe-niveau" aria-live="polite">{Math.round(niveau * 100)} %</span>
                <button type="button" onClick={() => changerNiveau(LOUPE.pas)} disabled={niveau >= LOUPE.max} aria-label="Augmenter le zoom">+</button>
              </div>
            )}

          </div>

            {/* La bande montre TOUTES les vues, y compris celle affichée :
                masquer la première la rendait inatteignable dès le premier
                clic sur une autre. */}
            {vues.length > 1 && (
              <div className="fp-vues">
                {vues.map(({ media: m, index: i }) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => { setSelectedImage(i); setZoom(false); }}
                    aria-label={`Afficher la vue ${i + 1} de ${product.name}`}
                    aria-current={selectedImage === i}
                    className={`fp-vue ${selectedImage === i ? 'is-active' : ''}`}
                  >
                    <CldImg src={m.src} alt="" sizes="72px" widths={[160, 320]} />
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
                un accordéon en bas de colonne. Sans sur-titre : « La pièce »
                a été retiré à la demande. */}
            <div className="fp-description">
              <p>{product.description || 'Description à venir.'}</p>
            </div>

            {couleurs.length > 0 && (
              <div className="fp-bloc-choix">
                <div className="fp-bloc-entete">
                  <span className="fp-bloc-titre">Couleur</span>
                  {/* La couleur choisie seulement — « Au choix », affiché
                      tant que rien n'était choisi, a été retiré à la demande. */}
                  {selectedColor && <span className="fp-bloc-valeur">{selectedColor}</span>}
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
                  {/* Le lien « Guide des tailles » a été retiré à la demande,
                      avec la fenêtre qu'il ouvrait (SizeGuideModal). */}
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
                <div className="fp-actions" ref={refActions}>
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

        {/* ── LA BARRE D'ACHAT, EN BAS D'ECRAN, SOUS 900 PX ─────────────────
            Le bouton « Ajouter au panier » se trouve a environ 1 200 px du
            haut de la fiche : photo, titre, prix, description, couleur,
            taille, quantite. Sur un telephone, c'est DEUX ECRANS de
            defilement avant de pouvoir acheter — et une fois descendu, le
            prix n'est plus visible : on valide sans voir ce qu'on paye.

            La barre porte donc les deux : le montant a gauche, l'action a
            droite. Elle n'apparait que lorsque le bouton d'origine a quitte
            l'ecran, et jamais sur une piece epuisee, ou l'on propose a la
            place d'etre prevenu du retour en atelier. */}
        {!epuise && !actionsVisibles && (
          <div className="fp-barre-achat" ref={barreAchat} role="group" aria-label="Acheter">
            <span className="fp-barre-prix">
              {formatPrice(prix, currency)}
              {qte > 1 && <span className="fp-barre-qte"> x {qte}</span>}
            </span>
            <button type="button" onClick={ajouterAuPanier} className="btn btn--primary fp-barre-cta">
              Ajouter au panier
            </button>
          </div>
        )}

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
/* La loupe : de 125 % à 400 %, par pas de 25 %, à 150 % à l'ouverture. */
const LOUPE = { min: 1.25, defaut: 1.5, max: 4, pas: 0.25 };
const borner = (n) => Math.round(Math.min(LOUPE.max, Math.max(LOUPE.min, n)) * 100) / 100;

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
  /* Porte le reperage de la bande de vues, qui etait celui du visuel.
     Le visuel le remplit : rien ne change sur un grand ecran. */
  .fp-galerie { position: relative; }

  .fp-visuel {
    position: relative;
    aspect-ratio: 4 / 5;
    overflow: hidden;
    border-radius: var(--r-3);
    background: var(--surface-sunk);
    display: grid;
    place-items: center;
  }
  .fp-visuel > img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* ── Loupe ────────────────────────────────────────────────────────────────
     Le grossissement se RÈGLE, à la demande (molette, ou « − / + ») : de 1,25
     à 4, 1,5 à l'ouverture — assez pour lire la trame d'un bazin et la
     broderie sans perdre de vue la pièce. Il était fixé à 1,55.

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

  /* LE GROSSISSEMENT N'EST PLUS RESERVE A LA SOURIS. Ces trois regles
     vivaient dans une media query « pointeur fin » : au doigt, la photo ne
     s'agrandissait jamais, quel que soit le reglage. Elles sont pilotees par
     l'etat — la classe est-zoom —, pose par un geste delibere : survol a la
     souris, tape au doigt. Rien ne se declenche tout seul. */
  .fp-visuel > img {
    transform-origin: var(--zx, 50%) var(--zy, 50%);
    transition: scale var(--dur-2) var(--ease), opacity var(--dur-1) var(--ease);
  }
  .fp-visuel.est-zoom > img { scale: var(--zniveau, 1.5); }
  .fp-visuel.est-zoom .fp-hd { opacity: 1; }

  /* Agrandie, la photo se parcourt au doigt : sans cela le navigateur prend
     le geste pour un defilement et emporte la fiche vers le bas au moment ou
     l'on examine une broderie. Uniquement pendant le zoom — hors zoom, la
     page doit defiler normalement sous le doigt. */
  .fp-visuel.est-zoom { touch-action: none; }

  @media (hover: hover) and (pointer: fine) {
    .fp-visuel.peut-zoomer { cursor: zoom-in; }
  }

  /* Le grossissement reste — c'est la fonction même de la loupe ; seule sa
     mise en route cesse d'être animée. */
  @media (prefers-reduced-motion: reduce) {
    .fp-visuel > img { transition: none; }
  }
  /* La commande de zoom : la pastille écrue des cartes (indigo dessus),
     en haut à gauche — le coin droit est aux pastilles cœur, panier…
     Elle s'affiche PARTOUT depuis que la loupe fonctionne au doigt ; elle
     etait masquee hors pointeur fin, donc invisible sur un telephone. */
  .fp-loupe {
    position: absolute;
    top: var(--s-3);
    left: var(--s-3);
    z-index: 3;
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    padding: 0.3rem;
    border-radius: var(--r-pill);
    background: rgba(250, 246, 238, 0.92);
    backdrop-filter: blur(8px);
    color: var(--gp-indigo-900);
    cursor: default;
  }

  /* 30 px a la souris, 44 au doigt : le minimum tactile. */
  @media (pointer: coarse) {
    .fp-loupe { top: var(--s-2); left: var(--s-2); }
    .fp-loupe button { width: 4.4rem; height: 4.4rem; font-size: 2.2rem; }
  }
  .fp-loupe button {
    display: grid;
    place-items: center;
    width: 3rem;
    height: 3rem;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: inherit;
    font-size: 1.8rem;
    line-height: 1;
    cursor: pointer;
    transition: background var(--dur-1) var(--ease);
  }
  .fp-loupe button:hover:not([disabled]) { background: var(--gp-brass-400); }
  .fp-loupe button[disabled] { opacity: 0.35; cursor: not-allowed; }
  .fp-loupe-niveau {
    min-width: 5.2ch;
    font-size: 1.25rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    text-align: center;
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
     rangée avec le sélecteur de quantité. (Le cœur qui la complétait a été
     retiré : il est sur la photo.) */
  .fp-cta { flex: 1; min-width: 0; }

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
  .fp-vue img {
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

  /* ── La barre d'achat collante ──────────────────────────────────────────
     Elle n'existe QUE sous 900 px : au-dessus, la colonne d'achat est a
     cote de la photo et le bouton reste a l'ecran.

     Le fond reprend le chrome du site, avec un filet de laiton au-dessus —
     la meme matiere que la barre de navigation, a l'autre bout de l'ecran.
     La reserve du bas tient compte de la barre gestuelle des telephones
     sans bouton d'accueil ; sans elle, l'indicateur du systeme se pose sur
     le bouton d'achat. */
  .fp-barre-achat { display: none; }

  @media (max-width: 900px) {
    .fp-barre-achat {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 900;
      display: flex;
      align-items: center;
      gap: var(--s-3);
      padding: var(--s-3) var(--page-pad);
      padding-bottom: calc(var(--s-3) + env(safe-area-inset-bottom, 0px));
      background: var(--surface-chrome);
      border-top: 1px solid var(--line-dark-accent);
      animation: fadeUp var(--dur-2) var(--ease) both;
    }
    .fp-barre-prix {
      font-family: var(--font-display);
      font-size: 1.9rem;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      color: var(--gp-brass-400);
      white-space: nowrap;
    }
    .fp-barre-qte { font-size: 1.4rem; color: var(--text-on-dark-muted); }
    /* `.btn` passe en pleine largeur sous 767 px : ici il partage la ligne
       avec le prix, d'ou le flex qui lui rend une largeur propre. */
    .fp-barre-cta { flex: 1; min-width: 0; width: auto; }

    /* La barre couvre le bas de la page : sans cette reserve, les dernieres
       pieces de « Dans le meme esprit » finiraient dessous. */
    .fp-recos { padding-bottom: 8rem; }
  }

  @media (max-width: 900px) {
    /* 80 px de vide en tete de page etaient un reliquat de l'epoque ou la
       barre de navigation passait en « fixed » au defilement et sortait donc
       du flux. Elle est « sticky » depuis : elle occupe sa place, rien n'a a
       etre compense. L'ecart revient au rythme du site. */
    .fp { padding-top: var(--section-y); }
    .fp-grille { grid-template-columns: 1fr; gap: var(--s-6); }
    .fp-recos-grille { grid-template-columns: repeat(2, minmax(0, 1fr)); }

    /* ── LA BANDE DE VUES SORT DE LA PHOTO ───────────────────────────────
       Elle etait posee EN SURIMPRESSION sur le bas du visuel, avec un
       degrade sombre par-dessus : 101 px sur une photo de 419 px, soit
       24 % — le quart inferieur. Sur un vetement cadre en pied, ce quart
       porte l'ourlet, la retombee du tissu et les chaussures. Sur un
       boubou, c'est precisement ce qui dit si la coupe tombe droit.

       En dessous, elle ne coute qu'une soixantaine de pixels de page et
       rend la piece entiere. Le degrade n'a plus lieu d'etre : il ne
       servait qu'a detacher les miniatures du vetement. */
    .fp-vues {
      position: static;
      gap: 0.6rem;
      padding: var(--s-2) 0 0;
      background: none;
      scroll-snap-type: x proximity;
    }
    .fp-vue { width: 5.2rem; scroll-snap-align: start; }
  }
`;

export default ProduitPage;
