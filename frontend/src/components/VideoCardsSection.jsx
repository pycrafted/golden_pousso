import { useState, useEffect, useRef } from 'react';
import apiClient from '../api/client';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion';
import Reveal from './Reveal';
import useTexteSection from '../hooks/useTexteSection';

/**
 * « Nos créations en mouvement »
 * ---------------------------------------------------------------------------
 * Les séquences viennent de l'API (`/videos/`), donc de l'Espace Gestion →
 * Vidéos. La version précédente embarquait en dur quatre plans du dépôt
 * Redesign_mcommaman.com, avec des pièces et des prix qui n'étaient pas ceux
 * de cette maison — et dont les fichiers ont depuis disparu de `public/`.
 *
 * Le DESSIN reste celui de la source : palette rose/ink/stone/gold, Plus
 * Jakarta Sans, tuiles arrondies, deux voiles, pastille de son, carte produit
 * en pied de tuile. Seules les données ont changé. Ne pas « harmoniser » le
 * reste sans demande explicite.
 *
 * La carte produit n'apparaît que si la vidéo est rattachée à une pièce
 * (champ facultatif, réglable en admin). La vidéo montre, la carte vend.
 */

/* Décalages de départ, en secondes. Quand deux tuiles servent la même
   séquence — fréquent quand la maison n'en a que deux ou trois — des lectures
   synchronisées se lisent immédiatement comme une copie. */
const DEPARTS = [0, 3, 5, 2, 6, 4];


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
 * Bande de séquences verticales, à la façon d'un banc de montage : les tuiles
 * ne sont pas alignées, une sur deux descend d'un cran.
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
  const textes = useTexteSection('accueil-mouvement', { titre: 'Le tissu en mouvement' });
  const [bande, setBande] = useState([]);
  const [son, setSon] = useState(null);
  const lecteurs = useRef([]);

  useEffect(() => {
    apiClient.get('/videos/')
      // Une séquence sans fichier ne donnerait qu'une tuile blanche : mieux
      // vaut ne pas la dessiner. L'API peut en renvoyer — une ligne créée sans
      // vidéo était acceptée avant que le sérialiseur ne l'interdise.
      .then(({ data }) => setBande((data.results ?? data).filter((v) => v.video_url)))
      .catch(() => {});
  }, []);

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
  // (Espace Gestion → Vidéos).
  if (bande.length === 0) return null;

  return (
    <section className="em">
      <div className="em-shell">
        {/* En-tête au style Golden Pousso — titre seul, souligné du filet
            doré, comme les autres sections. C'est la seule partie de cette
            section transférée qui rejoint le système du site ; les tuiles en
            dessous restent celles de la source.

            Plus de dorure sur un mot du titre : elle ne servait qu'à mettre
            « Golden Pousso » en laiton, et le titre ne le contient plus. */}
        <Reveal className="em-entete">
          <h2>{textes.titre}</h2>
          <span className="filet-titre" aria-hidden="true" />
        </Reveal>

        <Reveal variant="scale">
          <div className="em-bande">
            {bande.map((item, i) => (
              <div
                key={item.id}
                /* Une tuile sur deux descend : la bande cesse d'être une
                   rangée et devient une composition. */
                className={`em-tuile ${i % 2 === 1 ? 'em-tuile--basse' : ''}`}
              >
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

      <style>{`
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

          /* ↓ LA HAUTEUR DES TUILES SE RÈGLE ICI.

             L'écart suivait --section-y, le rythme de toute la page. Il a été
             resserré : cette section n'en a plus besoin, pour deux raisons qui
             se cumulent.

             D'abord le titre a été retiré — il portait 36 px de marge sous
             lui, et l'espace du haut servait à le poser. Ensuite le hero finit
             maintenant en dégradé vers le fond de la page, dont le dernier
             tiers est un aplat d'écru franc : cette zone vide EST déjà la
             séparation. La reprendre en padding la comptait deux fois, et les
             vidéos tombaient bien trop bas.

             Le reste du dessin de cette section reste celui de la source. */
          padding: var(--s-6) 0 0;
          font-family: var(--em-font);
          overflow: visible;
        }

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

        /* 3/4 et non le 9/16 de la source : ces tuiles doivent faire la
           même taille que les cartes de « Nos créations », juste au-dessus.
           En 9/16 elles montaient à 560 px de haut contre 404 pour une carte —
           deux objets de même largeur et de hauteurs très différentes, à un
           écran d'intervalle.
           Conséquence assumée : une vidéo verticale est davantage recadrée. */
        .em-cadre {
          position: relative;
          aspect-ratio: 3 / 4;
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

        @media (min-width: 640px) {
          .em-tuile { width: 36vw; }
        }

        @media (min-width: 768px) {
          /* Le padding-top est retiré ici : il est désormais porté par
             la variable --section-y, qui gère elle-même sa progression. */
          .em-shell { padding: 0 32px; }
          .em-bande { margin: 0 -32px; padding: 0 32px 8px; }
        }

        @media (min-width: 1024px) {
          .em-shell { padding: 0 40px; }
          .em-bande {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 1.25rem;
            overflow: visible;
            margin: 0;
            padding: 0;
            /* Chaque tuile s'arrête à sa propre hauteur.

               Par défaut une cellule de grille s'étire sur la hauteur de sa
               rangée. Les tuiles paires descendant de 48 px, la rangée faisait
               48 px de plus que la hauteur naturelle d'une tuile : les tuiles
               impaires — la première et la troisième — s'étiraient d'autant et
               laissaient voir 48 px de leur fond rose sous la vidéo, le cadre
               vidéo étant lui bloqué en 3/4.

               Ce fond n'apparaissait donc que là où la composition était censée
               créer du vide, et le décalage se lisait comme un défaut plutôt
               que comme une intention. */
            align-items: start;
          }
          .em-bande > * { width: auto; }
          .em-tuile--basse { margin-top: 48px; }
        }

        /* La quatrième colonne n'arrive qu'une fois l'écran assez large pour
           que les tuiles gardent la largeur d'une carte produit. */
        @media (min-width: 1280px) {
          .em-bande { grid-template-columns: repeat(4, minmax(0, 1fr)); }
        }
      `}</style>
    </section>
  );
};

export default VideoCardsSection;
