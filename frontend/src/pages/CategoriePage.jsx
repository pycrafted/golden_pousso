import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import SEOHead from '../components/SEOHead';
import apiClient from '../api/client';
import { PLPCard, SkeletonCard } from '../components/ProductGridCard';
import { PlpFilterBar } from '../components/PlpFilterBar';
import Pagination from '../components/Pagination';
import useSettingsStore, { formatPrice } from '../store/settingsStore';
import useAuthStore from '../store/authStore';

/* Le formulaire d'ajout de pièce, chargé à la demande. C'est du code
   d'administration — celui de l'Espace Gestion → Produits, partagé — que les
   visiteurs n'ont aucune raison de télécharger : il ne part qu'au premier
   clic sur le stylo, et seul un compte `is_staff` voit le stylo. */
const ProductForm = lazy(() => import('./gestion/ProductForm'));

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
  const estAdmin = useAuthStore((s) => s.isAuthenticated && Boolean(s.user?.is_staff));

  const [category, setCategory]     = useState(null);
  // Les sous-catégories du rayon — le filtre par catégorie, à la demande.
  const [sousCategories, setSousCategories] = useState([]);
  const [notFound, setNotFound]     = useState(false);
  const [catLoading, setCatLoading] = useState(true);

  /* Le panneau d'ajout : `undefined` fermé, `null` création, un produit en
     édition — la même convention que l'Espace Gestion → Produits. La pièce
     se crée en une étape, médias compris, puis le panneau se vide pour la
     suivante (voir ProductForm). */
  const [edition, setEdition] = useState(undefined);
  /* Incrémenté à la fermeture du panneau : une pièce ajoutée peut déplacer
     les bornes de prix et les comptes par état, que les facettes décrivent. */
  const [versionRayon, setVersionRayon] = useState(0);

  /* Ce que le rayon contient AVANT filtrage : bornes de prix et comptes par
     état. C'est ce qui décide quels filtres méritent d'être dessinés. */
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
  /* Le slug de la sous-catégorie choisie, vide par défaut : le rayon s'ouvre
     entier, sous-catégories comprises. Dans l'URL, pour qu'un lien filtré se
     partage. */
  const sous     = searchParams.get('sous') || '';
  const ordering = TRI_DEFAUT;

  /* La page affichée, dans l'URL : elle se partage, le bouton « retour » du
     navigateur ramène à la précédente, et un rechargement retombe au même
     endroit. */
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  /* ⚠ Tout filtre RAMÈNE À LA PAGE 1 — une sous-catégorie comprise. Rester en
     page 3 après avoir choisi « Bazin » afficherait une grille vide alors
     qu'il reste des pièces : elles sont en page 1. */
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
        setSousCategories(list.filter((c) => c.parent === found.id));
      })
      .catch(() => setNotFound(true))
      .finally(() => setCatLoading(false));
  }, [slug]);

  /* ── Charger les facettes du rayon ──────────────────────────────────────
     Dépend du `slug`, jamais des filtres posés : ces bornes décrivent le
     rayon entier. Les rafraîchir à chaque filtre ferait rétrécir le curseur de
     prix à chaque geste, sans possibilité de revenir en arrière. Elles se
     relisent seulement quand le rayon lui-même a changé — une pièce ajoutée
     depuis le stylo (`versionRayon`).
     En cas d'échec, `facettes` reste nul et la barre se réduit au tri —
     dégradation silencieuse plutôt qu'une page cassée. */
  useEffect(() => {
    setFacettes(null);
    apiClient.get('/products/facets/', { params: { category: slug } })
      .then(({ data }) => setFacettes(data))
      .catch(() => {});
  }, [slug, versionRayon]);

  /* Une requête = UNE page, à la demande. La grille est remplacée, jamais
     allongée : le navigateur ne garde en mémoire que les 24 cartes affichées
     et ne télécharge que leurs photos. */
  const fetchProducts = useCallback(async () => {
    if (catLoading || notFound) return;
    setLoading(true);
    try {
      // Une sous-catégorie choisie remplace le rayon : l'API ne renvoie alors
      // que ses pièces. Sans choix, le rayon ET ses sous-catégories.
      const params = { category: sous || slug };
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
  }, [slug, sous, minPrice, maxPrice, enStock, enPromo, ordering, page, catLoading, notFound]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const pages = Math.max(1, Math.ceil(totalCount / parPage));

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

  /* Plus de bascules « Vidéo » / « Photo » : la vidéo de produit a été
     retirée, front et back, à la demande. */
  const bascules = [
    /* Le filtre par catégorie, à la demande : une bascule par sous-catégorie
       du rayon, en tête de barre. Exclusives — en choisir une remplace la
       précédente, la rechoisir la retire. Seules celles qui rangent au moins
       une pièce sont proposées : une bascule vers une page vide mentirait. */
    ...sousCategories
      .filter((s) => s.product_count > 0)
      .map((s) => ({
        cle: `sous-${s.slug}`,
        label: s.name,
        actif: sous === s.slug,
        onToggle: () => updateFilter('sous', sous === s.slug ? '' : s.slug),
      })),
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
    setVersionRayon((v) => v + 1);
    fetchProducts();
  };

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
        description={`Découvrez notre sélection ${category?.name ?? ''} — Haute couture africaine à Dakar, Sénégal.`}
        url={`/categorie/${slug}`}
      />

      <div className="catalogue-page">

        {/* ── En-tête ──
            Titre et filet viennent de `.catalogue-entete` / `.catalogue-titre`
            dans styles.css : la page favoris porte exactement le même, et une
            copie locale des deux aurait divergé au premier réglage.

            Le stylo n'existe que pour les comptes `is_staff`. Il est HORS du
            <h1> — le nom accessible du titre reste le nom du rayon — et posé
            hors du flux à sa droite, voir `.catalogue-edition`. */}
        <section className="catalogue-entete">
          <div className="catalogue-titre-ligne">
            <h1 className="catalogue-titre">{catLoading ? ' ' : category?.name}</h1>
            {estAdmin && category && (
              <button
                type="button"
                className="catalogue-edition"
                onClick={() => setEdition(null)}
                aria-label={`Ajouter une pièce au rayon ${category.name}`}
                title="Ajouter une pièce à ce rayon"
              >
                <i className="bx bx-pencil" aria-hidden="true" />
              </button>
            )}
          </div>
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
              {products.map((p, i) => <PLPCard key={p.id} product={p} index={i} onModifie={() => fetchProducts()} />)}
            </div>
          )}

          {!loading && (
            <Pagination page={page} pages={pages} total={totalCount} onPage={allerPage} />
          )}
        </div>
      </div>

      {/* Le panneau d'ajout, rayon posé d'office : la pièce créée ici est
          destinée à CE rayon. `categories` ne sert qu'au menu de l'Espace
          Gestion, que `categorieFixe` remplace. */}
      {estAdmin && category && edition !== undefined && (
        <Suspense fallback={null}>
          <ProductForm
            product={edition}
            categories={[category]}
            categorieFixe={category}
            onClose={fermerEdition}
            onSaved={(enregistre) => { setEdition(enregistre); fetchProducts(); }}
          />
        </Suspense>
      )}
    </>
  );
};

export default CategoriePage;
