import { useEffect, useRef, useState } from 'react';

/**
 * L'invitation à installer l'application — en plein écran, avant tout, sur
 * téléphone.
 * ---------------------------------------------------------------------------
 * À la demande : tout téléphone qui arrive sur le site et n'a pas l'icône sur
 * son écran d'accueil se la voit proposer, à chaque visite, avant de pouvoir
 * faire quoi que ce soit — comme un bandeau de consentement.
 *
 * ── CE QUE LE NAVIGATEUR PERMET, ET CE QU'IL NE PERMET PAS ─────────────────
 * Il n'existe aucune API pour « installer » de force, ni même pour savoir si
 * l'application est déjà posée sur l'écran d'accueil quand on navigue dans le
 * navigateur. Trois situations, trois traitements :
 *
 * 1. ANDROID / CHROME — l'événement `beforeinstallprompt` est capté, et son
 *    `prompt()` ouvre la vraie boîte d'installation du système. ⚠ Chrome
 *    EXIGE un geste de l'utilisateur pour l'appeler : impossible de l'ouvrir
 *    tout seul au chargement. D'où ce panneau, dont le bouton porte le geste.
 *    Pas de sortie : l'installation est possible, elle est donc demandée.
 *
 * 2. IPHONE / SAFARI — `beforeinstallprompt` N'EXISTE PAS. Apple n'offre
 *    aucune API : l'ajout à l'écran d'accueil passe obligatoirement par le
 *    menu « Partager » de l'utilisateur. On ne peut donc que l'expliquer —
 *    et comme rien ne permet de vérifier qu'il l'a fait, le panneau doit
 *    offrir une sortie. Sans elle, le site serait définitivement inaccessible
 *    sur iPhone.
 *
 * 3. TOUT LE RESTE — navigateurs intégrés à Facebook, Instagram, WhatsApp,
 *    Firefox Android, et les ordinateurs. ⚠ AUCUN NE SAIT INSTALLER. Les
 *    bloquer fermerait la boutique à tout le trafic venu des réseaux
 *    sociaux, qui est considérable à Dakar. Le panneau ne s'affiche pas.
 *
 * ── Ce qui fait disparaître le panneau ────────────────────────────────────
 * L'application lancée depuis l'écran d'accueil tourne en `display-mode:
 * standalone` (et `navigator.standalone` sur iPhone) : le panneau ne s'y
 * affiche jamais. Il disparaît aussi à l'instant où l'installation aboutit,
 * sur l'événement `appinstalled`.
 */

const estInstallee = () =>
  window.matchMedia('(display-mode: standalone)').matches
  || window.matchMedia('(display-mode: fullscreen)').matches
  || window.navigator.standalone === true;

const estTelephone = () => window.matchMedia('(max-width: 900px)').matches;

/* iPhone et iPad. `maxTouchPoints` rattrape les iPad récents, qui se
   présentent comme des Mac dans leur chaîne d'identification. */
const estIOS = () =>
  /iphone|ipod|ipad/i.test(navigator.userAgent)
  || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

/* Safari seul sait ajouter à l'écran d'accueil sur iPhone. Les navigateurs
   intégrés aux applications (Facebook, Instagram…) n'exposent pas
   `navigator.standalone` : c'est le signal qui les distingue. */
const estSafariIOS = () => estIOS() && typeof navigator.standalone === 'boolean';

const InvitationInstallation = () => {
  const [mode, setMode] = useState(null);   // null | 'android' | 'ios'
  const differe = useRef(null);             // l'événement retenu

  useEffect(() => {
    if (estInstallee() || !estTelephone()) return undefined;

    /* Chrome envoie l'événement peu après le chargement, une fois les
       critères d'installation vérifiés (manifeste, service worker, icônes
       192 et 512). Le retenir empêche la bannière native de Chrome et nous
       laisse la main sur le moment. */
    const surInvite = (e) => {
      e.preventDefault();
      differe.current = e;
      setMode('android');
    };

    const surInstallee = () => { differe.current = null; setMode(null); };

    window.addEventListener('beforeinstallprompt', surInvite);
    window.addEventListener('appinstalled', surInstallee);

    /* iPhone : aucun événement à attendre, le panneau s'affiche de lui-même.
       Un court délai laisse la page peindre son premier écran — un panneau
       posé sur du vide donne l'impression d'une erreur de chargement. */
    let minuteur;
    if (estSafariIOS()) {
      minuteur = setTimeout(() => setMode((m) => m ?? 'ios'), 600);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', surInvite);
      window.removeEventListener('appinstalled', surInstallee);
      clearTimeout(minuteur);
    };
  }, []);

  /* Le panneau couvre la page : celle-ci ne doit pas défiler derrière.
     `position: fixed` et non `overflow: hidden`, qui ne bloque pas Safari
     iOS — le même verrou que le tiroir du panier et ceux de l'Espace
     Gestion. */
  useEffect(() => {
    if (!mode) return undefined;
    const y = window.scrollY;
    const avant = {
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
      overflow: document.body.style.overflow,
    };
    document.body.style.position = 'fixed';
    document.body.style.top = `-${y}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    return () => {
      Object.assign(document.body.style, avant);
      window.scrollTo(0, y);
    };
  }, [mode]);

  if (!mode) return null;

  const installer = async () => {
    const evt = differe.current;
    if (!evt) return;
    differe.current = null;
    evt.prompt();
    const { outcome } = await evt.userChoice;
    /* Refusée, l'invitation se retire pour cette visite : Chrome ne rejoue
       pas `beforeinstallprompt` dans la foulée, un panneau qui resterait
       n'aurait plus de bouton qui fonctionne. Elle reviendra à la visite
       suivante, comme demandé. */
    if (outcome !== 'accepted') setMode(null);
  };

  return (
    <div className="inv-voile" role="dialog" aria-modal="true" aria-labelledby="inv-titre">
      <div className="inv-carte on-dark">
        <img src="/icons/icon-192.png" alt="" className="inv-logo" width="88" height="88" />

        <p className="eyebrow inv-sur-titre">Golden Pousso</p>
        <h2 id="inv-titre" className="inv-titre">Installez la boutique sur votre téléphone</h2>
        <p className="inv-texte">
          Un accès direct depuis votre écran d’accueil, en plein écran, et des
          pages qui s’ouvrent plus vite même quand le réseau faiblit.
        </p>

        {mode === 'android' ? (
          <button type="button" className="btn btn--accent inv-action" onClick={installer}>
            Installer l’application
          </button>
        ) : (
          <>
            <ol className="inv-etapes">
              <li>
                Touchez <strong>Partager</strong>
                <span className="inv-glyphe" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
                       strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 15V3m0 0L8.5 6.5M12 3l3.5 3.5" />
                    <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
                  </svg>
                </span>
                en bas de l’écran
              </li>
              <li>Faites défiler et choisissez <strong>Sur l’écran d’accueil</strong></li>
              <li>Touchez <strong>Ajouter</strong></li>
            </ol>
            {/* ⚠ Cette sortie est indispensable : rien ne permet de savoir que
                l'ajout a été fait, et sans elle l'iPhone resterait bloqué sur
                ce panneau pour toujours. */}
            <button type="button" className="inv-passer" onClick={() => setMode(null)}>
              Continuer sans installer
            </button>
          </>
        )}
      </div>

      <style>{`
        .inv-voile {
          position: fixed;
          inset: 0;
          z-index: 2000;
          display: grid;
          place-items: center;
          padding: var(--s-4);
          padding-bottom: calc(var(--s-4) + env(safe-area-inset-bottom, 0px));
          background: rgba(15, 19, 32, 0.92);
          -webkit-backdrop-filter: blur(10px);
          backdrop-filter: blur(10px);
          animation: fadeUp var(--dur-2) var(--ease) both;
        }
        .inv-carte {
          width: 100%;
          max-width: 40rem;
          max-height: 100%;
          overflow-y: auto;
          overscroll-behavior: contain;
          padding: var(--s-6) var(--s-5);
          text-align: center;
          background: var(--surface-chrome);
          border: 1px solid var(--line-dark-accent);
          border-radius: var(--r-3);
        }
        .inv-logo {
          width: 8.8rem;
          height: 8.8rem;
          border-radius: var(--r-3);
          margin-bottom: var(--s-4);
        }
        .inv-sur-titre { color: var(--gp-brass-400); }
        .inv-titre {
          margin: var(--s-2) 0 var(--s-3);
          font-family: var(--font-display);
          font-size: var(--t-h3);
          font-weight: 600;
          color: var(--text-on-dark);
        }
        .inv-texte {
          margin: 0 auto var(--s-5);
          max-width: 32rem;
          font-size: var(--t-body);
          line-height: var(--lh-body);
          color: var(--text-on-dark-muted);
        }
        .inv-action { width: 100%; }

        .inv-etapes {
          margin: 0 0 var(--s-5);
          padding: 0;
          list-style: none;
          counter-reset: etape;
          text-align: left;
        }
        .inv-etapes li {
          counter-increment: etape;
          position: relative;
          padding: var(--s-2) 0 var(--s-2) 4rem;
          font-size: var(--t-sm);
          line-height: 1.5;
          color: var(--text-on-dark);
        }
        .inv-etapes li::before {
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
        .inv-etapes strong { color: var(--gp-brass-400); font-weight: 600; }
        .inv-glyphe {
          display: inline-grid;
          place-items: center;
          width: 2rem;
          height: 2rem;
          vertical-align: -0.5rem;
          margin: 0 0.2rem;
          color: var(--gp-brass-400);
        }
        .inv-glyphe svg { width: 1.8rem; height: 1.8rem; }

        .inv-passer {
          min-height: 4.4rem;
          padding: 0 var(--s-3);
          border: 0;
          background: none;
          font-family: var(--font-body);
          font-size: var(--t-xs);
          letter-spacing: var(--ls-eyebrow);
          text-transform: uppercase;
          color: var(--text-on-dark-muted);
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .inv-passer:hover { color: var(--text-on-dark); }

        @media (prefers-reduced-motion: reduce) {
          .inv-voile { animation: none; }
        }
      `}</style>
    </div>
  );
};

export default InvitationInstallation;
