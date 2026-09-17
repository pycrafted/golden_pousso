import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import apiClient from '../api/client';
import useAuthStore from '../store/authStore';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion';
import Reveal from './Reveal';
import useTexteSection from '../hooks/useTexteSection';

/**
 * « Aperçu de la boutique »
 * ---------------------------------------------------------------------------
 * Le titre est réglable dans l'Espace Gestion → Textes des sections (clé
 * `accueil-mouvement`). La valeur écrite plus bas n'est qu'un repli ; celle
 * qui fait foi en production est dans `sync_contenu.py`, rejouée à chaque mise
 * en ligne. Renommer ici seulement ne change rien au site déployé.
 * ---------------------------------------------------------------------------
 * Les séquences viennent de l'API (`/videos/`) ; elles se gèrent par le stylo
 * posé à droite du titre (comptes `is_staff`), la page Espace Gestion →
 * Vidéos de l'accueil ayant été supprimée à la demande. La version précédente embarquait en dur quatre plans du dépôt
 * Redesign_mcommaman.com, avec des pièces et des prix qui n'étaient pas ceux
 * de cette maison — et dont les fichiers ont depuis disparu de `public/`.
 *
 * Le DESSIN reste celui de la source : palette rose/ink/stone/gold, Plus
 * Jakarta Sans, tuiles arrondies, deux voiles, pastille de son. Seules les
 * données ont changé. Ne pas « harmoniser » le reste sans demande explicite.
 *
 * Plus de carte produit en pied de tuile : ce sont des vidéos de la boutique,
 * qui ne représentent aucune pièce — le champ `product` a été retiré, front et
 * back, à la demande (migration 0035).
 */

/* Décalages de départ, en secondes. Quand deux tuiles servent la même
   séquence — fréquent quand la maison n'en a que deux ou trois — des lectures
   synchronisées se lisent immédiatement comme une copie. */
const DEPARTS = [0, 3, 5, 2, 6, 4];

/* La gestion des quatre vidéos de l'Espace Gestion, chargée au premier clic
   sur le stylo — que seul un compte `is_staff` voit. */
const GestionVideosAccueil = lazy(() => import('../pages/gestion/VideosPage').then((m) => ({ default: m.GestionVideosAccueil })));


/** Haut-parleur, son coupé : la barre traverse le cône. */
const IconMuet = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M11 5.5 6.8 9H4.2a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h2.6L11 18.5z" />
    <path d="m16.5 10 4 4M20.5 10l-4 4" />
  </svg>
);

/** Haut-parleur, son actif : deux ondes à droite du cône. */
const IconSon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M11 5.5 6.8 9H4.2a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h2.6L11 18.5z" />
    <path d="M15 9.5a3.6 3.6 0 0 1 0 5M17.8 7.2a7.2 7.2 0 0 1 0 9.6" />
  </svg>
);

/**
 * Bande de séquences verticales, TOUTES sur une même ligne et à la mesure de
 * la page, à la demande. Une sur deux descendait d'un cran, à la façon d'un
 * banc de montage, et les tuiles se rangeaient par trois ou quatre : les
 * rangées suivantes passaient sous la page.
 *
 * Les vidéos ne jouent que ce qui est à l'écran — une bande de quatre lecteurs
 * qui tournent en fond coûte cher en batterie pour rien. Le son est coupé
 * d'office, c'est la seule façon qu'un navigateur accepte de lancer une vidéo
 * sans clic ; un bouton par tuile le rend, une tuile à la fois.
 */
const VideoCardsSection = () => {
  const reduced = usePrefersReducedMotion();
  /* Le titre vient du back-office (Espace Gestion → Textes des sections) ; la
     valeur écrite ici n'est qu'un repli, pour que la section ne perde jamais
     son intitulé si l'API ne répond pas. */
  const textes = useTexteSection('accueil-mouvement', { titre: 'Aperçu de la boutique' });
  const [bande, setBande] = useState([]);
  const [son, setSon] = useState(null);
  const lecteurs = useRef([]);
  const estAdmin = useAuthStore((s) => s.isAuthenticated && Boolean(s.user?.is_staff));
  const [gestion, setGestion] = useState(false);
  /* Relit la bande après chaque écriture depuis le stylo. */
  const [version, setVersion] = useState(0);

  useEffect(() => {
    apiClient.get('/videos/')
      // Une séquence sans fichier ne donnerait qu'une tuile blanche : mieux
      // vaut ne pas la dessiner. L'API peut en renvoyer — une ligne créée sans
      // vidéo était acceptée avant que le sérialiseur ne l'interdise.
      .then(({ data }) => setBande((data.results ?? data).filter((v) => v.video_url)))
      .catch(() => {});
  }, [version]);

  /* Une seule bande son à la fois : ouvrir la deuxième referme la première. */
  useEffect(() => {
    lecteurs.current.forEach((v, i) => {
      if (v) v.muted = son !== i;
    });
  }, [son, bande]);

  /* Lecture pilotée par la visibilité, tuile par tuile. `IntersectionObserver`
     plutôt qu'un écouteur de défilement : le navigateur ne réveille le fil
     principal que lorsqu'une tuile passe le seuil. */
  useEffect(() => {
    if (reduced || bande.length === 0) return;

    const io = new IntersectionObserver(
      (entrees) => {
        entrees.forEach((e) => {
          const v = e.target;
          if (e.isIntersecting) {
            /* Refus du navigateur (onglet caché, économie d'énergie) : le
               poster reste, ce n'est pas une erreur à remonter. */
            v.play().catch(() => {});
          } else {
            v.pause();
          }
        });
      },
      { threshold: 0.45 }
    );

    lecteurs.current.forEach((v) => v && io.observe(v));
    return () => io.disconnect();
  }, [reduced, bande]);

  // Rien tant que le propriétaire n'a pas publié de vidéo
  // (par le stylo de cette section). Sauf pour un admin : sans la
  // section, il n'aurait pas de stylo pour ajouter la première.
  if (bande.length === 0 && !estAdmin) return null;

  return (
    <section className="em on-dark">
      <div className="em-shell">
        {/* En-tête au style Golden Pousso — titre seul, souligné du filet
            doré, comme les autres sections. C'est la seule partie de cette
            section transférée qui rejoint le système du site ; les tuiles en
            dessous restent celles de la source.

            Plus de dorure sur un mot du titre : elle ne servait qu'à mettre
            « Golden Pousso » en laiton, et le titre ne le contient plus. */}
        <Reveal className="em-entete">
          {/* Le stylo, pour les seuls comptes `is_staff`, à la demande : le
              même que sur les rayons et la boutique (`.catalogue-edition`),
              hors du <h2> — le sommaire de l'accueil lit le nom de la
              section dans ce titre — et hors du flux, à sa droite : le titre
              reste centré. */}
          <div className="catalogue-titre-ligne">
            <h2>{textes.titre}</h2>
            {estAdmin && (
              <button
                type="button"
                className="catalogue-edition"
                onClick={() => setGestion(true)}
                aria-label="Gérer les vidéos de l’aperçu de la boutique"
                title="Gérer les vidéos"
              >
                <i className="bx bx-pencil" aria-hidden="true" />
              </button>
            )}
          </div>
          <span className="filet-titre" aria-hidden="true" />
        </Reveal>

        {/* Section vide : seul un admin la voit, et le stylo est son unique
            porte d'entrée. */}
        {bande.length === 0 && (
          <p className="em-vide">
            Aucune vidéo pour l’instant. Le stylo permet d’en ajouter jusqu’à
            quatre ; tant qu’il n’y en a pas, les visiteurs ne voient pas cette
            section.
          </p>
        )}

        <Reveal variant="scale">
          <div className="em-bande">
            {bande.map((item, i) => (
              <div key={item.id} className="em-tuile">
                <div className="em-cadre">
                  <video
                    ref={(el) => { lecteurs.current[i] = el; }}
                    src={item.video_url}
                    poster={item.poster_url || undefined}
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    onLoadedMetadata={(e) => {
                      const v = e.currentTarget;
                      const depart = DEPARTS[i % DEPARTS.length];
                      if (depart && v.duration > depart) v.currentTime = depart;
                    }}
                  />

                  {/* Deux voiles. Le haut porte le bouton de son. Le bas ne
                      porte plus rien depuis le retrait de la carte produit : il
                      est gardé parce qu'il assoit la tuile — sans lui, une
                      vidéo claire se termine en bord franc contre le fond de
                      la page. */}
                  <div aria-hidden="true" className="em-voile-haut" />
                  <div aria-hidden="true" className="em-voile-bas" />

                  <button
                    type="button"
                    onClick={() => setSon((s) => (s === i ? null : i))}
                    aria-pressed={son === i}
                    aria-label={son === i ? 'Couper le son' : 'Écouter cette séquence'}
                    className="em-son"
                  >
                    {son === i ? <IconSon /> : <IconMuet />}
                  </button>

                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      {/* Le panneau est rendu dans <body> : les pages de l'accueil sont
          réduites par « zoom » (Pagineur), qui réduirait aussi un calque
          « fixed » posé dedans. */}
      {estAdmin && gestion && createPortal(
        <Suspense fallback={null}>
          <GestionVideosAccueil
            onClose={() => setGestion(false)}
            onChange={() => setVersion((v) => v + 1)}
          />
        </Suspense>,
        document.body,
      )}

      <style>{`
        /* Écru à 62 % sur #161B2D : 6,79:1. */
        .em-vide {
          max-width: 46rem;
          margin: 0 auto;
          text-align: center;
          font-size: var(--t-body);
          line-height: var(--lh-body);
          color: var(--text-on-dark-muted);
        }

        /* Palette et rythme de la source, redéclarés localement. Cette section
           ne doit rien au thème Or & Indigo. */
        .em {
          --em-rose:  #e0417f;
          --em-ink:   #241a20;
          --em-stone: #f6e9f0;
          --em-ease:  cubic-bezier(0.22, 0.68, 0.16, 1);
          /* Plus Jakarta Sans, la fonte de la source, a été remplacée par
             celle du site : « tous les écrits, vraiment tous ». */
          --em-font:  var(--font-display);

          /* Le fond, l'espace et l'écart du haut sont réglés juste après ce
             bloc — voir « .em.on-dark » et sa règle de voisinage.

             Le reste du dessin de cette section reste celui de la source. */
          font-family: var(--em-font);
          overflow: visible;
        }

        /* ── Le fond : #161B2D ─────────────────────────────────────────────
           À la demande, l'indigo du chrome (« --surface-chrome »), comme les
           trois bandes sombres qui suivent. C'est la seule exception au
           transfert à l'identique avec la police : le reste du dessin est
           celui de la source. « .on-dark », posé dans le JSX, bascule le titre
           et le filet en clair ; son propre fond (#0F1320) est remplacé ici.

           Bande pleine largeur : l'écart avec ce qui précède se prend en
           MARGE, dehors, et l'espace intérieur en padding en haut ET en bas —
           sans le padding du bas, les tuiles toucheraient le bord de l'indigo. */
        .em.on-dark {
          background: var(--surface-chrome);
          --surface: var(--surface-chrome);
          margin-top: var(--section-y);
          padding-block: var(--section-y);
        }
        /* Juste après le hero, pas de marge : le hero finit sur le même
           #161B2D — son fondu vers l'écru a été retiré à la demande. Les deux
           se fondent, sans séparateur : le filet de laiton qui faisait le
           joint a été retiré à la demande lui aussi. Adossé au voisinage :
           ailleurs dans la page, la marge revient seule. */
        main > section:first-of-type + .em.on-dark { margin-top: 0; }

        /* Juste après « Le mot de la maison », sur le même indigo : pas de
           marge — elle ouvrirait une bande d'écru de 80 px entre deux fonds
           sombres. Les deux bandes se fondent, sans séparateur. Adossé au
           voisinage, la règle cesse d'elle-même si l'ordre change. */
        .man + .em.on-dark { margin-top: 0; }
        /* De même juste après « Notre catalogue ». */
        .uv + .em.on-dark { margin-top: 0; }
        /* Et juste après la vitrine, « En vitrine » — la place de l'aperçu
           dans l'ordre actuel : même indigo, pas de marge. */
        .bp + .em.on-dark { margin-top: 0; }

/* En-tête centré, dans la police et le laiton du site — pas dans la
           palette de la source. */
        .em-entete {
          margin-bottom: 36px;
          text-align: center;
          font-family: var(--font-display);
        }

        .em-shell {
          margin: 0 auto;
          width: 100%;
          max-width: 1400px;
          padding: 0 20px;
        }

        /* Sous 1024px : bande qui défile et déborde jusqu'aux bords.
           Au-dessus : grille de quatre colonnes, plus de défilement. */
        .em-bande {
          display: flex;
          gap: 1rem;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
          overscroll-behavior-x: contain;
          margin: 0 -20px;
          padding: 0 20px 8px;
        }
        .em-bande::-webkit-scrollbar { display: none; }
        .em-bande > * { flex: none; scroll-snap-align: start; }

        /* 56vw / 36vw : les largeurs qu'occupe une carte produit aux mêmes
           tailles d'écran (1,6 puis 2,4 cartes visibles). */
        .em-tuile {
          position: relative;
          width: 56vw;
          overflow: hidden;
          border-radius: 24px;
          background: var(--em-stone);
        }

        /* 2/3 — ni le 9/16 de la source, ni le 3/4 d'avant. Ces tuiles
           suivent les cartes de « Nos produits », allongées à 2/3 à la
           demande : deux objets de la même famille, même proportion. En 9/16
           elles montaient à 560 px de haut contre 404 pour une carte de
           l'époque — deux objets de même largeur et de hauteurs très
           différentes.
           Conséquence : une vidéo verticale (9/16) reste recadrée, mais moins
           qu'en 3/4. */
        .em-cadre {
          position: relative;
          aspect-ratio: 2 / 3;
          overflow: hidden;
        }
        .em-cadre video {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 1200ms var(--em-ease);
        }
        .em-tuile:hover .em-cadre video { transform: scale(1.05); }

        .em-voile-haut,
        .em-voile-bas {
          position: absolute;
          left: 0;
          right: 0;
          pointer-events: none;
        }
        .em-voile-haut {
          top: 0;
          height: 96px;
          background: linear-gradient(to bottom, rgba(36,26,32,.45), transparent);
        }
        .em-voile-bas {
          bottom: 0;
          height: 40%;
          background: linear-gradient(to top, rgba(36,26,32,.85), rgba(36,26,32,.25), transparent);
        }

        .em-son {
          position: absolute;
          top: 12px;
          right: 12px;
          z-index: 20;
          display: grid;
          place-items: center;
          width: 36px;
          height: 36px;
          border-radius: 9999px;
          background: rgba(255,255,255,.85);
          color: var(--em-ink);
          backdrop-filter: blur(8px);
          cursor: pointer;
          transition: background-color 300ms, color 300ms;
        }
        .em-son:hover { background: var(--em-rose); color: #fff; }
        .em-son svg { width: 16px; height: 16px; }

        /* ── Au téléphone : une vidéo par ligne ────────────────────────────
           À la demande, et comme la grille des catalogues au même seuil
           (560 px, voir « .catalogue-grille » dans styles.css) : la bande qui
           défilait de côté devient une pile, chaque vidéo en pleine largeur.
           Le glissement latéral disparaît — deux gestes concurrents sur un
           téléphone, l'un pour la bande, l'autre pour la page — et l'on
           parcourt tout d'un seul doigt vers le bas. */
        @media (max-width: 560px) {
          .em-bande {
            display: grid;
            grid-template-columns: 1fr;
            gap: var(--s-5);
            overflow: visible;
            scroll-snap-type: none;
            margin: 0;
            padding: 0;
          }
          .em-tuile { width: auto; }
        }

        @media (min-width: 640px) {
          .em-tuile { width: 36vw; }
        }

        @media (min-width: 768px) {
          /* Le padding-top est retiré ici : il est désormais porté par
             la variable --section-y, qui gère elle-même sa progression. */
          .em-shell { padding: 0 32px; }
          .em-bande { margin: 0 -32px; padding: 0 32px 8px; }
        }

        /* ── Au-delà de 1 024 px : une seule ligne, à la mesure de la page ──
           À la demande : TOUTES les tuiles sur une ligne, alignées — plus de
           tuile sur deux qui descend de 48 px, plus de rangées de trois ou
           quatre dont les suivantes passaient sous la page.

           Elles se partagent la largeur (flex: 1) sans jamais dépasser la
           hauteur utile. --em-haut-max = la page (--hp-utile, posée par le
           Pagineur ; l'écran hors de l'accueil), moins l'espace du haut et du
           bas de la section (2 × --section-y) et le bloc du titre
           (--em-titre : titre, filet et leur marge). Une tuile en 2/3 ne
           s'élargit donc jamais au-delà des 2/3 de cette hauteur, et la rangée
           se centre dans la largeur qui reste.

           Sous 1 024 px, la bande reste une ligne qui défile au doigt. */
        @media (min-width: 1024px) {
          .em-shell { padding: 0 40px; }
          .em {
            --em-titre: 13rem;
            --em-haut-max: calc(var(--hp-utile, 100svh) - 2 * var(--section-y) - var(--em-titre));
          }
          .em-bande {
            display: flex;
            justify-content: center;
            gap: 1.25rem;
            overflow: visible;
            margin: 0;
            padding: 0;
          }
          .em-bande > * {
            flex: 1 1 0;
            width: auto;
            min-width: 0;
            max-width: calc(var(--em-haut-max) * 2 / 3);
          }
        }
      `}</style>
    </section>
  );
};

export default VideoCardsSection;
