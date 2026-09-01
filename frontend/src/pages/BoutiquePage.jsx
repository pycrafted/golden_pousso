import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import apiClient from '../api/client';
import { PLPCard, SkeletonCard } from '../components/ProductGridCard';
import { PlpFilterBar } from '../components/PlpFilterBar';
import useSettingsStore, { formatPrice } from '../store/settingsStore';

/**
 * Boutique — tout le catalogue, mêlé.
 * ===========================================================================
 * C'est la page de rayon (`CategoriePage`), sans le rayon. Même en-tête, même
 * barre de filtres, même grille, même état vide, même « Charger plus » : un
 * visiteur qui passe de la boutique à un rayon ne change pas de page, il
 * change de contenu.
 *
 * La seule différence tient en une ligne : aucun `category` n'est envoyé à
 * l'API. Les boubous, les chaussures, les sacs, les bijoux et les cosmétiques
 * arrivent donc dans le même flux, ordonnés par le tri choisi et non par
 * rayon.
 *
 * Une première version groupait les pièces par rayon, quatre par quatre, avec
 * un lien vers chaque page complète. Elle a été remplacée à la demande : la
 * boutique doit tout mélanger.
 *
 * ⚠ La recherche plein texte n'existe plus nulle part depuis la suppression
 * de /recherche et du bouton loupe de la barre de navigation. L'API sait
 * toujours le faire (`?search=`) : c'est une page à rebâtir, pas une
 * capacité perdue.
 */

/* ⚠ PLUS DE TRI À L'ÉCRAN. Les trois options — par date, par prix
   croissant, par prix décroissant — ont été retirées à la demande. Les pièces
   s'affichent donc toujours de la plus récente à la plus ancienne.

   Le paramètre `ordering` de l'URL n'est plus lu : le remettre à la main
   n'aura aucun effet. C'est l'API qui saurait encore trier (`?ordering=`), et
   `PlpFilterBar` sait toujours dessiner la commande — il suffirait de lui
   repasser une liste d'au moins deux options. */
const TRI_DEFAUT = '-created_at';

const BoutiquePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currency = useSettingsStore((s) => s.currency);

  /* Ce que le catalogue contient AVANT filtrage : bornes de prix et comptes
     par état. C'est ce qui décide quels filtres méritent d'être dessinés. */
  const [facettes, setFacettes] = useState(null);

  const [products, setProducts]       = useState([]);
  const [totalCount, setTotalCount]   = useState(0);
  const [nextUrl, setNextUrl]         = useState(null);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';
  const enStock  = searchParams.get('in_stock') === 'true';
  const enPromo  = searchParams.get('on_sale')  === 'true';
  const nouveau  = searchParams.get('is_new')   === 'true';
  /* '' | 'video' | 'photo' — vide par défaut : la boutique s'ouvre entière,
     les cartes vidéo et les cartes photo mêlées dans l'ordre du tri. */
  const media    = searchParams.get('media') || '';
  const ordering = TRI_DEFAUT;

  const updateFilter = (key, value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value); else p.delete(key);
    setSearchParams(p);
  };
  const resetFilters = () => setSearchParams({});

  const setPrice = (min, max) => {
    const p = new URLSearchParams(searchParams);
    if (min) p.set('min_price', String(min)); else p.delete('min_price');
    if (max) p.set('max_price', String(max)); else p.delete('max_price');
    setSearchParams(p);
  };

  /* ── Les facettes de tout le catalogue ──────────────────────────────────
     Sans paramètre `category` : elles décrivent la boutique entière. Elles ne
     dépendent d'aucun filtre posé — les rafraîchir à chaque geste ferait
     rétrécir le curseur de prix sans possibilité de revenir en arrière. */
  useEffect(() => {
    apiClient.get('/products/facets/')
      .then(({ data }) => setFacettes(data))
      .catch(() => {});
  }, []);

  const fetchProducts = useCallback(async (reset = true) => {
    reset ? setLoading(true) : setLoadingMore(true);
    try {
      const params = {};
      if (minPrice) params.min_price = minPrice;
      if (maxPrice) params.max_price = maxPrice;
      if (enStock)  params.in_stock  = true;
      if (enPromo)  params.on_sale   = true;
      if (nouveau)  params.is_new    = true;
      if (media)    params.media     = media;
      if (ordering) params.ordering  = ordering;
      const res = await apiClient.get('/products/', { params });
      const data = res.data;
      const results = data.results ?? data;
      setTotalCount(data.count ?? results.length);
      setNextUrl(data.next ?? null);
      reset ? setProducts(results) : setProducts((p) => [...p, ...results]);
    } catch { if (reset) setProducts([]); }
    finally { reset ? setLoading(false) : setLoadingMore(false); }
  }, [minPrice, maxPrice, enStock, enPromo, nouveau, media, ordering]);

  useEffect(() => { fetchProducts(true); }, [fetchProducts]);

  const loadMore = async () => {
    if (!nextUrl) return;
    setLoadingMore(true);
    try {
      const res = await apiClient.get(nextUrl.replace(/^https?:\/\/[^/]+/, ''));
      const data = res.data;
      setProducts((p) => [...p, ...(data.results ?? data)]);
      setNextUrl(data.next ?? null);
    } finally { setLoadingMore(false); }
  };

  /* ── Quels filtres la boutique mérite-t-elle ? ───────────────────────────
     Une bascule n'est proposée que si elle partage vraiment le catalogue en
     deux. « En stock » alors que rien n'est épuisé ne retirerait aucune
     pièce ; « En promotion » sur un catalogue entièrement soldé n'en
     retirerait pas davantage. Dans les deux cas le contrôle ment sur ce qu'il
     fait. */
  const partage = (compte) =>
    facettes != null && compte > 0 && compte < facettes.total;

  const mediaPartage = facettes != null && facettes.video > 0 && facettes.photo > 0;
  const basculeMedia = (valeur, label) => ({
    cle: `media-${valeur}`,
    label,
    actif: media === valeur,
    onToggle: () => updateFilter('media', media === valeur ? '' : valeur),
  });

  const bascules = [
    mediaPartage && basculeMedia('video', 'Vidéo'),
    mediaPartage && basculeMedia('photo', 'Photo'),
    partage(facettes?.in_stock) && {
      cle: 'in_stock',
      label: 'Disponible',
      actif: enStock,
      onToggle: () => updateFilter('in_stock', enStock ? '' : 'true'),
    },
    /* Toujours proposé, à la demande — c'est la seule bascule qui échappe à
       la règle du partage. Elle disparaîtrait sinon dans deux cas : quand
       rien n'est en promotion, et quand tout l'est.

       ⚠ Conséquence à connaître : sur un catalogue sans aucune remise, la bascule
       est là et mène à une page vide. L'état vide et la chip « En promotion »
       la défont, mais le clic aura été fait pour rien. */
    facettes != null && {
      cle: 'on_sale',
      label: 'En promotion',
      actif: enPromo,
      onToggle: () => updateFilter('on_sale', enPromo ? '' : 'true'),
    },
    partage(facettes?.is_new) && {
      cle: 'is_new',
      label: 'Nouveautés',
      actif: nouveau,
      onToggle: () => updateFilter('is_new', nouveau ? '' : 'true'),
    },
  ].filter(Boolean);

  /* Le prix tient en UNE chip et non deux : « ≥ 30 500 » et « ≤ 64 000 » sur
     deux pastilles se lisent comme deux filtres indépendants alors qu'ils
     forment un seul intervalle, et retirer l'une laissait l'autre en place. */
  const prixPose = Boolean(minPrice || maxPrice);
  const chips = [
    prixPose && {
      cle: 'prix',
      label: `${formatPrice(Number(minPrice || facettes?.price_min || 0), currency)} – ${formatPrice(Number(maxPrice || facettes?.price_max || 0), currency)}`,
      onRetirer: () => setPrice('', ''),
    },
    ...bascules.filter((b) => b.actif).map((b) => ({
      cle: b.cle,
      label: b.label,
      onRetirer: b.onToggle,
    })),
  ].filter(Boolean);

  return (
    <>
      <SEOHead
        title="Boutique"
        description="Boubous, chaussures, sacs à main, bijoux et cosmétiques — toute la boutique Golden Pousso, maison de couture à Dakar."
        url="/boutique"
      />

      <div className="catalogue-page">
        <section className="catalogue-entete">
          <h1 className="catalogue-titre">Boutique</h1>
          <span className="filet-titre" aria-hidden="true" />
        </section>

        <div className="catalogue-corps">
          <PlpFilterBar
            facettes={facettes}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onPrice={setPrice}
            bascules={bascules}
                chips={chips}
            onResetAll={resetFilters}
          />

          {loading ? (
            <div className="catalogue-grille">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div className="catalogue-vide">
              <p className="catalogue-vide-titre">Aucune pièce trouvée</p>
            </div>
          ) : (
            <div className="catalogue-grille">
              {products.map((p, i) => <PLPCard key={p.id} product={p} index={i} />)}
            </div>
          )}

          {nextUrl && !loading && (
            <div style={{ textAlign: 'center', marginTop: 'var(--s-9)' }}>
              <p style={{ fontSize: 'var(--t-xs)', fontFamily: 'var(--font-body)', color: 'var(--text-muted)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 'var(--s-6)' }}>
                {products.length} sur {totalCount} pièces
              </p>
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="btn btn--ghost btn--auto"
              >
                {loadingMore ? 'Chargement…' : 'Charger plus'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BoutiquePage;
