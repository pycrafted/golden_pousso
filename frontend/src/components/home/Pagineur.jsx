import { useCallback, useEffect, useRef, useState } from 'react';
import Sommaire, { SommairePas } from '../Sommaire';

/**
 * La page d'accueil, paginée sur les côtés.
 * ===========================================================================
 * À la demande : on ne descend plus, on passe d'une section à l'autre vers la
 * droite. Chaque section occupe une page, toute la hauteur disponible sous
 * les barres du haut — la page d'accueil tient exactement dans l'écran, le
 * document ne défile plus.
 *
 * ── Comment on tourne les pages ────────────────────────────────────────────
 * - le SOMMAIRE, au-delà de 900 px : une carte flottante à gauche, décollée
 *   du bord, toujours ouverte — le numéro et le nom de chaque section, deux
 *   chevrons pour la précédente et la suivante ; en dessous de 900 px, les
 *   flèches des côtés (la barre de pagination du bas a été retirée à la
 *   demande) ;
 * - au doigt ou au pavé tactile, en glissant : c'est un vrai défilement
 *   horizontal, aimanté page par page (« scroll-snap-stop: always » — un
 *   geste, une page, même lancé fort) ;
 * - à la molette : vers le bas pour la suivante, vers le haut pour la
 *   précédente (voir « La molette », plus bas) ;
 * - au clavier : ← →, Page préc. / Page suiv., Début / Fin ; ↑ ↓ font défiler
 *   une page plus haute que l'écran.
 *
 * ── Une section plus haute que sa page ─────────────────────────────────────
 * Elle est d'abord RÉDUITE pour y tenir, d'un bloc — voir « Chaque section
 * tient dans sa page ». Au-delà de la réduction permise, et toujours en petit
 * écran, elle défile DANS sa page, verticalement. La molette la fait d'abord
 * défiler, et ne tourne la page qu'une fois arrivée au bord — et seulement
 * sur un NOUVEAU geste : l'élan qui vient d'amener la page en bas ne la
 * tourne pas. Sans cette règle, l'inertie d'un pavé tactile sautait la
 * section suivante sans qu'on l'ait vue.
 *
 * ── Une section qui ne rend rien ───────────────────────────────────────────
 * L'aperçu de la boutique sans vidéo publiée : sa page
 * reste vide, et « .hp-page:empty » la retire. La pagination ne compte que les
 * pages affichées ; un MutationObserver la tient à jour quand une section
 * apparaît après le chargement de ses données.
 *
 * ── Le nom des pages ───────────────────────────────────────────────────────
 * Lu dans la page elle-même : son premier <h2>, celui que le propriétaire
 * règle dans l'Espace Gestion : renommer une section renomme son entrée du
 * sommaire. Il est aussi annoncé aux lecteurs d'écran à chaque page tournée.
 * `titre` ne sert qu'aux pages sans <h2> (le hero).
 *
 * ── Le mouvement ───────────────────────────────────────────────────────────
 * Un clic, une touche ou la molette font glisser la piste en ~750 ms, courbe
 * douce aux deux bouts. Le défilement « smooth » du navigateur a été écarté :
 * trop vif, et impossible à régler. L'aimantation est coupée le temps du
 * trajet — sans cela le navigateur ramènerait la piste au point d'aimantation
 * le plus proche à chaque image. Un doigt posé en cours de route reprend la
 * main. Si le visiteur demande moins d'animations, la page change d'un coup.
 *
 * @param {{ pages: Array<{ cle: string, contenu: React.ReactNode,
 *                           titre?: string, claire?: boolean }> }} props
 *        `claire` : page écrue, pour une section dessinée sur fond clair.
 */

/* La molette ne retourne pas de page avant VERROU_MIN, ni tant que l'élan
   n'est pas retombé depuis VERROU_QUEUE. Un silence de PAUSE_GESTE sépare
   deux gestes. */
const VERROU_MIN = 800;
const VERROU_QUEUE = 180;
const PAUSE_GESTE = 160;

/* L'ajustement à la page — voir « Chaque section tient dans sa page ». Sous
   70 %, un texte courant de 16 px passerait sous 11 px : la section s'arrête
   là et défile pour le reste. En petit écran, pas de réduction du tout : le
   défilement dans la page s'y lit mieux qu'un texte rapetissé. */
const ECHELLE_MIN = 0.7;
const ECRAN_AJUSTE = '(min-width: 900px)';

/* ⚠ LA PAGINATION HORIZONTALE N'EXISTE QU'AU-DELA DE 900 PX, a la demande.
   En dessous, l'accueil est un document vertical ordinaire : les six
   sections s'empilent et l'on defile.

   Pourquoi : sur un telephone, ce carrousel superposait DEUX systemes de
   defilement — un balayage lateral entre les pages, un defilement vertical
   a l'interieur de chaque page trop haute (la reduction par `zoom` etant
   deja desactivee sous 900 px). Le geste lateral entrait en concurrence
   avec le balayage « retour » du navigateur, et surtout avec la bande de
   « Apercu de la boutique », elle-meme un carrousel horizontal : un doigt
   pose sur une vignette video faisait defiler les videos, jamais la page.
   Le visiteur pouvait s'y croire coince — d'autant que le sommaire, seul
   repere du nombre de sections et de la position, est masque sous 900 px.

   En vertical, tout cela disparait et le navigateur rend gratuitement ce
   que ~250 lignes de JS reproduisaient : molette, barre de defilement,
   bouton retour, lecteur d'ecran.

   Au-dela de 900 px rien ne change : souris, clavier et sommaire visible,
   le format y est a son avantage. */
const ECRAN_PAGINE = '(min-width: 900px)';
const estPagine = () =>
  typeof window === 'undefined' || window.matchMedia(ECRAN_PAGINE).matches;

/* Durée d'un glissement : 750 ms pour une page, un peu plus pour un saut
   lointain — sans jamais traîner. */
const DUREE = 750;
const DUREE_PAR_PAGE = 110;
const DUREE_MAX = 1150;

// easeInOutCubic : départ et arrivée en douceur.
const adoucir = (p) => (p < 0.5 ? 4 * p * p * p : 1 - ((-2 * p + 2) ** 3) / 2);
const moinsDeMouvement = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Là, une touche fléchée appartient au contrôle, pas à la pagination.
const ZONES_CLAVIER = 'input, textarea, select, [contenteditable], [role="dialog"], [role="tablist"], [role="slider"]';

const Pagineur = ({ pages }) => {
  const cadre = useRef(null);
  const piste = useRef(null);
  const sommaire = useRef(null);
  const [titres, setTitres] = useState([]);
  const [courante, setCourante] = useState(0);
  const [pagine, setPagine] = useState(estPagine);

  const couranteRef = useRef(0);
  const cible = useRef(null);       // page visée par le glissement en cours
  const anim = useRef(0);           // requestAnimationFrame du glissement
  const verrou = useRef(0);         // molette : pas de page avant cet instant
  const derniereRoue = useRef(0);
  const gesteInterne = useRef(false);

  const pagesAffichees = useCallback(
    () => Array.from(piste.current?.children ?? []).filter((p) => p.offsetWidth > 0),
    [],
  );

  const fixer = useCallback((i) => {
    couranteRef.current = i;
    setCourante(i);
  }, []);

  const arreter = useCallback(() => {
    if (!anim.current) return;
    cancelAnimationFrame(anim.current);
    anim.current = 0;
    cible.current = null;
    if (piste.current) piste.current.style.scrollSnapType = '';
  }, []);

  const aller = useCallback((i) => {
    const el = piste.current;
    const total = pagesAffichees().length;
    if (!el || total === 0) return;
    const n = Math.max(0, Math.min(total - 1, i));
    arreter();
    // La barre montre la destination tout de suite, pas les pages traversées.
    fixer(n);

    const depart = el.scrollLeft;
    const ecart = n * el.clientWidth - depart;
    if (Math.abs(ecart) < 1) return;
    if (moinsDeMouvement()) {
      el.scrollLeft = depart + ecart;
      return;
    }

    const traversees = Math.abs(ecart) / el.clientWidth;
    const duree = Math.min(DUREE_MAX, DUREE + DUREE_PAR_PAGE * (traversees - 1));
    cible.current = n;
    el.style.scrollSnapType = 'none';
    const t0 = performance.now();
    const pas = (t) => {
      const p = Math.min(1, (t - t0) / duree);
      el.scrollLeft = depart + ecart * adoucir(p);
      if (p < 1) {
        anim.current = requestAnimationFrame(pas);
        return;
      }
      anim.current = 0;
      cible.current = null;
      el.style.scrollSnapType = '';
    };
    anim.current = requestAnimationFrame(pas);
  }, [arreter, fixer, pagesAffichees]);

  /* ── La page courante suit le défilement ──────────────────────────────────
     Au doigt, au pavé tactile, ou quand le navigateur amène à l'écran un
     lien atteint à la tabulation. Pendant un glissement animé, la barre
     affiche déjà la destination : les pages traversées ne s'y inscrivent
     pas. */
  useEffect(() => {
    const el = piste.current;
    if (!el) return undefined;
    let image = 0;
    const lire = () => {
      if (cible.current != null) return;
      const i = Math.round(el.scrollLeft / (el.clientWidth || 1));
      if (i !== couranteRef.current) fixer(i);
    };
    const surDefilement = () => {
      cancelAnimationFrame(image);
      image = requestAnimationFrame(lire);
    };
    el.addEventListener('scroll', surDefilement, { passive: true });
    // Un doigt posé en plein glissement reprend la main.
    el.addEventListener('pointerdown', arreter);
    el.addEventListener('touchstart', arreter, { passive: true });
    return () => {
      el.removeEventListener('scroll', surDefilement);
      el.removeEventListener('pointerdown', arreter);
      el.removeEventListener('touchstart', arreter);
      cancelAnimationFrame(image);
    };
  }, [arreter, fixer]);

  /* ── La fenêtre change de taille ──────────────────────────────────────────
     Les pages changent de largeur, pas la position de la piste : sans ce
     recalage, on se retrouverait à cheval sur deux pages. */
  useEffect(() => {
    const el = piste.current;
    if (!el) return undefined;
    const observateur = new ResizeObserver(() => {
      arreter();
      el.scrollLeft = couranteRef.current * el.clientWidth;
    });
    observateur.observe(el);
    return () => observateur.disconnect();
  }, [arreter]);

  /* ── Les pages affichées et leur nom ──────────────────────────────────────
     Relevés après chaque changement du contenu, une fois par image au plus :
     une section qui apparaît au retour de sa requête gagne sa page, un titre
     renommé en base change ce qu'annonce le lecteur d'écran. */
  useEffect(() => {
    const el = piste.current;
    if (!el) return undefined;
    let image = 0;
    const relever = () => {
      const noms = pagesAffichees().map((p, i) =>
        p.dataset.titre || p.querySelector('h2')?.textContent.trim() || `Section ${i + 1}`);
      setTitres((avant) => (
        avant.length === noms.length && avant.every((t, i) => t === noms[i]) ? avant : noms
      ));
      // Une page a disparu sous la page courante : on se range sur la dernière.
      if (noms.length && couranteRef.current > noms.length - 1) {
        fixer(noms.length - 1);
        el.scrollLeft = (noms.length - 1) * el.clientWidth;
      }
    };
    const planifier = () => {
      cancelAnimationFrame(image);
      image = requestAnimationFrame(relever);
    };
    planifier();
    const observateur = new MutationObserver(planifier);
    observateur.observe(el, { childList: true, subtree: true, characterData: true });
    return () => {
      observateur.disconnect();
      cancelAnimationFrame(image);
    };
  }, [fixer, pagesAffichees]);

  /* ── La molette ───────────────────────────────────────────────────────────
     Un geste vertical tourne la page — vers le bas, la suivante. Un geste
     horizontal (pavé tactile) est laissé au défilement natif, que
     l'aimantation arrête sur une page.

     Une page plus haute que l'écran défile d'abord. Arrivée au bord, elle ne
     tourne que sur un NOUVEAU geste : l'élan qui l'a amenée là est ignoré.
     Une fois la page tournée, la molette reste sourde tant que l'élan ne
     retombe pas — l'inertie d'un pavé tactile envoie des dizaines
     d'événements, qui auraient fait défiler toutes les sections d'un coup.

     Écouteur posé à la main, « passive: false » : React n'offre pas de
     « onWheel » capable d'annuler le défilement. */
  useEffect(() => {
    const el = cadre.current;
    if (!el) return undefined;
    const surRoue = (e) => {
      // En vertical, la molette appartient au document.
      if (!estPagine()) return;
      if (e.ctrlKey || Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
      const maintenant = performance.now();
      if (maintenant - derniereRoue.current > PAUSE_GESTE) gesteInterne.current = false;
      derniereRoue.current = maintenant;

      if (maintenant < verrou.current) {
        verrou.current = Math.max(verrou.current, maintenant + VERROU_QUEUE);
        e.preventDefault();
        return;
      }

      const page = pagesAffichees()[couranteRef.current];
      if (!page) return;
      const versLeBas = e.deltaY > 0;
      const peutDefiler = versLeBas
        ? page.scrollTop + page.clientHeight < page.scrollHeight - 1
        : page.scrollTop > 0;
      if (peutDefiler) {
        gesteInterne.current = true;
        return;
      }
      if (gesteInterne.current) return;

      const n = couranteRef.current + (versLeBas ? 1 : -1);
      if (n < 0 || n >= pagesAffichees().length) return;
      e.preventDefault();
      verrou.current = maintenant + VERROU_MIN;
      aller(n);
    };
    el.addEventListener('wheel', surRoue, { passive: false });
    return () => el.removeEventListener('wheel', surRoue);
  }, [aller, pagesAffichees]);

  /* ── Le clavier ───────────────────────────────────────────────────────── */
  useEffect(() => {
    const surTouche = (e) => {
      // En vertical, les fleches et Page suiv./prec. defilent la page.
      if (!estPagine()) return;
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.target instanceof Element && e.target.closest(ZONES_CLAVIER)) return;
      const i = couranteRef.current;

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const page = pagesAffichees()[i];
        if (!page || page.scrollHeight <= page.clientHeight + 1) return;
        e.preventDefault();
        page.scrollBy({
          top: (e.key === 'ArrowDown' ? 1 : -1) * Math.round(page.clientHeight * 0.2),
          behavior: moinsDeMouvement() ? 'auto' : 'smooth',
        });
        return;
      }

      const total = pagesAffichees().length;
      const n = {
        ArrowRight: i + 1, PageDown: i + 1,
        ArrowLeft: i - 1, PageUp: i - 1,
        Home: 0, End: total - 1,
      }[e.key];
      if (n === undefined || n < 0 || n >= total || n === i) return;
      e.preventDefault();
      aller(n);
    };
    window.addEventListener('keydown', surTouche);
    return () => window.removeEventListener('keydown', surTouche);
  }, [aller, pagesAffichees]);

  /* ── Chaque section tient dans sa page ────────────────────────────────────
     Une section plus haute que sa page est réduite d'un bloc — texte,
     photos, grilles —, juste assez pour y tenir, à la demande. « zoom » et
     non « transform: scale » : il réduit aussi la place occupée dans la mise
     en page ; mise à l'échelle par transform, la section garderait sa
     hauteur d'origine et déborderait toujours.

     L'échelle passe par --hp-zoom, posée sur la PAGE (un élément de ce
     composant) : le style des sections appartient à leurs composants, React
     pourrait le réécrire.

     La mesure se fait TOUJOURS à l'échelle 1 — la variable est remise à 1
     juste avant. Mesurer une section déjà réduite, dont les lignes sont plus
     longues, donnerait une autre hauteur, et l'ajustement oscillerait.
     Réécrire la même échelle ne change pas la taille finale : l'observateur
     ne se relance pas.

     Relevé quand la piste change de taille, quand une section change (une
     photo qui arrive, un titre lu en base) et quand une section apparaît au
     retour de sa requête. */
  useEffect(() => {
    const el = piste.current;
    if (!el) return undefined;
    const ecran = window.matchMedia(ECRAN_AJUSTE);
    let image = 0;

    const ajuster = () => {
      Array.from(el.children).forEach((page) => {
        const section = page.firstElementChild;
        page.style.setProperty('--hp-zoom', '1');
        if (!section || !ecran.matches) return;
        const naturelle = section.getBoundingClientRect().height;
        const dispo = page.clientHeight;
        if (!naturelle || !dispo || naturelle <= dispo) return;
        const echelle = Math.max(ECHELLE_MIN, Math.floor((dispo / naturelle) * 1000) / 1000);
        page.style.setProperty('--hp-zoom', String(echelle));
      });
    };
    const planifier = () => {
      cancelAnimationFrame(image);
      image = requestAnimationFrame(ajuster);
    };

    const tailles = new ResizeObserver(planifier);
    const suivre = () => {
      tailles.disconnect();
      tailles.observe(el);
      Array.from(el.children).forEach((page) => {
        if (page.firstElementChild) tailles.observe(page.firstElementChild);
      });
      planifier();
    };
    const apparitions = new MutationObserver(suivre);
    Array.from(el.children).forEach((page) => apparitions.observe(page, { childList: true }));
    suivre();
    ecran.addEventListener('change', planifier);
    return () => {
      tailles.disconnect();
      apparitions.disconnect();
      ecran.removeEventListener('change', planifier);
      cancelAnimationFrame(image);
    };
  }, []);

  /* ── La largeur du sommaire ───────────────────────────────────────────────
     Publiée dans --hp-sommaire-l, sur le cadre : les pages lui réservent
     exactement sa place. Mesurée et non écrite en dur — les noms viennent de
     la base, un titre renommé change la largeur de la carte. Le sommaire
     n'existe qu'une fois les pages relevées : l'effet se rebranche quand il
     apparaît. Masqué en petit écran, il mesure 0 : on garde la valeur
     d'avant, la réserve n'y sert pas. */
  const aSommaire = titres.length > 1;
  useEffect(() => {
    const nav = sommaire.current;
    const el = cadre.current;
    if (!aSommaire || !nav || !el) return undefined;
    const observateur = new ResizeObserver(() => {
      const largeur = Math.ceil(nav.getBoundingClientRect().width);
      if (largeur > 0) el.style.setProperty('--hp-sommaire-l', `${largeur}px`);
    });
    observateur.observe(nav);
    return () => observateur.disconnect();
  }, [aSommaire]);

  /* Le passage d'un mode a l'autre, a la rotation de l'ecran comme au
     redimensionnement d'une fenetre de bureau. */
  useEffect(() => {
    const ecran = window.matchMedia(ECRAN_PAGINE);
    const suivre = () => setPagine(ecran.matches);
    suivre();
    ecran.addEventListener('change', suivre);
    return () => ecran.removeEventListener('change', suivre);
  }, []);

  // Le glissement en cours s'arrête si la page d'accueil est quittée.
  useEffect(() => () => cancelAnimationFrame(anim.current), []);

  const total = titres.length;

  return (
    <div className="hp" ref={cadre}>
      <div className="hp-piste" ref={piste}>
        {pages.map((p) => (
          <div
            key={p.cle}
            className={p.claire ? 'hp-page hp-page--claire' : 'hp-page'}
            data-titre={p.titre}
          >
            {p.contenu}
          </div>
        ))}
      </div>

      {pagine && total > 1 && (
        <>
          <button
            type="button"
            className="hp-fleche hp-fleche--g"
            onClick={() => aller(courante - 1)}
            disabled={courante === 0}
            aria-label="Section précédente"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
                 strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14.5 5.5 8 12l6.5 6.5" />
            </svg>
          </button>
          <button
            type="button"
            className="hp-fleche hp-fleche--d"
            onClick={() => aller(courante + 1)}
            disabled={courante >= total - 1}
            aria-label="Section suivante"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
                 strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9.5 5.5 16 12l-6.5 6.5" />
            </svg>
          </button>

          {/* Le sommaire — au-delà de 900 px. La carte est le composant
              partagé avec l'Espace Gestion (components/Sommaire.jsx) ; cette
              page ne décide que de son emplacement et de ses deux chevrons.
              Elle remplace les flèches des côtés, qui ne restent qu'en petit
              écran. */}
          <Sommaire
            innerRef={sommaire}
            className="hp-sommaire"
            label="Sections de la page d'accueil"
            entrees={titres.map((titre, i) => ({
              cle: `${i}-${titre}`,
              nom: titre,
              actif: i === courante,
              onClick: () => aller(i),
            }))}
            tete={(
              <SommairePas
                sens="haut"
                onClick={() => aller(courante - 1)}
                disabled={courante === 0}
                aria-label="Section précédente"
              />
            )}
            pied={(
              <SommairePas
                sens="bas"
                onClick={() => aller(courante + 1)}
                disabled={courante >= total - 1}
                aria-label="Section suivante"
              />
            )}
          />

          {/* La position, dite aux lecteurs d'écran à chaque page tournée. */}
          <p className="visually-hidden" aria-live="polite">
            {`Section ${courante + 1} sur ${total} : ${titres[courante] ?? ''}`}
          </p>
        </>
      )}

      <style>{`
        /* ── Le cadre ─────────────────────────────────────────────────────
           L'écran entier moins les deux barres collantes, qui publient leur
           hauteur (--bande-h, --nav-h) : la page d'accueil tient exactement
           dans la fenêtre. Le pied de page, qui se retranchait aussi
           (--pied-h), a été retiré du site à la demande.

           --hp-utile, la hauteur d'une page — la vitrine s'y règle. Elle
           retranchait une réserve de 72 px (--hp-bas) où flottait la barre de
           pagination du bas, retirée à la demande.

           svh (la plus petite hauteur de fenêtre, barres du navigateur
           déployées) dans un @supports et non en seconde déclaration : une
           variable CSS accepte n'importe quelle valeur, la seconde écraserait
           la première même là où svh n'existe pas. */
        .hp {
          /* L'espace au-dessus du titre de chaque section — voir « Une page ». */
          --hp-haut: var(--s-6);
          --hp-h: calc(100vh - var(--bande-h, 0px) - var(--nav-h, 0px));
          --hp-utile: var(--hp-h);
          /* L'écart du sommaire au bord gauche, et la place que les pages lui
             réservent à gauche — 0 tant qu'il n'est pas affiché. Voir « Le
             sommaire ». */
          --hp-sommaire-bord: clamp(1.6rem, 2.2vw, 3.2rem);
          --hp-reserve: 0px;
          position: relative;
          isolation: isolate;
          /* Filet de sécurité : rien ne dépasse du cadre de l'accueil. Sans
             lui, un seul élément échappé des pages (voir « Une page ») élargit
             TOUT le document, et une barre de défilement horizontale apparaît
             sous la fenêtre, qui ne mène nulle part. */
          overflow: hidden;
          height: var(--hp-h);
          min-height: 40rem;
          background: var(--surface-chrome);
        }
        @supports (height: 100svh) {
          .hp {
            --hp-h: calc(100svh - var(--bande-h, 0px) - var(--nav-h, 0px));
          }
        }
        /* Les hauteurs publiées sont arrondies : un pixel d'écart laisserait
           voir l'écru du document sous les pages. */
        html:has(.hp) body { background: var(--surface-chrome); }

        /* ── La piste ─────────────────────────────────────────────────────
           Un vrai défilement horizontal, aimanté : le doigt et le pavé
           tactile marchent sans une ligne de code. « overscroll-behavior »
           empêche le geste de fuir vers l'historique du navigateur (glisser
           vers la droite sur la première page ne fait pas « Précédent »). */
        .hp-piste {
          display: flex;
          height: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          scroll-snap-type: x mandatory;
          overscroll-behavior-x: contain;
          scrollbar-width: none;
        }
        .hp-piste::-webkit-scrollbar { display: none; }

        /* ── Une page ─────────────────────────────────────────────────────
           Toute la largeur, toute la hauteur. Une section plus courte s'y
           centre verticalement (marges automatiques) ; plus haute, elle
           défile dans sa page — « flex-shrink: 0 » l'empêche d'être écrasée,
           et une marge automatique retombe à zéro quand le contenu déborde.

           « scrollbar-gutter: stable » : toutes les pages réservent la place
           de la barre de défilement, qu'elles défilent ou non — sans cela, le
           contenu se décalerait de quelques pixels d'une page à l'autre. */
        .hp-page {
          /* « position: relative » : un élément en position absolue dans une
             section se range dans SA page. Sans cela, il se rangeait sur
             « .hp », hors de la piste qui défile : il échappait à son
             défilement et à son rognage, et élargissait le document — le
             texte caché du compteur de « Nos produits », posé dans la
             sixième page, le portait à ~8 900 px, d'où une barre horizontale
             qui ne fonctionnait pas. */
          position: relative;
          flex: 0 0 100%;
          height: 100%;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          overflow-x: hidden;
          overflow-y: auto;
          overscroll-behavior-y: contain;
          scroll-snap-align: start;
          scroll-snap-stop: always;
          scrollbar-gutter: stable;
          scrollbar-width: thin;
          scrollbar-color: rgba(198, 164, 61, 0.45) transparent;
          background: var(--surface-chrome);
        }
        /* Une section qui ne rend rien : pas de page blanche. */
        .hp-page:empty { display: none; }
        /* Option « claire » : une page écrue. Inutilisée — la sélection, qui
           s'en servait, a été retirée avec les pièces « Vedette ». */
        .hp-page--claire { background: var(--gp-ecru-50); }

        .hp-page > * { flex-shrink: 0; }
        /* Calée EN HAUT de sa page, son titre juste sous la barre de
           navigation, à la demande. Elle était centrée verticalement : une
           section plus courte que l'écran laissait un grand vide au-dessus.

           --section-y redéfinie ici, et non chaque padding un par un : toutes
           les sections la lisent — padding des bandes, marge, bloc du titre
           de la vitrine (--bp-titre) —, elles se resserrent donc toutes
           ensemble. 80 px au-dessus d'un titre séparaient une section de sa
           voisine ; seule dans sa page, elle n'a plus que la barre de
           navigation au-dessus : --hp-haut, 32 px.

           « margin-block: 0 auto » remplace la marge du haut que portent les
           bandes (« .uv.on-dark », « .bp »…) : plus de voisine dont se
           séparer. ⚠ « .hp » en tête du sélecteur, pour la spécificité :
           sans lui (0,1,1), la règle perdait contre « .uv.on-dark » (0,2,0),
           et les bandes gardaient 80 px de marge en plus de leurs 80 px de
           padding. */
        .hp .hp-page > section {
          --section-y: var(--hp-haut);
          margin-block: 0 auto;
          /* 1 sauf si la section dépasse sa page — posée par le composant,
             voir « Chaque section tient dans sa page ». */
          zoom: var(--hp-zoom, 1);
        }
        /* Le hero occupe sa page, et non plus 100vh — l'écran entier le
           ferait déborder sous les barres du haut. */
        .hp-page > .hero { min-height: 100%; }
        /* Le mot de la maison : son panneau porte son propre espace, comme
           quand il suivait le hero. */
        .hp-page > .man { padding-top: 0; }
        .hp .hp-page > .man .man-panneau { padding-top: var(--hp-haut); }
        /* La sélection n'a d'espace qu'en haut (le rythme vertical à sens
           unique) : seule dans sa page, elle reprend le sien en bas. */
        .hp-page--claire > section { padding-bottom: var(--section-y); }

        /* ── Les flèches ──────────────────────────────────────────────────
           Centrées sur la hauteur de la page. En petit écran seulement :
           au-delà de 900 px, le sommaire les remplace. Elles s'effacent au bout de
           la course plutôt que de griser. Voile d'indigo à 80 % : écru
           16,93:1 sur l'indigo, 9,53:1 sur la page écrue de la sélection ;
           au survol, indigo sur laiton : 7,74:1. */
        .hp-fleche {
          position: absolute;
          top: 50%;
          z-index: 30;
          display: grid;
          place-items: center;
          width: 5.6rem;
          height: 5.6rem;
          padding: 0;
          border: 1px solid var(--line-dark-accent);
          border-radius: 50%;
          background: rgba(15, 19, 32, 0.8);
          -webkit-backdrop-filter: blur(10px);
          backdrop-filter: blur(10px);
          color: var(--gp-ecru-50);
          cursor: pointer;
          transform: translateY(-50%);
          transition: background var(--dur-2) var(--ease),
                      border-color var(--dur-2) var(--ease),
                      color var(--dur-2) var(--ease),
                      opacity var(--dur-2) var(--ease);
        }
        .hp-fleche svg {
          width: 2rem;
          height: 2rem;
          transition: transform var(--dur-2) var(--ease);
        }
        .hp-fleche--g { left: clamp(1.2rem, 2vw, 3.2rem); }
        .hp-fleche--d { right: clamp(1.2rem, 2vw, 3.2rem); }
        .hp-fleche:hover {
          background: var(--gp-brass-400);
          border-color: var(--gp-brass-400);
          color: var(--gp-indigo-900);
        }
        .hp-fleche--g:hover svg { transform: translateX(-2px); }
        .hp-fleche--d:hover svg { transform: translateX(2px); }
        /* Anneau collé, sans décalage : la flèche a sa propre bordure, un
           écart dessinait un second cercle. */
        .hp-fleche:focus-visible { outline: 2px solid var(--gp-brass-400); outline-offset: 0; }
        .hp-fleche:disabled { opacity: 0; pointer-events: none; }

        /* ── Le sommaire ──────────────────────────────────────────────────
           La CARTE est dans components/Sommaire.jsx, partagée avec l'Espace
           Gestion — voile, filet de laiton, numéro, trait, nom. Ici, son seul
           EMPLACEMENT : à gauche, décollée du bord (1,6 à 3,2 rem), centrée
           sur la hauteur, et masquée sous 900 px, où les flèches des côtés
           prennent le relais. Elle a été à droite ; passée à gauche à la
           demande, sa ligne s'est retournée — le numéro contre le bord, puis
           le trait, puis le nom. */
        .hp-sommaire {
          position: absolute;
          top: 50%;
          left: var(--hp-sommaire-bord);
          z-index: 30;
          display: none;
          transform: translateY(-50%);
        }

        /* Les pages lui réservent sa place, À GAUCHE : le bord, la carte — sa
           largeur mesurée, publiée dans --hp-sommaire-l par le composant ;
           22,6 rem en attendant la mesure — et 2,4 rem d'air. Toutes les
           pages, hero compris : ouverte en permanence, la carte couvrirait
           sinon la silhouette de gauche du tableau. À gauche seulement : des
           deux côtés, le contenu perdrait ~540 px de large. Chaque section se
           centre dans ce qui reste. */
        @media (min-width: 900px) {
          .hp { --hp-reserve: calc(var(--hp-sommaire-bord) + var(--hp-sommaire-l, 22.6rem) + 2.4rem); }
          .hp-page { padding-left: var(--hp-reserve); }
          .hp-sommaire { display: flex; }
          .hp-fleche { display: none; }
        }

        /* En petit écran, les flèches restent — c'est le seul repère qui dit
           qu'il y a d'autres sections à côté — mais rapetissent et se
           rapprochent du bord, pour moins mordre sur le contenu. */
        @media (max-width: 900px) {
          .hp-fleche { width: 4.4rem; height: 4.4rem; }
          .hp-fleche svg { width: 1.8rem; height: 1.8rem; }
          .hp-fleche--g { left: 0.8rem; }
          .hp-fleche--d { right: 0.8rem; }
        }

        @media (prefers-reduced-motion: reduce) {
          .hp-fleche,
          .hp-fleche svg { transition: none; }
        }
        /* ══ SOUS 900 PX : UN DOCUMENT VERTICAL ORDINAIRE ════════════════
           ⚠ CE BLOC DOIT RESTER LE DERNIER DE LA FEUILLE. Il a vécu en TÊTE,
           et n'a donc jamais rien fait : « .hp-piste { display: block } » y
           était réécrit quelques lignes plus bas par « .hp-piste { display:
           flex } », de même poids mais déclaré après. La requête média
           s'appliquait bien (mesuré : « (max-width: 899px) » vraie à 400 px),
           mais la piste restait horizontale — sur un téléphone, la page
           d'accueil se parcourait donc de côté, ce qu'elle n'aurait jamais dû
           faire. Une requête média ne pèse pas plus lourd qu'une règle
           ordinaire : à poids égal, c'est la dernière écrite qui gagne.

           Le carrousel est deroule : les six sections s'empilent et l'on
           defile. Voir ECRAN_PAGINE en tete de fichier pour le pourquoi.
           Au-dela de 900 px, aucune de ces regles ne s'applique. */
        @media (max-width: 899px) {
          .hp {
            height: auto;
            min-height: 0;
            /* clip et non hidden : garde le filet de securite contre un
               debordement horizontal sans faire de .hp un conteneur de
               defilement, ce qui casserait le sticky des barres. */
            overflow-x: clip;
            overflow-y: visible;
          }
          .hp-piste {
            display: block;
            height: auto;
            overflow: visible;
            scroll-snap-type: none;
          }
          .hp-page {
            display: block;
            height: auto;
            overflow: visible;
            scroll-snap-align: none;
            scrollbar-gutter: auto;
          }
          /* Le rythme vertical du site reprend ses droits : chaque section
             porte son ecart en haut, la valeur de --section-y de la racine. */
          .hp .hp-page > section {
            --section-y: clamp(6.4rem, 6vw, 8rem);
            margin-block: 0;
            zoom: 1;
          }
          .hp-page > .hero { min-height: var(--hp-h); }
          .hp .hp-page > .man .man-panneau { padding-top: var(--section-y); }
        }


      `}</style>
    </div>
  );
};

export default Pagineur;
