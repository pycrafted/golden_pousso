import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';
import Reveal from '../Reveal';
import CldImg from '../CldImg';
import useTexteSection from '../../hooks/useTexteSection';

/**
 * Le mot de la maison — ce que Golden Pousso a et que les autres n'ont pas.
 * ---------------------------------------------------------------------------
 * Tongoro, la référence sénégalaise du secteur, vend une image de marque. Ici
 * il y a un atelier réel à Pikine, des tailleurs, des mains. C'est le seul
 * actif qu'aucun concurrent ne peut copier, et cette section porte seule le
 * récit de la maison sur tout le site — la page À propos a été supprimée.
 *
 * REFONTE — de la galerie à la lettre
 * -----------------------------------
 * La section se lisait comme une page de catalogue : deux photos à gauche, un
 * bloc de texte à droite. Le seul passage de la page d'accueil où la maison
 * parle en son nom avait exactement le poids visuel d'une grille de produits.
 *
 * Elle est désormais un PANNEAU PLEINE LARGEUR, borné de deux filets de
 * laiton, sur l'écru de la page. Il a été indigo un temps ; le fond est revenu
 * à #FAF6EE à la demande, et les filets portent seuls la délimitation.
 * Trois gestes, pas un de plus :
 *
 *   1. la lettrine de laiton — l'unique endroit du site, hors hero, où la
 *      lettre elle-même devient l'ornement. C'est l'idiome natif de Fraunces,
 *      un serif old style : la capitale ouvragée en tête de paragraphe est ce
 *      pour quoi ce dessin de lettre existe ;
 *   2. le diptyque composé — une grande photo, une seconde posée par-dessus
 *      son angle, et le cadre de laiton décalé derrière elle. Deux photos qui
 *      se recouvrent forment une image ; côte à côte, elles formaient une
 *      planche-contact ;
 *   3. la signature détachée, précédée de son filet, comme au bas d'une
 *      lettre. C'est l'enseigne de la boutique, pas un quatrième paragraphe.
 *
 * Ce qui ne change pas : les mots. Le texte est celui de la maison, repris à
 * la virgule près. La refonte est de mise en page, pas d'écriture.
 *
 * ⚠ WONK n'est posé QUE sur la lettrine (72 px). Le hero reste le seul titre
 * du site à le porter : l'axe irrégulier de Fraunces est la signature du
 * seuil, le diluer sur chaque section lui ôterait tout effet.
 */

const VISUEL_SECOURS = ['/images/atailleur.webp', '/images/hero.jpg'];

/* Le lieu, écrit ici et non en base. La maison ne déménagera pas d'une saison
   à l'autre, et une valeur qui ne bouge jamais n'a pas besoin d'un formulaire
   dans l'Espace Gestion — même raisonnement que la constante ACCUEIL du hero.
   Le champ `surtitre` existe toujours en base pour cette clé ; il reste, comme
   avant la refonte, sans effet. */
const LIEU = 'Maison de couture — Dakar';

const AtelierSection = () => {
  // Les deux visuels viennent du back-office : Espace Gestion → Contenu du
  // site → « Notre savoir-faire ». Ils sont distincts de la photo de la page
  // À propos, d'où le groupe `accueil` renvoyé par l'API. Les fichiers
  // locaux ne servent que de repli tant que rien n'a été mis en ligne.
  const [visuels, setVisuels] = useState(VISUEL_SECOURS);
  const textes = useTexteSection('accueil-atelier',
    { titre: 'L’élégance africaine' });

  useEffect(() => {
    apiClient.get('/atelier-image/')
      .then(({ data }) => {
        const lot = data.accueil ?? [];
        if (!lot.length) return;
        // Chaque photo va à la place que lui donne son `order` : publier la
        // seule photo de droite ne doit pas la faire atterrir à gauche.
        const parOrdre = (n) => lot.find((i) => i.order === n)?.image_url;
        setVisuels([
          parOrdre(0) ?? VISUEL_SECOURS[0],
          parOrdre(1) ?? VISUEL_SECOURS[1],
        ]);
      })
      .catch(() => {});
  }, []);

  return (
    <section className="man">
      {/* Le panneau est un enfant de la section, et c'est LUI qui porte le
          padding vertical : la section garde intact le `padding-top:
          var(--section-y)` du rythme global, qu'aucune section ne redéfinit.
          Pleine largeur, donc `--r-0` : un rayon contre le bord de la fenêtre
          y ferait une encoche.

          Fond écru, comme la page : le panneau ne se distingue plus par sa
          couleur mais par ses deux filets de laiton, en haut et en bas. */}
      <div className="man-panneau">
        <div className="container man-grille">

          <Reveal className="man-texte" variant="up">
            <p className="eyebrow man-lieu">{LIEU}</p>

            <h2 className="man-titre">{textes.titre}</h2>

            {/* Texte fourni par la maison, repris mot pour mot. Ne pas le
                réécrire : c'est sa parole, pas la nôtre. La lettrine est
                posée en CSS sur ::first-letter — aucun mot n'est découpé dans
                le JSX, le paragraphe reste sélectionnable d'un seul tenant. */}
            <div className="man-prose">
              <p>
                Golden Pousso est une maison de couture spécialisée dans la
                création et la vente de mode africaine haut de gamme. À travers
                des créations élégantes et raffinées, nous associons le
                savoir-faire de la couture africaine à une touche de modernité.
              </p>
              <p>
                Nos collections proposent des boubous pour hommes et femmes,
                ainsi qu’une sélection de chaussures, sacs à main et bijoux
                soigneusement choisis pour sublimer chaque style.
              </p>
              <p>
                Chez Golden Pousso, chaque création est une célébration de
                l’élégance, de l’authenticité et de la richesse de la mode
                africaine.
              </p>
            </div>

            <p className="man-signature">
              <span className="man-signature-filet" aria-hidden="true" />
              Golden Pousso, la couture africaine autrement&#8239;!
            </p>

            {/* La section se terminait sur la signature, sans porte de
                sortie : le visiteur venait d'apprendre ce qu'est la maison et
                n'avait que le bouton « retour » du navigateur pour agir. */}
            <Link to="/boutique" className="link-reveal man-lien">
              Découvrir les créations
              <i className="bx bx-right-arrow-alt" aria-hidden="true" />
            </Link>
          </Reveal>

          {/* Deux photos du même lieu et de la même lumière : sorties de deux
              décors différents, la paire se lirait comme deux emprunts. */}
          <Reveal className="man-visuels" variant="scale" delay={140}>
            <div className="media man-visuel-a">
              <CldImg src={visuels[0]} alt="L’atelier Golden Pousso à Pikine"
                   sizes="(max-width: 900px) 92vw, 32vw" widths={[400, 800]} />
            </div>

            {/* Le cadre est un frère de la petite photo, pas sa bordure : il
                doit DÉBORDER d'elle pour se voir, ce qu'un `border` posé sur
                un `.media` (overflow: hidden) ne peut pas faire. */}
            <span className="man-cadre" aria-hidden="true" />
            <div className="media man-visuel-b">
              <CldImg src={visuels[1]} alt=""
                   sizes="(max-width: 900px) 58vw, 19vw" widths={[400, 800]} />
            </div>
          </Reveal>

        </div>
      </div>

      <style>{`
        /* ── Le panneau ────────────────────────────────────────────────────
           Fond écru — la valeur de « --surface », soit #FAF6EE, celui de la page.
           Ce sont les deux filets de laiton, en haut et en bas, qui délimitent
           la bande : l'or reste structurel, il borne au lieu de décorer.

           L'espace intérieur est plus serré que du temps où le panneau était
           indigo. Un aplat sombre porte 128 px de vide sans qu'on les
           remarque ; sur un écru continu, les mêmes 128 px s'ajoutent aux 80
           du rythme de section et ouvrent un trou de près de 200 px au-dessus
           du titre, que plus aucun changement de couleur ne justifie. */
        /* Quand la section suit directement le hero, son espace du haut est
           resserré. Le hero finit en dégradé vers un aplat d'écru franc, et
           cette zone vide fait DÉJÀ la séparation : la reprendre en entier
           par-dessus la compte deux fois, et le panneau tombe trop bas.

           La règle est adossée au voisinage (« le hero, puis nous ») plutôt
           qu'écrite en dur sur .man : déplacée ailleurs dans la page, la
           section retrouve seule le rythme commun, sans qu'on ait à y
           repenser. C'est cette section-ci qui hérite du resserrement que
           portait « En mouvement » du temps où elle suivait le hero. */
        main > section:first-of-type + .man { padding-top: var(--s-6); }

        .man-panneau {
          background: var(--surface);
          border-radius: var(--r-0);
          border-block: 1px solid var(--line-accent);
          padding-block: clamp(var(--s-7), 6vw, var(--s-8));
        }

        /* Colonne de texte plus large que celle des photos : c'est la parole
           qui mène cette section, les photos l'accompagnent. La gouttière est
           généreuse — la petite photo vient y mordre. */
        .man-grille {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: clamp(var(--s-7), 7vw, var(--s-10));
          align-items: center;
        }

        /* ── La colonne de texte ───────────────────────────────────────── */
        .man-texte { display: flex; flex-direction: column; }

        /* Le filet qui précède le lieu remplace le sur-titre encadré : un
           trait suffit à poser la ligne sans lui donner le poids d'un titre. */
        .man-lieu {
          display: flex;
          align-items: center;
          gap: var(--s-3);
        }
        .man-lieu::before {
          content: "";
          width: 3.2rem;
          height: 1px;
          background: var(--text-accent);
          flex: none;
        }

        /* Une taille de h1 pour un h2 : c'est la seule prise de parole de la
           page, elle doit peser plus qu'un intitulé de rayon. Le niveau reste
           h2 — la hiérarchie du document n'a pas à suivre la typographie. */
        .man-titre {
          margin-top: var(--s-4);
          font-size: var(--t-h1);
          line-height: var(--lh-tight);
          letter-spacing: var(--ls-display);
          max-width: 12ch;
        }

        .man-prose {
          margin-top: var(--s-6);
          display: flex;
          flex-direction: column;
          gap: var(--s-4);
        }
        .man-prose p {
          color: var(--text-muted);
          /* 52 caractères : la mesure confortable en français. Au-delà, l'œil
             perd la ligne suivante au retour chariot. */
          max-width: 52ch;
        }

        /* ── La lettrine ───────────────────────────────────────────────────
           72 px, laiton, WONK actif — bien au-dessus des 40 px en dessous
           desquels l'axe irrégulier se lit comme un défaut de rendu.
           « line-height: 0.76 » cale le sommet de la capitale sur la première
           ligne ; sans cela elle flotte au-dessus du texte. « ::first-letter »
           n'accepte qu'un jeu restreint de propriétés : le flottement, les
           marges et les propriétés de fonte en font partie. */
        .man-prose p:first-of-type::first-letter {
          float: left;
          font-family: var(--font-display);
          font-size: 7.2rem;
          font-weight: 400;
          font-variation-settings: "WONK" 1;
          line-height: 0.76;
          color: var(--text-accent);
          margin: 0.8rem var(--s-3) 0 0;
        }

        /* ── La signature ──────────────────────────────────────────────────
           L'enseigne de la boutique, traitée comme le bas d'une lettre : son
           filet, puis la phrase en laiton. */
        .man-signature {
          margin-top: var(--s-6);
          font-family: var(--font-display);
          font-size: var(--t-h3);
          font-style: italic;
          line-height: 1.3;
          color: var(--text-accent);
          max-width: 22ch;
        }
        .man-signature-filet {
          display: block;
          width: 6.4rem;
          height: 1px;
          background: var(--text-accent);
          margin-bottom: var(--s-4);
        }

        .man-lien {
          align-self: flex-start;
          margin-top: var(--s-6);
          display: inline-flex;
          align-items: center;
          gap: var(--s-2);
          font-size: var(--t-xs);
          font-weight: 600;
          letter-spacing: var(--ls-button);
          text-transform: uppercase;
          color: var(--text);
        }
        .man-lien i { font-size: 1.8rem; }

        /* ── Le diptyque ───────────────────────────────────────────────────
           La grande photo occupe la colonne ; la petite est posée sur son
           angle bas-gauche et mord dans la gouttière, donc vers le texte. */
        .man-visuels { position: relative; }

        .man-visuel-a { aspect-ratio: 2 / 3; }

        .man-visuel-b {
          position: absolute;
          left: calc(-1 * clamp(var(--s-5), 4vw, var(--s-8)));
          bottom: calc(-1 * var(--s-6));
          width: 56%;
          aspect-ratio: 3 / 4;
          /* L'anneau d'indigo détache la petite photo de la grande : sans lui
             les deux tissus se touchent et la superposition devient un
             collage. Il reprend « --surface », le fond du panneau. */
          box-shadow: 0 0 0 0.9rem var(--surface);
        }

        /* Le cadre décalé — un filet de laiton qui dépasse en bas à droite.
           Il reprend la mesure exacte de la petite photo, translatée. */
        .man-cadre {
          position: absolute;
          left: calc(-1 * clamp(var(--s-5), 4vw, var(--s-8)));
          bottom: calc(-1 * var(--s-6));
          width: 56%;
          aspect-ratio: 3 / 4;
          border: 1px solid var(--line-accent);
          border-radius: var(--r-3);
          transform: translate(1.4rem, 1.4rem);
        }

        /* Les deux photos respirent ensemble au survol de la paire : animer
           la seule survolée ferait glisser une image sous l'autre. */
        .man-visuels img { transition: transform 1100ms var(--ease); }
        .man-visuels:hover img { transform: scale(1.05); }

        @media (max-width: 900px) {
          .man-grille {
            grid-template-columns: 1fr;
            gap: var(--s-8);
          }
          /* Les photos passent devant : en petit écran, un mur de texte en
             tête de section n'invite pas à descendre. */
          .man-visuels { order: -1; }
          /* 3/4 et non 2/3 : en pleine largeur, une photo au ratio 2/3
             occuperait à elle seule plus d'un écran de haut. */
          .man-visuel-a { aspect-ratio: 3 / 4; }
          /* Plus de position absolue : la petite photo remonte sur la grande
             par une marge négative et se cale à droite. Le chevauchement
             survit, la hauteur du bloc reste calculable. */
          .man-visuel-b {
            position: static;
            width: 52%;
            margin: calc(-1 * var(--s-7)) 0 0 auto;
          }
          .man-cadre { display: none; }
          .man-titre { max-width: none; }
          .man-signature { max-width: none; }
        }

        @media (max-width: 520px) {
          .man-prose p:first-of-type::first-letter {
            font-size: 5.6rem;
            margin-right: var(--s-2);
          }
        }
      `}</style>
    </section>
  );
};

export default AtelierSection;
