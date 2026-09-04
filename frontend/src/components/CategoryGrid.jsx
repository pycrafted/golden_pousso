import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import useSettingsStore, { formatPrice } from '../store/settingsStore';
import CldImg from './CldImg';
import useTexteSection from '../hooks/useTexteSection';

const SPEED = 1.0;
const GAP_REM = 2.4;

/* ── Taille des cartes ───────────────────────────────────────────────────────
 * ↓ C'EST ICI QUE ÇA SE RÈGLE. Baisser un nombre = cartes plus grandes.
 *
 * Le rail n'est dans aucun `.container` : il occupe toute la largeur de la
 * fenêtre. L'ancien calcul divisait pourtant un conteneur figé de 1200 px par
 * 4 colonnes, alors que les cartes s'étalaient sur tout l'écran — on en voyait
 * donc 5 à 7, toutes petites, et le défaut s'aggravait à mesure que l'écran
 * s'élargissait.
 *
 * On part maintenant du nombre de cartes que l'on veut VOIR. Les valeurs sont
 * fractionnaires à dessein : la carte suivante dépasse du bord, ce qui dit à
 * l'œil que le rail continue. Un compte entier laisse croire que tout est vu.
 */
const CARTES_VISIBLES = [
  { jusqua:  480, nb: 1.6 },
  { jusqua:  768, nb: 2.4 },
  { jusqua: 1100, nb: 3.4 },
  { jusqua: 1600, nb: 4.4 },
  { jusqua: Infinity, nb: 5.5 },
];

/* Plafond. Sans lui, un très grand écran donnerait une carte occupant la
   hauteur de la fenêtre. Au-delà, c'est le nombre de cartes visibles qui
   augmente, pas leur taille. */
const CARTE_MAX_PX = 360;

const getCardWidth = () => {
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
  const gap = GAP_REM * rem;
  const largeur = window.innerWidth;
  const { nb } = CARTES_VISIBLES.find((p) => largeur <= p.jusqua);
  // La gouttière est retirée après le partage : chaque carte cède la moitié
  // d'un espacement à sa gauche et à sa droite.
  return Math.min(largeur / nb - gap, CARTE_MAX_PX);
};

const useInView = () => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
};

const ProductsCarousel = ({ categorySlug }) => {
  const currency  = useSettingsStore((s) => s.currency);
  const textes = useTexteSection('accueil-creations', { titre: 'En vitrine' });

  const [carouselRef, carouselVisible] = useInView();

  const [products,        setProducts]        = useState([]);
  const [carouselHovered, setCarouselHovered] = useState(false);
  const [cardWidth,       setCardWidth]       = useState(getCardWidth);

  useEffect(() => {
    const onResize = () => setCardWidth(getCardWidth());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const trackRef    = useRef(null);
  const posRef      = useRef(0);
  const rafRef      = useRef(null);
  const pausedRef   = useRef(false);
  const momentumRef = useRef(0);
  const productsRef = useRef(products);

  useEffect(() => { productsRef.current = products; }, [products]);

  const calcCardW = useCallback(() => {
    const cardW = getCardWidth();
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const gap = GAP_REM * rem;
    return { cardW, gap, setW: productsRef.current.length * (cardW + gap) };
  }, []);

  /* ── API produits ───────────────────────────────────────── */
  useEffect(() => {
    const params = categorySlug ? { category: categorySlug } : {};
    apiClient.get('/products/', { params })
      .then((res) => {
        const data = res.data.results ?? res.data;
        /* Le rail repart du début : garder la position d'avant ferait
           apparaître la nouvelle série au milieu, voire au-delà de sa fin. */
        posRef.current = 0;
        if (trackRef.current) trackRef.current.style.transform = 'translateX(0)';
        setProducts(categorySlug ? data : data.slice(0, 8));
      })
      .catch(() => {});
  }, [categorySlug]);

  /* ── Boucle d'animation ────────────────────────────────── */
  const tick = useCallback(() => {
    if (pausedRef.current || !trackRef.current) return;

    const { setW } = calcCardW();
    const speed = SPEED + momentumRef.current;
    momentumRef.current *= 0.9;
    if (Math.abs(momentumRef.current) < 0.1) momentumRef.current = 0;

    posRef.current += speed;
    if (posRef.current >= setW) posRef.current -= setW;
    if (posRef.current < 0)     posRef.current += setW;

    trackRef.current.style.transform = `translateX(-${posRef.current}px)`;
    rafRef.current = requestAnimationFrame(tick);
  }, [calcCardW]);

  useEffect(() => {
    if (!carouselVisible || products.length === 0) return;
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [carouselVisible, tick, products.length]);

  /* ── Flèches ─────────────────────────────────────────────── */
  const handleArrow = useCallback((direction) => {
    const { cardW, gap } = calcCardW();
    momentumRef.current = direction * (cardW + gap) * 0.18;
  }, [calcCardW]);

  /* ── Carte produit ───────────────────────────────────────────────────────
     Traitement repris des tuiles « Nos pièces, filmées » : le nom et le prix
     ne sont plus posés SOUS l'image mais DANS un panneau vitré à son pied.
     La carte gagne toute la hauteur pour la pièce, et le bloc d'information
     tient dans un objet dessiné au lieu de flotter dans le blanc.

     Le flou d'arrière-plan n'est pas décoratif : un aplat fixe devient
     illisible dès qu'une photo est claire en bas, ce qui arrive tout le temps
     sur des tissus écrus. Le voile en dégradé garantit le contraste, le flou
     garantit la lisibilité quel que soit le motif derrière.

     La vignette montre `secondary_image` — la deuxième photo de la pièce.
     Dans la source elle montrait le produit parce que le média derrière était
     une vidéo ; ici le média est déjà la photo principale, donc y remettre la
     même image ne dirait rien. Repli sur la principale si la pièce n'a qu'une
     seule photo. */
  const renderCard = (p, key) => {
    const vignette = p.secondary_image || p.primary_image;

    return (
      <Link
        key={key}
        to={`/produit/${p.slug}`}
        className="np-carte"
        style={{ width: `${cardWidth}px` }}
      >
        <div className="np-media">
          {p.primary_image ? (
            <CldImg
              src={p.primary_image}
              alt={p.name}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              widths={[300, 600]}
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                objectFit: 'cover', objectPosition: 'center top',
              }}
            />
          ) : (
            <div className="np-vide">
              <span>Photo bientôt</span>
            </div>
          )}

          {/* Pas de voile sur la photo : le panneau ci-dessous porte son propre
              fond et son propre flou, il n'a besoin d'aucun assombrissement de
              l'image pour rester lisible. Un dégradé posé ici ternissait le
              bas de chaque pièce. */}

          {/* Panneau présentationnel : c'est la carte entière qui est le lien,
              pas ce bloc. Un lien dans un lien casse la navigation clavier. */}
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
  };

  return (
    <section
      id="nos-produits"
      style={{ background: 'var(--surface)', overflow: 'hidden' }}
    >

      {/* Titre seul, sans sur-titre : « Boutique » au-dessus de « Nos Produits »
          disait deux fois la même chose. Le filet doré remplace le sur-titre
          disparu — il pose la section sans rien répéter. */}
      <div style={{ textAlign: 'center', marginBottom: 'var(--s-7)' }}>
        <h2>{textes.titre}</h2>
        <span className="filet-titre" aria-hidden="true" />
      </div>

      {/* Carousel auto-scroll */}
      <div
        style={{ position: 'relative' }}
        onMouseEnter={() => setCarouselHovered(true)}
        onMouseLeave={() => setCarouselHovered(false)}
      >
        {/* Flèche gauche */}
        <button
          onClick={() => handleArrow(-1)}
          aria-label="Précédent"
          style={{
            position: 'absolute', left: '1.6rem', top: '50%', transform: 'translateY(-50%)',
            zIndex: 10, width: '4.4rem', height: '4.4rem',
            background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            opacity: carouselHovered ? 1 : 0,
            pointerEvents: carouselHovered ? 'auto' : 'none',
            transition: 'opacity 0.2s, background 0.2s, border-color 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--gp-brass-400)'; e.currentTarget.style.borderColor = 'var(--gp-brass-400)'; e.currentTarget.querySelector('svg').style.stroke = 'var(--gp-indigo-900)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.querySelector('svg').style.stroke = 'var(--text)'; }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'stroke 0.2s' }}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Flèche droite */}
        <button
          onClick={() => handleArrow(1)}
          aria-label="Suivant"
          style={{
            position: 'absolute', right: '1.6rem', top: '50%', transform: 'translateY(-50%)',
            zIndex: 10, width: '4.4rem', height: '4.4rem',
            background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            opacity: carouselHovered ? 1 : 0,
            pointerEvents: carouselHovered ? 'auto' : 'none',
            transition: 'opacity 0.2s, background 0.2s, border-color 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--gp-brass-400)'; e.currentTarget.style.borderColor = 'var(--gp-brass-400)'; e.currentTarget.querySelector('svg').style.stroke = 'var(--gp-indigo-900)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.querySelector('svg').style.stroke = 'var(--text)'; }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'stroke 0.2s' }}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        <div ref={carouselRef} style={{ overflow: 'hidden' }}>
          {/* Sans ce mot, le rail se vide sans rien dire et la section a
              l'air cassée. */}
          {products.length === 0 && (
            <p className="ev-rien">Aucune pièce à afficher pour le moment.</p>
          )}
          {products.length > 0 && (
            <div
              ref={trackRef}
              style={{
                display: 'flex', gap: '2.4rem',
                willChange: 'transform', paddingLeft: '2.4rem',
              }}
            >
              {products.map((p, i) => renderCard(p, `a-${i}`))}
              {products.map((p, i) => renderCard(p, `b-${i}`))}
            </div>
          )}
        </div>
      </div>

      {/* Valeurs en pixels et non en rem : elles viennent d'une source calée
          sur une racine à 16 px, alors que ce site est à 62,5 %. En rem, le
          panneau et la vignette seraient déformés. */}
      <style>{`
        .ev-rien {
          text-align: center;
          color: var(--text-muted);
          padding: var(--s-6) var(--page-pad);
        }

        .np-carte {
          flex-shrink: 0;
          display: block;
          color: inherit;
        }

        .np-media {
          position: relative;
          aspect-ratio: 3 / 4;
          overflow: hidden;
          border-radius: 24px;
          background: var(--surface-sunk);
        }
        .np-media img { transition: transform 1200ms var(--ease); }
        .np-carte:hover .np-media img { transform: scale(1.05); }

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
        .np-carte:hover .np-panneau {
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
        .np-carte:hover .np-fleche { opacity: 1; transform: translateX(0); }

        /* Au doigt il n'y a pas de survol : la flèche resterait invisible et
           le panneau à son opacité la plus basse. */
        @media (hover: none) {
          .np-fleche { opacity: 1; transform: translateX(0); }
          .np-panneau { background: rgba(15,19,32,0.62); }
        }
      `}</style>
    </section>
  );
};

export default ProductsCarousel;
