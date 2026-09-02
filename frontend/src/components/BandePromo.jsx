import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import Reveal from './Reveal';

/**
 * La bande de promotion — transfert de `Redesign_mcommaman.com`.
 * ===========================================================================
 * Une photo pleine largeur qui se DÉCOUVRE au défilement : le calque de fond
 * glisse plus lentement que la page et grossit à mesure qu'il s'en approche.
 * L'œil lit ça comme de la profondeur, et la bande cesse d'être une image
 * posée là.
 *
 * ⚠ Comme `UniversGrid` et `VideoCardsSection`, cette section est HORS du
 * système de design, volontairement : palette et médias de la source,
 * redéclarés en local sur `.bp`. Elle ne lit aucun token Or & Indigo. Ne pas
 * l'« harmoniser » sans demande explicite. Seule la police suit le site —
 * Fraunces partout, comme les deux autres transferts.
 *
 * ⚠ La photo transférée montre des pyjamas d'enfants : c'est le média de la
 * source, pas du vêtement sénégalais. À remplacer par une photo de la maison
 * dans `frontend/public/images/promo/bande-promo.webp`.
 *
 * ── D'où vient la parole ────────────────────────────────────────────────────
 * De `/hero-promotion/`, la MÊME source que le hero. Il n'y a donc qu'une
 * campagne, réglée une seule fois dans l'admin. Sans campagne en cours, la
 * bande ne rend rien du tout : mieux vaut pas de bande qu'une bande vide.
 */

/**
 * Les pièces détourées, posées sur l'aplat indigo.
 *
 * ── Pourquoi pas une photographie de fond ───────────────────────────────────
 * Il n'en existe aucune qui convienne. Les 278 clichés de la maison sont du
 * catalogue produit : bijoux sur présentoirs, sacs sur étagères, clientes
 * photographiées de près. Recadrés au format du bandeau, les visages se
 * coupent à la bouche et le texte tombe sur la poitrine.
 *
 * Une pièce détourée règle les deux problèmes d'un coup : elle montre
 * l'article, et elle laisse le centre libre pour la parole.
 *
 * `cote` place la pièce à gauche ou à droite ; `hauteur` est un pourcentage de
 * la hauteur du bandeau, supérieur à 100 pour que la pièce DÉBORDE — on la
 * découvre de la tête à mi-jambe, le reste coupé par le bas de la bande, ce qui
 * suggère qu'elle continue.
 */
const PIECES = [
  { src: '/images/promo/piece-peche.webp', cote: 'gauche', hauteur: 168, decalage: 3 },
];

const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

/** « 2026-05-31 » donne « 31 mai ». Lu par le client, pas par la machine. */
const enClair = (iso) => {
  if (!iso) return '';
  const [, mois, jour] = iso.slice(0, 10).split('-');
  return `${Number(jour)} ${MOIS[Number(mois) - 1]}`;
};

/* ── Le fond qui se découvre ────────────────────────────────────────────────
   Le calque déborde de `marge` en haut et en bas, puis se translate à
   l'intérieur de ce débord : il glisse sans jamais laisser voir de vide.

   L'observateur local n'est PAS une entorse à la règle qui impose `useInView`
   pour les révélations : celui-ci ne révèle rien, il coupe le calcul quand la
   bande sort du champ. `useInView` se débranche définitivement à la première
   vue, ce qui donnerait exactement l'inverse. */
const FondQuiSeDecouvre = ({ vitesse = 0.22, zoom = 0.05, marge = 0.14, children }) => {
  const cadre = useRef(null);
  const calque = useRef(null);

  useEffect(() => {
    const boite = cadre.current;
    const mobile = calque.current;
    if (!boite || !mobile) return;
    // Le mouvement est un ornement : qui l'a refusé dans son système ne le
    // subit pas, et la photo reste simplement fixe.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    let visible = true;

    const placer = () => {
      raf = 0;
      const r = boite.getBoundingClientRect();
      const centre = r.top + r.height / 2 - window.innerHeight / 2;
      // Borné au débord disponible : sur un grand écran, le décalage calculé
      // dépasserait la marge et découvrirait un bord vide.
      const limite = r.height * marge;
      const y = Math.max(-limite, Math.min(limite, -centre * vitesse));
      const loin = Math.min(1, Math.abs(centre) / (window.innerHeight / 2 + r.height / 2));
      mobile.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0) scale(${(1 + zoom * loin).toFixed(4)})`;
    };

    const auDefilement = () => {
      if (!visible || raf) return;
      raf = requestAnimationFrame(placer);
    };

    const io = new IntersectionObserver(
      ([entree]) => {
        visible = entree.isIntersecting;
        if (visible) auDefilement();
      },
      { rootMargin: '150px' },
    );
    io.observe(boite);

    placer();
    window.addEventListener('scroll', auDefilement, { passive: true });
    window.addEventListener('resize', auDefilement, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener('scroll', auDefilement);
      window.removeEventListener('resize', auDefilement);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [vitesse, zoom, marge]);

  return (
    <div ref={cadre} className="bp-cadre">
      <div ref={calque} className="bp-calque" style={{ top: `${-marge * 100}%`, bottom: `${-marge * 100}%` }}>
        {children}
      </div>
    </div>
  );
};

/* ── Le décompte ────────────────────────────────────────────────────────────
   Passée l'échéance, il disparaît au lieu d'afficher 00:00:00:00.

   L'heure est lue dès l'état initial, et non dans un effet comme dans la
   source : là-bas le rendu serveur de Next.js imposait d'attendre le client,
   au prix d'une réserve vide pour que rien ne saute à l'arrivée. Ici le rendu
   est entièrement côté navigateur — attendre ne servirait qu'à provoquer le
   rendu en cascade que le compilateur React refuse. */
const deuxChiffres = (n) => String(n).padStart(2, '0');

const Decompte = ({ fin }) => {
  const [maintenant, setMaintenant] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setMaintenant(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // `fin` est une date sans heure et la journée est INCLUSE : on compte
  // jusqu'à son dernier instant, pas jusqu'à son premier.
  const reste = new Date(`${fin}T23:59:59`).getTime() - maintenant;
  if (reste <= 0) return null;

  const cellules = [
    { valeur: deuxChiffres(Math.floor(reste / 86400000)), libelle: 'Jours' },
    { valeur: deuxChiffres(Math.floor(reste / 3600000) % 24), libelle: 'Heures' },
    { valeur: deuxChiffres(Math.floor(reste / 60000) % 60), libelle: 'Min' },
    { valeur: deuxChiffres(Math.floor(reste / 1000) % 60), libelle: 'Sec' },
  ];

  return (
    <div className="bp-decompte">
      {cellules.map((c) => (
        <div key={c.libelle} className="bp-cellule">
          <div className="bp-nombre">{c.valeur}</div>
          <div className="bp-unite">{c.libelle}</div>
        </div>
      ))}
    </div>
  );
};

const BandePromo = () => {
  const [promo, setPromo] = useState(null);

  useEffect(() => {
    // L'API répond {} hors campagne : c'est l'état normal, pas une erreur.
    apiClient.get('/hero-promotion/')
      .then(({ data }) => setPromo(data && data.titre ? data : {}))
      .catch(() => setPromo({}));
  }, []);

  // Pas de campagne, pas de bande. Un bandeau promotionnel sans promotion
  // n'aurait rien à dire et occuperait pourtant un écran entier.
  if (!promo || !promo.titre) return null;

  const cotes = new Set(PIECES.map((p) => p.cote));

  return (
    <section className={`bp ${cotes.has('gauche') ? 'bp--g' : ''} ${cotes.has('droite') ? 'bp--d' : ''}`}>
      <FondQuiSeDecouvre>
        {PIECES.map((piece) => (
          <img
            key={piece.src}
            src={piece.src}
            alt=""
            className={`bp-piece bp-piece--${piece.cote}`}
            style={{ height: `${piece.hauteur}%`, [piece.cote === 'gauche' ? 'left' : 'right']: `${piece.decalage}%` }}
            loading="lazy"
            decoding="async"
          />
        ))}
      </FondQuiSeDecouvre>

      {/* Une lueur chaude derrière les pièces : sans elle, une silhouette
          découpée posée sur un aplat uni a l'air collée. */}
      <div className="bp-lueur" aria-hidden />

      <Reveal className="bp-corps" variant="blur">
        <span className="bp-surtitre">
          <span aria-hidden className="bp-filet" />
          {promo.titre}
          <span aria-hidden className="bp-filet" />
        </span>

        <h2 className="bp-titre">
          {promo.offre}
          <span className="bp-accroche">{promo.accroche}</span>
        </h2>

        {promo.fin && (
          <div className="bp-zone-decompte">
            <Decompte fin={promo.fin} />
          </div>
        )}

        <div className="bp-pied">
          <Link to={promo.lien || '/boutique'} className="bp-bouton">
            {promo.libelle_lien || 'Voir la sélection'}
            <span aria-hidden className="bp-fleche">&#8594;</span>
          </Link>
          {promo.fin && (
            <span className="bp-mention">
              Jusqu&apos;au {enClair(promo.fin)}, dans la limite des stocks.
            </span>
          )}
        </div>
      </Reveal>

      <style>{`
        /* Bande pleine largeur : l'écart se prend en marge, jamais en padding.
           Un padding creuserait l'espace DANS le visuel au lieu de l'en
           séparer — la photo remonterait sous la section précédente. */
        .bp {
          position: relative;
          isolation: isolate;
          overflow: hidden;
          margin-top: var(--section-y);
          /* L'indigo de la bande de coordonnées et du footer : la bande de
             promotion est du même chrome, pas une section de contenu. */
          background: var(--surface-chrome);
          color: #fff;
          font-family: var(--font-display);
        }
        .bp-cadre { position: absolute; inset: 0; overflow: hidden; z-index: -2; }
        .bp-calque { position: absolute; left: 0; right: 0; will-change: transform; }

        /* Ancrée en HAUT et plus haute que le cadre : la pièce déborde par le
           BAS. On la découvre donc de la tête à mi-jambe — le visage, le
           plastron brodé et les manches, c'est-à-dire tout ce qui se regarde.
           Ancrée en bas, on n'aurait vu que l'ourlet de la jupe : le bandeau
           fait moins d'un tiers de la hauteur du vêtement.

           Le -4 % rogne le vide laissé au-dessus de la coiffe par le
           détourage. */
        .bp-piece {
          position: absolute;
          top: -4%;
          width: auto;
          display: block;
          /* L'ombre portée la pose sur le fond au lieu de la laisser flotter.
             Deux passes : une proche et dure, une lointaine et douce. */
          filter: drop-shadow(0 2px 6px rgba(0,0,0,.45)) drop-shadow(0 24px 48px rgba(0,0,0,.5));
        }

        /* Lueur chaude derrière les pièces, décentrée du côté où elles se
           tiennent. Sans elle, un détourage sur aplat uni fait autocollant. */
        .bp-lueur {
          position: absolute; inset: 0; z-index: -1; pointer-events: none;
          background:
            radial-gradient(30% 90% at 12% 44%, rgba(214,138,74,.13) 0%, transparent 74%),
            radial-gradient(30% 90% at 88% 44%, rgba(214,138,74,.13) 0%, transparent 74%),
            linear-gradient(180deg, transparent 40%, rgba(8,10,18,.55) 100%);
        }

        .bp-corps {
          position: relative;
          margin: 0 auto;
          width: 100%;
          max-width: 1400px;
          padding: 3.4rem 2rem;
          text-align: center;
        }
        /* Au-delà de cette largeur seulement, la pièce occupe un bord : le
           texte s'en écarte pour ne jamais lui passer dessus. */
        @media (min-width: 1000px) {
          .bp--g .bp-corps { padding-left: 26%; }
          .bp--d .bp-corps { padding-right: 26%; }
        }
        /* En dessous, le bandeau est trop étroit pour porter les deux : la
           pièce s'efface plutôt que d'écraser la parole. */
        @media (max-width: 780px) {
          .bp-piece { display: none; }
          .bp-lueur { background: linear-gradient(180deg, transparent 40%, rgba(8,10,18,.55) 100%); }
        }

        .bp-surtitre {
          display: inline-flex; align-items: center; gap: 1.2rem;
          font-size: 1.1rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: .16em;
          color: #D9B45B;
        }
        .bp-filet { display: block; height: 1px; width: 3.6rem; background: rgba(217,180,91,.55); }

        .bp-titre {
          margin: 1.1rem auto 0;
          max-width: 22ch;
          font-size: clamp(2.1rem, 4vw, 3.2rem);
          font-weight: 800;
          line-height: 1.05;
          letter-spacing: -.035em;
          text-wrap: balance;
        }
        /* Le rabais lui-même passe en dégradé doré : c'est le seul mot de la
           bande qui doit se lire avant tous les autres. */
        .bp-accroche {
          display: block;
          margin-top: .4rem;
          background: linear-gradient(90deg, #fff, #D9B45B, #fff);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }

        .bp-zone-decompte { display: flex; justify-content: center; margin-top: 1.6rem; }
        .bp-decompte { display: flex; gap: 1rem; }
        .bp-cellule {
          min-width: 6.6rem;
          padding: .7rem .9rem;
          text-align: center;
          border-radius: var(--r-3);
          background: rgba(255,255,255,.10);
          backdrop-filter: blur(6px);
        }
        .bp-nombre {
          font-size: 2.3rem; font-weight: 800; line-height: 1;
          /* Fraunces n'a pas de chiffres tabulaires par défaut : sans ceci,
             la largeur du décompte danse à chaque seconde. */
          font-variant-numeric: tabular-nums;
        }
        .bp-unite {
          margin-top: .35rem;
          font-size: 1rem; font-weight: 600;
          text-transform: uppercase; letter-spacing: .1em;
          opacity: .6;
        }

        .bp-pied {
          margin-top: 1.9rem;
          display: flex; flex-direction: column; align-items: center; gap: .9rem;
        }
        .bp-bouton {
          display: inline-flex; align-items: center; gap: 1rem;
          padding: 1.1rem 2.8rem;
          border-radius: var(--r-pill);
          background: #E0417F;
          color: #fff;
          font-family: var(--font-display);
          font-size: 1.45rem; font-weight: 700;
          text-decoration: none;
          box-shadow: 0 18px 42px -16px rgba(224,65,127,.9);
          transition: transform .3s ease, box-shadow .3s ease;
        }
        .bp-bouton:hover { transform: translateY(-2px); box-shadow: 0 22px 50px -16px rgba(224,65,127,1); }
        .bp-fleche { transition: transform .3s ease; }
        .bp-bouton:hover .bp-fleche { transform: translateX(4px); }
        .bp-mention { font-size: 1.25rem; color: rgba(255,255,255,.6); }

        @media (max-width: 640px) {
          .bp-corps { padding: 2.6rem 1.6rem; }
          .bp-cellule { min-width: 0; flex: 1; padding: .9rem .4rem; }
          .bp-decompte { gap: .6rem; width: 100%; }
          .bp-nombre { font-size: 2rem; }
        }

        @media (prefers-reduced-motion: reduce) {
          .bp-bouton, .bp-fleche { transition: none; }
        }
      `}</style>
    </section>
  );
};

export default BandePromo;
