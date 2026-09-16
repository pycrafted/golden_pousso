/**
 * Le chargement de la maison — l'emblème, et un filet de laiton qui tourne.
 * ---------------------------------------------------------------------------
 * C'était un anneau gris à segment doré, sur l'ancien brun `#1A1208` : rien
 * qui dise la maison, et un fond qui n'existe plus nulle part sur le site. À
 * la demande, le loader porte maintenant l'EMBLÈME de Golden Pousso sur
 * l'indigo `#161B2D`, celui de toutes les pages.
 *
 * ── Le dessin ──────────────────────────────────────────────────────────────
 * Trois gestes, et rien de plus :
 *
 *   — l'ANNEAU, un filet de laiton à 22 %, cerclant l'emblème sans le toucher.
 *     L'or est structurel dans cette maison : un filet, jamais un aplat ;
 *   — l'ARC qui court dessus, un dégradé conique masqué en anneau de 2 px. Il
 *     ne remplit pas une jauge — on ne sait pas combien de temps il reste — il
 *     dit seulement que quelque chose travaille ;
 *   — l'EMBLÈME, qui respire lentement. La pulsation est de 2,4 s, trois fois
 *     plus lente que le tour de l'arc : deux mouvements à la même cadence se
 *     liraient comme un clignotement.
 *
 * ── Ce qu'on ne voit pas ───────────────────────────────────────────────────
 * `role="status"` et un texte caché : un lecteur d'écran annonce « Chargement »
 * là où l'œil voit tourner l'arc. L'emblème est en `alt=""` — il ne porte pas
 * d'information, le texte caché la porte.
 *
 * Et si le visiteur demande moins d'animations, tout s'arrête : l'anneau reste
 * cerclé, l'emblème pleinement visible. Un écran figé vaut mieux qu'un écran
 * qui tourne pour quelqu'un que le mouvement gêne.
 *
 * ── `plein` ────────────────────────────────────────────────────────────────
 * Par défaut le loader prend tout l'écran (`position: fixed`) : c'est le
 * repli de `<Suspense>` dans App.jsx, où il remplace la page ENTIÈRE, barres
 * comprises — un bloc de 40 vh y laissait voir le fond du document au-dessus
 * et en dessous. `plein={false}` le pose dans le flux, pour une zone qui
 * charge à l'intérieur d'une page déjà dessinée.
 */

const EMBLEME = '/logo-embleme.png';

const Loader = ({ plein = true, label = 'Chargement…' }) => (
  <div className={`gp-loader${plein ? ' gp-loader--plein' : ''}`} role="status" aria-live="polite">
    <span className="gp-loader-anneau">
      <img className="gp-loader-embleme" src={EMBLEME} alt="" width="240" height="240" />
    </span>
    <span className="visually-hidden">{label}</span>

    <style>{`
      .gp-loader {
        display: grid;
        place-items: center;
        padding: var(--s-8) var(--s-5);
        background: #161B2D;
      }
      .gp-loader--plein {
        position: fixed;
        inset: 0;
        z-index: 2000;
      }
      /* Dans le flux — sous les barres, pendant qu'une page se charge : une
         hauteur minimale, sinon la page se replie sur la taille de l'emblème
         et les barres sautent vers le haut. */
      .gp-loader:not(.gp-loader--plein) {
        min-height: calc(100vh - var(--bande-h, 0px) - var(--nav-h, 0px));
      }

      .gp-loader-anneau {
        position: relative;
        display: grid;
        place-items: center;
        width: clamp(11rem, 22vw, 15rem);
        aspect-ratio: 1;
        border-radius: 50%;
      }

      /* Le cercle de fond : le filet de laiton, éteint. */
      .gp-loader-anneau::before {
        content: "";
        position: absolute;
        inset: 0;
        border: 1px solid rgba(198, 164, 61, 0.22);
        border-radius: 50%;
      }

      /* L'arc qui court : un dégradé conique, masqué en anneau de 2 px pour
         n'en garder que le bord. Sans le masque, c'est un disque qui tourne. */
      .gp-loader-anneau::after {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: conic-gradient(
          from 0deg,
          transparent 0 62%,
          rgba(198, 164, 61, 0.35) 78%,
          var(--gp-brass-400) 96%,
          transparent 100%
        );
        -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px));
        mask: radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px));
        animation: gp-loader-tour 1400ms linear infinite;
      }

      .gp-loader-embleme {
        width: 62%;
        height: auto;
        animation: gp-loader-souffle 2400ms var(--ease, ease-in-out) infinite;
      }

      @keyframes gp-loader-tour {
        to { transform: rotate(360deg); }
      }
      /* Respiration : l'emblème ne disparaît jamais — 0,55 au creux, pas 0. */
      @keyframes gp-loader-souffle {
        0%, 100% { opacity: 1;    transform: scale(1); }
        50%      { opacity: 0.55; transform: scale(0.96); }
      }

      @media (prefers-reduced-motion: reduce) {
        .gp-loader-anneau::after { animation: none; }
        .gp-loader-embleme { animation: none; opacity: 1; transform: none; }
      }
    `}</style>
  </div>
);

export default Loader;
