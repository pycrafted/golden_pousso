import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';

/**
 * Page introuvable.
 * ---------------------------------------------------------------------------
 * Refaite dans le vocabulaire du site, à la demande : elle se dessinait à sa
 * façon, avec sa propre palette en dur (`#B8960A`, `#111111`, `#2A2A2A`) et
 * une trentaine de styles en ligne. Elle emprunte maintenant ce que les autres
 * pages emploient déjà :
 *
 *   — le TITRE et son FILET de l'en-tête des catalogues (`.catalogue-titre`,
 *     `.filet-titre`) — le même titre que la boutique, les rayons, les favoris ;
 *   — le CHAPÔ `.lead`, la voix des paragraphes d'introduction ;
 *   — les BOUTONS `.btn` du site : laiton pour la boutique, contour pour
 *     l'accueil. Ils étaient deux rectangles à angles vifs, l'un laiton plein
 *     virant terre cuite au survol, l'autre cerné de gris.
 *
 * ── L'état vide, en trois morceaux ─────────────────────────────────────────
 * Le constat (« Page introuvable »), la phrase, l'action — la règle des pages
 * de catalogue. La rangée de liens rapides qui fermait la page a été retirée :
 * elle proposait « Accueil » et « Boutique », c'est-à-dire exactement les deux
 * boutons posés juste au-dessus.
 *
 * ── Les ciseaux ────────────────────────────────────────────────────────────
 * À la demande, les trois étoiles « ✦ ✦ ✦ » sont remplacées par les CISEAUX de
 * la bande de coordonnées (`bx-cut`, laiton) : le geste qui dit le métier, déjà
 * employé en haut de chaque page pour séparer adresse, téléphone et e-mail.
 * Purement décoratifs, donc `aria-hidden` — un lecteur d'écran n'annonce pas
 * trois fois « ciseaux ».
 *
 * ── Le grand 404 ───────────────────────────────────────────────────────────
 * Il reste, en filigrane de laiton derrière la page. C'est une image, pas un
 * texte : le titre dit déjà la chose, et le nombre est donc masqué aux lecteurs
 * d'écran. Il porte `.wonk` — l'axe irrégulier de Fraunces, réservé aux
 * très grands corps (≥ 40 px), comme le `<h1>` du hero.
 *
 * ⚠ Pas de fond ni de couleur posés ici : la page vit dans le `Layout`, dont
 * le `<main class="site-page on-dark">` peint déjà l'indigo et bascule les
 * tokens. Elle ne prend que la hauteur qui reste sous les deux barres
 * collantes (`--bande-h` + `--nav-h`) — en `100vh`, elle débordait d'autant.
 */

const Page404 = () => (
  <>
    <SEOHead title="Page introuvable" url="/404" noindex />

    <section className="p404">
      <p className="p404-numero wonk" aria-hidden="true">404</p>

      <p className="p404-ciseaux" aria-hidden="true">
        <i className="bx bx-cut" />
        <i className="bx bx-cut" />
        <i className="bx bx-cut" />
      </p>

      <h1 className="catalogue-titre">Page introuvable</h1>
      <span className="filet-titre" aria-hidden="true" />

      <p className="lead p404-texte">
        La page que vous cherchez n&apos;existe pas ou a été déplacée. Explorez
        notre boutique, ou retournez à l&apos;accueil.
      </p>

      <div className="p404-actions">
        <Link to="/boutique" className="btn btn--accent">Voir la boutique</Link>
        <Link to="/" className="btn btn--ghost">Accueil</Link>
      </div>
    </section>

    <style>{`
      .p404 {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        /* La hauteur qui reste sous la bande de coordonnées et la barre de
           navigation, toutes deux collantes. */
        min-height: calc(100vh - var(--bande-h, 0px) - var(--nav-h, 0px));
        padding: var(--s-9) var(--page-pad);
        text-align: center;
      }

      /* Le nombre en filigrane : du laiton qui s'éteint vers le bas, jamais un
         aplat. Il n'est pas là pour être lu — d'où l'opacité basse et le
         aria-hidden ; le titre porte le sens. */
      .p404-numero {
        margin: 0;
        font-family: var(--font-display);
        font-size: clamp(9rem, 18vw, 16rem);
        font-weight: 600;
        line-height: 0.9;
        letter-spacing: -0.04em;
        background: linear-gradient(
          180deg,
          color-mix(in srgb, var(--gp-brass-400) 22%, transparent) 0%,
          color-mix(in srgb, var(--gp-brass-400) 4%, transparent) 100%
        );
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        user-select: none;
      }

      /* Les ciseaux de la bande, en ponctuation sous le nombre. */
      .p404-ciseaux {
        display: flex;
        justify-content: center;
        gap: var(--s-5);
        margin: var(--s-5) 0 var(--s-7);
        font-size: 2rem;
        line-height: 1;
        color: var(--gp-brass-400);
      }

      .p404-texte { margin: var(--s-6) auto 0; max-width: 46rem; }

      .p404-actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: var(--s-4);
        margin-top: var(--s-8);
      }

      @media (max-width: 767px) {
        .p404 { padding-block: var(--s-8); }
        .p404-ciseaux { gap: var(--s-4); font-size: 1.8rem; }
        /* Sous 767 px, un bouton .btn prend toute la largeur (règle du
           site) : la rangée se borne pour que les deux boutons empilés
           restent à la mesure du texte plutôt qu'à celle de l'écran.
           ⚠ Pas d'accent grave dans ce bloc : il fermerait le gabarit JS. */
        .p404-actions { width: min(32rem, 100%); }
      }
    `}</style>
  </>
);

export default Page404;
