import { NavLink } from 'react-router-dom';

/**
 * Le sommaire — la carte flottante qui liste des pages.
 * ---------------------------------------------------------------------------
 * Une seule copie, à la demande. Le dessin vivait en DEUX exemplaires : la
 * page d'accueil (`home/Pagineur.jsx`, classes `.hp-sommaire-*`) et l'Espace
 * Gestion (`gestion/GestionLayout.jsx`, classes `.gl-sommaire-*`), qui l'avait
 * recopié ligne à ligne — voile, filet de laiton, numéro, trait, nom, survol,
 * anneau de focus. Deux copies d'une même carte divergent au premier réglage :
 * l'une a déjà gagné un `max-width` sur le nom que l'autre n'avait pas.
 *
 * ⚠ Ce qui est PARTAGÉ, c'est la carte : son voile, son filet, ses lignes.
 * Ce qui reste à chaque page, c'est son EMPLACEMENT — l'accueil la pose en
 * `absolute` au milieu de la hauteur de sa pagination et la masque sous
 * 900 px (les flèches des côtés prennent le relais) ; l'Espace Gestion la pose
 * en `fixed` sous les deux barres et la fait rentrer dans le flux en petit
 * écran. Une carte qui déciderait elle-même où elle se place ne servirait
 * qu'une des deux.
 *
 * ── Deux sortes d'entrées ──────────────────────────────────────────────────
 * `to` : un lien de routeur (l'Espace Gestion change de page). Sans `to`, un
 * bouton (l'accueil tourne une page sans changer d'URL). Le style s'accroche à
 * `[aria-current]`, présent dans les deux cas — « page » posé par NavLink,
 * « true » posé à la main.
 *
 * ── La tête et le pied ─────────────────────────────────────────────────────
 * Libres, parce qu'ils diffèrent : l'accueil y met ses deux chevrons
 * (`SommairePas`), l'Espace Gestion un titre en capitales de laiton.
 */

/* Un chevron de la carte — « section précédente », « section suivante ». */
export const SommairePas = ({ sens = 'haut', ...props }) => (
  <button type="button" className="som-pas" {...props}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={sens === 'haut' ? 'M6.5 14.5 12 9l5.5 5.5' : 'M6.5 9.5 12 15l5.5-5.5'} />
    </svg>
  </button>
);

/* Le titre de tête — celui de l'Espace Gestion. */
export const SommaireTete = ({ children }) => <p className="som-tete">{children}</p>;

const Ligne = ({ rang, nom }) => (
  <>
    {/* Le numéro est masqué aux lecteurs d'écran : la liste est déjà une
        <ol>, ils comptent eux-mêmes. Le nom nomme le bouton. */}
    <span className="som-num" aria-hidden="true">{String(rang).padStart(2, '0')}</span>
    <span className="som-barre" aria-hidden="true" />
    <span className="som-nom">{nom}</span>
  </>
);

const Sommaire = ({ label, entrees, tete, pied, className = '', innerRef }) => (
  <nav ref={innerRef} className={`som ${className}`.trim()} aria-label={label}>
    {tete}

    {/* Les filets n'encadrent la liste que du côté où il y a quelque chose :
        sans pied, un filet bas pendrait au ras du bord de la carte. Des
        classes explicites plutôt qu'un `:last-child` — le bloc <style> est
        lui aussi un enfant du <nav>, et il fausserait le compte. */}
    <ol className={`som-liste${tete ? '' : ' som-liste--sans-tete'}${pied ? '' : ' som-liste--sans-pied'}`}>
      {entrees.map(({ cle, nom, to, actif, onClick }, i) => (
        <li key={cle ?? to ?? `${i}-${nom}`}>
          {to ? (
            /* NavLink pose aria-current="page" sur la page courante : le style
               s'y accroche, les lecteurs d'écran l'annoncent. */
            <NavLink to={to} className="som-lien">
              <Ligne rang={i + 1} nom={nom} />
            </NavLink>
          ) : (
            <button
              type="button"
              className="som-lien"
              aria-current={actif ? 'true' : undefined}
              onClick={onClick}
            >
              <Ligne rang={i + 1} nom={nom} />
            </button>
          )}
        </li>
      ))}
    </ol>

    {pied}

    <style>{`
      /* ── La carte ──────────────────────────────────────────────────────
         Un VOILE d'indigo à 85 % et un flou, sans ombre, cerné d'un filet de
         laiton. Mesuré au pire — une photo blanche dessous, fond composé
         #333641 : écru 11,1:1, écru à 62 % (numéros et noms au repos) 5,3:1,
         laiton 5,0:1. À 82 %, le laiton tombe à 4,48:1 : NE PAS DESCENDRE
         SOUS 85 %. Chevron au survol, indigo sur laiton : 7,74:1.

         Texte à 13 px et non 11 : Fraunces, seule famille du site, se
         brouille en dessous.

         La carte ne dit pas où elle se pose : position, taille et points de
         rupture appartiennent à la page qui l'emploie. */
      .som {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        padding: 0.4rem;
        --som-encre: var(--gp-ecru-50);
        --som-encre-2: var(--text-on-dark-muted);
        --som-accent: var(--gp-brass-400);
        --som-filet: var(--line-dark);
        --som-cadre: var(--line-dark-accent);
        --som-cadre-vif: rgba(198, 164, 61, 0.5);
        --som-survol: rgba(250, 246, 238, 0.06);
        border: 1px solid var(--som-cadre);
        border-radius: var(--r-3);
        background: rgba(15, 19, 32, 0.85);
        -webkit-backdrop-filter: blur(14px);
        backdrop-filter: blur(14px);
        color: var(--som-encre);
        transition: border-color var(--dur-2) var(--ease);
      }
      .som:hover,
      .som:focus-within { border-color: var(--som-cadre-vif); }

      /* En tête, à la place d'un chevron : le nom de l'espace, en capitales
         de laiton. */
      .som-tete {
        padding: 1.2rem 1.2rem 0.8rem;
        font-family: var(--font-body);
        font-size: 1.2rem;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--som-accent);
      }

      /* Les filets n'encadrent la liste que du côté où il y a quelque chose :
         une tête ou un chevron. */
      .som-liste {
        margin: 0.4rem 0;
        padding: 0.4rem 0;
        border-block: 1px solid var(--som-filet);
        list-style: none;
      }
      .som-liste--sans-tete { margin-top: 0; border-top: 0; }
      .som-liste--sans-pied { margin-bottom: 0; border-bottom: 0; }
      .som-liste li { display: flex; }

      .som-lien {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        width: 100%;
        height: 3.6rem;
        padding: 0 1.2rem;
        border: 0;
        border-radius: var(--r-pill);
        background: none;
        color: var(--som-encre-2);
        font-family: var(--font-body);
        text-decoration: none;
        cursor: pointer;
        transition: background var(--dur-1) var(--ease), color var(--dur-1) var(--ease);
      }
      .som-lien:hover { background: var(--som-survol); color: var(--som-encre); }
      .som-lien[aria-current] { color: var(--som-encre); }

      /* Le nom, toujours affiché. Borné à 22 rem : un titre très long saisi
         en base finit en points de suspension au lieu d'élargir la carte —
         et avec elle la réserve que les pages lui gardent. */
      .som-nom {
        max-width: 22rem;
        margin-inline-start: 1.2rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 1.3rem;
        letter-spacing: 0.02em;
      }

      /* Le trait : sa place est toujours réservée, seul son tracé grandit —
         la carte garde la même largeur d'une entrée à l'autre. */
      .som-barre {
        width: 1.6rem;
        height: 2px;
        margin-inline-start: 0.8rem;
        border-radius: var(--r-pill);
        background: var(--som-accent);
        transform: scaleX(0);
        transform-origin: left;
        transition: transform var(--dur-3) var(--ease);
      }
      .som-lien:hover .som-barre { transform: scaleX(0.45); }
      .som-lien[aria-current] .som-barre { transform: scaleX(1); }

      .som-num {
        min-width: 2ch;
        font-size: 1.3rem;
        font-variant-numeric: tabular-nums;
        letter-spacing: 0.06em;
        text-align: left;
      }
      .som-lien[aria-current] .som-num {
        color: var(--som-accent);
        font-weight: 600;
      }

      .som-pas {
        display: grid;
        place-items: center;
        height: 3.2rem;
        padding: 0;
        border: 0;
        border-radius: var(--r-pill);
        background: none;
        color: var(--som-encre);
        cursor: pointer;
        transition: background var(--dur-1) var(--ease),
                    color var(--dur-1) var(--ease),
                    opacity var(--dur-2) var(--ease);
      }
      .som-pas svg { width: 1.8rem; height: 1.8rem; }
      .som-pas:hover { background: var(--som-accent); color: var(--gp-indigo-900); }
      /* Au bout de la course, le chevron pâlit sans disparaître : la carte
         garde sa forme. */
      .som-pas:disabled { opacity: 0.25; pointer-events: none; }

      /* Anneau collé à l'élément, sans décalage : il a déjà sa pilule. */
      .som-lien:focus-visible,
      .som-pas:focus-visible {
        outline: 2px solid var(--som-accent);
        outline-offset: -2px;
      }

      @media (prefers-reduced-motion: reduce) {
        .som, .som-lien, .som-barre, .som-pas { transition: none; }
      }
    `}</style>
  </nav>
);

export default Sommaire;
