import { useState, useEffect, useRef, useMemo } from 'react';
import SEOHead from '../components/SEOHead';
import apiClient from '../api/client';

import Hero from '../components/Hero';
import UniversGrid from '../components/home/UniversGrid';
import CategoryGrid from '../components/CategoryGrid';
import VideoCardsSection from '../components/VideoCardsSection';
import AtelierSection from '../components/home/AtelierSection';
import TestimonialsSection from '../components/TestimonialsSection';

import ProductCard from '../components/ProductCard';
import SkeletonCard from '../components/SkeletonCard';
import Reveal from '../components/Reveal';

/* ── Sélection — les pièces en vedette, filtrables par univers ───────────────
   Les onglets sont déduits des produits reçus plutôt que codés en dur : un
   onglet ne s'affiche que si au moins une pièce en vedette lui appartient.
   Une liste figée finirait par proposer un rayon vide le jour où la maison
   arrête une catégorie.

   Le rail défile nativement (scroll-snap) au lieu d'être déplacé par
   `transform` : le glissement au doigt fonctionne sans code, et le retour au
   début lors d'un changement d'onglet est un simple `scrollTo`. */
const Selection = () => {
  const [produits, setProduits] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [onglet, setOnglet] = useState('tous');
  const rail = useRef(null);

  useEffect(() => {
    apiClient.get('/products/featured/')
      .then((r) => setProduits(r.data.results || r.data))
      .catch(() => {})
      .finally(() => setChargement(false));
  }, []);

  const onglets = useMemo(() => {
    const vus = new Map();
    produits.forEach((p) => {
      if (p.category?.slug && !vus.has(p.category.slug)) {
        vus.set(p.category.slug, p.category.name);
      }
    });
    // Sous deux univers représentés, les onglets ne trient rien.
    if (vus.size < 2) return [];
    return [{ cle: 'tous', libelle: 'Tout voir' },
            ...[...vus].map(([cle, libelle]) => ({ cle, libelle }))];
  }, [produits]);

  const affiches = onglet === 'tous'
    ? produits
    : produits.filter((p) => p.category?.slug === onglet);

  const changerOnglet = (cle) => {
    setOnglet(cle);
    rail.current?.scrollTo({ left: 0, behavior: 'smooth' });
  };

  const faireDefiler = (sens) => {
    const el = rail.current;
    if (!el) return;
    // On avance d'une carte : la largeur du premier enfant, gouttière comprise.
    const pas = el.firstElementChild?.offsetWidth ?? el.clientWidth * 0.8;
    el.scrollBy({ left: sens * (pas + 24), behavior: 'smooth' });
  };

  if (!chargement && produits.length === 0) return null;

  return (
    <section>
      <div className="container">
        <Reveal className="selection-entete">
          <div>
            <p className="eyebrow">La sélection</p>
            <h2 style={{ marginTop: 'var(--s-3)' }}>Nos plus belles pièces</h2>
          </div>

          {onglets.length > 0 && (
            <div className="selection-onglets" role="tablist" aria-label="Filtrer par univers">
              {onglets.map((o) => (
                <button
                  key={o.cle}
                  type="button"
                  role="tab"
                  aria-selected={onglet === o.cle}
                  onClick={() => changerOnglet(o.cle)}
                  className={`selection-onglet ${onglet === o.cle ? 'is-actif' : ''}`}
                >
                  {o.libelle}
                </button>
              ))}
            </div>
          )}
        </Reveal>

        <div className="selection-rail-zone">
          {/* Les flèches ne servent qu'à la souris : au doigt, le rail défile
              tout seul. Elles sont donc masquées aux lecteurs d'écran, qui
              parcourent les cartes directement. */}
          <button
            type="button" aria-hidden="true" tabIndex={-1}
            className="selection-fleche selection-fleche--g"
            onClick={() => faireDefiler(-1)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            type="button" aria-hidden="true" tabIndex={-1}
            className="selection-fleche selection-fleche--d"
            onClick={() => faireDefiler(1)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          <div className="selection-rail" ref={rail}>
            {chargement
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="selection-case"><SkeletonCard /></div>
                ))
              : affiches.map((p, i) => (
                  <div key={p.id} className="selection-case">
                    <ProductCard
                      product={p}
                      index={i}
                      sizes="(max-width: 640px) 72vw, (max-width: 1024px) 40vw, 24vw"
                    />
                  </div>
                ))}
          </div>
        </div>
      </div>

      <style>{`
        .selection-entete {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-end;
          justify-content: space-between;
          gap: var(--s-4);
          margin-bottom: var(--s-6);
        }

        .selection-onglets {
          display: flex;
          flex-wrap: wrap;
          gap: var(--s-2);
        }
        .selection-onglet {
          padding: 0.9rem var(--s-4);
          background: transparent;
          border: 1px solid var(--line);
          border-radius: var(--r-pill);
          font-family: var(--font-body);
          font-size: var(--t-xs);
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-muted);
          cursor: pointer;
          transition: color var(--dur-1) var(--ease),
                      border-color var(--dur-1) var(--ease),
                      background var(--dur-1) var(--ease);
        }
        .selection-onglet:hover { color: var(--text); border-color: var(--line-accent); }
        .selection-onglet.is-actif {
          background: var(--gp-ink);
          border-color: var(--gp-ink);
          color: var(--gp-ecru-50);
        }

        .selection-rail-zone { position: relative; }

        /* Le rail déborde du conteneur en pleine largeur sous 1024px : une
           carte coupée par le bord de l'écran indique qu'il y en a d'autres,
           là où une grille sagement alignée laisse croire que tout est vu. */
        .selection-rail {
          display: flex;
          gap: var(--s-5);
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
          padding-bottom: var(--s-2);
        }
        .selection-rail::-webkit-scrollbar { display: none; }
        .selection-case {
          flex: 0 0 calc((100% - 3 * var(--s-5)) / 4);
          scroll-snap-align: start;
        }

        .selection-fleche {
          position: absolute;
          top: 34%;
          z-index: 5;
          display: grid;
          place-items: center;
          width: 4.4rem;
          height: 4.4rem;
          background: var(--surface);
          border: 1px solid var(--line-accent);
          border-radius: 50%;
          color: var(--text-accent);
          cursor: pointer;
          transition: background var(--dur-1) var(--ease), color var(--dur-1) var(--ease);
        }
        .selection-fleche:hover { background: var(--gp-brass-400); color: var(--gp-indigo-900); }
        .selection-fleche--g { left: -2.2rem; }
        .selection-fleche--d { right: -2.2rem; }

        @media (max-width: 1024px) {
          .selection-case { flex: 0 0 40%; }
          .selection-fleche { display: none; }
        }
        @media (max-width: 640px) {
          .selection-case { flex: 0 0 72%; }
          .selection-rail { gap: var(--s-4); }
        }
      `}</style>
    </section>
  );
};

/* ── Page d'accueil ─────────────────────────────────────────────────────────
   L'ordre suit une progression : on oriente, on montre, on presse, on raconte,
   on prouve, on ouvre la conversation. Les fonds alternent — indigo pour le
   hero et la bande promotionnelle ; écru partout ailleurs — pour que la page
   respire au lieu de dérouler un seul aplat.

   La bande de coordonnées qui suivait le hero est remontée au-dessus de la
   barre de navigation (`components/BandeCoordonnees.jsx`, posée par le
   `Layout`) : le hero enchaîne donc directement sur « En mouvement ».

   ⚠ La bande promotionnelle du milieu de page (`FullWidthBanner`) a été
   supprimée : son offre — « Bientôt la Tabaski », « −15 % sur les boubous » —
   est passée dans le HERO. Le même rabais annoncé deux fois sur une page se
   lit comme deux offres différentes. La page ne « presse » donc plus en son
   milieu : elle presse d'entrée. Si une seconde relance est voulue plus bas,
   c'est une nouvelle section, pas la reprise de celle-ci.

   ⚠ La rangée de réassurance (livraison, paiement, retouches, WhatsApp) a été
   retirée, et la bande qui portait ses arguments ne porte plus que les
   coordonnées. Délai de livraison et moyens de paiement ne sont annoncés nulle
   part avant le tunnel d'achat. */
const HomePage = () => (
  <>
    <SEOHead url="/" />

    {/* ── 1. Le seuil ── */}
    <Hero />

    {/* ── 2. Les pièces en mouvement ── */}
    <VideoCardsSection />

    {/* ── 3. Orienter : la seule entrée par rayon de la page ── */}
    <UniversGrid />

    {/* ── 4. Montrer : le catalogue ── */}
    <CategoryGrid />

    {/* ── 6. La sélection filtrable ── */}
    <Selection />

    {/* ── 7. Raconter : l'atelier, le seul actif incopiable ── */}
    <AtelierSection />

    {/* ── 8. Prouver ── */}
    <TestimonialsSection />
  </>
);

export default HomePage;
