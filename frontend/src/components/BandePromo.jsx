/**
 * La vitrine.
 * ===========================================================================
 * Quatre pièces détourées sur un aplat indigo, entières, de la coiffe à
 * l'ourlet, en rangée : les deux tenues de femme aux bords, les deux tenues
 * d'homme au centre. Pas de texte. Pour ajouter ou retirer une pièce, c'est la
 * table `PIECES` juste en dessous — la rangée se recompose seule.
 *
 * ── Ce qu'elle a été ────────────────────────────────────────────────────────
 * La bande de promotion. Elle portait au centre la campagne du moment, lue
 * sur `/hero-promotion/` : sur-titre, offre, décompte, bouton, mention de
 * fin. Ce texte a été retiré à la demande, avec toute la mécanique qui le
 * servait — lecture de l'API, décompte, message hors campagne.
 *
 * ⚠ CONSÉQUENCE : LE SITE N'ANNONCE PLUS AUCUNE PROMOTION. Le hero avait déjà
 * été rendu muet sur ce point ; cette bande était le dernier endroit. Une
 * campagne saisie dans l'admin (`HeroPromotion`) ne s'affiche donc nulle part.
 * Pour la faire revenir, la mécanique complète est dans l'historique git :
 * `git show 5f67b1d:frontend/src/components/BandePromo.jsx`.
 *
 * Avant encore, c'était un transfert de `Redesign_mcommaman.com` : une photo
 * pleine largeur, puis des pièces qui dérivaient au défilement. Il n'en reste
 * rien — le composant garde seulement son nom de fichier.
 */

/**
 * Les pièces, dans l'ordre de la rangée, de gauche à droite.
 *
 * ── Pourquoi des détourages et pas une photographie ─────────────────────────
 * Aucun des 278 clichés de la maison ne convient en fond : ce sont des vues de
 * catalogue — bijoux sur présentoirs, sacs sur étagères, clientes de près —
 * qui recadrées au format de la bande coupent les visages à la bouche. Une
 * pièce détourée montre l'article entier et laisse le reste de l'aplat libre.
 *
 * ── largeur, hauteur ────────────────────────────────────────────────────────
 * Les dimensions du FICHIER, en pixels. Elles servent deux fois : posées en
 * attributs, elles donnent au navigateur le ratio de l'image avant son
 * chargement — la rangée ne saute pas quand les fichiers arrivent ; additionnées
 * en ratios, elles bornent la hauteur de la bande pour que la rangée tienne
 * dans la largeur (voir LARGEUR_RANGEE). Une pièce ajoutée sans ses vraies
 * dimensions déborde ou se tasse.
 *
 * Toutes prennent la même hauteur — celle de la bande moins l'air — et
 * partagent donc la même ligne de coiffe et la même ligne de sol.
 */
const PIECES = [
  { src: '/images/promo/piece-peche.webp', largeur: 700, hauteur: 1504 },
  // Les deux tenues d'homme du hero — le troisième tableau, mêmes mannequins
  // dorés — mais ENTIÈRES, jusqu'aux pieds : le hero les coupe à mi-cuisse.
  // Les détourages viennent du catalogue (outils/exporter_pieces.py), mis à
  // l'échelle sur 900 px de haut : un peu plus doux que les pièces de femme
  // (1 448 et 1 504 px) sur un écran haute densité.
  { src: '/images/catalogue/homme-bleu.webp', largeur: 344, hauteur: 900 },
  { src: '/images/catalogue/homme-taupe.webp', largeur: 320, hauteur: 900 },
  // Le MÊME mannequin que la pièce pêche, rhabillé par ChatGPT à partir du
  // premier détourage : même matière dorée, même pose, même éclairage. La
  // répétition est voulue — une paire de vitrines, pas deux photos
  // rapprochées par hasard.
  //
  // Elle n'est PAS retournée : sa tête est tournée vers la gauche, donc posée
  // à droite elle regarde vers le centre de la vitrine. La retourner la ferait
  // regarder dehors, et l'œil suit toujours le regard.
  { src: '/images/promo/piece-blanche.webp', largeur: 700, hauteur: 1448 },
];

/* La largeur de la rangée pour des pièces d'une unité de haut : la somme de
   leurs ratios. Passée au CSS en --bp-rangee, elle borne la hauteur de la
   bande — voir « LA HAUTEUR ». */
const LARGEUR_RANGEE = PIECES.reduce((somme, p) => somme + p.largeur / p.hauteur, 0);

const BandePromo = () => (
  <section className="bp" style={{ '--bp-rangee': LARGEUR_RANGEE.toFixed(4) }}>
    {/* Les pièces, fixes. Masquées aux lecteurs d'écran : sans nom de pièce
        ni lien, une description n'apprendrait rien de plus que « des
        boubous ». Quand la vitrine portera des pièces nommées, il faudra leur
        donner un texte. */}
    <div className="bp-cadre" aria-hidden="true">
      {PIECES.map((piece) => (
        <img
          key={piece.src}
          src={piece.src}
          alt=""
          width={piece.largeur}
          height={piece.hauteur}
          className="bp-piece"
          loading="lazy"
          decoding="async"
        />
      ))}
    </div>

    {/* Une lueur chaude derrière la rangée : sans elle, une silhouette
        découpée posée sur un aplat uni a l'air collée. */}
    <div className="bp-lueur" aria-hidden="true" />

    <style>{`
      /* Bande pleine largeur : l'écart avec la section précédente se prend en
         marge, jamais en padding — un padding creuserait l'espace DANS
         l'indigo au lieu de l'en séparer. D'où la remise à zéro du
         « padding-top: var(--section-y) » que styles.css pose sur toutes les
         sections : c'est l'exception que le rythme vertical prévoit pour une
         bande pleine largeur, pas une entorse. */
      .bp {
        /* L'air laissé au-dessus des coiffes et sous les ourlets. */
        --bp-air: var(--s-6);

        position: relative;
        isolation: isolate;
        overflow: hidden;
        margin-top: var(--section-y);
        padding-top: 0;
        /* L'indigo de la bande de coordonnées et du footer : la vitrine est
           du même chrome, pas une section de contenu. */
        background: var(--surface-chrome);

        /* ── LA HAUTEUR ─────────────────────────────────────────────────────
           Tout l'écran sous la bande de coordonnées et la barre de
           navigation : la hauteur maximale utile — au-delà, on ne verrait plus
           la vitrine en entier. --bande-h et --nav-h sont publiées par ces
           deux barres, jamais écrites en dur.

           Bornée par la LARGEUR : la rangée entière doit tenir dans 90 vw.
           Les pièces prenant la hauteur de la bande, une bande trop haute pour
           sa largeur ferait déborder la rangée — sur un téléphone, ou une
           fenêtre étroite et haute. --bp-rangee est la largeur de la rangée
           pour des pièces d'une unité de haut (la somme de leurs ratios,
           calculée dans le JS) : 90 vw divisés par elle donnent la plus
           grande hauteur de pièce qui tienne. Les 10 vw restants se partagent
           entre les cinq espaces de la rangée.

           « height » et non « min-height » : la bande n'a pas de contenu qui
           puisse la pousser.

           Deux déclarations : 100vh pour les navigateurs qui ignorent svh,
           puis 100svh — la plus petite hauteur de fenêtre, barres du
           navigateur déployées : la bande n'y dépasse jamais du bord. */
        height: min(calc(100vh - var(--bande-h, 0px) - var(--nav-h, 0px)), calc(90vw / var(--bp-rangee) + 2 * var(--bp-air)));
        height: min(calc(100svh - var(--bande-h, 0px) - var(--nav-h, 0px)), calc(90vw / var(--bp-rangee) + 2 * var(--bp-air)));
      }

      /* La rangée. Espaces égaux sur toute la largeur, bords compris
         (« space-evenly ») : quatre pièces, ou trois, ou six, se répartissent
         sans qu'on ait à placer chacune. L'air du haut et du bas est un
         padding ; les pièces, à 100 % de hauteur, prennent ce qui reste.

         Elle remplace un placement pièce par pièce — « gauche » ou « droite »
         et un décalage en pourcentage de la largeur — qui ne tenait qu'à deux
         pièces : la largeur d'une pièce suit la HAUTEUR de l'écran, et des
         positions en pourcentage de sa largeur se chevauchaient dès que la
         fenêtre devenait étroite. */
      .bp-cadre {
        position: absolute;
        inset: 0;
        overflow: hidden;
        z-index: -2;
        display: flex;
        justify-content: space-evenly;
        align-items: center;
        padding-block: var(--bp-air);
      }

      /* La pièce ENTIÈRE, de la coiffe à l'ourlet : toute la hauteur de la
         rangée, largeur déduite du ratio.

         Les détourages n'ont AUCUNE marge transparente en haut : la silhouette
         commence à la première ligne de pixels (mesuré sur les quatre). Un
         ancien décalage de −4 % « pour rogner le vide au-dessus de la coiffe »
         rognait donc la coiffe.

         « height: 100% » bat le « height: auto » que styles.css pose sur
         toutes les images : la classe l'emporte sur l'élément. */
      .bp-piece {
        flex: none;
        height: 100%;
        width: auto;
        display: block;
        /* L'ombre portée la pose sur le fond au lieu de la laisser flotter.
           Deux passes : une proche et dure, une lointaine et douce. */
        filter: drop-shadow(0 2px 6px rgba(0,0,0,.45)) drop-shadow(0 24px 48px rgba(0,0,0,.5));
      }

      /* Lueur chaude, une seule et large, derrière toute la rangée — il y en
         avait deux, calées sur une pièce à chaque bord. Sous le cadre
         (z-index −3 contre −2) : elle éclaire le fond, pas les tissus. Pas de
         voile sombre sur le bas : il aurait éteint les ourlets. */
      .bp-lueur {
        position: absolute; inset: 0; z-index: -3; pointer-events: none;
        background: radial-gradient(70% 85% at 50% 46%, rgba(214,138,74,.12) 0%, transparent 72%);
      }
    `}</style>
  </section>
);

export default BandePromo;
