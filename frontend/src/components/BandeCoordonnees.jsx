import { useEffect, useRef } from 'react';
import { COORDONNEES } from '../constants/contact';

/**
 * Bande de coordonnées — au-dessus de la barre de navigation, sur tout le site.
 * ---------------------------------------------------------------------------
 * Elle a vécu sous le hero, en section 2 de la page d'accueil : le fond indigo
 * y prolongeait le hero d'un cran avant le passage à l'écru. Elle est
 * maintenant posée par le `Layout`, donc en tête de TOUTES les pages, et non
 * plus de la seule page d'accueil. C'est du chrome, pas une section — d'où le
 * déménagement hors de `components/home/`.
 *
 * ── Elle reste visible en permanence ───────────────────────────────────────
 * `position: sticky` et non `fixed` : collée, elle reste DANS le flux, donc
 * elle occupe sa place en haut de page et rien n'a besoin d'être décalé pour
 * la compenser. En `fixed`, elle sortait du flux et il aurait fallu creuser un
 * padding de sa hauteur exacte en tête de document — une hauteur qui change
 * dès que la rangée passe à la ligne.
 *
 * ── Pourquoi la hauteur est publiée en variable CSS ────────────────────────
 * La barre de navigation se fixe en haut au premier défilement (`fixed`,
 * `top: 0`). Elle passerait donc PAR-DESSUS la bande. Elle doit se caler sous
 * elle, à `top: var(--bande-h)`.
 *
 * Cette hauteur ne peut pas être écrite en dur : la rangée tient sur une ligne
 * en desktop et passe à deux ou trois en téléphone, et elle bouge encore selon
 * la longueur des coordonnées. Un `ResizeObserver` la mesure et la publie sur
 * la racine ; le CSS de la navbar la lit. Repli `0px` — si la bande n'est pas
 * montée, la navbar se cale en haut comme avant.
 *
 * `z-index: 999`, sous les 1000 de la barre de navigation : ses panneaux
 * (menu mobile, tiroir panier) doivent recouvrir la bande, pas passer
 * dessous.
 *
 * ⚠ Sur téléphone, la rangée passe à deux ou trois lignes et mange d'autant la
 * hauteur utile, en permanence maintenant qu'elle ne défile plus hors de vue.
 * Si l'en-tête devient trop lourd en petit écran, la bande est le premier
 * élément à masquer sous un point de rupture.
 *
 * ── Elle ne défile plus ─────────────────────────────────────────────────────
 * C'était un bandeau en boucle de 44 s, la liste doublée pour masquer le
 * raccord, avec une pause au survol et des fondus sur les deux bords. Tout
 * cela n'existait que pour rendre lisible un texte en mouvement. À l'arrêt,
 * plus rien n'a besoin d'être compensé :
 *
 * — la seconde copie de la liste disparaît, et avec elle son `aria-hidden` ;
 * — les fondus latéraux aussi : ils masquaient une entrée et une sortie qui
 *   n'ont plus lieu, et ne feraient qu'assombrir le texte au bord de l'écran ;
 * — surtout, les valeurs deviennent CLIQUABLES. Elles ne l'étaient pas parce
 *   qu'on ne vise pas une cible en mouvement du premier coup. Le numéro et
 *   l'adresse e-mail sont de nouveau actionnables d'un geste — ils ne
 *   l'étaient plus nulle part sur la page d'accueil.
 *
 * Le `wrap` n'est pas décoratif : la rangée entière tient sur une ligne en
 * desktop et passe à deux ou trois en téléphone. Sans lui, une rangée figée
 * déborde de l'écran au lieu de défiler, et une partie des coordonnées
 * devient inatteignable.
 *
 * ── Ce que la bande portait avant ───────────────────────────────────────────
 * La promesse commerciale : « Confectionné à la main à Pikine », « Livraison
 * 24 – 48 h sur Dakar », « Wave · Orange Money · Free Money », « Retouches
 * offertes », « Sur-mesure sur demande », « Conseil taille sur WhatsApp ».
 *
 * ⚠ C'était le SEUL endroit du site où le moyen de paiement et le délai de
 * livraison étaient annoncés avant le tunnel d'achat. Au Sénégal, la question
 * du moyen de paiement se pose avant celle du produit. Ces arguments ne
 * subsistent nulle part ailleurs sur la page d'accueil : à replacer si la
 * conversion s'en ressent.
 */

const STYLE_ENTREE = {
  display: 'inline-flex',
  alignItems: 'center',
  whiteSpace: 'nowrap',
  fontSize: 'var(--t-xs)',
  fontWeight: 500,
  letterSpacing: '0.14em',
  color: 'var(--text-on-dark-muted)',
};

const BandeCoordonnees = () => {
  const ref = useRef(null);

  /* La hauteur est publiée à chaque changement de taille — rotation de
     l'écran, passage à la ligne, police tardive. Un simple relevé au montage
     laisserait la navbar calée sur une hauteur périmée.

     ⚠ `getBoundingClientRect().height` ARRONDI VERS LE BAS, et surtout pas
     `offsetHeight`. Ce dernier renvoie un ENTIER alors que la hauteur réelle
     est fractionnaire : padding en rem sur une racine à 62,5 %, ligne de
     texte, icône. Publier 44 px pour une bande qui en mesure 43,2 pousse la
     barre de navigation 0,8 px trop bas — et cet interstice laisse voir
     l'écru du document entre deux aplats indigo. C'est un trait fin, mais on
     ne voit que lui.

     Arrondi vers le bas plutôt qu'au plus proche : dans l'autre sens l'erreur
     ne se voit pas. La barre chevauche la bande d'une fraction de pixel, et
     comme elle est au-dessus dans l'ordre d'empilement, elle la recouvre. */
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const publier = () => {
      const hauteur = Math.floor(el.getBoundingClientRect().height);
      document.documentElement.style.setProperty('--bande-h', `${hauteur}px`);
    };
    publier();
    const observateur = new ResizeObserver(publier);
    observateur.observe(el);
    return () => {
      observateur.disconnect();
      document.documentElement.style.removeProperty('--bande-h');
    };
  }, []);

  return (
    <div
      ref={ref}
      className="on-dark"
      style={{
        /* `on-dark` pose `--surface-dark` ; le chrome est un cran plus clair.
           Les tokens de texte, de filet et d'accent de la classe restent
           lus — seul le fond est repris. */
        background: 'var(--surface-chrome)',
        position: 'sticky',
        top: 0,
        zIndex: 999,
        /* Écart resserré depuis le passage en tête de page : à `--s-4`, la
           bande faisait 48 px de chrome avant même la barre de navigation. */
        padding: 'var(--s-3) var(--page-pad)',
        /* Le filet doré qui sépare les deux barres n'est PAS ici mais sur le
           bord haut de la barre de navigation. La raison tient à l'arrondi
           ci-dessus : la navbar chevauche la bande d'une fraction de pixel,
           et comme elle passe au-dessus dans l'ordre d'empilement, elle
           mangerait un filet posé sur le bord bas de la bande. Porté par la
           navbar elle-même, il est peint par-dessus tout et reste entier. */
      }}
    >
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--s-3) var(--s-5)',
        maxWidth: 'var(--page-max)',
        margin: '0 auto',
      }}>
        {COORDONNEES.map(({ libelle, texte, lien }, i) => {
          /* Le libellé en capitales dorées, la valeur dans sa casse d'origine.
             Les capitales ne sont pas posées sur toute la bande : une adresse
             e-mail en capitales se lit mal et cesse de ressembler à une
             adresse. */
          const contenu = (
            <>
              <span style={{
                textTransform: 'uppercase',
                color: 'var(--gp-brass-400)',
                marginRight: 'var(--s-3)',
              }}>
                {libelle}
              </span>
              {texte}
            </>
          );

          return (
            <span key={libelle} style={STYLE_ENTREE}>
              {lien
                ? <a href={lien} className="link-reveal" style={{ color: 'inherit' }}>{contenu}</a>
                : contenu}

              {/* Ciseaux de séparation. C'était le losange du filet doré, le
                  geste graphique de la maison ; les ciseaux disent le métier au
                  lieu de le décorer.

                  Entre les entrées seulement : posés après la dernière, ils
                  pendraient dans le vide. La boucle en avait besoin pour
                  raccorder la fin au début, ce n'est plus le cas.

                  `aria-hidden` : c'est une ponctuation, pas un mot. Sans lui,
                  un lecteur d'écran annonce l'icône entre chaque coordonnée. */}
              {i < COORDONNEES.length - 1 && (
                <i
                  className="bx bx-cut"
                  aria-hidden="true"
                  style={{
                    marginLeft: 'var(--s-5)',
                    fontSize: '1.6rem',
                    lineHeight: 1,
                    color: 'var(--gp-brass-400)',
                    flexShrink: 0,
                  }}
                />
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default BandeCoordonnees;
