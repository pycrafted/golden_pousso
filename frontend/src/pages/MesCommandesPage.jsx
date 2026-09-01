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
  { cle: 'pending',    label: 'En attente' },
  { cle: 'confirmed',  label: 'Confirmée' },
  { cle: 'processing', label: 'En préparation' },
  { cle: 'shipped',    label: 'Expédiée' },
  { cle: 'delivered',  label: 'Livrée' },
];

const ANNULEE = 'cancelled';

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
  const [ouverte, setOuverte] = useState(null);

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

  return (
    <>
      <SEOHead title="Mes commandes" url="/commandes" noindex />

      <div className="catalogue-page">
        <section className="catalogue-entete">
          <h1 className="catalogue-titre">Mes commandes</h1>
          <span className="filet-titre" aria-hidden="true" />
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

            {isAuthenticated && chargement && <p className="cmd-attente">Chargement…</p>}

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
              <div className="card cmd-carte on-dark">
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
                        <th scope="col"><span className="visually-hidden">Détail</span></th>
                      </tr>
                    </thead>

                    <tbody>
                      {commandes.map((c) => {
                        const est = ouverte === c.order_number;
                        const pieces = c.items.reduce((n, i) => n + i.quantity, 0);
                        const suit = enCours(c.status);

                        return [
                          <tr key={c.order_number} className={est ? 'cmd-ligne cmd-ligne--ouverte' : 'cmd-ligne'}>
                            <td data-intitule="Commande" className="cmd-numero">{c.order_number}</td>
                            <td data-intitule="Date">{dateLisible(c.created_at)}</td>
                            <td data-intitule="Pièces" className="cmd-num">{pieces}</td>
                            <td data-intitule="Total" className="cmd-num cmd-total">
                              {formatPrice(Number(c.total), currency)}
                            </td>
                            <td data-intitule="État">
                              {/* L'état est une pastille et non du texte nu :
                                  dans une colonne, l'œil cherche une forme
                                  avant de lire un mot. */}
                              <span className={`cmd-etat cmd-etat--${suit ? 'cours' : c.status}`}>
                                {LIBELLES[c.status] ?? c.status}
                              </span>
                            </td>
                            <td className="cmd-cellule-action">
                              <button
                                type="button"
                                className="cmd-basculer"
                                aria-expanded={est}
                                onClick={() => setOuverte((n) => (n === c.order_number ? null : c.order_number))}
                              >
                                {est ? 'Masquer' : (suit ? 'Suivre' : 'Détail')}
                              </button>
                            </td>
                          </tr>,

                          est && (
                            <tr key={`${c.order_number}-detail`} className="cmd-ligne-detail">
                              <td colSpan={6}>
                                {/* La frise n'apparaît que pour une commande
                                    en route : livrée ou annulée, elle
                                    n'apprendrait rien. */}
                                {suit && <Frise statut={c.status} />}
                                {c.status === ANNULEE && (
                                  <p className="cmd-annulee">Cette commande a été annulée.</p>
                                )}

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

                                <dl className="cmd-recap">
                                  <div>
                                    <dt>Sous-total</dt>
                                    <dd>{formatPrice(Number(c.subtotal), currency)}</dd>
                                  </div>
                                  <div>
                                    <dt>Livraison{c.delivery_zone ? ` — ${ZONES[c.delivery_zone] ?? c.delivery_zone}` : ''}</dt>
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

        .cmd-carte {
          background: var(--surface-chrome);
          padding: clamp(var(--s-4), 3vw, var(--s-6));
        }

        /* Le tableau déborde plutôt que la page : c'est le conteneur qui
           défile, jamais le corps du document. */
        .cmd-defilement { overflow-x: auto; }

        .cmd-tableau {
          width: 100%;
          border-collapse: collapse;
          font-size: var(--t-sm);
        }
        .cmd-tableau th {
          padding: 0 var(--s-4) var(--s-3);
          text-align: left;
          font-family: var(--font-body);
          font-size: var(--t-eyebrow);
          font-weight: 500;
          letter-spacing: var(--ls-eyebrow);
          text-transform: uppercase;
          color: var(--text-muted);
          border-bottom: 1px solid var(--line);
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
        .cmd-numero { font-variant-numeric: tabular-nums; white-space: nowrap; }
        .cmd-total { color: var(--text-accent); white-space: nowrap; }

        .cmd-ligne--ouverte td { border-bottom-color: transparent; }

        /* ── L'état ── */
        .cmd-etat {
          display: inline-block;
          padding: 0.3rem 1rem;
          border-radius: var(--r-pill);
          border: 1px solid var(--line);
          font-size: var(--t-xs);
          white-space: nowrap;
          color: var(--text-muted);
        }
        /* Une seule couleur pour « en cours » : six teintes d'état, c'était un
           code à apprendre. Ce qui compte est binaire — ça bouge, ou c'est
           fini. */
        .cmd-etat--cours {
          border-color: var(--line-accent);
          color: var(--text-accent);
        }
        .cmd-etat--cancelled { color: var(--gp-terra-500); border-color: var(--gp-terra-500); }

        .cmd-cellule-action { text-align: right; }
        .cmd-basculer {
          border: 0;
          background: none;
          padding: 0 0 0.2rem;
          border-bottom: 1px solid var(--line-accent);
          font-family: var(--font-body);
          font-size: var(--t-eyebrow);
          letter-spacing: var(--ls-eyebrow);
          text-transform: uppercase;
          color: var(--text-accent);
          cursor: pointer;
          white-space: nowrap;
        }

        /* ── Le dépliant ── */
        .cmd-ligne-detail > td {
          padding: 0 var(--s-4) var(--s-6);
          background: var(--surface-sunk);
        }

        .cmd-articles {
          display: flex;
          flex-direction: column;
          gap: var(--s-2);
          margin: var(--s-5) 0;
        }
        .cmd-article {
          display: flex;
          justify-content: space-between;
          gap: var(--s-4);
          font-size: var(--t-sm);
        }
        .cmd-qte { color: var(--text-muted); }

        .cmd-recap { display: flex; flex-direction: column; gap: var(--s-2); }
        .cmd-recap > div {
          display: flex;
          justify-content: space-between;
          gap: var(--s-4);
          font-size: var(--t-sm);
        }
        .cmd-recap dt { color: var(--text-muted); }
        .cmd-recap dd { text-align: right; overflow-wrap: anywhere; font-variant-numeric: tabular-nums; }

        .cmd-annulee {
          margin: var(--s-5) 0 0;
          font-size: var(--t-sm);
          color: var(--gp-terra-500);
        }

        .cmd-attente { text-align: center; padding: var(--s-9) 0; color: var(--text-muted); }

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

        /* ── Sous 768 px : le tableau se replie en pile ──
           Un seul balisage, deux mises en page. Chaque cellule reprend son
           intitulé depuis data-intitule : sans lui, une colonne de valeurs
           sans en-tête ne se comprend plus une fois la ligne dépliée. */
        @media (max-width: 768px) {
          .cmd-tableau thead { display: none; }
          .cmd-tableau, .cmd-tableau tbody, .cmd-tableau tr, .cmd-tableau td { display: block; }
          .cmd-ligne {
            padding: var(--s-4) 0;
            border-bottom: 1px solid var(--line);
          }
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
            font-size: var(--t-eyebrow);
            letter-spacing: var(--ls-eyebrow);
            text-transform: uppercase;
            color: var(--text-muted);
            text-align: left;
          }
          .cmd-cellule-action { justify-content: flex-end; padding-top: var(--s-3); }
          .cmd-ligne-detail > td { padding: var(--s-4) 0 var(--s-5); }

          .cmd-frise { grid-auto-flow: row; gap: var(--s-4); }
          .cmd-etape { padding-top: 0; padding-left: var(--s-5); text-align: left; }
          .cmd-etape::before {
            top: 0; bottom: 0; left: 0.5rem; right: auto; width: 1px; height: auto;
          }
          .cmd-etape:first-child::before { top: 50%; }
          .cmd-etape:last-child::before  { bottom: 50%; right: auto; }
          .cmd-puce { top: 50%; left: 0; transform: translate(0, -50%); }
        }
      `}</style>
    </>
  );
};

export default MesCommandesPage;
