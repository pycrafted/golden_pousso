import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../api/client';
import SEOHead from '../components/SEOHead';
import { PLPCard, SkeletonCard } from '../components/ProductGridCard';
import useFavorisStore from '../store/favorisStore';
import useCartStore from '../store/cartStore';
import useSettingsStore, { formatPrice } from '../store/settingsStore';

/**
 * « Mes favoris » — les pièces mises de côté.
 * ---------------------------------------------------------------------------
 * Structure reprise de la page /favoris de boty-e-commerce-template : titre
 * centré avec sur-titre, barre d'actions (compte, total, tout ajouter, vider
 * avec confirmation), grille, état vide, squelettes de chargement, et la
 * mention des pièces enregistrées qui ne sont plus au catalogue.
 *
 * Le DESSIN, lui, est celui de Golden Pousso — c'était la demande. La source
 * est en ivoire/corail, cartes très arrondies et ombres douces ; ici on est en
 * Or & Indigo, filet doré sous le titre, et surtout :
 *
 * ── Le cadre est celui des pages de rayon ──────────────────────────────────
 * Cette page montre la même chose que `/categorie/:slug` : une liste de
 * pièces sous un titre centré. Elle se dessinait pourtant autrement — grille
 * à trois paliers contre quatre, `<h1>` par défaut contre `--t-h2`, état vide
 * en carte dorée contre message centré. Elle emprunte désormais le cadre
 * commun (`.catalogue-*`, styles.css) : même en-tête, même grille, même état
 * vide. Ne reste ici que ce qui lui appartient en propre — la barre
 * d'actions, et le compte des pièces sorties du catalogue.
 *
 * ── La carte est celle du site, pas celle de la source ──────────────────────
 * La source dessine une carte de favori à part, avec un cœur en haut à droite
 * pour retirer et deux boutons en pied. Golden Pousso a déjà `ProductCard`,
 * utilisée par cinq surfaces, et son cœur EST le bouton de retrait depuis
 * qu'il écrit dans le magasin. La réutiliser évite une sixième carte à
 * maintenir, et le geste reste le même partout : on retire un favori là où on
 * l'a ajouté, d'un clic sur le cœur.
 *
 * ── Pourquoi la page relit chaque pièce ─────────────────────────────────────
 * Le magasin ne garde que { id, slug }. La page redemande donc chaque pièce à
 * l'API, une requête par favori. C'est ce qui garantit un prix juste après
 * plusieurs semaines, et ce qui permet de repérer les pièces qui ont quitté le
 * catalogue au lieu de planter dessus.
 */

const FavorisPage = () => {
  const favoris = useFavorisStore((s) => s.items);
  const vider = useFavorisStore((s) => s.vider);
  const addItem = useCartStore((s) => s.addItem);
  const currency = useSettingsStore((s) => s.currency);

  const [confirmeVidage, setConfirmeVidage] = useState(false);

  // La liste des slugs sert de dépendance plutôt que le tableau lui-même :
  // celui-ci change d'identité à chaque rendu du magasin et relancerait toutes
  // les requêtes sans raison.
  const cles = favoris.map((f) => f.slug).join(',');

  // Un seul état, qui retient POUR QUELLE liste les pièces ont été chargées.
  // Le chargement s'en déduit au lieu d'être un second état à tenir en accord
  // avec le premier — et surtout, plus aucun setState ne s'exécute dans le
  // corps de l'effet : les appeler là déclenche une seconde passe de rendu
  // avant même la peinture, ce que React signale comme une cascade.
  const [charge, setCharge] = useState({ cles: '', pieces: [] });

  const chargement = cles !== '' && charge.cles !== cles;
  const pieces = charge.cles === cles ? charge.pieces : [];

  useEffect(() => {
    if (!cles) return undefined;
    let vivant = true;
    Promise.all(
      cles.split(',').map((slug) =>
        apiClient.get('/products/' + slug + '/')
          .then(({ data }) => data)
          // Une pièce retirée du catalogue ne doit pas emporter la page :
          // elle disparaît de la liste et se fait compter plus bas.
          .catch(() => null)
      )
    ).then((lot) => {
      if (vivant) setCharge({ cles, pieces: lot.filter(Boolean) });
    });
    return () => { vivant = false; };
  }, [cles]);

  const total = pieces.reduce((somme, p) => somme + Number(p.price), 0);
  const introuvables = favoris.length - pieces.length;

  // Fonction ordinaire et non useCallback : `pieces` est une valeur dérivée,
  // recalculée à chaque rendu, si bien que la mémorisation ne mémorisait rien
  // — le compilateur React refusait même d'optimiser le composant à cause
  // d'elle. Il s'occupe seul de ce que cette enveloppe prétendait faire.
  const toutAjouter = () => {
    // Une pièce à variantes exige une taille, qu'on ne peut pas deviner ici —
    // même règle que sur la carte. On ajoute le reste et on dit ce qui manque,
    // plutôt que de refuser tout le lot.
    const directes = pieces.filter((p) => (p.variants?.length ?? 0) === 0 && p.stock !== 0);
    const aOuvrir = pieces.length - directes.length;

    directes.forEach((p) => addItem(p, null, 1));

    if (directes.length) {
      const s = directes.length > 1 ? 's' : '';
      toast.success(directes.length + ' pièce' + s + ' ajoutée' + s + ' au panier');
    }
    if (aOuvrir) {
      toast(aOuvrir > 1
        ? aOuvrir + ' pièces demandent une taille ou sont épuisées — à ouvrir une par une'
        : 'Une pièce demande une taille ou est épuisée — à ouvrir depuis sa fiche');
    }
  };

  return (
    <>
      <SEOHead
        title="Mes favoris"
        description="Les pièces Golden Pousso que vous avez mises de côté."
        url="/favoris"
        noindex
      />

      <div className="catalogue-page">

        <section className="catalogue-entete">
          <h1 className="catalogue-titre">Mes favoris</h1>
          <span className="filet-titre" aria-hidden="true" />
        </section>

        <div className="catalogue-corps">

          {chargement && (
            <div className="catalogue-grille">
              {/* Un squelette par favori et non un nombre fixe : le compte est
                  connu avant la première réponse, et la grille ne change plus
                  de hauteur quand les pièces arrivent. */}
              {favoris.map((f) => <SkeletonCard key={f.slug} />)}
            </div>
          )}

          {!chargement && favoris.length === 0 && (
            <div className="catalogue-vide">
              <p className="catalogue-vide-titre">Aucune pièce mise en favoris</p>
            </div>
          )}

          {!chargement && favoris.length > 0 && (
            <>
              <div className="fav-barre">
                <p className="fav-compte">
                  {pieces.length} pièce{pieces.length > 1 ? 's' : ''}
                  {pieces.length > 0 && (
                    <> · <strong>{formatPrice(total, currency)}</strong> au total</>
                  )}
                </p>

                <div className="fav-outils">
                  {pieces.length > 0 && (
                    <button type="button" className="btn btn--accent btn--auto" onClick={toutAjouter}>
                      Tout ajouter au panier
                    </button>
                  )}

                  {/* Vider est irréversible et efface un tri qui a pu prendre
                      des semaines : d'où la confirmation en deux temps, sur
                      place plutôt qu'en fenêtre modale. */}
                  {confirmeVidage ? (
                    <>
                      <button
                        type="button"
                        className="btn btn--ghost btn--auto fav-vider"
                        onClick={() => { vider(); setConfirmeVidage(false); }}
                      >
                        Confirmer
                      </button>
                      <button
                        type="button"
                        className="fav-annuler"
                        onClick={() => setConfirmeVidage(false)}
                      >
                        Annuler
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="btn btn--ghost btn--auto"
                      onClick={() => setConfirmeVidage(true)}
                    >
                      Vider la liste
                    </button>
                  )}
                </div>
              </div>

              <div className="catalogue-grille">
                {pieces.map((p, i) => (
                  <PLPCard key={p.id} product={p} index={i} />
                ))}
              </div>

              {introuvables > 0 && (
                <p className="fav-introuvables">
                  {introuvables > 1
                    ? introuvables + ' pièces de votre liste ne figurent plus au catalogue et ne sont pas affichées.'
                    : 'Une pièce de votre liste ne figure plus au catalogue et n’est pas affichée.'}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        /* La barre d'actions. Elle reprend le dessin de la barre de filtres de
           la page rayon — même filet de séparation, même écart avant la
           grille : les deux pages posent leur rangée de commandes au même
           endroit et à la même distance des cartes. */
        .fav-barre {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: var(--s-3);
          margin-bottom: var(--s-6);
          padding-bottom: var(--s-4);
          border-bottom: 1px solid var(--line);
        }
        .fav-compte { font-size: var(--t-sm); color: var(--text-muted); }
        .fav-compte strong { color: var(--text); font-weight: 600; }

        .fav-outils { display: flex; flex-wrap: wrap; align-items: center; gap: var(--s-3); }

        /* Le système n'a pas de bouton « danger » : il n'en avait jamais eu
           besoin. Plutôt que d'en ajouter un au socle pour un seul emploi, on
           teinte ici le bouton fantôme en terre cuite — 5,60:1 sur l'écru, le
           seuil AA est tenu. À remonter dans styles.css le jour où une
           deuxième page en demande un. */
        .fav-vider {
          color: var(--gp-terra-700);
          border-color: var(--gp-terra-700);
        }
        .fav-vider:hover:not([disabled]) {
          background: var(--gp-terra-700);
          color: var(--gp-ecru-50);
        }

        /* Annuler n'est pas un bouton dessiné : dans une paire de décision, le
           chemin de retour doit peser moins que celui qui engage. */
        .fav-annuler {
          border: 0;
          background: none;
          padding: var(--s-2);
          font-family: var(--font-body);
          font-size: var(--t-sm);
          color: var(--text-muted);
          cursor: pointer;
        }
        .fav-annuler:hover { color: var(--text); }

        .fav-introuvables {
          margin-top: var(--s-6);
          text-align: center;
          font-size: var(--t-sm);
          color: var(--text-muted);
        }
      `}</style>
    </>
  );
};

export default FavorisPage;
