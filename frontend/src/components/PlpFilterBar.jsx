import { useState, useEffect, useRef, useCallback } from 'react';
import useSettingsStore, { formatPrice } from '../store/settingsStore';

/* ── Barre de filtres — page catégorie ───────────────────────────────────────
 *
 * Remplace la colonne de filtres qui mangeait 28 rem à gauche de la grille.
 * Les pièces récupèrent la pleine largeur, la grille passe à quatre colonnes,
 * et les filtres se posent en une rangée au-dessus.
 *
 * PRINCIPE — on ne dessine que des filtres qui trouveront quelque chose. Les
 * facettes (`/products/facets/`) disent, rayon par rayon, entre quels prix il
 * vend et combien de pièces y sont épuisées, en solde ou nouvelles ; une
 * bascule dont le compte est à zéro n'est pas rendue. C'est ce qui évite les
 * filtres décoratifs : un « En promotion » sur un rayon qui n'a rien en solde
 * ne fait que promettre une page vide.
 *
 * Ce qui n'est PAS ici, et pourquoi :
 * — Femme / Homme. La maison sépare déjà ses vêtements en rayons (« Vêtement
 *   pour Femme », « Vêtement pour Homme ») : le filtre re-poserait, dans une
 *   page, la question à laquelle cette page est la réponse.
 * — Taille et couleur. L'API sait les filtrer, mais seules les chaussures
 *   portent des variantes en base ; sur les autres rayons la liste serait
 *   vide. À rebrancher le jour où les variantes sont saisies partout — le
 *   filtre backend existe déjà (`size`, `color`).
 */

/* Ferme un panneau au clic extérieur et à Échap. Les deux, pas l'un ou
   l'autre : le clic sert la souris, Échap sert le clavier, et un panneau qui
   ne se referme qu'à la souris piège la tabulation. */
const useFermeture = (ref, ouvert, fermer) => {
  useEffect(() => {
    if (!ouvert) return;
    const auClic = (e) => { if (ref.current && !ref.current.contains(e.target)) fermer(); };
    const auClavier = (e) => { if (e.key === 'Escape') fermer(); };
    document.addEventListener('mousedown', auClic);
    document.addEventListener('keydown', auClavier);
    return () => {
      document.removeEventListener('mousedown', auClic);
      document.removeEventListener('keydown', auClavier);
    };
  }, [ref, ouvert, fermer]);
};

/* Pastille ronde du chevron : ▾ fermé, ▴ ouvert. */
const Chevron = ({ ouvert }) => (
  <svg
    width="12" height="12" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: ouvert ? 'rotate(180deg)' : 'none', transition: 'transform var(--dur-2) var(--ease)' }}
    aria-hidden="true"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

/* ── Curseur de prix à deux poignées ─────────────────────────────────────────
 *
 * Deux `input[type=range]` superposés plutôt qu'un composant maison en
 * pointeurs : le navigateur donne gratuitement le clavier (flèches, Origine,
 * Fin), le tactile et les rôles ARIA, qu'une poignée en `div` oblige à
 * réécrire — mal, en général.
 *
 * Le prix ne remonte qu'au RELÂCHEMENT. Émettre à chaque pixel déclencherait
 * une requête par mouvement de souris ; l'affichage, lui, suit le doigt en
 * direct grâce à l'état local.
 */
export const PriceRangeSlider = ({ bas, haut, pas, min, max, onChange }) => {
  const currency = useSettingsStore((s) => s.currency);
  const [duo, setDuo] = useState([min, max]);

  /* Le parent reste la source de vérité : retour arrière du navigateur,
     « Tout effacer » ou chip retirée doivent replacer les poignées.

     Recalage PENDANT le rendu et non dans un effet. Un effet ne s'exécute
     qu'après la peinture : les poignées s'afficheraient une image à l'ancienne
     position avant de sauter. React réexécute simplement ce rendu-ci, rien
     n'atteint l'écran entre-temps.
     https://react.dev/reference/react/useState#storing-information-from-previous-renders */
  const [borneVue, setBorneVue] = useState([min, max]);
  if (borneVue[0] !== min || borneVue[1] !== max) {
    setBorneVue([min, max]);
    setDuo([min, max]);
  }

  const [a, b] = duo;
  const etendue = Math.max(haut - bas, 1);
  const pct = (v) => ((Math.min(Math.max(v, bas), haut) - bas) / etendue) * 100;

  /* Les poignées ne se croisent pas : chacune bute sur l'autre. Sans cette
     borne, tirer le minimum au-delà du maximum inverse l'intervalle et l'API
     répond une page vide sans que rien ne l'explique à l'écran. */
  const bouger = (cote) => (e) => {
    const v = Number(e.target.value);
    setDuo(([d0, d1]) => (cote === 'min' ? [Math.min(v, d1), d1] : [d0, Math.max(v, d0)]));
  };
  const relacher = () => onChange(duo[0], duo[1]);

  /* Poignées confondues à l'extrémité droite : celle du minimum passe devant,
     sinon elle est définitivement prisonnière sous celle du maximum. */
  const minDevant = a > haut - etendue * 0.04;

  return (
    <div className="gp-prix">
      <p className="gp-prix-titre">Prix</p>

      <div className="gp-prix-piste">
        <span className="gp-prix-rail" aria-hidden="true" />
        <span
          className="gp-prix-plein"
          aria-hidden="true"
          style={{ left: `${pct(a)}%`, right: `${100 - pct(b)}%` }}
        />
        <input
          type="range" min={bas} max={haut} step={pas} value={a}
          onChange={bouger('min')} onPointerUp={relacher} onKeyUp={relacher}
          aria-label="Prix minimum"
          aria-valuetext={formatPrice(a, currency)}
          style={{ zIndex: minDevant ? 5 : 3 }}
        />
        <input
          type="range" min={bas} max={haut} step={pas} value={b}
          onChange={bouger('max')} onPointerUp={relacher} onKeyUp={relacher}
          aria-label="Prix maximum"
          aria-valuetext={formatPrice(b, currency)}
          style={{ zIndex: 4 }}
        />
      </div>

      <div className="gp-prix-bornes">
        <span>{formatPrice(a, currency)}</span>
        <span>{formatPrice(b, currency)}</span>
      </div>
    </div>
  );
};

/* ── Barre complète ──────────────────────────────────────────────────────── */
export const PlpFilterBar = ({
  facettes,
  minPrice, maxPrice, onPrice,
  bascules,          // [{ cle, label, actif, onToggle }]
  sortOptions = [], ordering, onSort,
  chips, onResetAll,
}) => {
  const currency = useSettingsStore((s) => s.currency);
  const [panneau, setPanneau] = useState(null);   // 'prix' | 'tri' | null
  const fermer = useCallback(() => setPanneau(null), []);

  const refPrix = useRef(null);
  const refTri  = useRef(null);
  useFermeture(refPrix, panneau === 'prix', fermer);
  useFermeture(refTri,  panneau === 'tri',  fermer);

  /* Bornes du rayon, arrondies vers l'extérieur au pas : des poignées calées
     sur 30 500 et 64 000 se lisent comme des prix, pas comme des repères. */
  const PAS = 500;
  const bas  = facettes?.price_min != null ? Math.floor(facettes.price_min / PAS) * PAS : null;
  const haut = facettes?.price_max != null ? Math.ceil(facettes.price_max / PAS) * PAS : null;

  /* Un rayon dont toutes les pièces sont au même prix n'a rien à filtrer :
     le curseur n'aurait qu'une position. */
  const prixFiltrable = bas != null && haut != null && haut > bas;

  const valeurMin = minPrice ? Number(minPrice) : bas;
  const valeurMax = maxPrice ? Number(maxPrice) : haut;
  const prixActif = Boolean(minPrice || maxPrice);

  /* Un tri à un seul choix n'est pas un tri : la commande s'ouvre sur une
     liste d'une ligne, déjà cochée. Sous deux options, la pilule n'est pas
     rendue du tout — et `sortOptions[0]` n'est plus lu, ce qui évitait au
     passage un plantage sur une liste vide. */
  const triFiltrable = sortOptions.length > 1;
  const labelTri = triFiltrable
    ? (sortOptions.find((o) => o.value === ordering)?.label ?? sortOptions[0].label)
    : '';

  return (
    <div className="gp-barre">
      <div className="gp-barre-rang">

        {/* ── Filtres, à gauche ── */}
        <div className="gp-barre-gauche">
          {prixFiltrable && (
            <div className="gp-pop" ref={refPrix}>
              <button
                type="button"
                className={`gp-pilule${prixActif ? ' gp-pilule--actif' : ''}`}
                aria-expanded={panneau === 'prix'}
                onClick={() => setPanneau((p) => (p === 'prix' ? null : 'prix'))}
              >
                {prixActif
                  ? `${formatPrice(valeurMin, currency)} – ${formatPrice(valeurMax, currency)}`
                  : 'Prix'}
                <Chevron ouvert={panneau === 'prix'} />
              </button>

              {panneau === 'prix' && (
                <div className="gp-panneau gp-panneau--prix">
                  <PriceRangeSlider
                    bas={bas} haut={haut} pas={PAS}
                    min={valeurMin} max={valeurMax}
                    onChange={(a, b) => onPrice(a === bas ? '' : a, b === haut ? '' : b)}
                  />
                </div>
              )}
            </div>
          )}

          {bascules.map(({ cle, label, actif, onToggle }) => (
            <button
              key={cle}
              type="button"
              aria-pressed={actif}
              onClick={onToggle}
              className={`gp-pilule${actif ? ' gp-pilule--actif' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Tri, à droite ── */}
        {triFiltrable && (
        <div className="gp-pop gp-pop--fin" ref={refTri}>
          <button
            type="button"
            className="gp-pilule gp-pilule--tri"
            aria-expanded={panneau === 'tri'}
            onClick={() => setPanneau((p) => (p === 'tri' ? null : 'tri'))}
          >
            Trier : {labelTri}
            <span className="gp-fleche"><Chevron ouvert={panneau === 'tri'} /></span>
          </button>

          {panneau === 'tri' && (
            <div className="gp-panneau gp-panneau--tri" role="listbox">
              {sortOptions.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected={o.value === ordering}
                  className={`gp-option${o.value === ordering ? ' gp-option--actif' : ''}`}
                  onClick={() => { onSort(o.value); fermer(); }}
                >
                  {o.label}
                  {o.value === ordering && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" strokeWidth="3" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        )}
      </div>

      {/* ── Ce qui est posé, et de quoi tout défaire ── */}
      {chips.length > 0 && (
        <div className="gp-chips">
          {chips.map(({ cle, label, onRetirer }) => (
            <button key={cle} type="button" className="gp-chip" onClick={onRetirer}>
              {label}
              <span aria-hidden="true">×</span>
              <span className="visually-hidden">— retirer ce filtre</span>
            </button>
          ))}
          <button type="button" className="gp-effacer" onClick={onResetAll}>
            Tout effacer
          </button>
        </div>
      )}

      <style>{`
        .gp-barre { margin-bottom: var(--s-6); }

        /* La rangée se casse en deux lignes plutôt que d'écraser le tri :
           « Trier : Prix décroissant » ne se tronque pas proprement. */
        .gp-barre-rang {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: var(--s-3);
          padding-bottom: var(--s-4);
          border-bottom: 1px solid var(--line);
        }
        /* Les filtres sont calés à DROITE. La classe garde son nom
           historique — elle désignait le groupe de gauche, quand le tri
           occupait l'autre bord ; le tri a été retiré et le groupe a
           traversé.

           « margin-left: auto » plutôt que « justify-content: flex-end » sur la
           rangée : la rangée reste en « space-between » pour le jour où une
           commande reviendrait à gauche, et c'est le groupe seul qui se
           pousse. */
        .gp-barre-gauche {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: flex-end;
          gap: var(--s-2);
          margin-left: auto;
        }

        .gp-pop { position: relative; }
        .gp-pop--fin { margin-left: auto; }

        .gp-pilule {
          display: inline-flex;
          align-items: center;
          gap: 0.8rem;
          padding: 1rem 1.8rem;
          border: 1px solid var(--line);
          border-radius: var(--r-pill);
          background: var(--surface);
          color: var(--text);
          font-family: var(--font-body);
          font-size: var(--t-sm);
          font-variant-numeric: tabular-nums;
          white-space: nowrap;
          cursor: pointer;
          transition: border-color var(--dur-1) var(--ease),
                      background var(--dur-1) var(--ease),
                      color var(--dur-1) var(--ease);
        }
        .gp-pilule:hover { border-color: var(--line-accent); }
        .gp-pilule--actif {
          background: var(--surface-gold);
          border-color: var(--line-accent);
          color: var(--text-accent);
        }
        .gp-pilule:focus-visible {
          outline: 2px solid var(--text-accent);
          outline-offset: 2px;
        }
        /* Le chevron du tri prend le laiton : c'est le seul repère coloré de
           la rangée, il désigne l'action qui ouvre un choix. */
        .gp-fleche { color: var(--text-accent); display: inline-flex; }

        .gp-panneau {
          position: absolute;
          top: calc(100% + 0.8rem);
          z-index: 20;
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: var(--r-3);
          box-shadow: var(--shadow-overlay);
          animation: fadeDown var(--dur-2) var(--ease) backwards;
        }
        /* Le panneau s'aligne désormais sur le bord DROIT de sa pilule : à
           gauche, une pilule posée près du bord droit de l'écran aurait
           ouvert son panneau de 30 rem dans le vide, hors cadre. */
        .gp-panneau--prix { right: 0; width: 30rem; padding: var(--s-5); }
        .gp-panneau--tri  { right: 0; min-width: 22rem; padding: var(--s-2); }
        /* Panneau collé au bord droit de l'écran en petit écran : il sortirait
           du cadre en restant aligné sur son bouton. */
        @media (max-width: 480px) {
          .gp-panneau--prix { width: min(30rem, calc(100vw - 4rem)); }
        }

        .gp-option {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--s-4);
          width: 100%;
          padding: 1.1rem 1.4rem;
          border: none;
          border-radius: var(--r-pill);
          background: none;
          color: var(--text-muted);
          font-family: var(--font-body);
          font-size: var(--t-sm);
          text-align: left;
          cursor: pointer;
          transition: background var(--dur-1) var(--ease), color var(--dur-1) var(--ease);
        }
        .gp-option:hover { background: var(--surface-sunk); color: var(--text); }
        .gp-option--actif { color: var(--text-accent); }

        /* ── Curseur de prix ── */
        .gp-prix-titre {
          font-family: var(--font-body);
          font-size: var(--t-eyebrow);
          letter-spacing: var(--ls-eyebrow);
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: var(--s-5);
        }

        .gp-prix-piste { position: relative; height: 2.4rem; }
        .gp-prix-rail,
        .gp-prix-plein {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          height: 4px;
          border-radius: var(--r-pill);
        }
        .gp-prix-rail  { left: 0; right: 0; background: var(--surface-sunk); }
        .gp-prix-plein { background: var(--text-accent); }

        /* Les deux champs couvrent toute la piste et se superposent. Ils
           laissent passer le clic — pointer-events: none — pour ne pas se
           voler mutuellement le curseur ; seules les POIGNÉES le reprennent. */
        .gp-prix-piste input[type="range"] {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 2.4rem;
          margin: 0;
          background: none;
          pointer-events: none;
          -webkit-appearance: none;
          appearance: none;
        }
        .gp-prix-piste input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          pointer-events: auto;
          width: 1.8rem;
          height: 1.8rem;
          border-radius: var(--r-pill);
          background: var(--surface);
          border: 2px solid var(--text-accent);
          box-shadow: var(--shadow-lift);
          cursor: grab;
        }
        .gp-prix-piste input[type="range"]::-moz-range-thumb {
          pointer-events: auto;
          width: 1.8rem;
          height: 1.8rem;
          border-radius: var(--r-pill);
          background: var(--surface);
          border: 2px solid var(--text-accent);
          box-shadow: var(--shadow-lift);
          cursor: grab;
        }
        .gp-prix-piste input[type="range"]:focus-visible::-webkit-slider-thumb {
          outline: 2px solid var(--text-accent);
          outline-offset: 2px;
        }
        .gp-prix-piste input[type="range"]:focus-visible::-moz-range-thumb {
          outline: 2px solid var(--text-accent);
          outline-offset: 2px;
        }

        .gp-prix-bornes {
          display: flex;
          justify-content: space-between;
          margin-top: var(--s-3);
          font-family: var(--font-body);
          font-size: var(--t-sm);
          font-variant-numeric: tabular-nums;
          color: var(--text-muted);
        }

        /* ── Chips ── */
        /* Les chips suivent les filtres : ce sont les mêmes commandes, une
           fois posées. À gauche pendant que les pilules sont à droite, les
           deux rangées se seraient lues comme deux blocs sans rapport. */
        .gp-chips {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: flex-end;
          gap: var(--s-2);
          margin-top: var(--s-4);
        }
        .gp-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.9rem;
          padding: 0.9rem 1.6rem;
          border: none;
          border-radius: var(--r-pill);
          background: var(--surface-dark);
          color: var(--text-on-dark);
          font-family: var(--font-body);
          font-size: var(--t-xs);
          font-variant-numeric: tabular-nums;
          cursor: pointer;
          transition: opacity var(--dur-1) var(--ease);
        }
        .gp-chip:hover { opacity: 0.82; }
        .gp-chip span[aria-hidden] { font-size: 1.6rem; line-height: 1; opacity: 0.7; }

        .gp-effacer {
          border: none;
          background: none;
          padding: 0.9rem 0.6rem;
          color: var(--text-muted);
          font-family: var(--font-body);
          font-size: var(--t-xs);
          cursor: pointer;
          transition: color var(--dur-1) var(--ease);
        }
        .gp-effacer:hover { color: var(--text); }

        @media (prefers-reduced-motion: reduce) {
          .gp-panneau { animation: none; }
        }
      `}</style>
    </div>
  );
};

export default PlpFilterBar;
