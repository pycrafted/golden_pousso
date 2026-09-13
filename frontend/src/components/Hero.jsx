import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TABLEAUX_HERO, LARGEUR_TABLEAU } from '../constants/hero';

/**
 * Hero — l'accueil, en pleine largeur.
 * ===========================================================================
 * C'est le dessin de la bande promotionnelle (`FullWidthBanner`, supprimée),
 * porté à l'échelle du hero : la photo occupe TOUTE la surface, les deux
 * silhouettes détourées se tiennent à gauche et à droite, la parole se pose
 * au centre entre elles.
 *
 * ⚠ LE HERO N'ANNONCE PLUS DE PROMOTION. Il salue, et rien d'autre. Il a
 * porté la campagne du moment — titre, occasion, rabais, décompte des
 * derniers jours — lue sur `/hero-promotion/` ; retiré à la demande.
 *
 * La campagne n'a d'abord plus été annoncée qu'à un autre endroit,
 * `components/BandePromo.jsx` — deux formulations d'une seule offre sur le
 * même écran se lisaient comme deux offres. Cette bande est depuis devenue
 * une vitrine sans texte, à la demande. ⚠ LE SITE N'ANNONCE DONC PLUS AUCUNE
 * PROMOTION : une campagne saisie dans l'admin ne s'affiche nulle part.
 *
 * Pour la remettre : le hero lisait `/hero-promotion/`, gardait la réponse en
 * état, et basculait sur le texte ci-dessous quand elle était vide ou la date
 * de fin passée. La mécanique complète — lecture, échéance, décompte — se
 * relit dans l'historique git :
 * `git show 5f67b1d:frontend/src/components/BandePromo.jsx`.
 *
 * ⚠ Ce n'est PAS la mise en page de l'ancien hero. Celui-ci partageait
 * l'écran en deux colonnes — parole à gauche sur fond indigo, photo à droite —
 * et la photo n'était qu'un panneau. Ici il n'y a plus de panneau : l'image
 * est le fond, et le texte est dessus.
 *
 * ── Ce que l'image doit être ───────────────────────────────────────────────
 * Elle est COMPOSÉE pour cette mise en page, ce n'est pas une photo
 * quelconque : deux silhouettes détourées sur fond indigo plein, posées à
 * 22 % et 80 % de la largeur, le milieu laissé libre pour la parole. Toutes
 * deux recadrées sous les mains, jamais en pied — à cette taille, une
 * silhouette entière devient minuscule.
 *
 * Les tableaux sont des fichiers du front, listés dans `constants/hero.js`.
 * Sans eux il reste l'indigo plein : la parole tient seule, elle ne dépend
 * pas de l'image.
 *
 * ── La photo disparaît sous 768 px, et c'est voulu ─────────────────────────
 * Le hero y devient un portrait étroit. Un recadrage cover sur une image
 * large n'en garderait que la colonne centrale — c'est-à-dire précisément la
 * partie laissée VIDE pour le texte, les deux silhouettes tombant hors cadre
 * des deux côtés. Mieux vaut l'indigo franc qu'un fond amputé de son sujet.
 *
 * ── La parole ──────────────────────────────────────────────────────────────
 * Trois niveaux, du plus fort au plus discret :
 *   1. l'emblème de la maison ;
 *   2. le salut, en dégradé écru → laiton → écru, souligné du filet doré ;
 *   3. l'action.
 *
 * Elle ne dépend plus de rien : ni requête, ni horloge, ni date. Le hero rend
 * la même chose au premier octet et six mois plus tard, et il ne peut plus
 * rouiller faute d'avoir quoi que ce soit à périmer.
 */

/* Emblème de la maison, en tête du hero. Redimensionné à 240 px depuis
   l'original de 1 254 px : il s'affiche autour de 110 px, et les 1,8 Mo du
   fichier source auraient pesé sur la ligne de flottaison. */
const LOGO = '/logo-embleme.png';

/* Ce que le hero dit. Tout ce qu'il dit.
   ---------------------------------------------------------------------------
   Ce texte est ecrit ici et non en base : il ne change pas d'une saison a
   l'autre, et une valeur qui ne bouge jamais n'a pas besoin d'un formulaire
   dans l'Espace Gestion. C'etait deja le cas quand il n'etait que l'etat de
   repos du hero ; c'est maintenant son seul etat. */
const ACCUEIL = {
  /* ⚠ UNE SEULE LIGNE. La promesse « L'élégance africaine, réinventée pour
     vous » a été retirée : le hero d'accueil ne dit donc plus ce que fait la
     maison, il salue et il ouvre la boutique. La phrase vit encore dans la
     section « L'élégance africaine réinventée », plus bas dans la page.

     « accroche » désigne l'habit, pas le rang : c'est la ligne en dégradé
     écru → laiton → écru. Ici elle est SEULE, donc elle porte le <h1>. */
  accroche: 'Bienvenue chez Golden Pousso',
  lien: '/boutique',
  libelleLien: 'Découvrir la boutique',
};

const Hero = () => {
  /* Les tableaux ne sont plus chargés : ce sont des fichiers du front, servis
     par le CDN de Vercel, listés dans constants/hero.js. Un seul élément
     donnerait un hero fixe ; à partir de deux ils s'enchaînent.

     Ils venaient de l'API et de Cloudflare R2. Sans domaine personnalisé, R2
     ne sert que par son adresse r2.dev, que Cloudflare bride volontairement :
     un tableau sur cinq n'arrivait pas et le hero affichait un carré cassé. */
  const [tableau, setTableau] = useState(0);

  /* Le défilé. Un tableau toutes les six secondes — assez pour lire la
     parole posée dessus, assez court pour qu'on voie que ça bouge.

     L'horloge ne démarre pas s'il n'y a qu'une image : un intervalle qui
     ramène toujours à zéro réveille l'onglet pour rien.

     ⚠ Il ne démarre pas non plus si le visiteur a demandé moins d'animations
     (prefers-reduced-motion). Un fond qui change tout seul est du mouvement
     non sollicité : pour qui souffre de troubles vestibulaires, c'est
     exactement ce que ce réglage demande d'éviter. Il voit alors le premier
     tableau, fixe. */
  useEffect(() => {
    if (TABLEAUX_HERO.length < 2) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const horloge = setInterval(
      () => setTableau((n) => (n + 1) % TABLEAUX_HERO.length),
      6000,
    );
    return () => clearInterval(horloge);
  }, []);

  return (
    <section className="hero">
      {/* Un <img> nu et non CldImg : ces fichiers ne sont plus des médias du
          backend mais des fichiers du front, servis tels quels. Il n'y a
          aucune URL à transformer, et une seule largeur — voir hero.js.

          Tous les tableaux sont rendus et superposés ; seul celui du moment
          est opaque. C'est ce qui permet le fondu ENCHAÎNÉ : échanger le src
          d'une seule image ferait disparaître l'ancienne avant que la nouvelle
          n'arrive, et le hero clignoterait au fond indigo.

          Corollaire : tous se chargent, pas seulement le premier. Seul le
          premier est en `eager` — c'est lui qui compte pour la ligne de
          flottaison ; les suivants attendent que le navigateur ait le temps. */}
      {TABLEAUX_HERO.map((src, i) => (
        <span
          key={src}
          className={i === tableau ? 'hero-calque hero-calque--vu' : 'hero-calque'}
          aria-hidden="true"
        >
          <img
            className="hero-fond"
            src={src}
            alt=""
            width={LARGEUR_TABLEAU}
            height={1037}
            loading={i === 0 ? 'eager' : 'lazy'}
            decoding="async"
          />
        </span>
      ))}

      {/* Le fondu du bas. Il est rendu MEME sans photo : sous 768 px le calque
          d'image disparaît, l'aplat indigo reste, et c'est justement là que la
          cassure avec l'écru serait la plus franche. */}
      <span className="hero-fondu-bas" aria-hidden="true" />

      <div className="hero-contenu">
        {/* Attribut alt vide : le nom de la maison est déjà annoncé par la
            barre de navigation et par le titre de la page — le répéter ferait
            une troisième annonce au lecteur d'écran. width/height sont posés
            pour réserver la place avant le chargement, sinon le titre saute
            vers le haut à l'arrivée de l'image. */}
        <img className="hero-logo" src={LOGO} alt="" width="110" height="110" />

        {/* Un <h1> et non un <p> : c'est la seule parole du hero, la page
            doit avoir un titre pour un moteur de recherche comme pour un
            lecteur d'écran. Le dégradé vit sur le <span>, le <h1> ne porte
            que la mise en page — l'habit ne change pas parce que la balise
            change.

            Pas de classe `.wonk` ici. L'axe WONK de Fraunces n'a de sens
            au-delà de 40 px seulement ; ce titre part de 2,2 rem, soit 35 px
            en petit écran, où l'irrégularité se lirait comme un défaut de
            rendu plutôt que comme un parti pris. */}
        <h1 className="hero-offre">
          <span className="hero-accroche">{ACCUEIL.accroche}</span>
        </h1>
        <span className="filet-titre" aria-hidden="true" />

        <Link to={ACCUEIL.lien} className="btn btn--accent btn--auto hero-action">
          {ACCUEIL.libelleLien}
        </Link>
      </div>

      <style>{`
        .hero {
          position: relative;
          isolation: isolate;
          /* Le cadre découpe : c'est lui qui rend le débord du calque
             invisible sur les bords. */
          overflow: hidden;
          /* La hauteur de l'ancien hero, conservée. */
          min-height: 100vh;
          display: grid;
          place-items: center;
          /* ↓ LA HAUTEUR DE LA PAROLE SE RÈGLE PAR LE PADDING DU BAS.

             Le bloc est centré dans la BOÎTE de contenu, pas dans la section :
             donner plus d'espace en bas qu'en haut le fait donc remonter
             d'autant, sans toucher au centrage ni sortir la parole du flux.
             Une marge négative ou un « translateY » l'auraient déplacée sans que
             la grille le sache, et elle aurait pu mordre sur la barre de
             navigation en petit écran.

             18vh et non une valeur fixe : sur un écran court, un décalage en
             pixels mangerait une part bien plus grande de la hauteur. */
          padding: var(--s-8) var(--s-5) calc(var(--s-8) + 18vh);
          /* Le même indigo que la bande de coordonnées, la barre de
             navigation et le pied de page. Il se voit là où la photo ne va
             pas : sous 768 px, où le calque est masqué, et tant que l'image
             n'est pas chargée — un fond qui change de ton au moment où la
             photo arrive se remarque. */
          background: var(--surface-chrome);
        }

        /* AUCUN débord vertical. Le calque déborde-t-il en haut, et les
           têtes — posées à 1 px du bord haut de l'image — passent hors cadre.
           Elles doivent affleurer la barre de navigation : le bord haut de
           l'image est donc collé au bord haut du hero.

           « object-position: center top » va avec : en recadrage « cover »,
           c'est
           lui qui décide quel bord est sacrifié. Au centre, la coupe se
           répartissait en haut ET en bas, et reprenait quelques pixels de
           tête. Ancré en haut, tout le rognage vertical se fait par le bas,
           où il n'y a que le bas des boubous — qui sort du cadre de toute
           façon. */
        .hero-calque {
          position: absolute;
          inset: 0;
          z-index: -2;
          /* Invisible par défaut, et SANS pointer-events à gérer : les calques
             sont déjà sous la parole. La durée est longue — 1,2 s — parce
             qu'un fondu court sur une pleine page se lit comme un à-coup. */
          opacity: 0;
          transition: opacity 1200ms var(--ease);
        }
        .hero-calque--vu { opacity: 1; }

        @media (prefers-reduced-motion: reduce) {
          .hero-calque { transition: none; }
        }
        .hero-fond {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
        }

        /* Le bas du hero se dissout dans la page.
           ------------------------------------------------------------------
           L'indigo s'arrêtait net contre l'écru de la section suivante : une
           ligne horizontale en travers de l'écran, là où il n'y a rien à
           séparer. Le dégradé va vers « --surface », le fond du document, et non
           vers une couleur écrite en dur : le jour où la section suivante
           change de fond, il suffira de faire pointer ce token.

           z-index -1 : au-dessus de la photo (-2), sous la parole (flux
           normal). Le texte est centré, il ne descend pas jusque-là — mais si
           une campagne l'allongeait, il resterait lisible par-dessus.

           ↓ L'INTENSITÉ SE RÈGLE SUR CES DEUX NOMBRES.
           « height » dit où le fondu commence — 30 %, donc aux deux tiers de la
           hauteur du hero. La position du premier « --surface » dit à quelle
           vitesse il se ferme : à 70 %, l'écru est PLEIN bien avant le bord,
           et le dernier tiers du calque est un aplat franc. C'est ce qui
           donne un bas dense plutôt qu'une teinte qui s'éclaircit encore au
           moment où elle touche la section suivante.

           Deux stops de la même couleur et non un seul : entre le premier et
           le second, il n'y a plus rien à interpoler, la bande reste opaque.
           Avec un stop unique à 100 %, la montée est linéaire sur toute la
           hauteur et le raccord reste visible. */
        .hero-fondu-bas {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 30%;
          z-index: -1;
          pointer-events: none;
          background: linear-gradient(
            to bottom,
            transparent 0%,
            var(--surface) 70%,
            var(--surface) 100%
          );
        }

        /* La photo est composée sur fond indigo plein : elle porte donc son
           propre contraste et n'a pas besoin d'un voile qui la ternirait. Une
           ombre portée sur le texte suffit à le tenir si le sujet remonte. */
        .hero-contenu :where(h1, p) {
          text-shadow: 0 1px 10px rgba(15, 19, 32, 0.5);
        }

        /* La parole se pose entre les deux silhouettes. Bornée en largeur pour
           qu'elle ne vienne toucher ni l'une ni l'autre.

           38ch et non 30 : « Bienvenue chez Golden Pousso » tomberait sur
           quatre lignes dans la largeur qui suffisait au mot « Promotion ». */
        .hero-contenu {
          text-align: center;
          max-width: 38ch;
        }

        /* Le filet doit virer au laiton clair ici : sur fond sombre, la
           variante « fond clair » du token disparaîtrait. On redéfinit le
           token localement plutôt que de coder la teinte en dur dans la
           primitive. */
        .hero .filet-titre { --text-accent: var(--gp-brass-400); }

        /* display: block est nécessaire — une image est en ligne par défaut,
           et margin-inline: auto ne centre pas un élément en ligne. Posé tel
           quel, sans cadre : l'emblème est déjà cerclé, l'enfermer dans une
           pastille ferait deux cercles concentriques. */
        .hero-logo {
          display: block;
          width: clamp(7.2rem, 9vw, 11rem);
          height: auto;
          margin: 0 auto var(--s-5);
        }

        /* Le salut. Il suit l'emblème, et le filet le suit.

           Le nom de classe date de l'époque où cette ligne portait l'offre
           d'une campagne, sous un titre qui n'existe plus. Elle a gardé son
           habit — le dégradé doré — en devenant la seule parole du hero. */
        .hero-offre {
          max-width: 26ch;
          margin: var(--s-4) auto 0;
          font-family: var(--font-display);
          font-size: clamp(2.2rem, 3.6vw, 3.6rem);
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: -0.02em;
          text-wrap: balance;
          color: var(--gp-ecru-50);
        }

        /* Dégradé découpé dans les lettres. Repli en couleur pleine : sans le
           @supports, un navigateur sans background-clip afficherait du texte
           transparent, donc invisible. */
        .hero-accroche {
          display: block;
          color: var(--gp-brass-400);
        }
        @supports (-webkit-background-clip: text) or (background-clip: text) {
          .hero-accroche {
            background: linear-gradient(
              to right,
              var(--gp-ecru-50),
              var(--gp-brass-400) 50%,
              var(--gp-ecru-50)
            );
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
          }
        }

        .hero-offre + .filet-titre { margin-top: var(--s-4); }

        .hero-action { margin-top: var(--s-7); }

        @media (max-width: 768px) {
          .hero { padding: var(--s-8) var(--s-4); }
          /* La photo disparaît : le hero devient un portrait étroit, et un
             recadrage cover n'en garderait que la colonne centrale — celle
             qu'on a justement laissée vide. Les deux silhouettes tomberaient
             hors cadre. */
          .hero-calque { display: none; }
          .hero-contenu { max-width: 100%; }
        }
      `}</style>
    </section>
  );
};

export default Hero;
