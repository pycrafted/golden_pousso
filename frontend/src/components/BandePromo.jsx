import useTexteSection from '../hooks/useTexteSection';

/**
 * La vitrine.
 * ===========================================================================
 * Cinq pièces détourées sur un aplat indigo, entières, de la coiffe à
 * l'ourlet, en rangée : les deux tenues de femme aux bords, trois tenues
 * d'homme au centre, sous un seul titre : « En vitrine ». Pour ajouter ou
 * retirer une pièce, c'est la table `PIECES` juste en dessous — la rangée se
 * recompose seule.
 *
 * ── Ce qu'elle a été ────────────────────────────────────────────────────────
 * La bande de promotion. Elle portait au centre la campagne du moment, lue
 * sur `/hero-promotion/` : sur-titre, offre, décompte, bouton, mention de
 * fin. Ce texte a été retiré à la demande, avec toute la mécanique qui le
 * servait — lecture de l'API, décompte, message hors campagne. Le titre
 * « En vitrine » est revenu ensuite, à la demande : il nommait jusque-là le
 * carrousel de produits, renommé « Nos produits ».
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
 * ── echelle ─────────────────────────────────────────────────────────────────
 * Facultative, 1 par défaut : la part de la hauteur de rangée que prend la
 * pièce. MÊME HAUTEUR N'EST PAS MÊME ÉCHELLE — un mannequin photographié de
 * plus près paraît « zoomé » à côté des autres, même s'il va lui aussi de la
 * tête aux pieds. Toutes les pièces posent les pieds sur la même ligne de
 * sol : une pièce réduite perd de la hauteur par le haut.
 *
 * Une échelle se MESURE, elle ne se règle pas à l'œil : comparer une largeur
 * qui ne dépend pas du vêtement — les épaules, la couture posée sur le
 * mannequin — à celle d'une pièce comparable, à hauteur de fichier égale.
 */
const PIECES = [
  { src: '/images/promo/piece-peche.webp', largeur: 700, hauteur: 1504 },
  // Les deux tenues d'homme du hero (troisième tableau), ENTIÈRES jusqu'aux
  // pieds — le hero les coupe à mi-cuisse — sur le même type de mannequin
  // doré à tête lisse. Même carrure à hauteur égale, donc même échelle sans
  // correction : largeur d'épaules 0,2446 et 0,2439 de la hauteur du fichier.
  //
  // Le bleu est un détourage fourni par la maison, gardé en pleine
  // résolution (570 × 1 529). Il remplace celui du catalogue — tête de
  // cristal, 900 px — photographié de plus près : à hauteur égale il avait
  // 8 % de carrure en plus et paraissait zoomé, et ramené à la même carrure
  // il paraissait trop petit. Cette photo-là ne permettait pas les deux.
  //
  // Le marron vient du catalogue (outils/exporter_pieces.py), à 900 px de
  // haut : un peu plus doux que les autres pièces sur un écran haute densité.
  { src: '/images/promo/homme-bleu.webp', largeur: 570, hauteur: 1529 },
  // Le boubou blanc brodé à coupe droite, au centre exact de la rangée.
  //
  // ⚠ Fourni SANS transparence : le damier gris et blanc derrière le
  // mannequin était dessiné dans l'image, comme sur les sites qui simulent un
  // fond transparent. Détouré ici par la couleur — le damier est parfaitement
  // NEUTRE (gris et blanc purs, écart entre canaux < 1), le tissu est un blanc
  // bleuté (234, 238, 253) : tout pixel clair et neutre relié au bord de
  // l'image est du fond. Si une version avec une vraie couche alpha arrive, la
  // préférer.
  //
  // ⚠ Ce n'est pas le même mannequin que ses voisins : visage sculpté et socle
  // doré, là où les autres ont une tête lisse et les pieds nus. Posés sur la
  // même ligne de sol, ses pieds sont donc plus hauts de l'épaisseur du socle.
  { src: '/images/promo/boubou-blanc-mince.webp', largeur: 559, hauteur: 1530 },
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

/* La largeur de la rangée pour une rangée d'une unité de haut : la somme des
   ratios des pièces, chacun pondéré par son échelle. Passée au CSS en
   --bp-rangee, elle borne la hauteur de la bande — voir « LA HAUTEUR ». */
const LARGEUR_RANGEE = PIECES.reduce(
  (somme, p) => somme + (p.echelle ?? 1) * (p.largeur / p.hauteur),
  0,
);

const BandePromo = () => {
  // La clé de l'ancienne bande de promotion, reprise : le titre reste
  // modifiable dans l'Espace Gestion, sur la ligne qui existait déjà.
  const textes = useTexteSection('accueil-promotion', { titre: 'En vitrine' });

  return (
    <section className="bp on-dark" style={{ '--bp-rangee': LARGEUR_RANGEE.toFixed(4) }}>
      {/* Le titre, au style des autres sections : h2 centré, filet doré. Il
          est compris dans la hauteur de la bande — voir « --bp-titre ». */}
      <div className="bp-entete">
        <h2>{textes.titre}</h2>
        <span className="filet-titre" aria-hidden="true" />
      </div>

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
            /* L'échelle passe par une variable, pas par une hauteur en ligne :
               posée en ligne, elle l'emporterait sur la feuille et la pièce
               garderait la hauteur de la RANGÉE au téléphone, où elles sont
               empilées une par une. */
            style={piece.echelle ? { '--bp-echelle': piece.echelle } : undefined}
            loading="lazy"
            decoding="async"
          />
        ))}
      </div>

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
          /* La hauteur du bloc du titre, padding compris — écrite et non
             mesurée : « .bp-entete » la prend exactement, et la hauteur de la
             bande l'ajoute à celle de la rangée. « En vitrine » tient sur une
             ligne : le h2 (interlignage des titres, 1,15 ; 1,3 laisse du jeu),
             puis le filet, 1 px sous un écart de --s-4. */
          --bp-titre: calc(var(--section-y) + var(--t-h2) * 1.3 + var(--s-4) + 1px);

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
             fenêtre étroite et haute. --bp-rangee est la largeur d'une rangée
             d'une unité de haut (la somme des ratios des pièces, pondérés par
             leur échelle, calculée dans le JS) : 90 vw divisés par elle donnent
             la plus grande hauteur de rangée qui tienne. Les 10 vw restants se
             partagent entre les espaces de la rangée, un de plus que de pièces.

             À cinq pièces, la rangée est plus large que haute : même en
             1 920 × 1 080, c'est cette borne qui décide — la bande n'occupe
             plus l'écran entier, et les espaces entre pièces se resserrent.

             Le TITRE est compris dans la hauteur : la rangée prend ce qui reste
             sous lui. La borne de largeur lui ajoute donc --bp-titre — sans
             cela, le titre se paierait en taille de pièces.

             « height » et non « min-height » : la bande n'a pas de contenu qui
             puisse la pousser.

             Dans la page d'accueil paginée (Pagineur), l'écran est remplacé par
             la hauteur utile d'une page, --hp-utile : la vitrine y tient entière,
             et la largeur, par celle que laisse le sommaire (--hp-reserve, à
             gauche) : la pièce de gauche ne passe plus sous lui.

             Deux déclarations : 100vh pour les navigateurs qui ignorent svh,
             puis 100svh — la plus petite hauteur de fenêtre, barres du
             navigateur déployées : la bande n'y dépasse jamais du bord. */
          height: min(var(--hp-utile, calc(100vh - var(--bande-h, 0px) - var(--nav-h, 0px))), calc((100vw - var(--hp-reserve, 0px)) * 0.9 / var(--bp-rangee) + 2 * var(--bp-air) + var(--bp-titre)));
          height: min(var(--hp-utile, calc(100svh - var(--bande-h, 0px) - var(--nav-h, 0px))), calc((100vw - var(--hp-reserve, 0px)) * 0.9 / var(--bp-rangee) + 2 * var(--bp-air) + var(--bp-titre)));
        }

        /* « .on-dark », posé pour passer le titre et son filet en clair, pose
           aussi son fond #0F1320 et « --surface » : la double classe rend
           l'indigo du chrome, comme « .uv.on-dark » et « .ev.on-dark ». */
        .bp.on-dark { background: var(--surface-chrome); --surface: var(--surface-chrome); }

        /* Le titre, au style des autres sections de la page : h2 centré et
           filet doré (« .filet-titre »). Sa hauteur est fixée à --bp-titre,
           celle que la bande lui réserve ; le contenu se pose en bas. */
        .bp-entete {
          box-sizing: border-box;
          height: var(--bp-titre);
          padding-top: var(--section-y);
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          align-items: center;
          text-align: center;
        }

        /* Juste après « Notre catalogue » — sa place dans l'ordre actuel, à la
           demande — ou « Nos produits », sur le même indigo :
           pas de marge — elle ouvrirait une bande d'écru de 80 px entre deux
           fonds sombres — et pas de séparateur : les filets de laiton qui
           faisaient le joint ont été retirés à la demande. Adossées au
           voisinage, ces règles cessent d'elles-mêmes si l'ordre change. */
        .ev + .bp,
        .uv + .bp { margin-top: 0; }

        /* La rangée. Espaces égaux sur toute la largeur, bords compris
           (« space-evenly ») : quatre pièces, ou trois, ou six, se répartissent
           sans qu'on ait à placer chacune. L'air du haut et du bas est un
           padding ; les pièces, à 100 % de hauteur, prennent ce qui reste.

           Alignées par le BAS (« flex-end ») : tous les pieds sur la même ligne
           de sol, comme dans une vraie vitrine. Une pièce réduite par son
           « echelle » perd de la hauteur par le haut, jamais par les pieds.

           Elle remplace un placement pièce par pièce — « gauche » ou « droite »
           et un décalage en pourcentage de la largeur — qui ne tenait qu'à deux
           pièces : la largeur d'une pièce suit la HAUTEUR de l'écran, et des
           positions en pourcentage de sa largeur se chevauchaient dès que la
           fenêtre devenait étroite. */
        .bp-cadre {
          position: absolute;
          /* Sous le titre, jusqu'au bas de la bande. */
          inset: var(--bp-titre) 0 0;
          overflow: hidden;
          z-index: -2;
          display: flex;
          justify-content: space-evenly;
          align-items: flex-end;
          padding-block: var(--bp-air);
        }

        /* La pièce ENTIÈRE, de la coiffe à l'ourlet : toute la hauteur de la
           rangée, largeur déduite du ratio. Une pièce qui porte une « echelle »
           remplace cette hauteur en ligne.

           Les détourages n'ont AUCUNE marge transparente en haut : la silhouette
           commence à la première ligne de pixels (mesuré sur les quatre). Un
           ancien décalage de −4 % « pour rogner le vide au-dessus de la coiffe »
           rognait donc la coiffe.

           « height: 100% » bat le « height: auto » que styles.css pose sur
           toutes les images : la classe l'emporte sur l'élément. */
        .bp-piece {
          flex: none;
          height: calc(var(--bp-echelle, 1) * 100%);
          width: auto;
          display: block;
          /* Ni ombre portée ni lueur : le fond reste l'indigo UNIFORME de la
             page, #161B2D, jusqu'au bord des silhouettes — à la demande, pour
             que la vitrine continue la page d'accueil. L'ombre (deux passes,
             0 2px 6px à 45 % et 0 24px 48px à 50 %) et la lueur chaude du
             centre (dégradé radial, rgba(214,138,74,.12)) sont dans
             l'historique git. Les détourages, eux, sont propres : hors
             silhouette, l'écart au fond est nul, liseré d'anticrénelage mis à
             part. */
        }

        /* ── Au téléphone : une pièce à la fois ────────────────────────────
           À la demande, et au seuil des catalogues et de l'aperçu (560 px).
           En rangée, cinq silhouettes dans la largeur d'un téléphone font
           ~160 px de haut : on voit une vitrine, pas des vêtements. Empilées,
           chacune prend la hauteur de l'écran moins le titre, et l'on descend
           de l'une à l'autre.

           La bande perd donc sa hauteur calculée (« height: auto ») : c'est
           la pile qui la donne. Et la rangée sort de l'absolu — placée sous
           le titre par « inset », elle aurait recouvert la page entière. */
        @media (max-width: 560px) {
          .bp { height: auto; }
          .bp-cadre {
            position: static;
            inset: auto;
            z-index: auto;
            display: grid;
            grid-template-columns: 1fr;
            justify-items: center;
            gap: var(--s-7);
            padding: var(--bp-air) var(--page-pad) var(--s-8);
          }
          /* La pièce entière dans l'écran : la page moins le titre. La
             HAUTEUR est posée, la largeur se déduit du ratio du fichier.
             ⚠ Ne pas mettre les deux en « auto » : une image en chargement
             différé n'a alors aucune taille tant qu'elle n'est pas arrivée
             (les attributs width/height ne donnent qu'un rapport, pas une
             dimension), la bande se replie et la page saute quand les
             fichiers tombent. Mesuré : quatre pièces sur cinq à 0 × 0.

             À cette hauteur, la plus large des cinq fait 333 px — elle tient
             dans un téléphone de 400 px moins ses marges. « contain » est le
             garde-fou si une pièce plus large arrive : elle rétrécira au lieu
             de s'écraser. */
          .bp-piece {
            height: calc(var(--bp-echelle, 1) * (var(--hp-utile, calc(100svh - var(--bande-h, 0px) - var(--nav-h, 0px))) - var(--bp-titre)));
            width: auto;
            max-width: 100%;
            object-fit: contain;
          }
        }
      `}</style>
    </section>
  );
};

export default BandePromo;
