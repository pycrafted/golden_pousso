import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import useSettingsStore, { formatPrice } from '../store/settingsStore';
import CldImg from './CldImg';
import useTexteSection from '../hooks/useTexteSection';
import useInView from '../hooks/useInView';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion';

/**
 * « Nos produits » — un JEU DE CARTES.
 * ---------------------------------------------------------------------------
 * À la demande, le rail qui défilait sans fin a laissé place à un paquet : la
 * pièce du dessus, droite et entière, et derrière elle les suivantes en
 * éventail, comme une main de cartes. Toutes les ~3 s, la carte du dessus
 * s'envole vers la droite et repasse sous le paquet ; la suivante se révèle.
 * Un défilé continu se regarde passer ; une carte à la fois se regarde.
 *
 *   • Le filet de laiton sous le paquet est le TEMPS qui reste avant la carte
 *     suivante. C'est lui qui la déclenche (`onAnimationEnd`) : survoler ou
 *     mettre le focus dans le jeu met l'animation en pause
 *     (`animation-play-state`), donc le jeu s'arrête exactement où il en était
 *     et reprend de là.
 *   • Flèches et compteur « 03 / 08 » : on passe une carte, ou l'on revient.
 *     Un clic sur une carte de l'éventail la fait passer devant ; seule celle
 *     du dessus mène à la fiche.
 *   • Rien ne bouge seul avant que la section soit vue, ni si le visiteur
 *     demande moins d'animations — les flèches restent.
 *
 * TOUTES les pièces du catalogue, à la demande — le jeu s'arrêtait aux huit
 * premières. L'API pagine par 24 et ignore `page_size` : les pages sont lues
 * à la suite (`next`). Seules les cartes utiles sont dans le DOM — le dessus,
 * l'éventail, et la dernière, qui reçoit la carte envolée : un paquet de
 * cent pièces ne monte pas cent photos.
 *
 * Le dessin de la carte (photo 2/3, panneau vitré nom + prix) est celui de
 * l'ancien rail, inchangé. Le rail débordait sous le sommaire de l'accueil
 * (`.ev-rail`, marge négative de --hp-reserve) : le paquet tient dans la
 * largeur utile, l'exception est partie avec lui.
 */

/* Cartes visibles derrière celle du dessus. Au-delà, elles attendent, cachées
   sous la dernière. */
const EVENTAIL = 4;
/* Durée d'une carte à l'écran — c'est celle du filet de temps (voir la
   feuille, « jeu-temps »). */
const DUREE_MS = 3200;
/* Le temps que la carte du dessus s'envole avant de passer sous le paquet. */
const ENVOL_MS = 420;

const ProductsCarousel = ({ categorySlug }) => {
  const currency = useSettingsStore((s) => s.currency);
  // « Nos produits », à la demande : « En vitrine » est passé à la vitrine
  // des mannequins (BandePromo), juste au-dessus.
  const textes = useTexteSection('accueil-creations', { titre: 'Nos produits' });
  const [scene, vue] = useInView();
  const reduit = usePrefersReducedMotion();

  const [products, setProducts] = useState([]);
  const [courant, setCourant] = useState(0);
  const [envol, setEnvol] = useState(false);
  const [pause, setPause] = useState(false);

  useEffect(() => {
    let actif = true;
    const params = categorySlug ? { category: categorySlug } : {};
    (async () => {
      const toutes = [];
      // Garde-fou : vingt pages, 480 pièces — une boucle sur `next` ne doit
      // jamais pouvoir tourner sans fin.
      for (let page = 1; page <= 20; page += 1) {
        const { data } = await apiClient.get('/products/', { params: { ...params, page } });
        toutes.push(...(data.results ?? data));
        if (!data.next) break;
      }
      if (!actif) return;
      setCourant(0);
      setProducts(toutes);
    })().catch(() => {});
    return () => { actif = false; };
  }, [categorySlug]);

  const n = products.length;

  /* Suivante : la carte du dessus s'envole, PUIS le paquet avance — elle
     repasse alors sous les autres. Précédente : la carte cachée sous le paquet
     revient directement devant. */
  const suivante = () => {
    if (n < 2 || envol) return;
    setEnvol(true);
    window.setTimeout(() => {
      setCourant((c) => (c + 1) % n);
      setEnvol(false);
    }, reduit ? 0 : ENVOL_MS);
  };
  const precedente = () => {
    if (n < 2 || envol) return;
    setCourant((c) => (c - 1 + n) % n);
  };

  const automatique = vue && !reduit && n > 1;

  return (
    <section id="nos-produits" className="ev on-dark">
      {/* Titre seul, sans sur-titre : le filet doré pose la section. */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--s-6)' }}>
        <h2>{textes.titre}</h2>
        <span className="filet-titre" aria-hidden="true" />
      </div>

      {n === 0 ? (
        /* Sans ce mot, la section se vide sans rien dire et a l'air cassée. */
        <p className="ev-rien">Aucune pièce à afficher pour le moment.</p>
      ) : (
        <div
          ref={scene}
          className={`jeu${pause ? ' is-pause' : ''}`}
          role="region"
          aria-roledescription="jeu de cartes"
          aria-label={textes.titre}
          onMouseEnter={() => setPause(true)}
          onMouseLeave={() => setPause(false)}
          onFocus={() => setPause(true)}
          onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setPause(false); }}
        >
          <div className="jeu-pile">
            {products.map((p, i) => {
              // Rang dans le paquet : 0 dessus, puis l'éventail, puis cachée.
              const rang = (i - courant + n) % n;
              const dessus = rang === 0;
              const cachee = rang > EVENTAIL;
              // Hors du DOM : ni dans l'éventail, ni la dernière du paquet.
              if (cachee && rang !== n - 1) return null;
              const vignette = p.secondary_image || p.primary_image;
              return (
                <Link
                  key={p.id}
                  to={`/produit/${p.slug}`}
                  className={`np-carte jeu-carte${dessus ? ' is-dessus' : ''}${dessus && envol ? ' is-envol' : ''}${cachee ? ' is-cachee' : ''}`}
                  style={{ '--rang': Math.min(rang, EVENTAIL), zIndex: n - rang }}
                  tabIndex={dessus ? 0 : -1}
                  aria-hidden={dessus ? undefined : true}
                  onClick={(e) => {
                    // Une carte de l'éventail passe devant ; seule celle du
                    // dessus mène à sa fiche.
                    if (!dessus) { e.preventDefault(); setCourant(i); }
                  }}
                >
                  <div className="np-media">
                    {p.primary_image ? (
                      <CldImg
                        src={p.primary_image}
                        alt={p.name}
                        sizes="(max-width: 640px) 70vw, 380px"
                        widths={[400, 800]}
                        eager={rang <= 1}
                        style={{
                          position: 'absolute', inset: 0,
                          width: '100%', height: '100%',
                          objectFit: 'cover', objectPosition: 'center top',
                        }}
                      />
                    ) : (
                      <div className="np-vide"><span>Photo bientôt</span></div>
                    )}

                    {/* Panneau présentationnel : c'est la carte entière qui est
                        le lien. */}
                    <div className="np-panneau">
                      {vignette && (
                        <span className="np-vignette">
                          <img src={vignette} alt="" loading="lazy" />
                        </span>
                      )}
                      <span className="np-texte">
                        <span className="np-nom">{p.name}</span>
                        <span className="np-prix">{formatPrice(p.price, currency)}</span>
                      </span>
                      <span className="np-fleche" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
                             strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h13.5" />
                          <path d="m13 6.5 5.5 5.5-5.5 5.5" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {n > 1 && (
            <div className="jeu-nav">
              <button type="button" className="jeu-fleche" onClick={precedente} aria-label="Pièce précédente">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              <div className="jeu-repere">
                <span className="jeu-compte" aria-live="polite">
                  <span className="visually-hidden">Pièce </span>
                  {String(courant + 1).padStart(2, '0')}
                  <span className="jeu-sur"> / {String(n).padStart(2, '0')}</span>
                </span>
                {/* Le temps de la carte : il déclenche la suivante. Remonté à
                    chaque carte (`key`) pour repartir de zéro. */}
                {automatique && (
                  <span className="jeu-piste" aria-hidden="true">
                    <span
                      key={`${courant}-${envol}`}
                      className="jeu-temps"
                      onAnimationEnd={suivante}
                    />
                  </span>
                )}
              </div>

              <button type="button" className="jeu-fleche" onClick={suivante} aria-label="Pièce suivante">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Valeurs du panneau en pixels : elles viennent d'une source calée sur
          une racine à 16 px, alors que ce site est à 62,5 %. */}
      <style>{`
        .ev-rien {
          text-align: center;
          color: var(--text-muted);
          padding: var(--s-6) var(--page-pad);
        }

        /* ── Le fond : #161B2D ── « .on-dark » bascule le titre, le filet et
           les flèches ; cette double classe remplace son fond (#0F1320) par
           l'indigo du chrome. Bande pleine largeur : l'écart avec ce qui
           précède se prend en marge, l'espace intérieur en padding. */
        .ev.on-dark {
          background: var(--surface-chrome);
          --surface: var(--surface-chrome);
          margin-top: var(--section-y);
          padding-block: var(--section-y);
        }
        .man + .ev.on-dark,
        .em + .ev.on-dark,
        .uv + .ev.on-dark,
        .bp + .ev.on-dark { margin-top: 0; }
        .ev { overflow: hidden; }

        /* ── Le paquet ─────────────────────────────────────────────────────
           Largeur d'une carte : tirée de la hauteur de page (--hp-utile) pour
           que paquet, titre et flèches tiennent dans l'écran, bornée par la
           largeur en petit écran. La carte est en 2/3. */
        .jeu {
          --jeu-l: min(calc((var(--hp-utile, 90vh) - 30rem) * 2 / 3), 36rem, 62vw);
          --jeu-pas-x: -13%;
          --jeu-pas-r: -5deg;
          display: grid;
          justify-items: center;
          gap: var(--s-5);
        }
        .jeu-pile {
          position: relative;
          width: max(var(--jeu-l), 20rem);
          aspect-ratio: 2 / 3;
          margin-top: var(--s-4);
          /* Le paquet s'ouvre vers la gauche : décalé d'autant vers la
             droite, l'ensemble reste centré. */
          translate: 20% 0;
        }

        .jeu-carte {
          position: absolute;
          inset: 0;
          transform-origin: 50% 100%;
          transform:
            translateX(calc(var(--jeu-pas-x) * var(--rang)))
            rotate(calc(var(--jeu-pas-r) * var(--rang)))
            scale(calc(1 - 0.025 * var(--rang)));
          filter: brightness(calc(1 - 0.12 * var(--rang)));
          box-shadow: 0 18px 40px -18px rgba(0, 0, 0, 0.7);
          border-radius: 24px;
          transition: transform 650ms var(--ease), filter 400ms var(--ease), opacity 400ms var(--ease);
          cursor: pointer;
        }
        .jeu-carte.is-cachee { opacity: 0; pointer-events: none; }
        /* La carte du dessus : droite, pleine lumière. */
        .jeu-carte.is-dessus { filter: none; }
        /* Elle s'envole vers la droite, puis repasse sous le paquet. */
        .jeu-carte.is-envol {
          transform: translate(78%, -6%) rotate(14deg);
          opacity: 0;
          transition: transform ${ENVOL_MS}ms var(--ease-in), opacity ${ENVOL_MS}ms var(--ease-in);
        }
        /* Une carte de l'éventail se soulève un peu au survol : elle dit
           qu'elle se prend. */
        .jeu-carte:not(.is-dessus):hover { filter: brightness(1); }

        /* L'agrandissement de photo de l'ancien rail, sur la carte du dessus
           seulement. */
        .np-media img { transition: transform 1200ms var(--ease); }
        .jeu-carte.is-dessus:hover .np-media img { transform: scale(1.05); }

        /* ── Flèches, compteur et temps ── */
        .jeu-nav {
          display: flex;
          align-items: center;
          gap: var(--s-4);
        }
        .jeu-fleche {
          display: grid;
          place-items: center;
          width: 4.4rem;
          height: 4.4rem;
          border: 1px solid var(--line-dark-accent);
          border-radius: 50%;
          background: transparent;
          color: var(--gp-ecru-50);
          cursor: pointer;
          transition: background var(--dur-1) var(--ease), border-color var(--dur-1) var(--ease), color var(--dur-1) var(--ease);
        }
        .jeu-fleche svg { width: 18px; height: 18px; }
        /* Indigo sur laiton : 7,74:1. */
        .jeu-fleche:hover { background: var(--gp-brass-400); border-color: var(--gp-brass-400); color: var(--gp-indigo-900); }

        .jeu-repere { display: grid; justify-items: center; gap: 0.8rem; min-width: 9rem; }
        .jeu-compte {
          font-family: var(--font-display);
          font-size: 1.8rem;
          font-variant-numeric: tabular-nums;
          letter-spacing: 0.06em;
          color: var(--gp-brass-400);
        }
        /* Écru à 62 % : 6,79:1. */
        .jeu-sur { color: var(--text-on-dark-muted); }
        .jeu-piste {
          position: relative;
          width: 9rem;
          height: 2px;
          overflow: hidden;
          border-radius: var(--r-pill);
          background: var(--line-dark);
        }
        .jeu-temps {
          position: absolute;
          inset: 0;
          background: var(--gp-brass-400);
          transform-origin: left;
          animation: jeu-temps ${DUREE_MS}ms linear forwards;
        }
        .jeu.is-pause .jeu-temps { animation-play-state: paused; }
        @keyframes jeu-temps { from { transform: scaleX(0); } to { transform: scaleX(1); } }

        /* En petit écran, l'éventail se resserre : ouvert comme au large, il
           sortirait de l'écran par la gauche. */
        @media (max-width: 640px) {
          .jeu { --jeu-pas-x: -8%; --jeu-pas-r: -4deg; }
          .jeu-pile { translate: 12% 0; }
        }

        .np-carte { display: block; color: inherit; }

        /* 2/3 : un boubou est une silhouette debout. */
        .np-media {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
          border-radius: 24px;
          background: var(--surface-sunk);
        }

        .np-vide {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          background: var(--gp-indigo-900);
        }
        .np-vide span {
          font-size: var(--t-eyebrow);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-on-dark-muted);
        }

        .np-panneau {
          position: absolute;
          left: 12px;
          right: 12px;
          bottom: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px;
          border-radius: 16px;
          border: 1px solid rgba(250,246,238,0.15);
          background: rgba(15,19,32,0.45);
          backdrop-filter: blur(12px);
          color: var(--gp-ecru-50);
          transition: background var(--dur-2) var(--ease), border-color var(--dur-2) var(--ease);
        }
        .jeu-carte.is-dessus:hover .np-panneau {
          border-color: rgba(250,246,238,0.4);
          background: rgba(15,19,32,0.65);
        }

        .np-vignette {
          position: relative;
          width: 36px;
          height: 44px;
          flex-shrink: 0;
          overflow: hidden;
          border-radius: 8px;
          background: var(--surface-sunk);
        }
        .np-vignette img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .np-texte { min-width: 0; flex: 1; }
        .np-nom {
          display: block;
          font-family: var(--font-body);
          font-size: 12.5px;
          font-weight: 600;
          line-height: 1.375;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .np-prix {
          display: block;
          font-family: var(--font-body);
          font-size: 12.5px;
          font-weight: 800;
          font-variant-numeric: tabular-nums;
          color: var(--gp-brass-400);
        }

        .np-fleche {
          display: grid;
          place-items: center;
          flex-shrink: 0;
          opacity: 0;
          transform: translateX(-4px);
          transition: opacity var(--dur-2) var(--ease), transform var(--dur-2) var(--ease);
        }
        .np-fleche svg { width: 16px; height: 16px; }
        .jeu-carte.is-dessus:hover .np-fleche { opacity: 1; transform: translateX(0); }

        /* Au doigt il n'y a pas de survol : la flèche resterait invisible et
           le panneau à son opacité la plus basse. */
        @media (hover: none) {
          .jeu-carte.is-dessus .np-fleche { opacity: 1; transform: translateX(0); }
          .np-panneau { background: rgba(15,19,32,0.62); }
        }

        @media (prefers-reduced-motion: reduce) {
          .jeu-carte, .jeu-carte.is-envol { transition: none; }
        }
      `}</style>
    </section>
  );
};

export default ProductsCarousel;
