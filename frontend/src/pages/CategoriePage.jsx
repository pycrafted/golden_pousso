import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import apiClient from '../api/client';
import { PLPCard, SkeletonCard } from '../components/ProductGridCard';
import { PlpFilterBar } from '../components/PlpFilterBar';
import useSettingsStore, { formatPrice } from '../store/settingsStore';

/* ⚠ PLUS DE TRI À L'ÉCRAN. Les trois options — par date, par prix
   croissant, par prix décroissant — ont été retirées à la demande. Les pièces
   s'affichent donc toujours de la plus récente à la plus ancienne.

   Le paramètre `ordering` de l'URL n'est plus lu : le remettre à la main
   n'aura aucun effet. C'est l'API qui saurait encore trier (`?ordering=`), et
   `PlpFilterBar` sait toujours dessiner la commande — il suffirait de lui
   repasser une liste d'au moins deux options. */
const TRI_DEFAUT = '-created_at';

const CategoriePage = () => {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const currency = useSettingsStore((s) => s.currency);

  const [category, setCategory]     = useState(null);
  const [notFound, setNotFound]     = useState(false);
  const [catLoading, setCatLoading] = useState(true);

  /* Ce que le rayon contient AVANT filtrage : bornes de prix et comptes par
     état. C'est ce qui décide quels filtres méritent d'être dessinés. */
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
  /* '' | 'video' | 'photo' — vide par défaut : le rayon s'ouvre entier, les
     cartes vidéo et les cartes photo mêlées dans l'ordre du tri. */
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

  /* ── Charger la catégorie (nom, description) ── */
  useEffect(() => {
    setCatLoading(true);
    setNotFound(false);
    apiClient.get('/categories/')
      .then((res) => {
        const list = res.data.results ?? res.data;
        const found = list.find((c) => c.slug === slug);
        if (!found) { setNotFound(true); return; }
        setCategory(found);
      })
      .catch(() => setNotFound(true))
      .finally(() => setCatLoading(false));
  }, [slug]);

  /* ── Charger les facettes du rayon ──────────────────────────────────────
     Dépend du seul `slug`, jamais des filtres posés : ces bornes décrivent le
     rayon entier. Les rafraîchir à chaque filtre ferait rétrécir le curseur de
     prix à chaque geste, sans possibilité de revenir en arrière.
     En cas d'échec, `facettes` reste nul et la barre se réduit au tri —
     dégradation silencieuse plutôt qu'une page cassée. */
  useEffect(() => {
    setFacettes(null);
    apiClient.get('/products/facets/', { params: { category: slug } })
      .then(({ data }) => setFacettes(data))
      .catch(() => {});
  }, [slug]);

  const fetchProducts = useCallback(async (reset = true) => {
    if (catLoading || notFound) return;
    reset ? setLoading(true) : setLoadingMore(true);
    try {
      const params = { category: slug };
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
  }, [slug, minPrice, maxPrice, enStock, enPromo, nouveau, media, ordering, catLoading, notFound]);

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

  /* ── Quels filtres ce rayon mérite-t-il ? ────────────────────────────────
     Une bascule n'est proposée que si elle partage vraiment le rayon en deux.
     « En stock » sur un rayon dont rien n'est épuisé ne retirerait aucune
     pièce ; « En promotion » sur un rayon entièrement soldé n'en retirerait
     pas davantage. Dans les deux cas le contrôle ment sur ce qu'il fait.

     C'est la réponse au fait que le catalogue est petit et inégalement
     rempli : la barre suit le stock réel au lieu d'afficher un jeu de filtres
     figé, décoratif sur la plupart des rayons. */
  const partage = (compte) =>
    facettes != null && compte > 0 && compte < facettes.total;

  /* ── Le média de la carte ────────────────────────────────────────────────
     Une carte joue sa vidéo si la pièce en a une, et ne montre sa photo que
     sinon : les deux bascules se partagent donc le rayon au lieu de se
     croiser. Elles s'excluent l'une l'autre — cocher « Photo » quand
     « Vidéo » est posé remplace le filtre au lieu de vider la page, ce qu'une
     paire de bascules indépendantes ferait à tous les coups.

     Elles n'apparaissent que si le rayon contient VRAIMENT les deux : sur un
     rayon sans aucune vidéo, « Vidéo » mènerait à une page vide et « Photo »
     ne retirerait rien. C'est la même règle que les bascules d'état. */
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

       ⚠ Conséquence à connaître : sur un rayon sans aucune remise, la bascule
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

  if (!catLoading && notFound) {
    return (
      <div className="catalogue-page">
        <div className="catalogue-vide">
          <p className="catalogue-vide-titre">Catégorie introuvable</p>
          <p className="catalogue-vide-texte">
            Ce rayon n&apos;existe pas ou n&apos;est plus en ligne.
          </p>
          <Link to="/boutique" className="catalogue-vide-action">
            Voir toutes nos pièces
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title={category?.name || 'Catégorie'}
        description={category?.description || `Découvrez notre sélection ${category?.name ?? ''} — Haute couture africaine à Dakar, Sénégal.`}
        url={`/categorie/${slug}`}
      />

      <div className="catalogue-page">

        {/* ── En-tête ──
            Titre et filet viennent de `.catalogue-entete` / `.catalogue-titre`
            dans styles.css : la page favoris porte exactement le même, et une
            copie locale des deux aurait divergé au premier réglage. */}
        <section className="catalogue-entete">
          <h1 className="catalogue-titre">{catLoading ? ' ' : category?.name}</h1>
          <span className="filet-titre" aria-hidden="true" />
        </section>

        {/* ── Filtres en bandeau, puis la grille sur toute la largeur ── */}
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

          {loading || catLoading ? (
            <div className="catalogue-grille">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : products.length === 0 ? (
            /* Ni phrase ni bouton de remise à zéro : la barre de filtres reste
               affichée au-dessus avec ses chips et son « Tout effacer », qui
               défont exactement ce qui a vidé la page. Les redoubler ici
               donnait deux commandes pour un seul geste, à trois lignes
               d'écart. */
            <div className="catalogue-vide">
              <p className="catalogue-vide-titre">Aucune pièce trouvée</p>
            </div>
          ) : (
            <div className="catalogue-grille">
              {products.map((p, i) => <PLPCard key={p.id} product={p} index={i} />)}
            </div>
          )}

          {/* Charger plus */}
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

export default CategoriePage;
