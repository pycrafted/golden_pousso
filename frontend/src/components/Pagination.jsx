/**
 * La pagination des pages de catalogue.
 * ---------------------------------------------------------------------------
 * À la demande : la boutique et les rayons se parcourent PAGE PAR PAGE, et le
 * navigateur ne demande que la page affichée. Un bouton « Charger plus »
 * empilait les pièces — au bout de quatre clics, la grille portait une
 * centaine de cartes et autant de photos, toutes gardées en mémoire, et rien
 * ne disait où l'on en était ni comment revenir en arrière.
 *
 * ── Ce que la pagination apporte ───────────────────────────────────────────
 * Une requête = une page (24 pièces, c'est l'API qui décide) ; la grille est
 * remplacée, pas allongée. Le numéro de page vit dans l'URL (`?page=3`) : la
 * page se partage, le bouton « retour » du navigateur ramène à la précédente,
 * et un rechargement retombe au même endroit.
 *
 * ── Le dessin ──────────────────────────────────────────────────────────────
 * Les pilules de la barre de filtres (`.gp-pilule` de `PlpFilterBar`), reprises
 * ici en `.pg-*` : même hauteur, même rayon, même contour ; la page courante
 * est pleine — sur fond sombre, indigo sur laiton (7,74:1), comme la pilule
 * active des filtres. Les styles sont recopiés plutôt que lus chez le voisin :
 * un composant qui dépend du bloc `<style>` d'un autre casse le jour où
 * celui-ci n'est plus rendu.
 *
 * ── La fenêtre de numéros ──────────────────────────────────────────────────
 * Première, dernière, la courante et ses deux voisines ; le reste devient un
 * « … » qui n'est pas un bouton. Quinze numéros alignés ne se lisent pas, et
 * sur un téléphone ils passeraient à la ligne trois fois.
 */

const FENETRE = 1; // voisines affichées de part et d'autre de la page courante

/* Les numéros à montrer, « … » compris. Jamais deux « … » de suite, et jamais
   un « … » qui masquerait un seul numéro — l'afficher coûte la même place. */
const numeros = (page, pages) => {
  const gardees = new Set([1, pages]);
  for (let p = page - FENETRE; p <= page + FENETRE; p += 1) {
    if (p >= 1 && p <= pages) gardees.add(p);
  }
  const triees = [...gardees].sort((a, b) => a - b);
  const sortie = [];
  triees.forEach((p, i) => {
    const precedent = triees[i - 1];
    if (precedent && p - precedent > 1) {
      sortie.push(p - precedent === 2 ? precedent + 1 : '…');
    }
    sortie.push(p);
  });
  return sortie;
};

const Pagination = ({ page, pages, total, onPage }) => {
  if (!pages || pages <= 1) return null;

  const aller = (p) => {
    if (p < 1 || p > pages || p === page) return;
    onPage(p);
  };

  return (
    <nav className="pg" aria-label="Pagination">
      <p className="pg-compte">
        Page {page} sur {pages}
        {total ? ` · ${total} pièce${total > 1 ? 's' : ''}` : ''}
      </p>

      <div className="pg-rangee">
        <button
          type="button"
          className="pg-pilule pg-fleche"
          onClick={() => aller(page - 1)}
          disabled={page === 1}
          aria-label="Page précédente"
        >
          <i className="bx bx-chevron-left" aria-hidden="true" />
          <span className="pg-mot">Précédente</span>
        </button>

        {numeros(page, pages).map((n, i) => (n === '…' ? (
          <span key={`saut-${i}`} className="pg-saut" aria-hidden="true">…</span>
        ) : (
          <button
            key={n}
            type="button"
            className={`pg-pilule pg-num${n === page ? ' pg-pilule--actif' : ''}`}
            onClick={() => aller(n)}
            aria-label={`Page ${n}`}
            aria-current={n === page ? 'page' : undefined}
          >
            {n}
          </button>
        )))}

        <button
          type="button"
          className="pg-pilule pg-fleche"
          onClick={() => aller(page + 1)}
          disabled={page === pages}
          aria-label="Page suivante"
        >
          <span className="pg-mot">Suivante</span>
          <i className="bx bx-chevron-right" aria-hidden="true" />
        </button>
      </div>

      <style>{`
        .pg { margin-top: var(--s-9); text-align: center; }

        .pg-compte {
          margin: 0 0 var(--s-5);
          font-family: var(--font-body);
          font-size: var(--t-xs);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-variant-numeric: tabular-nums;
          color: var(--text-muted);
        }

        .pg-rangee {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 0.8rem;
        }

        /* La pilule des filtres, à l'identique — voir PlpFilterBar. */
        .pg-pilule {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          min-width: 4.4rem;
          min-height: 4.4rem;
          padding: 1rem 1.6rem;
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
        .pg-num { justify-content: center; padding-inline: 1.2rem; }
        .pg-pilule:hover:not([disabled]) { border-color: var(--line-accent); }

        /* La page courante est pleine. Sur fond sombre, « --surface-gold »
           resterait crème pendant que « --text-accent » passerait au laiton
           clair : ~2,2:1. D'où la variante, indigo sur laiton (7,74:1) — celle
           de la pilule active des filtres. */
        .pg-pilule--actif {
          background: var(--surface-gold);
          border-color: var(--line-accent);
          color: var(--text-accent);
          cursor: default;
        }
        .on-dark .pg-pilule--actif {
          background: var(--gp-brass-400);
          border-color: var(--gp-brass-400);
          color: var(--gp-indigo-900);
        }

        /* Désactivée et non masquée : la rangée garderait sa forme, mais les
           numéros sauteraient d'un cran à la première et à la dernière page. */
        .pg-pilule[disabled] { opacity: 0.4; cursor: not-allowed; }

        .pg-pilule:focus-visible {
          outline: 2px solid var(--text-accent);
          outline-offset: 0;
        }

        .pg-saut {
          padding: 0 0.4rem;
          font-family: var(--font-body);
          color: var(--text-muted);
        }

        /* Sous 560 px, les flèches ne gardent que leur chevron : « Précédente »
           et « Suivante » mangeaient la largeur des numéros. */
        @media (max-width: 560px) {
          .pg-mot { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
          .pg-pilule { padding-inline: 1.2rem; }
        }
      `}</style>
    </nav>
  );
};

export default Pagination;
