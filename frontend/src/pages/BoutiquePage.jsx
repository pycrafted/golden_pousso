import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import apiClient from '../api/client';
import { PLPCard, SkeletonCard } from '../components/ProductGridCard';
import { PlpFilterBar } from '../components/PlpFilterBar';
import Pagination from '../components/Pagination';
import useSettingsStore, { formatPrice } from '../store/settingsStore';
import useAuthStore from '../store/authStore';

/* Le formulaire d'ajout de pièce, chargé à la demande — le même que sur les
   pages de rayon et dans l'Espace Gestion → Produits. Code d'administration :
   il ne part qu'au premier clic sur le stylo, que seul un compte `is_staff`
   voit. */
const ProductForm = lazy(() => import('./gestion/ProductForm'));

/**
 * Boutique — tout le catalogue, mêlé.
 * ===========================================================================
 * C'est la page de rayon (`CategoriePage`), sans le rayon. Même en-tête, même
 * barre de filtres, même grille, même état vide, même pagination : un
 * visiteur qui passe de la boutique à un rayon ne change pas de page, il
 * change de contenu.
 *
 * ⚠ Elle se parcourt PAGE PAR PAGE, à la demande, et n'appelle l'API que pour
 * la page affichée (`?page=N`, 24 pièces) : voir `components/Pagination.jsx`.
 * C'était un bouton « Charger plus » qui empilait les pièces — au bout de
 * quatre clics, une centaine de cartes et autant de photos en mémoire, sans
 * qu'on sache où l'on en était ni comment revenir en arrière.
 *
 * La seule différence de contenu tient en une ligne : aucun `category` n'est envoyé à
 * l'API. Les boubous, les chaussures, les sacs, les bijoux et les cosmétiques
 * arrivent donc dans le même flux, ordonnés par le tri choisi et non par
 * rayon.
 *
 * ⚠ Une seconde différence, à la demande : le FOND. La boutique est sur
 * l'indigo #161B2D (« catalogue-page on-dark », voir styles.css), les pages de
 * rayon restent sur l'écru.
 *
 * Une première version groupait les pièces par rayon, quatre par quatre, avec
 * un lien vers chaque page complète. Elle a été remplacée à la demande : la
 * boutique doit tout mélanger.
 *
 * Un stylo à droite du titre, visible des seuls comptes `is_staff`, ouvre le
 * formulaire d'ajout de pièce, à la demande — comme sur les pages de rayon,
 * mais sans rayon posé d'office : le formulaire propose le menu des rayons.
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
  const estAdmin = useAuthStore((s) => s.isAuthenticated && Boolean(s.user?.is_staff));

  /* Le panneau d'ajout : `undefined` fermé, `null` création, un produit en
     édition — la convention de la page de rayon et de l'Espace Gestion. */
  const [edition, setEdition] = useState(undefined);
  // Les rayons du menu du formulaire — lus pour un compte admin seulement.
  const [categories, setCategories] = useState([]);
  /* Incrémenté à la fermeture du panneau : une pièce ajoutée peut déplacer
     les bornes de prix et les comptes par état, que les facettes décrivent. */
  const [versionCatalogue, setVersionCatalogue] = useState(0);

  /* Lus pour TOUS les visiteurs : ils servent aussi aux filtres par rayon et
     sous-catégorie, à la demande — ils ne servaient qu'au formulaire d'un
     compte admin. Relus après l'ajout d'une pièce, qui change les comptes. */
  useEffect(() => {
    apiClient.get('/categories/')
      .then((r) => setCategories(r.data.results ?? r.data))
      .catch(() => {});
  }, [versionCatalogue]);

  /* Ce que le catalogue contient AVANT filtrage : bornes de prix et comptes
     par état. C'est ce qui décide quels filtres méritent d'être dessinés. */
  const [facettes, setFacettes] = useState(null);

  const [products, setProducts]     = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading]       = useState(true);
  /* La taille d'une page est celle du serveur, pas une valeur recopiée ici :
     tant qu'il annonce une page suivante, la page reçue est pleine, donc sa
     longueur EST la taille de page. 24 n'est qu'un point de départ. */
  const [parPage, setParPage]       = useState(24);

  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';
  const enStock  = searchParams.get('in_stock') === 'true';
  const enPromo  = searchParams.get('on_sale')  === 'true';
  /* Le filtre par catégorie, à la demande : un rayon (`rayon`), puis l'une de
     ses sous-catégories (`sous`). Vides par défaut — la boutique s'ouvre
     entière. Dans l'URL, pour qu'un lien filtré se partage. */
  const rayon    = searchParams.get('rayon') || '';
  const sous     = searchParams.get('sous') || '';
  const ordering = TRI_DEFAUT;

  /* La page affichée, dans l'URL : elle se partage, le bouton « retour » du
     navigateur ramène à la précédente, et un rechargement retombe au même
     endroit. */
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  /* ⚠ Tout filtre RAMÈNE À LA PAGE 1. Rester en page 4 après avoir coché
     « En stock » afficherait une grille vide alors qu'il reste des pièces :
     elles sont en page 1. */
  const updateFilter = (key, value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value); else p.delete(key);
    p.delete('page');
    setSearchParams(p);
  };
  const resetFilters = () => setSearchParams({});

  const setPrice = (min, max) => {
    const p = new URLSearchParams(searchParams);
    if (min) p.set('min_price', String(min)); else p.delete('min_price');
    if (max) p.set('max_price', String(max)); else p.delete('max_price');
    p.delete('page');
    setSearchParams(p);
  };

  /* Changer de page : l'URL, puis le haut de la page — sinon on arrive au
     milieu de la grille suivante, à la hauteur où l'on avait cliqué. */
  const allerPage = (n) => {
    const p = new URLSearchParams(searchParams);
    if (n > 1) p.set('page', String(n)); else p.delete('page');
    setSearchParams(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ── Les facettes de tout le catalogue ──────────────────────────────────
     Sans paramètre `category` : elles décrivent la boutique entière. Elles ne
     dépendent d'aucun filtre posé — les rafraîchir à chaque geste ferait
     rétrécir le curseur de prix sans possibilité de revenir en arrière. Elles
     se relisent seulement quand le catalogue lui-même a changé — une pièce
     ajoutée depuis le stylo (`versionCatalogue`). */
  useEffect(() => {
    apiClient.get('/products/facets/')
      .then(({ data }) => setFacettes(data))
      .catch(() => {});
  }, [versionCatalogue]);

  /* Une requête = UNE page, à la demande. La grille est remplacée, jamais
     allongée : le navigateur ne garde en mémoire que les 24 cartes affichées
     et ne télécharge que leurs photos. */
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      // La sous-catégorie l'emporte sur le rayon ; un rayon seul inclut ses
      // sous-catégories (filtre `category` de l'API).
      if (sous || rayon) params.category = sous || rayon;
      if (minPrice) params.min_price = minPrice;
      if (maxPrice) params.max_price = maxPrice;
      if (enStock)  params.in_stock  = true;
      if (enPromo)  params.on_sale   = true;
      if (ordering) params.ordering  = ordering;
      if (page > 1) params.page      = page;
      const res = await apiClient.get('/products/', { params });
      const data = res.data;
      const results = data.results ?? data;
      setTotalCount(data.count ?? results.length);
      if (data.next && results.length) setParPage(results.length);
      setProducts(results);
    } catch (err) {
      /* Une page qui n'existe plus — l'URL a été bricolée, ou un filtre a
         raccourci la liste depuis le dernier chargement : l'API répond 404.
         On revient en page 1 plutôt que de montrer une grille vide. */
      if (err.response?.status === 404 && page > 1) { allerPage(1); return; }
      setProducts([]);
    } finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rayon, sous, minPrice, maxPrice, enStock, enPromo, ordering, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const pages = Math.max(1, Math.ceil(totalCount / parPage));

  /* ── Quels filtres la boutique mérite-t-elle ? ───────────────────────────
     Une bascule n'est proposée que si elle partage vraiment le catalogue en
     deux. « En stock » alors que rien n'est épuisé ne retirerait aucune
     pièce ; « En promotion » sur un catalogue entièrement soldé n'en
     retirerait pas davantage. Dans les deux cas le contrôle ment sur ce qu'il
     fait. */
  const partage = (compte) =>
    facettes != null && compte > 0 && compte < facettes.total;

  /* Plus de bascules « Vidéo » / « Photo » : la vidéo de produit a été
     retirée, front et back, à la demande. */
  /* ── Rayons et sous-catégories ──────────────────────────────────────────
     Une bascule par rayon qui range au moins une pièce ; exclusives. Changer
     de rayon efface la sous-catégorie : celle d'un autre rayon ne voudrait
     plus rien dire. Les sous-catégories n'apparaissent qu'une fois leur rayon
     choisi, et seulement celles qui rangent au moins une pièce. */
  const rayonChoisi = categories.find((c) => !c.parent && c.slug === rayon);
  const choisirRayon = (slugRayon) => {
    const p = new URLSearchParams(searchParams);
    if (rayon === slugRayon) p.delete('rayon'); else p.set('rayon', slugRayon);
    p.delete('sous');
    setSearchParams(p);
  };
  const basculesCategories = [
    ...categories
      .filter((c) => !c.parent && c.product_count > 0)
      .map((c) => ({
        cle: `rayon-${c.slug}`,
        label: c.name,
        actif: rayon === c.slug,
        onToggle: () => choisirRayon(c.slug),
      })),
    ...(rayonChoisi
      ? categories
        .filter((s) => s.parent === rayonChoisi.id && s.product_count > 0)
        .map((s) => ({
          cle: `sous-${s.slug}`,
          label: s.name,
          actif: sous === s.slug,
          onToggle: () => updateFilter('sous', sous === s.slug ? '' : s.slug),
        }))
      : []),
  ];

  const bascules = [
    ...basculesCategories,
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

  /* Fermer le panneau d'ajout relit la grille ET les facettes : la pièce
     ajoutée doit apparaître sans recharger la page. */
  const fermerEdition = () => {
    setEdition(undefined);
    setVersionCatalogue((v) => v + 1);
    fetchProducts();
  };

  return (
    <>
      <SEOHead
        title="Boutique"
        description="Boubous, chaussures, sacs à main, bijoux et cosmétiques — toute la boutique Golden Pousso, maison de couture à Dakar."
        url="/boutique"
      />

      {/* Sur l'indigo #161B2D, à la demande — voir « .catalogue-page.on-dark »
          dans styles.css. */}
      <div className="catalogue-page on-dark">
        {/* Le stylo, comme sur les pages de rayon : HORS du <h1>, posé hors
            du flux à sa droite — voir `.catalogue-edition`. */}
        <section className="catalogue-entete">
          <div className="catalogue-titre-ligne">
            <h1 className="catalogue-titre">Boutique</h1>
            {estAdmin && (
              <button
                type="button"
                className="catalogue-edition"
                onClick={() => setEdition(null)}
                aria-label="Ajouter une pièce à la boutique"
                title="Ajouter une pièce"
              >
                <i className="bx bx-pencil" aria-hidden="true" />
              </button>
            )}
          </div>
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
              {products.map((p, i) => <PLPCard key={p.id} product={p} index={i} onModifie={() => fetchProducts()} />)}
            </div>
          )}

          {!loading && (
            <Pagination page={page} pages={pages} total={totalCount} onPage={allerPage} />
          )}
        </div>
      </div>

      {/* Le panneau d'ajout, sans rayon posé d'office : le formulaire
          propose le menu des rayons. Après une création, il se vide pour la
          pièce suivante et la grille se relit (voir ProductForm). */}
      {estAdmin && edition !== undefined && (
        <Suspense fallback={null}>
          <ProductForm
            product={edition}
            categories={categories}
            onClose={fermerEdition}
            onSaved={(enregistre) => { setEdition(enregistre); fetchProducts(); }}
          />
        </Suspense>
      )}
    </>
  );
};

export default BoutiquePage;
