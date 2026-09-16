import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import apiClient from '../api/client';
import useAuthStore from '../store/authStore';
import useSettingsStore, { formatPrice } from '../store/settingsStore';

/**
 * Mes commandes — le tableau, et le suivi dedans.
 * ===========================================================================
 * Une seule page pour deux besoins qui n'ont pas la même urgence :
 *
 *   L'HISTORIQUE  se consulte de haut en bas. On cherche une commande parmi
 *                 d'autres — un tableau est fait pour ça : les colonnes
 *                 s'alignent, l'œil descend une seule d'entre elles.
 *
 *   LE SUIVI      ne concerne qu'une commande, celle qui est en route. Il
 *                 s'ouvre DANS la ligne plutôt que sur une page à part : on
 *                 ne quitte pas la liste pour savoir où en est un colis.
 *
 * ── Pourquoi le suivi ne s'affiche pas partout ─────────────────────────────
 * Une commande livrée ou annulée n'a plus rien à suivre : sa frise serait
 * complète ou barrée, et cinq frises identiques sur cinq lignes noieraient
 * la seule qui bouge. Le dépliant montre donc la frise UNIQUEMENT pour les
 * commandes en cours ; pour les autres, il ne montre que le détail.
 *
 * ── Le dessin : celui de l'Espace Gestion ──────────────────────────────────
 * À la demande, la page reprend les briques du back-office (pages/gestion) :
 *
 *   — l'EN-TÊTE : sur-titre, titre, filet, puis une ligne de décompte —
 *     « 4 commandes · 1 en cours » (PageHeader) ;
 *   — le CADRE : un encadrement de laiton sur le fond de la page, jamais un
 *     aplat (.gx-cadre). La carte était un îlot clair, écru-100, posé sur
 *     l'indigo ; le site est sombre, la page l'est maintenant aussi ;
 *   — le TABLEAU : en-têtes de laiton en capitales, lignes filetées, et sous
 *     760 px chaque ligne qui devient une carte ;
 *   — les PASTILLES d'état : le texte de la teinte sur un voile de 14 % —
 *     laiton, bleu, vert, rouge, les tons de l'Espace Gestion ;
 *   — les BLOCS du détail : un titre de laiton en capitales, séparés d'un
 *     filet, comme les blocs d'un tiroir.
 *
 * ⚠ L'état n'est plus binaire. Il l'était — « en cours » ou fini, une seule
 * couleur — pour éviter un code de six teintes à apprendre. L'Espace Gestion
 * donne sa teinte à chaque statut, et les deux pages parlent maintenant des
 * mêmes commandes dans les mêmes couleurs : payée en laiton, en livraison en
 * bleu, livrée en vert, annulée en rouge.
 *
 * ── Le tableau devient une pile en petit écran ─────────────────────────────
 * Six colonnes ne tiennent pas sur un téléphone. Sous 768 px, chaque ligne se
 * replie en bloc et chaque cellule porte son intitulé en `data-intitule` —
 * c'est ce qui permet de garder UN seul balisage de tableau, sémantiquement
 * juste, au lieu d'en rendre deux versions selon la largeur.
 *
 * ⚠ /commande/suivi reste en place : c'est le pendant pour qui a commandé
 * SANS compte, où il faut saisir un numéro. Ici, la liste est déjà la sienne.
 */

/* Les étapes, dans l'ordre où une commande les franchit. */
const ETAPES = [
  // Payé, livré, reçu : plus d'étape « En préparation », à la demande.
  { cle: 'pending',    label: 'En attente de paiement' },
  { cle: 'confirmed',  label: 'Payée' },
  { cle: 'shipped',    label: 'En livraison' },
  { cle: 'delivered',  label: 'Livrée' },
];

const ANNULEE = 'cancelled';

/* La teinte de chaque statut — celle de l'Espace Gestion, à la demande. Le
   client et la boutique lisent la même commande dans la même couleur. */
const TONS = {
  pending:   'neutre',
  confirmed: 'laiton',
  shipped:   'bleu',
  delivered: 'vert',
  cancelled: 'rouge',
};

/* Une commande est « en cours » tant qu'elle n'a atteint ni le bout du
   parcours ni l'annulation. C'est le seul cas où le suivi apprend quelque
   chose. */
const enCours = (statut) => statut !== 'delivered' && statut !== ANNULEE;

const LIBELLES = Object.fromEntries(ETAPES.map((e) => [e.cle, e.label]));
LIBELLES[ANNULEE] = 'Annulée';

const ZONES = {
  dakar_centre:   'Dakar Centre',
  dakar_banlieue: 'Dakar Banlieue / Pikine',
  thies:          'Thiès et environs',
  pickup:         'Retrait en boutique',
};

const PAIEMENTS = {
  paydunya:         'PayDunya',
  orange_money:     'Orange Money',
  wave:             'Wave',
  free_money:       'Free Money',
  cash_on_delivery: 'Paiement à la livraison',
  card:             'Carte bancaire',
};

const dateLisible = (iso) => (iso
  ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  : '');

/* ── La frise d'avancement ─────────────────────────────────────────────── */
const Frise = ({ statut }) => {
  const rang = ETAPES.findIndex((e) => e.cle === statut);
  /* Un statut inconnu du frontend ne doit pas vider la frise : on retombe sur
     la première étape plutôt que sur -1, qui n'en allumerait aucune. */
  const atteint = rang < 0 ? 0 : rang;

  return (
    <ol className="cmd-frise" aria-label="Avancement de la commande">
      {ETAPES.map((etape, i) => (
        <li
          key={etape.cle}
          className={`cmd-etape${i <= atteint ? ' cmd-etape--faite' : ''}${i === atteint ? ' cmd-etape--ici' : ''}`}
          aria-current={i === atteint ? 'step' : undefined}
        >
          <span className="cmd-puce" aria-hidden="true" />
          <span className="cmd-etape-label">{etape.label}</span>
        </li>
      ))}
    </ol>
  );
};

/* ══════════════════════════════════════════════════════════════════════════ */
const MesCommandesPage = () => {
  const { isAuthenticated } = useAuthStore();
  const currency = useSettingsStore((s) => s.currency);

  const [commandes, setCommandes] = useState([]);
  const [chargement, setChargement] = useState(isAuthenticated);
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let vivant = true;
    apiClient.get('/orders/mes-commandes/')
      .then(({ data }) => { if (vivant) setCommandes(data ?? []); })
      .catch(() => { if (vivant) setErreur(true); })
      .finally(() => { if (vivant) setChargement(false); });
    return () => { vivant = false; };
  }, [isAuthenticated]);

  const pret = isAuthenticated && !chargement && !erreur;
  const nbEnCours = commandes.filter((c) => enCours(c.status)).length;

  return (
    <>
      <SEOHead title="Mes commandes" url="/commandes" noindex />

      <div className="catalogue-page">
        <section className="catalogue-entete">
          <span className="eyebrow">Mon espace</span>
          <h1 className="catalogue-titre">Mes commandes</h1>
          <span className="filet-titre" aria-hidden="true" />
          {/* Le décompte de l'Espace Gestion : ce qu'il y a, et ce qui bouge. */}
          {pret && commandes.length > 0 && (
            <p className="cmd-compte">
              {commandes.length} commande{commandes.length > 1 ? 's' : ''}
              {nbEnCours > 0 && ` · ${nbEnCours} en cours`}
            </p>
          )}
        </section>

        <div className="catalogue-corps">
          <div className="cmd-colonne">

            {!isAuthenticated && (
              <div className="catalogue-vide">
                <p className="catalogue-vide-titre">Connectez-vous pour voir vos commandes</p>
                <p className="catalogue-vide-texte">
                  Vous avez commandé sans compte ? Le suivi se fait avec votre
                  numéro de commande.
                </p>
                <Link to="/profil" className="catalogue-vide-action">Se connecter</Link>
              </div>
            )}

            {/* Des squelettes et non une page vide — le chargement de
                l'Espace Gestion, au rayon des cadres qu'il remplace. */}
            {isAuthenticated && chargement && (
              <div className="cmd-squelette" aria-busy="true" aria-label="Chargement">
                {Array.from({ length: 3 }, (_, i) => <span key={i} />)}
              </div>
            )}

            {isAuthenticated && !chargement && erreur && (
              <div className="catalogue-vide">
                <p className="catalogue-vide-titre">Impossible de charger vos commandes</p>
                <p className="catalogue-vide-texte">
                  Réessayez dans un instant. Si cela persiste, écrivez-nous.
                </p>
              </div>
            )}

            {pret && commandes.length === 0 && (
              <div className="catalogue-vide">
                <p className="catalogue-vide-titre">Aucune commande</p>
                <Link to="/boutique" className="catalogue-vide-action">Découvrir la boutique</Link>
              </div>
            )}

            {pret && commandes.length > 0 && (
              <div className="cmd-cadre">
                <div className="cmd-defilement">
                  <table className="cmd-tableau">
                    <caption className="visually-hidden">
                      Vos commandes, de la plus récente à la plus ancienne
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Commande</th>
                        <th scope="col">Date</th>
                        <th scope="col" className="cmd-num">Pièces</th>
                        <th scope="col" className="cmd-num">Total</th>
                        <th scope="col">État</th>
                      </tr>
                    </thead>

                    <tbody>
                      {commandes.map((c) => {
                        const pieces = c.items.reduce((n, i) => n + i.quantity, 0);
                        const suit = enCours(c.status);

                        return [
                          <tr key={c.order_number} className="cmd-ligne">
                            <td data-intitule="Commande" className="cmd-numero">{c.order_number}</td>
                            <td data-intitule="Date">{dateLisible(c.created_at)}</td>
                            <td data-intitule="Pièces" className="cmd-num">{pieces}</td>
                            <td data-intitule="Total" className="cmd-num cmd-total">
                              {formatPrice(Number(c.total), currency)}
                            </td>
                            <td data-intitule="État">
                              {/* L'état est une pastille et non du texte nu :
                                  dans une colonne, l'œil cherche une forme
                                  avant de lire un mot. Sa teinte est celle de
                                  l'Espace Gestion. */}
                              <span className={`cmd-pastille cmd-pastille--${TONS[c.status] ?? 'neutre'}`}>
                                {LIBELLES[c.status] ?? c.status}
                              </span>
                            </td>
                          </tr>,

                          /* Le détail est TOUJOURS ouvert, à la demande : plus
                             de bouton « Détail / Suivre / Masquer », plus de
                             commande repliée. */
                          (
                            <tr key={`${c.order_number}-detail`} className="cmd-ligne-detail">
                              <td colSpan={5}>
                                {/* La frise n'apparaît que pour une commande
                                    en route : livrée ou annulée, elle
                                    n'apprendrait rien. */}
                                {suit && <Frise statut={c.status} />}
                                {c.status === ANNULEE && (
                                  <p className="cmd-annulee">Cette commande a été annulée.</p>
                                )}

                                <h3 className="cmd-bloc-titre">Articles</h3>
                                <ul className="cmd-articles">
                                  {c.items.map((a, i) => (
                                    <li key={i} className="cmd-article">
                                      <span>
                                        {a.product_name}
                                        {a.quantity > 1 && <span className="cmd-qte"> × {a.quantity}</span>}
                                      </span>
                                      <span className="cmd-num">
                                        {formatPrice(Number(a.line_total), currency)}
                                      </span>
                                    </li>
                                  ))}
                                </ul>

                                <h3 className="cmd-bloc-titre">Récapitulatif</h3>
                                <dl className="cmd-recap">
                                  <div>
                                    <dt>Sous-total</dt>
                                    <dd>{formatPrice(Number(c.subtotal), currency)}</dd>
                                  </div>
                                  <div>
                                    <dt>Livraison{c.delivery_zone ? ` : ${ZONES[c.delivery_zone] ?? c.delivery_zone}` : ''}</dt>
                                    <dd>{formatPrice(Number(c.delivery_fee), currency)}</dd>
                                  </div>
                                  {c.delivery_address && (
                                    <div><dt>Adresse</dt><dd>{c.delivery_address}</dd></div>
                                  )}
                                  <div>
                                    <dt>Paiement</dt>
                                    <dd>{PAIEMENTS[c.payment_method] ?? c.payment_method}</dd>
                                  </div>
                                </dl>
                              </td>
                            </tr>
                          ),
                        ];
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .cmd-colonne { max-width: 96rem; margin: 0 auto; }

        /* La ligne de décompte sous le filet — celle des en-têtes de
           l'Espace Gestion. */
        .cmd-compte {
          margin: var(--s-4) 0 0;
          font-family: var(--font-body);
          font-size: var(--t-sm);
          color: var(--text-muted);
          font-variant-numeric: tabular-nums;
        }

        /* ── LE CADRE ──
           Un encadrement de laiton posé sur le fond de la page, jamais un
           aplat : c'est la surface de l'Espace Gestion (.gx-cadre), et l'or
           de la maison est structurel. C'était une carte écru-100 — un îlot
           clair au milieu d'un site sombre. */
        .cmd-cadre {
          border: 1px solid var(--line-dark-accent);
          border-radius: var(--r-3);
          padding: clamp(var(--s-4), 3vw, var(--s-6));
        }

        /* Le tableau déborde plutôt que la page : c'est le conteneur qui
           défile, jamais le corps du document. */
        .cmd-defilement { overflow-x: auto; }

        .cmd-tableau {
          width: 100%;
          border-collapse: collapse;
          font-family: var(--font-body);
          font-size: var(--t-sm);
        }
        /* En-têtes de laiton en capitales — ceux des tableaux de gestion. */
        .cmd-tableau th {
          padding: 1.2rem var(--s-4) 1.4rem;
          text-align: left;
          font-size: 1.15rem;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--gp-brass-400);
          border-bottom: 1px solid var(--line-dark-accent);
          white-space: nowrap;
        }
        .cmd-tableau td {
          padding: var(--s-4);
          border-bottom: 1px solid var(--line);
          vertical-align: middle;
        }
        .cmd-tableau tr:last-child td { border-bottom: 0; }

        /* Les chiffres s'alignent à droite et en chasse fixe : c'est la seule
           façon de comparer deux totaux d'un coup d'œil dans une colonne. */
        .cmd-num { text-align: right; font-variant-numeric: tabular-nums; }
        .cmd-numero { font-variant-numeric: tabular-nums; white-space: nowrap; color: var(--text-accent); }
        .cmd-total { white-space: nowrap; }

        /* Chaque commande est suivie de son détail, toujours ouvert : pas de
           filet entre les deux. Le filet qui sépare deux commandes est celui
           du bas du détail. */
        .cmd-ligne td { border-bottom-color: transparent; }

        /* ── LES PASTILLES D'ÉTAT ──
           Le texte de la teinte sur un voile de 14 % — les pastilles de
           l'Espace Gestion (.gx-pastille), point compris. Ratios sur l'indigo :
           laiton 5,65:1, vert 6,66:1, bleu 6,30:1, rouge 5,56:1. */
        .cmd-pastille {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.5rem 1.2rem;
          border-radius: var(--r-pill);
          font-size: var(--t-xs);
          white-space: nowrap;
          background: rgba(250, 246, 238, 0.08);
          color: var(--text-muted);
        }
        .cmd-pastille::before {
          content: "";
          width: 0.6rem;
          height: 0.6rem;
          border-radius: 50%;
          background: currentColor;
        }
        .cmd-pastille--laiton { background: rgba(198, 164, 61, 0.14); color: var(--gp-brass-400); }
        .cmd-pastille--vert   { background: rgba(123, 203, 155, 0.14); color: var(--gp-success-300); }
        .cmd-pastille--bleu   { background: rgba(157, 180, 232, 0.14); color: var(--gp-info-300); }
        .cmd-pastille--rouge  { background: rgba(239, 138, 128, 0.14); color: var(--gp-danger-300); }

        /* ── Le détail, en blocs de tiroir ── */
        .cmd-ligne-detail > td {
          padding: 0 var(--s-4) var(--s-6);
          background: var(--surface-sunk);
        }

        /* Le titre d'un bloc : capitales de laiton, comme dans les tiroirs de
           l'Espace Gestion. */
        .cmd-bloc-titre {
          margin: var(--s-5) 0 var(--s-3);
          font-family: var(--font-body);
          font-size: 1.15rem;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--gp-brass-400);
        }

        .cmd-articles {
          display: flex;
          flex-direction: column;
          gap: var(--s-2);
          margin: 0 0 var(--s-5);
          padding: 0;
          list-style: none;
        }
        .cmd-article {
          display: flex;
          justify-content: space-between;
          gap: var(--s-4);
          font-size: var(--t-sm);
        }
        .cmd-qte { color: var(--text-muted); }

        .cmd-recap {
          display: flex;
          flex-direction: column;
          gap: var(--s-2);
          margin: 0;
          padding-top: var(--s-3);
          border-top: 1px solid var(--line);
        }
        .cmd-recap > div {
          display: flex;
          justify-content: space-between;
          gap: var(--s-4);
          font-size: var(--t-sm);
        }
        .cmd-recap dt { color: var(--text-muted); }
        .cmd-recap dd { text-align: right; overflow-wrap: anywhere; font-variant-numeric: tabular-nums; margin: 0; }
        /* La dernière ligne du récapitulatif est le total : elle porte le
           laiton, comme le total d'un tiroir de commande. */
        .cmd-recap > div:last-child dd { color: var(--text-accent); }

        .cmd-annulee {
          margin: var(--s-5) 0 0;
          font-size: var(--t-sm);
          color: var(--text-promo);
        }

        /* Le squelette de chargement — celui de l'Espace Gestion : il porte le
           rayon du cadre qu'il remplace, sans quoi le passage de l'un à
           l'autre fait un à-coup. */
        .cmd-squelette { display: grid; gap: var(--s-3); }
        .cmd-squelette span {
          display: block;
          height: 8rem;
          border-radius: var(--r-3);
          background: var(--surface-sunk);
          animation: shimmer 1.6s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .cmd-squelette span { animation: none; }
        }

        /* ── La frise ──
           Les puces sont reliées par un trait tracé en fond de la liste, et
           non par une bordure sur chaque élément : un trait par élément
           s'arrête avant le suivant et laisse des trous aux jointures. */
        .cmd-frise {
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: 1fr;
          margin: var(--s-6) 0 0;
          padding: 0;
        }
        .cmd-etape {
          position: relative;
          padding-top: var(--s-5);
          text-align: center;
          list-style: none;
        }
        .cmd-etape::before {
          content: "";
          position: absolute;
          top: 0.55rem;
          left: 0;
          right: 0;
          height: 1px;
          background: var(--line);
        }
        .cmd-etape:first-child::before { left: 50%; }
        .cmd-etape:last-child::before  { right: 50%; }
        .cmd-etape--faite::before { background: var(--line-accent); }
        .cmd-puce {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 1.1rem;
          height: 1.1rem;
          border-radius: var(--r-pill);
          border: 1px solid var(--line);
          background: var(--surface-sunk);
        }
        .cmd-etape--faite .cmd-puce {
          border-color: var(--text-accent);
          background: var(--text-accent);
        }
        .cmd-etape--ici .cmd-puce {
          box-shadow: 0 0 0 4px color-mix(in srgb, var(--text-accent) 28%, transparent);
        }
        .cmd-etape-label {
          display: block;
          font-size: var(--t-xs);
          color: var(--text-muted);
          overflow-wrap: anywhere;
        }
        .cmd-etape--ici .cmd-etape-label { color: var(--text); font-weight: 600; }

        /* ── Sous 760 px : le tableau se replie en cartes ──
           Le point de rupture des tableaux de l'Espace Gestion. Un seul
           balisage, deux mises en page : chaque cellule reprend son intitulé
           depuis data-intitule — sans lui, une colonne de valeurs sans en-tête
           ne se comprend plus une fois la ligne dépliée. */
        @media (max-width: 760px) {
          .cmd-tableau thead { display: none; }
          .cmd-tableau, .cmd-tableau tbody, .cmd-tableau tr, .cmd-tableau td { display: block; }
          .cmd-ligne { padding: var(--s-4) 0; }
          .cmd-tableau td {
            display: flex;
            justify-content: space-between;
            gap: var(--s-4);
            padding: 0.4rem 0;
            border: 0;
            text-align: right;
          }
          .cmd-tableau td::before {
            content: attr(data-intitule);
            font-size: 1.15rem;
            font-weight: 600;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: var(--gp-brass-400);
            text-align: left;
          }
          /* Le filet sépare deux commandes, donc il suit le détail — toujours
             ouvert — et non la ligne, qu'il couperait de son détail. */
          .cmd-ligne-detail { border-bottom: 1px solid var(--line); }
          .cmd-ligne-detail:last-child { border-bottom: 0; }
          .cmd-ligne-detail > td { padding: var(--s-4) 0 var(--s-5); }
          .cmd-ligne-detail > td::before { content: none; }

          .cmd-frise { grid-auto-flow: row; gap: var(--s-4); }
          .cmd-etape { padding-top: 0; padding-left: var(--s-5); text-align: left; }
          .cmd-etape::before {
            top: 0; bottom: 0; left: 0.5rem; right: auto; width: 1px; height: auto;
          }
          .cmd-etape:first-child::before { left: 0.5rem; top: 0.55rem; }
          .cmd-etape:last-child::before  { right: auto; bottom: 50%; }
          .cmd-puce { left: 0; transform: none; }
        }
      `}</style>
    </>
  );
};

export default MesCommandesPage;
