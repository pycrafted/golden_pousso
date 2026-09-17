import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  useInstallable, lancerInstallation, refuser, silenceEnCours,
  compterPage, assezParcouru, estSafariIOS,
} from '../hooks/useInstallation';

/**
 * L'invitation à installer l'application.
 * ---------------------------------------------------------------------------
 * ⚠ ELLE NE BLOQUE RIEN, ET NE MASQUE RIEN. C'était d'abord un panneau plein
 * écran posé à l'arrivée, avant tout contenu. Trois raisons de ne pas le
 * garder :
 *
 * 1. Google PÉNALISE au classement les interstitiels qui masquent le contenu
 *    sur mobile — c'est une règle explicite, et le site fait 80 % de son
 *    trafic sur téléphone. On payait la demande d'installation en visibilité.
 * 2. Un visiteur qui arrive n'a aucune raison d'installer : il ne sait pas
 *    encore chez qui il est. On demandait au pire moment.
 * 3. Les navigateurs intégrés à Facebook, Instagram et WhatsApp — beaucoup de
 *    trafic à Dakar — NE SAVENT PAS installer. Le panneau les bloquait devant
 *    une porte qui ne s'ouvre pas.
 *
 * Ce qui la remplace suit ce que Google recommande vraiment :
 *
 * — une BANDE en bas d'écran, qui ne recouvre pas le contenu et ne décale
 *   rien (elle est `fixed`, donc aucun saut de mise en page — le CLS reste à
 *   zéro, et c'est une mesure qui compte pour le classement) ;
 * — montrée APRÈS TROIS PAGES, quand le visiteur a montré de l'intérêt ;
 * — refusée, elle se tait TRENTE JOURS ;
 * — et surtout, une entrée permanente « Installer l'application » dans le
 *   menu mobile : le chemin reste ouvert sans jamais rien demander. C'est
 *   elle qui remplace l'insistance.
 */

const InvitationInstallation = () => {
  const installable = useInstallable();
  const { pathname } = useLocation();
  /* `pret` est pose par le minuteur, `ferme` par le visiteur. La visibilite
     se DEDUIT des deux et des conditions : rien n'est ecrit dans un etat
     depuis le corps d'un effet, ce qui evite un rendu en cascade. */
  const [pret, setPret] = useState(false);
  const [ferme, setFerme] = useState(false);
  const [expliquer, setExpliquer] = useState(false);

  /* Chaque page vue est comptée, toutes visites confondues : l'invitation
     attend un vrai parcours, pas un passage. */
  useEffect(() => { compterPage(); }, [pathname]);

  useEffect(() => {
    if (!installable || silenceEnCours() || !assezParcouru()) return undefined;
    if (!window.matchMedia('(max-width: 900px)').matches) return undefined;
    /* Un temps de pose : la bande ne monte pas pendant que la page se peint,
       elle attend que le visiteur soit posé sur son contenu. */
    const t = setTimeout(() => setPret(true), 1200);
    return () => clearTimeout(t);
  }, [installable, pathname]);

  const visible = pret && !ferme && installable && !silenceEnCours();

  const installer = async () => {
    const issue = await lancerInstallation();
    if (issue === 'expliquer') { setExpliquer(true); return; }
    setFerme(true);
    if (issue === 'refusee') refuser();
  };

  /* Le menu mobile porte la même action : il la demande par un événement,
     pour n'avoir pas à connaître ce composant. Déclaré APRÈS `installer` —
     une fonction fléchée en `const` n'est pas remontée, et l'écouteur posé
     au-dessus ne pouvait pas l'atteindre. */
  useEffect(() => {
    const surDemande = () => (estSafariIOS() ? setExpliquer(true) : installer());
    window.addEventListener('gp:installer', surDemande);
    return () => window.removeEventListener('gp:installer', surDemande);
  }, []);

  const plusTard = () => { refuser(); setFerme(true); };

  if (!installable) return null;

  return (
    <>
      {visible && (
        <div className="ins-bande" role="complementary" aria-label="Installer l'application">
          <img src="/icons/icon-192.png" alt="" className="ins-logo" width="44" height="44" />
          <p className="ins-texte">
            <strong>Golden Pousso</strong>
            <span>Sur votre écran d’accueil, en un geste</span>
          </p>
          <button type="button" className="ins-oui" onClick={installer}>Installer</button>
          <button type="button" className="ins-non" onClick={plusTard} aria-label="Plus tard">
            <i className="bx bx-x" aria-hidden="true" />
          </button>
        </div>
      )}

      {expliquer && (
        <div className="ins-voile" onClick={() => setExpliquer(false)}>
          <div
            className="ins-feuille on-dark"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ins-titre"
            onClick={(e) => e.stopPropagation()}
          >
            <img src="/icons/icon-192.png" alt="" className="ins-feuille-logo" width="64" height="64" />
            <h2 id="ins-titre" className="ins-titre">Ajouter à l’écran d’accueil</h2>
            {/* Sur iPhone, Apple n'offre aucune API : l'ajout passe
                obligatoirement par le menu « Partager ». On ne peut que
                montrer la marche à suivre. */}
            <ol className="ins-etapes">
              <li>
                Touchez <strong>Partager</strong>
                <span className="ins-glyphe" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
                       strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 15V3m0 0L8.5 6.5M12 3l3.5 3.5" />
                    <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
                  </svg>
                </span>
                dans la barre du bas
              </li>
              <li>Faites défiler, puis <strong>Sur l’écran d’accueil</strong></li>
              <li>Touchez <strong>Ajouter</strong></li>
            </ol>
            <button type="button" className="btn btn--accent ins-compris" onClick={() => { setExpliquer(false); setFerme(true); }}>
              J’ai compris
            </button>
          </div>
        </div>
      )}

      <style>{`
        /* ── La bande ───────────────────────────────────────────────────────
           Posée en bas : le pouce y est, et le haut de l'ecran reste au
           contenu. Au-dessus de la barre d'achat de la fiche produit, qui
           publie sa hauteur — sans quoi les deux se superposeraient. */
        .ins-bande {
          position: fixed;
          left: var(--s-3);
          right: var(--s-3);
          bottom: calc(var(--s-3) + var(--barre-achat-h, 0px) + env(safe-area-inset-bottom, 0px));
          z-index: 950;
          display: flex;
          align-items: center;
          gap: var(--s-3);
          padding: var(--s-2) var(--s-2) var(--s-2) var(--s-3);
          background: var(--surface-chrome);
          border: 1px solid var(--line-dark-accent);
          border-radius: var(--r-3);
          box-shadow: var(--shadow-overlay);
          animation: fadeUp var(--dur-3) var(--ease) both;
        }
        .ins-logo { width: 4.4rem; height: 4.4rem; border-radius: 1.2rem; flex-shrink: 0; }
        .ins-texte { min-width: 0; flex: 1; display: flex; flex-direction: column; line-height: 1.3; }
        .ins-texte strong {
          font-family: var(--font-display);
          font-size: var(--t-sm);
          font-weight: 600;
          color: var(--gp-ecru-50);
        }
        .ins-texte span {
          font-size: var(--t-xs);
          color: rgba(250, 246, 238, 0.62);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .ins-oui {
          flex-shrink: 0;
          min-height: 4rem;
          padding: 0 var(--s-4);
          border: 0;
          border-radius: var(--r-pill);
          background: var(--gp-brass-400);
          color: var(--gp-indigo-900);
          font-family: var(--font-body);
          font-size: var(--t-xs);
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .ins-non {
          flex-shrink: 0;
          display: grid;
          place-items: center;
          width: 4rem;
          height: 4rem;
          border: 0;
          border-radius: var(--r-pill);
          background: none;
          color: rgba(250, 246, 238, 0.62);
          font-size: 2.2rem;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .ins-non:hover { color: var(--gp-ecru-50); }

        /* ── La feuille d'explication (iPhone) ───────────────────────────── */
        .ins-voile {
          position: fixed;
          inset: 0;
          z-index: 1500;
          display: grid;
          place-items: end center;
          padding: var(--s-3);
          padding-bottom: calc(var(--s-3) + env(safe-area-inset-bottom, 0px));
          background: rgba(15, 19, 32, 0.72);
          -webkit-backdrop-filter: blur(8px);
          backdrop-filter: blur(8px);
        }
        .ins-feuille {
          width: 100%;
          max-width: 40rem;
          padding: var(--s-5);
          text-align: center;
          background: var(--surface-chrome);
          border: 1px solid var(--line-dark-accent);
          border-radius: var(--r-3);
          animation: fadeUp var(--dur-2) var(--ease) both;
        }
        .ins-feuille-logo { width: 6.4rem; height: 6.4rem; border-radius: 1.6rem; }
        .ins-titre {
          margin: var(--s-3) 0 var(--s-4);
          font-family: var(--font-display);
          font-size: var(--t-h3);
          font-weight: 600;
          color: var(--text-on-dark);
        }
        .ins-etapes {
          margin: 0 0 var(--s-5);
          padding: 0;
          list-style: none;
          counter-reset: etape;
          text-align: left;
        }
        .ins-etapes li {
          counter-increment: etape;
          position: relative;
          padding: var(--s-2) 0 var(--s-2) 4rem;
          font-size: var(--t-sm);
          line-height: 1.5;
          color: var(--text-on-dark);
        }
        .ins-etapes li::before {
          content: counter(etape);
          position: absolute;
          left: 0;
          top: var(--s-2);
          display: grid;
          place-items: center;
          width: 2.6rem;
          height: 2.6rem;
          border: 1px solid var(--line-dark-accent);
          border-radius: var(--r-pill);
          font-size: var(--t-xs);
          font-weight: 700;
          color: var(--gp-brass-400);
        }
        .ins-etapes strong { color: var(--gp-brass-400); font-weight: 600; }
        .ins-glyphe {
          display: inline-grid;
          place-items: center;
          width: 2rem;
          height: 2rem;
          vertical-align: -0.5rem;
          margin: 0 0.2rem;
          color: var(--gp-brass-400);
        }
        .ins-glyphe svg { width: 1.8rem; height: 1.8rem; }
        .ins-compris { width: 100%; }

        @media (min-width: 901px) { .ins-bande { display: none; } }
        @media (prefers-reduced-motion: reduce) {
          .ins-bande, .ins-feuille { animation: none; }
        }
      `}</style>
    </>
  );
};

export default InvitationInstallation;
