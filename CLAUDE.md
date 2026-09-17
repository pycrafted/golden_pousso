# Golden Pousso — Guide développement

E-commerce mode africaine (Dakar), full-stack React 19 + Django 5.

## Architecture

```
golden_pousso/
├── backend/          Django REST API (port 8000)
│   ├── store/        Produits, commandes, catégories
│   ├── accounts/     Auth (Customer extends AbstractUser — phone/mot de passe)
│   └── goldenpousso_backend/  Config Django, urls, settings
└── frontend/         React + Vite SPA (port 5173/5174)
    └── src/
        ├── api/      Axios client (client.js — intercepteurs JWT auto)
        ├── components/  26+ composants UI
        ├── pages/    16 routes React Router
        ├── store/    Zustand : authStore, cartStore, settingsStore
        └── utils/    Helpers
```

## Démarrage

```powershell
# Backend
cd backend
.\venv\Scripts\Activate.ps1
python manage.py runserver

# Frontend (autre terminal)
cd frontend
npm run dev
```

## Commandes courantes

```powershell
# Backend
python manage.py migrate
python manage.py makemigrations
python manage.py createsuperuser
python manage.py shell

# Frontend
npm run dev
npm run build
npm run lint
npm run preview
```

## Stack

| Couche | Techno |
|--------|--------|
| Frontend | React 19, Vite 8, React Router 7, Zustand 5, Axios, Swiper |
| Backend | Django 5.2, DRF, simplejwt, django-filter, Jazzmin |
| DB | SQLite (dev), PostgreSQL (prod) |
| Media | Images : Cloudinary — Vidéos : liens Cloudflare collés à la main (aucun envoi) |
| Paiement | PayDunya |
| Déploiement | Render (backend), Vercel (frontend) |

## API

- Base URL dev : `http://localhost:8000/api/v1/`
- Auth : JWT (access 4h, refresh 7j), header `Authorization: Bearer <token>`
- Pagination : 24 items/page (`?page=N`) — la boutique et les rayons ne
  demandent QUE la page affichée (voir « Le cadre des pages de catalogue »)
- Endpoints principaux : `/products/`, `/categories/`, `/orders/`
- Auth endpoints : `/auth/login/`, `/auth/register/`, `/auth/refresh/`, `/auth/me/`

Le client Axios dans `frontend/src/api/client.js` gère :
- Injection automatique du token JWT
- Refresh automatique à l'expiration (401 → refresh → retry)

## State management (Zustand)

- **authStore** — user, token, login/logout, profil, changement mot de passe
- **cartStore** — panier persisté localStorage, totaux calculés
- **settingsStore** — devise (XOF/EUR/USD/GBP), langue (FR/EN)

## Modèles clés

- `Product` — prix, stock, variants
  ⚠ Plus de **« Vedette »** ni de **« Nouveauté »** : `is_featured` et `is_new`
  ont été retirés à la demande (migration `0025`), avec l'admin, les filtres
  `?is_featured=` / `?is_new=`, la facette `is_new`, les endpoints
  `/products/featured/` et `/products/new/`, le badge « Nouveauté » des cartes,
  la bascule « Nouveautés » des catalogues et la section « La sélection » de
  l'accueil, qui n'affichait que les pièces en vedette.
  ⚠ Plus de **vidéo de produit** : `Product.video` a été retiré à la demande
  (migration `0028`), avec `video_url` dans l'API, le filtre `?media=`, les
  comptes `video` / `photo` des facettes, les bascules « Vidéo » / « Photo »
  des catalogues, la lecture sur les cartes produit et en tête de galerie de
  la fiche, et le bloc « Vidéo » du formulaire. Une pièce ne se présente plus
  que par ses photos. Les vidéos de l'accueil (`ShowcaseVideo`, « Aperçu de
  la boutique ») restent. ⚠ **La page Espace Gestion → Vidéos de l'accueil
  a été supprimée**, à la demande (`/gestion/videos`, `ContenuPage.jsx`,
  `BlocVideos`, son entrée de menu ; elle s'appelait « Contenu du site »,
  `/gestion/contenu`, dont la redirection est partie avec elle — les deux
  adresses mènent à la 404). **Les vidéos ne se gèrent plus que par le stylo
  de la section, sur l'accueil.** Le fichier `VideosPage.jsx` reste : il
  porte ce tiroir.
  ⚠ **Quatre vidéos au plus, toutes en ligne**, à la demande :
  `ShowcaseVideo.MAX = 4`, vérifié à la création par le sérialiseur de
  gestion (« 4 vidéos au maximum… ») et par l'admin (plus de bouton
  « Ajouter » à la quatrième) ; `/videos/` n'en sert jamais plus. L'option
  **« Visible sur le site » (`is_active`) a été retirée**, front et back
  (migration `0034`, qui supprime les vidéos alors masquées — il n'y en avait
  aucune en développement) : pour retirer une vidéo, on la supprime.
  **Un stylo** à droite du titre « Aperçu de la boutique », sur l'accueil,
  visible des seuls comptes `is_staff`, ouvre **la gestion complète des
  quatre vidéos** dans un tiroir, à la demande — le même stylo que sur les
  rayons et la boutique (`.catalogue-edition`). Le tiroir
  (`GestionVideosAccueil` : `useVideosAccueil`, `Emplacements`, `VideoForm`
  dans `VideosPage.jsx`) montre quatre emplacements — les vidéos dans l'ordre de
  l'accueil, numérotées, crayon et corbeille, puis une case pointillée
  « Ajouter une vidéo » par place libre. **La place d'une tuile est sa place
  sur l'accueil, et elle se change en glisser-déposer**, à la demande
  (`useGlisser`, sans bibliothèque) : à la souris toute la tuile se saisit,
  au doigt seulement la poignée (la pastille de place, `touch-action: none`,
  pour laisser le tiroir défiler), au clavier la poignée est un bouton et les
  flèches déplacent. Lâchée sur une place libre, la vidéo va en dernier (les
  vidéos se suivent sans trou). L'ordre s'affiche aussitôt, puis chaque vidéo
  déplacée est enregistrée (`PATCH { order }`) ; en cas d'échec, la liste est
  relue. Le champ « Ordre d'affichage » du formulaire a été **retiré** ; une
  vidéo ajoutée prend la place qui suit la dernière. Le formulaire prend la place du
  tiroir de la liste et y ramène ; la bande de l'accueil se relit après
  chaque écriture. Chargé au premier clic (`lazy`). Le panneau est rendu
  dans `<body>` (`createPortal`) : le `zoom` des pages de l'accueil le
  réduirait sinon. Sans vidéo, la section reste **visible pour un admin**
  (« Aucune vidéo pour l'instant… »), sans quoi il n'aurait pas de stylo ;
  les visiteurs ne la voient toujours pas.
  ⚠ Une pièce **ne se masque plus** : `Product.is_active` a été retiré à la
  demande (migration `0029`), avec la case « En ligne » du formulaire, la
  colonne « Statut » de l'Espace Gestion et les actions « Activer » /
  « Désactiver » de l'admin. Toute pièce enregistrée est en ligne ; pour la
  retirer, on la supprime. La migration a **supprimé les 3 pièces alors
  masquées** (« Boubous Africains », « Rosé », « Sandales Cuir Tressé
  Artisanal »). Elles avaient été commandées : `OrderItem.product` est donc
  passé de `PROTECT` à `SET_NULL` — une ligne de commande garde son
  `product_name`, `product_price` et `quantity`, et une pièce commandée peut
  désormais être supprimée. `_restore_order_stock` ignore une ligne sans
  pièce. Les catégories ne se masquent plus non plus (voir `Category`).
  ⚠ Plus de **collection** : le modèle `Collection`, le FK `Product.collection`,
  le filtre `?collection=`, les pages `/collections/:slug` et
  `/gestion/collections` ont été supprimés (migration `0021`). Le catalogue ne
  se range plus que par rayon (`Category`).
- `Category` — **nom et parent seulement**, à la demande (migration `0030`) :
  photo (et sa variante web `display`), description, statut `is_active` et
  ordre `order` ont été retirés. **On ne masque plus une catégorie : on la
  supprime.** `parent` fait une **sous-catégorie**, sur un seul niveau :
  `Category.verifier_parent` (appelée par `clean()` et par le sérialiseur de
  gestion) refuse une sous-sous-catégorie, une catégorie parente d'elle-même,
  un parent pour une catégorie qui a déjà des enfants, et un parent pour les
  cinq rayons de la maison. L'ordre vient de `Category.objects.par_rang()` :
  les rayons dans l'ordre de `SLUGS_STRUCTURELS` (devenu un tuple), puis les
  autres par nom. Le filtre `?category=` et les facettes incluent les pièces
  des sous-catégories ; `product_count` aussi. La barre de navigation ne
  montre que les catégories principales ; le formulaire produit propose
  l'arbre (`rayonsEnArbre`). La page d'un rayon propose ses sous-catégories
  en **bascules de filtre** (`?sous=<slug>`, exclusives, seulement celles qui
  rangent au moins une pièce), à la demande. La **boutique** propose de même
  ses rayons (`?rayon=<slug>`), puis, un rayon choisi, ses sous-catégories
  (`?sous=<slug>`) ; changer de rayon efface la sous-catégorie. Elle lit donc
  `/categories/` pour tous les visiteurs, plus seulement pour un admin. Supprimer une catégorie emporte ses
  sous-catégories (`CASCADE`) et échoue en entier si une pièce y est encore
  rangée (`Product.category` en `PROTECT`) : l'Espace Gestion affiche alors le
  message du serveur.
- `ProductVariant` — taille, couleur, prix propre
- `Order` — statut, méthode paiement, zone livraison, PayDunya ref
  ⚠ **C'est le paiement qui active une commande, et TOUT paiement passe par
  PayDunya**, à la demande (migration `0031`). Le tunnel (`CommandePage`) ne
  propose plus qu'un moyen, « Paiement sécurisé PayDunya » — carte, Orange
  Money, Wave et Free Money se choisissent sur la page de PayDunya. Retirés :
  le paiement à la livraison, les envois Orange Money / Wave / Free Money
  « à la main », l'étape 4 « instructions de paiement » et l'endpoint
  `POST /orders/` (`order_create`), qui créait des commandes non payées que
  rien ne marquait jamais payées. `OrderCreateSerializer` n'a plus de
  `payment_method` : toute commande est `paydunya` ; les anciennes valeurs de
  `PAYMENT_CHOICES` ne restent que pour l'historique. **Seul le retour PayDunya
  (`paydunya_callback`) marque une commande payée.**
  **Statuts : payé, livré, reçu** — on vend des vêtements, il n'y a rien à
  « préparer ». `pending` « En attente de paiement », `confirmed` « Payée »,
  `shipped` « En livraison », `delivered` « Livrée », `cancelled` « Annulée ».
  « En préparation » (`processing`) a disparu : la migration a passé ces
  commandes à « Payée ». Les clés sont restées (API, PayDunya, historique).
  L'**Espace Gestion → Commandes** ne liste que les commandes **payées**, sans
  colonne, menu ni export « Paiement » ; le paiement n'y est plus modifiable
  et « En attente » y est refusé. Une commande s'y **supprime**, à la
  demande (corbeille de la ligne, ou pied du tiroir) : définitif, ses
  lignes partent avec elle (`CASCADE`), le compte du client n'est pas
  touché (la commande n'y est liée que par téléphone) et rien ne lui est
  envoyé. ⚠ **Le stock suit ce que la commande a fait** : jamais partie
  (« Payée », « Annulée »), elle rend ses pièces au rayon
  (`_restore_order_stock`) — sinon une commande d'essai effacée retiendrait
  sa taille pour toujours ; « En livraison » ou « Livrée », le stock ne
  bouge pas, les pièces sont dehors. La confirmation dit lequel des deux
  va se produire. L'admin n'a plus d'action « Marquer comme
  Confirmées ». Les CGV (`MentionsLegalesPage`, clauses 3 et 4) ont été
  alignées : paiement en ligne uniquement, pas de paiement à la livraison.
- `Customer` (User) — téléphone (identifiant), adresse, avatar
- `Coordonnees` — **adresse, téléphone, e-mail de la boutique**, saisis dans
  l'Espace Gestion → Coordonnées (migration `0037`). **Une seule ligne**, et
  jamais zéro : `save()` force `pk=1`, la suppression est refusée et
  `Coordonnees.charger()` crée la ligne à la première lecture avec les
  valeurs qui étaient écrites en dur. Servie par `GET /coordonnees/` (public)
  et écrite par `PATCH /gestion/coordonnees/` (`IsStaffUser`, une adresse
  sans identifiant, donc hors routeur). `telephone_lien` est **calculé** par
  le modèle — le numéro saisi en local prend l'indicatif `+221` : deux champs
  pour un même numéro finiraient par se contredire, et c'est le lien,
  invisible, qui serait faux. **Le WhatsApp du site est ce même numéro**,
  à la demande : `whatsapp` (international, sans « + » ni espaces, la
  seule forme qu'accepte wa.me) est calculé lui aussi, et l'icône de la
  barre de navigation, l'entrée « WhatsApp » du menu mobile et le lien
  des mentions légales l'ouvrent — plus rien n'est écrit en dur
  (`useLienWhatsApp`, `lienWhatsApp`). Un second champ, c'est un second
  numéro à oublier de changer.
- `ShowcaseVideo` — séquences de l'« Univers visuel » : **un lien
  Cloudflare, une affiche facultative (`poster`), une place (`order`)**, rien
  d'autre. Le repère interne (`title`) et la pièce présentée (`product`) ont
  été **retirés, front et back**, à la demande (migration `0035`) : ce sont
  des vidéos de la boutique, qui ne représentent aucun produit. Le formulaire
  n'a plus que deux blocs, « La vidéo » et « Affiche ».
  ⚠ **Une vidéo se fournit par son LIEN Cloudflare, uniquement**, à la
  demande (migration `0036`) : le propriétaire dépose la vidéo dans
  Cloudflare et colle son adresse publique. `video_lien` est obligatoire et
  doit commencer par `https://`. **Plus aucun envoi de fichier vidéo** :
  le champ `video` (FileField), le dépôt direct sur R2 par URL signée
  (`/gestion/videos/lien-envoi/`, `video_cle`) et l'envoi multipart ont été
  retirés, front et back. Ils échouaient : le bucket `goldenpousso-videos`
  n'a pas de règle CORS (et la clé R2 du site ne peut pas la poser), et
  l'instance Render gratuite s'endort, son proxy ne retenant pas des
  dizaines de mégaoctets. La migration a converti en lien l'adresse publique
  de toute vidéo publiée par fichier, et supprimé une ligne sans lien ni
  fichier. Seule l'**affiche** (`poster`, une image) s'envoie encore.
  `video_storage.py` et `STORAGES['videos']` restent : les anciennes
  migrations et la commande `verifier_r2` les importent.

## Conventions

- Composants React : PascalCase, fichiers `.jsx`
- API calls : via `client.js` (jamais fetch natif)
- Images prod : `CldImg` (Cloudinary), pas `<img>` direct
- Styles : `styles.css` global (pas Tailwind) — **voir Design system ci-dessous**
- Icônes : Boxicons (`bx-*`)
- Toasts : `react-hot-toast`
- SEO : `<SEOHead>` composant wrappant `react-helmet-async`. **Un seul
  séparateur de titre sur tout le site, la barre verticale**, à la demande :
  « Boutique | Golden Pousso », et l'accueil, qui n'a pas de titre propre,
  « Golden Pousso | Couture Africaine Haut de Gamme » (il joignait son nom à
  sa devise par une virgule, un tiret cadratin avant cela). ⚠ La même chaîne
  est écrite dans `frontend/index.html` : changer l'une sans l'autre fait
  clignoter l'onglet au premier rendu de React. **L'Espace Gestion nomme ses
  pages comme le reste du site** (« Commandes | Golden Pousso »), à la
  demande : `GestionLayout` pose le `SEOHead`, le nom venant du menu
  (`NAV_ITEMS`) — il n'en posait aucun, et l'onglet gardait le titre de la
  page d'où l'on venait.

## Design system — « Or & Indigo »

Source de vérité : `frontend/src/styles.css`. `frontend/src/theme.js` en est le
miroir JS, réservé aux styles inline qui ne peuvent pas lire une variable CSS.

**Direction** — indigo profond (la teinture ouest-africaine) contre écru de coton
non teint. L'or est du **laiton structurel** : filets, encadrements, bordures.
Jamais un aplat décoratif.

**Rayons — le rôle décide.**

| Token | Valeur | Emploi |
|---|---|---|
| `--r-0` | 0 | aplats pleine largeur, séparateurs — un rayon y ferait une encoche contre le bord de l'écran |
| `--r-1` | 2 px | champs de saisie |
| `--r-2` | 4 px | badges |
| `--r-3` | 2,4 rem | **grandes surfaces** : média, cartes, tuiles, squelettes |
| `--r-pill` | 999 px | **actions** : boutons, chips, pastilles |

`--r-3` vaut 24 px, la valeur des tuiles transférées : la reprendre partout
évite que la moitié de la page soit à angles francs et l'autre non. Un
squelette de chargement doit porter le rayon de la carte qu'il remplace, sinon
le passage de l'un à l'autre fait un à-coup visible.

**La règle du doré.** Un seul or ne peut pas servir les deux fonds :

| | sur indigo `#0F1320` | sur écru `#FAF6EE` |
|---|---|---|
| `#C6A43D` (`goldOnDark`) | 7,74:1 ✅ | 2,22:1 ❌ |
| `#836B26` (`goldOnLight`) | 3,72:1 ⚠️ | 4,76:1 ✅ |

`#836B26` n'est pas choisi au hasard : c'est la **même teinte que `#C6A43D`**,
assombrie jusqu'au premier ton qui tienne AA sur les deux fonds clairs — l'écru
et la carte dorée `--surface-gold` (`#FAF4E6`, 4,67:1). Plus clair, il échoue
sur la carte.

`COLORS.gold` est un alias de `goldOnLight` conservé pour le code historique.
Dans du neuf, écrire `goldOnDark` / `goldOnLight` explicitement.

**Toute couleur ajoutée doit être mesurée** (WCAG 2.1, seuil AA 4,5:1) et son
ratio noté en commentaire à côté de sa déclaration, comme les autres.

**Rythme vertical — règle stricte.** Une section porte son espace **en haut
seulement**, jamais en bas : l'écart entre deux sections voisines vaut donc
toujours exactement `--section-y` (64 px en petit écran, 80 px au-delà), jamais
le double. Une section ne doit **jamais** redéfinir son `padding` vertical —
avec un espace des deux côtés, les écarts de la page d'accueil allaient de 48 à
192 px selon les surcharges de chacune.

Pour décaler un contenu à l'intérieur d'une section, utiliser une marge sur le
contenu. Pour une bande pleine largeur avec image de fond (`FullWidthBanner`),
prendre l'écart en `margin-top` : un padding creuserait l'espace *dans* le
visuel au lieu de l'en séparer. La dernière section d'une page retrouve son
espace du bas via `main > section:last-of-type`.

**Focus : une seule bordure**, à la demande. L'anneau de focus global
(`styles.css`, `:focus-visible`) était décalé de 3 px : autour d'un élément
déjà bordé — champ, pilule, case, flèche — il dessinait un second cadre. Il
est désormais **collé** (`outline-offset: 0`) et suit l'arrondi de l'élément.
Les champs `.field` n'ont plus d'anneau : leur propre bordure s'épaissit à
2 px et passe au laiton (`box-shadow: inset`). Le curseur de prix ne montre
le focus que sur sa poignée. Ne jamais remettre de décalage positif sur un
élément bordé, ni retirer le focus sans le remplacer : sans lui, le site est
inutilisable au clavier.

**Écrire du style, dans l'ordre de préférence :**
1. une classe existante — `.btn`, `.eyebrow`, `.rule`, `.price`, `.media`,
   `.card`, `.field`, `.badge`, `.link-reveal`, `.editorial`, `.lead`
2. une variable CSS dans un style inline — `var(--s-4)`, `var(--text-accent)`
3. en dernier recours seulement, une valeur en dur

**Le cadre des pages de catalogue.** Toute surface qui liste des pièces reprend
les classes `.catalogue-*` de `styles.css` — `page` (fond et hauteur), `entete`
+ `titre` (h1 en `--t-h2` centré, filet doré), `corps`, `grille` (4/3/2/1
colonnes) et `vide` + `vide-titre` / `vide-texte` / `vide-action`. `/categorie/:slug`
et `/favoris` s'en servent toutes deux : elles se dessinaient chacune à sa
façon, et la même absence de pièces ne se lisait pas pareil selon la page où
l'on tombait. Ne pas recopier ces règles dans un `<style>` de page — deux
copies d'une grille divergent au premier réglage.

La **boutique** est sur l'indigo `#161B2D`, à la demande : `catalogue-page
on-dark`, variante déclarée dans `styles.css` (`.catalogue-page.on-dark`, qui
relève aussi `--surface-sunk` à l'indigo-700 — sans cela, photos en attente et
squelettes de chargement prendraient la couleur exacte de la page). Depuis,
**tout le site public** est sur cet indigo (voir « Fond du site ») : la variante
ne change plus rien, elle reste pour une page qui sortirait du `Layout`. La barre de filtres porte ses réglages
sombres (`.on-dark .gp-pilule--actif`, `.on-dark .gp-panneau`) : sa pilule
active posait du laiton sur crème, ~2,2:1.

**La boutique et les rayons se parcourent page par page**, à la demande
(`components/Pagination.jsx`, partagé par `/boutique` et `/categorie/:slug`) :
une requête = une page (`?page=N`, 24 pièces), la grille est **remplacée**,
jamais allongée. C'était un bouton « Charger plus » qui empilait les pièces —
au bout de quatre clics, une centaine de cartes et autant de photos en
mémoire, sans qu'on sache où l'on en était ni comment revenir en arrière. Le
numéro vit dans l'URL (`?page=3`) : la page se partage, le bouton « retour »
du navigateur ramène à la précédente. ⚠ **Tout filtre efface `page`** — rester
en page 4 après avoir coché « En stock » montrerait une grille vide alors que
les pièces sont en page 1 —, un 404 de l'API (page bricolée dans l'URL) ramène
en page 1, et la taille de page n'est pas recopiée côté front : tant que l'API
annonce une page suivante, la page reçue est pleine, donc sa longueur EST la
taille de page. Le dessin reprend les pilules de `PlpFilterBar` (courante
pleine, indigo sur laiton 7,74:1), avec première, dernière, la courante et ses
voisines, le reste en « … ».

L'état vide se pose toujours en trois morceaux : constat, phrase, **action**.
Sans la porte de sortie, l'utilisateur n'a que le bouton « retour » du
navigateur.

**Ajouter une pièce depuis un rayon ou la boutique.** Sur `/boutique`, le
même stylo ouvre le même formulaire, à la demande, mais **sans rayon posé
d'office** : il propose le menu des rayons (lus sur `/categories/`, pour un
compte `is_staff` seulement). Sur `/categorie/:slug`, un stylo à droite
du titre — visible des seuls comptes `is_staff` — ouvre le formulaire produit
de l'Espace Gestion, **rayon posé d'office** (`categorieFixe`, sans être
affiché : la pastille de l'en-tête a été retirée à la demande) : la pièce créée va dans ce rayon, et **tout se fait en une
étape**, à la demande : photos et variantes se choisissent dans le
même panneau que la fiche et attendent « Créer la pièce », qui envoie la
fiche puis les médias (la première photo est la principale) et **vide le
panneau pour la pièce suivante**, rayon conservé. Si un envoi échoue après la
création, le panneau passe en modification de la pièce créée pour la
compléter. Une pièce ouverte pour être modifiée garde l'envoi immédiat de
chaque photo ou variante. (La création se faisait en deux temps : la
fiche, puis les médias.) Le panneau **reprend le dessin du
tiroir du panier**, à la demande : indigo `#161B2D` glissant de la droite sur
un voile flouté, titre de laiton, corps qui défile seul, pied fixe portant
l'action en pilule de laiton (survol écru et encre, 17,05:1 — pas la terre
cuite du panier, où l'écru ne tient que 3,72:1). Il porte ses propres tokens
sombres (`.pf-tiroir.on-dark`) : il se dessine pareil dans le site et dans
l'Espace Gestion. Ses champs sont arrondis à 1,2 rem, à la demande —
exception assumée au `--r-1` (2 px) des champs du site. La grille et les facettes se relisent à
la fermeture. Le formulaire vit dans `pages/gestion/ProductForm.jsx`, **partagé**
par les deux stylos — une seule copie —, et n'est chargé qu'au
premier clic (`lazy`) : les visiteurs ne téléchargent pas le code
d'administration. Aucune route nouvelle côté serveur : `POST /gestion/products/`
et `/gestion/product-images/`, déjà réservés à `IsStaffUser`.

⚠ **La page Espace Gestion → Produits a été supprimée**, à la demande
(`ProduitsPage.jsx`, sa route, son entrée de menu ; la carte « Stock faible »
du tableau de bord n'y mène plus). Les deux stylos des en-têtes ne font que
**créer**. **Une pièce existante se modifie par le stylo de sa carte**, à la
demande : troisième pastille de `ProductCard`, sous le cœur et le panier, même
dessin, visible des seuls comptes `is_staff` — et seule des trois à rester
sur une pièce épuisée (`.pc-pastilles` passe au-dessus du voile « Épuisé »).
Donc boutique, rayons, favoris et pièces similaires de la fiche ; pas le rail
« Nos produits » de l'accueil, qui a sa propre carte, sans pastilles. Il ouvre
`pages/gestion/EditionPiece.jsx` (chargé au premier clic, rendu dans
`<body>` : la carte se soulève par `transform`), qui relit la pièce sur
`/gestion/products/:id/` et les rayons sur `/categories/`, puis
`ProductForm` en modification. **Le panneau reste ouvert après
« Enregistrer »**, à la demande — rien n'indique que l'admin a fini : le
bouton passe à « ✓ Enregistré » (contour de laiton) jusqu'au prochain
changement d'un champ, et l'admin ferme lui-même. La grille n'est relue
qu'à la **fermeture** (s'il y a eu un enregistrement) : relue pendant
l'édition, elle passait en squelettes et démontait la carte — donc le
panneau. La boutique et les rayons relisent
leur grille (`onModifie`). **Sous le stylo, une poubelle supprime la pièce**,
à la demande (`pages/gestion/SuppressionPiece.jsx`, chargé au premier clic) :
confirmation, `DELETE /gestion/products/:id/`, retrait des favoris de ce
navigateur, grille relue. Définitif — photos, variantes et demandes de
réassort partent avec elle ; les commandes gardent leur ligne (`SET_NULL`).
Au survol, rouge `--gp-danger` sous l'écru (6,06:1).
**Les quatre pastilles — cœur, panier, stylo, poubelle — vivent dans
`components/PastillesPiece.jsx`**, une seule copie, partagée par la carte
(`ProductCard`) et **la fiche produit** (`ProduitPage`), où elles se posent
exactement au même endroit, en haut à droite de la photo principale, à la
demande. Sur la fiche, le panier ajoute la taille et la quantité choisies
(même garde-fou « Choisissez une taille » que le bouton), la loupe ignore le
survol des pastilles, une modification relit la pièce et une suppression
renvoie vers le rayon. Le bouton « Ajouter au panier » de la colonne d'achat
reste ; **le cœur qui le suivait a été retiré**, à la demande : il faisait
doublon avec celui de la photo. Les API `/gestion/products/` restent, c'est le formulaire qui
les appelle. Ont aussi disparu, à la demande : **Messages** et **Alertes de
réassort** (pages, entrées de menu, API `/gestion/messages/` et
`/gestion/stock-alerts/`, carte « Messages non lus » du tableau de bord). Les
modèles restent : un message de contact et une demande de réassort
s'enregistrent toujours, l'e-mail de retour en stock part toujours, et les
deux listes se lisent dans `/admin/`. Le **tableau de bord** (`/gestion`) a
été supprimé lui aussi, à la demande : `DashboardPage.jsx`, son entrée de
menu et l'API `/gestion/dashboard/` ; `/gestion` redirige vers
`/gestion/commandes`. Il reste donc quatre pages : Catégories, Commandes,
Comptes utilisateurs et Coordonnées (la page Vidéos de l'accueil a été
supprimée à son tour, voir `ShowcaseVideo`). « Clients » a été renommée
**« Comptes utilisateurs »** (`/gestion/comptes` ; `/gestion/clients` y
redirige), à la demande : chaque compte y a un **type, Client ou Admin**
(`is_staff`), et les colonnes « Commandes » et « Total dépensé » ont été
retirées, front et back (`GestionCustomerSerializer`). Un compte s'y
**crée** (bouton « Nouveau compte »), se **modifie** (stylo de la ligne),
se **désactive** (`is_active`, réactivable, pastille « Désactivé ») et se
**supprime** (définitif), à la demande ; les commandes, liées par téléphone,
restent. Sur son propre compte, **le stylo seul** est proposé, à la demande
(on y corrige son nom, son numéro, son mot de passe ; le bloc « Type de
compte » n'y est pas et `is_staff` n'est pas envoyé) : le serveur refuse
de se repasser client, de se désactiver ou de se supprimer, ces trois
boutons n'y sont donc pas.

La création et la modification passent par **un seul tiroir**
(`CompteForm`, dans `ClientsPage.jsx`) : identité, connexion, type —
**sans aucun texte d'aide sous les champs**, à la demande : il ne porte
que ses libellés, les règles restant vérifiées par le serveur et dites par
la notification en cas d'erreur. Le
`GestionCustomerViewSet` est devenu un `ModelViewSet` (il n'avait pas de
`POST`) et l'identité, jusque-là en lecture seule, s'écrit. C'est le seul
moyen d'ouvrir l'accès à un **second admin** sans `createsuperuser`.
⚠ **Le téléphone est l'identifiant de connexion** (`/auth/login/` cherche
le compte par son numéro) : il est unique — le sérialiseur le vérifie — et
le changer change le numéro avec lequel la personne se connecte. Le
`username` de Django le suit, **nettoyé de ses espaces** (Django n'en
accepte pas ; le téléphone, lui, garde sa présentation locale, celle que
le client retape) et suffixé en cas de collision ; il ne suit pas si le
compte portait un `username` choisi à la main (`createsuperuser`). Sans
e-mail saisi, le serveur en pose un interne, comme l'inscription du site.
Le **mot de passe** ne se lit jamais : obligatoire à la création, laissé
vide il n'est pas touché — c'est le seul dépannage possible pour un client
qui a perdu le sien, le site n'ayant pas de réinitialisation par e-mail.

Le projet compte encore ~1 200 styles inline hérités : ne pas en ajouter.
Pour une section sur fond sombre, poser `className="on-dark"` sur le conteneur —
tous les tokens de texte, de filet et de surface basculent d'un coup.

**Migration en cours.** `--r-surface`, `--r-action`, `--r-mark`, `--r-micro` et
`--radius` sont des alias de compatibilité pointant vers la nouvelle échelle
(`--r-0` … `--r-pill`). Ils disparaîtront : ne pas en écrire de nouveaux.

**Polices** — chargées dans `frontend/index.html` (preconnect + un seul `<link>`).
Ne jamais remettre d'`@import` dans le CSS : cela ajoute un aller-retour réseau
complet au chemin critique, ce qui se paie cher sur une connexion 3G.

**UNE SEULE FAMILLE : Fraunces, partout**, à la demande — titres, prix,
formulaires, tunnel d'achat, mentions légales. Inter et Plus Jakarta Sans ont
été retirées du lien Google Fonts ; plus aucun fichier ne les nomme.

`--font-body` et `--font-editorial` pointent tous deux sur `--font-display` :
les rôles restent déclarés, ils sont simplement servis par la même fonte. Le
jour où une seconde famille revient, il n'y a que ces deux lignes à changer —
pas les ~235 déclarations qui les lisent.

⚠ Ce que ce choix coûte : Fraunces est un serif de titrage. Sous 13 px
(mentions, étiquettes de formulaire, en-têtes de tableau) ses empattements se
brouillent plus vite qu'un sans serif, et ses chiffres ne sont pas tabulaires
par défaut — conserver `font-variant-numeric: tabular-nums` partout où des
nombres s'alignent verticalement.

Fraunces a remplacé Syne, dessinée en 2017 pour le centre d'art Synesthésie sur
un brief explicite de forme « étrange » — un registre d'institution culturelle,
étranger au vêtement et à la main. Fraunces est un serif *old style* dont la
caractéristique est l'irrégularité maîtrisée : l'équivalent typographique de
« cousu main ».

Elle est demandée en variable sur trois axes :

| Axe | Plage | Rôle |
|-----|-------|------|
| `opsz` | 9–144 | la lettre se redessine selon la taille de rendu (automatique via `font-optical-sizing: auto`) |
| `wght` | 300–900 | remplace quatre graisses statiques par un fichier |
| `WONK` | 0–1 | formes volontairement irrégulières — **classe `.wonk`, grands titres seulement (≥ 40 px)** |

En dessous de 40 px, WONK ne se lit plus comme un parti pris mais comme un
défaut de rendu. Aujourd'hui appliqué au `<h1>` du hero et au titre de
`FullWidthBanner`, nulle part ailleurs.

Dans du neuf, écrire `var(--font-display)` / `var(--font-body)`, jamais le nom
de la fonte : les 79 usages en dur ont déjà été convertis une fois.

## Fond du site — l'indigo partout

**Toutes les pages publiques sont sur `#161B2D`**, à la demande : le `Layout`
pose `className="site-page on-dark"` sur `<main>`. `.on-dark` bascule les
tokens de texte et de filet ; `.site-page.on-dark` (`styles.css`) reprend le
fond et `--surface` au chrome — `.on-dark` seul poserait `#0F1320` — et
redéfinit ce qui ne bascule pas de lui-même :

| Token | Sur le site sombre | Pourquoi |
|---|---|---|
| `--surface-sunk` | indigo-700 `#202742` | sinon la couleur exacte de la page : photos en attente et squelettes y disparaissaient |
| `--action-fill` / `-text` / `-hover` | écru / encre (17,05:1) / écru-100 | un bouton plein d'encre était invisible sur l'indigo |
| `--text-promo` | `--gp-terra-300` `#D6804A` (5,73:1 ; 4,93 dans une carte) | la terre cuite 500 ne tenait que 4,26:1 |
| `--field-bord*` | écru 40 % (3,60:1), laiton clair, `--gp-danger-300` `#EF8A80` (7,01:1) | le contour d'un champ doit tenir 3:1 ; le filet à 10 % disparaissait |

La bande de coordonnées, la barre, le panneau du panier et les notifications
sont **hors** de `<main>` : ils gardent leurs couleurs.

⚠ **Les barres sont montées UNE fois pour tout le site**, à la demande :
`components/Chrome.jsx` (bande de coordonnées, barre de navigation,
`<Toaster>`, et le `<Suspense>` des pages) coiffe **les deux** mises en page,
`Layout` (le site, réduit à son `<main>`) et `GestionLayout` (l'Espace
Gestion). Elles étaient rendues par chacune des deux : le même composant, mais
deux instances — passer de `/gestion` à `/` les démontait et les remontait,
donc `--bande-h` / `--nav-h` disparaissaient une image (la barre se recalait
en haut), l'état « collée » repartait de zéro et les panneaux se refermaient.
Le `<Suspense>` est **sous** les barres : au-dessus, son repli remplaçait la
page entière, barres comprises, à chaque première visite d'une page.
⚠ Et le `<Toaster>` ne vivait que dans `Layout` : **aucun toast ne s'affichait
dans l'Espace Gestion** — « Compte créé », « Coordonnées mises à jour », les
erreurs du serveur. Monté dans le chrome, il sert les deux.

**L'Espace Gestion est la continuité du site**, à la demande : il était écru,
il est sur le même indigo. `GestionLayout` pose `gl site-page on-dark`, donc
les tokens de `.site-page.on-dark`. Ses briques sont dans
`pages/gestion/ui.jsx`, **tout leur style dans `pages/gestion/gestion.css`**
(classes `.gx-*`, importée par `ui.jsx` : les visiteurs ne la téléchargent
pas) — plus aucune couleur en ligne, plus de `COLORS`. Les valeurs sont
reprises de trois dessins du site, pas inventées :
- **en-tête** (`PageHeader`) : sur-titre « Espace Gestion », h1 en `--t-h2`,
  `.filet-titre`, une ligne de décompte (`compte`) et les outils centrés
  dessous — l'en-tête des catalogues ;
- **tiroirs** (`Tiroir`, `Bloc`) : le panneau du panier et du formulaire
  produit, titre de laiton, corps qui défile, pied portant l'action en pilule
  de laiton ; Échap ferme. La boîte de confirmation (`ConfirmDialog`) est de
  la même matière, et Échap n'y ferme qu'elle, pas le tiroir dessous ;
- **filtres** (`Pilules`) : les pilules de `PlpFilterBar`, active pleine
  (indigo sur laiton, 7,74:1), avec leur **nombre** ; `Recherche` est un champ
  en pilule, loupe de laiton.
Surfaces : un **encadrement de laiton** (`.gx-cadre`, `--line-dark-accent`,
`--r-3`) sur le fond de la page, jamais un aplat. Tableaux : en-têtes en
laiton, lignes filetées ; **sous 760 px, chaque ligne devient une carte**
(l'intitulé de colonne vient de `<Td intitule>`). Pastilles d'état
(`Badge`) : texte de la teinte sur un voile de 14 % — laiton 5,65:1, vert
`--gp-success-300` `#7BCB9B` 6,66:1, bleu `--gp-info-300` `#9DB4E8` 6,30:1,
rouge 5,56:1 (les deux nouvelles teintes sont déclarées dans `styles.css`).
Chargement : squelettes à `--r-3` (`Chargement`) au lieu d'une page vide.
Par page : **Catégories** en cartes (une par catégorie principale, ses
sous-catégories en lignes, puce losange ; « Rayon de la maison » en
sur-titre ; crayon et corbeille en boutons ronds) ; **Commandes** avec pilules
de statut comptées (elles suivent la recherche), ligne entière cliquable,
détail en tiroir où le statut se choisit en pilules, sous-total et livraison
détaillés ; **Comptes utilisateurs** avec pastille d'initiales (pleine pour
un admin), recherche et pilules Tous / Clients / Admins / Désactivés ;
le **tiroir des vidéos** de l'accueil (seul endroit où elles se gèrent) en
quatre emplacements 3/4, pastille de place, formulaire en deux blocs (La
vidéo, Affiche) ; **Coordonnées** (`/gestion/coordonnees`,
`CoordonneesPage.jsx`), le formulaire à même la page — il n'y a qu'une
fiche, donc rien à lister ni à ouvrir en tiroir : trois champs et un bouton
qui passe à « ✓ Enregistré » jusqu'au prochain changement, comme le
formulaire produit. **Plus de carte « Aperçu », de sous-titre ni de textes
d'aide sous les champs**, retirés à la demande. La carte est **centrée** (64 rem au
plus) et ses champs portent des **exemples en placeholder**. Le formulaire produit
(`ProductForm`, `.pf-*`) avait déjà ce dessin et n'a pas bougé. Son
**menu EST le sommaire de la page d'accueil**, à la demande : le composant
`components/Sommaire.jsx`, plus une copie de son dessin — carte flottante à
gauche, voile d'indigo à 85 % et flou, filet de laiton, `--r-3` ; numéro,
trait et nom par page, la courante en laiton. Le dessin était recopié classe
par classe dans `GestionLayout.jsx` (`.gl-sommaire-*`) et dans `Pagineur.jsx`
(`.hp-sommaire-*`) ; **la carte est partagée, chaque page ne garde que son
EMPLACEMENT** (`absolute` et masquée sous 900 px sur l'accueil, `fixed` puis
dans le flux dans l'Espace Gestion). Une entrée est un lien de routeur (`to`,
`aria-current="page"`) ou un bouton (`actif`, `aria-current="true"`) ; la tête
et le pied sont libres — deux chevrons (`SommairePas`) sur l'accueil, un titre
(`SommaireTete`) dans l'Espace Gestion.
⚠ **Un seul jeu de barres sur tout le site** : la bande de coordonnées et la
barre de navigation de l'Espace Gestion sont les composants publics
(`BandeCoordonnees`, `Navbar`), pas des copies. Elle est centrée dans la
hauteur sous les deux barres (`--bande-h` + `--nav-h`) et le contenu lui
réserve sa place (`--gl-reserve`) ; sous 900 px, elle rentre dans le flux en
tête de page. Il a été une colonne sombre pleine hauteur, icônes en tête de
ligne.

**Îlot clair** — `className="theme-clair"` rend les tokens écrus (et les
titres, que `.on-dark h1…h4` repeint) à un bloc dessiné pour un fond clair.
⚠ **Plus aucune page ne s'en sert** : le tunnel d'achat (`/commande`), le
compte (`/profil`) et l'historique (`/commandes`) sont passés au cadre de
laiton de l'Espace Gestion, le formulaire produit au dessin sombre du panier.
La classe reste dans `styles.css`, prête pour un bloc qui redeviendrait clair. Dans un îlot clair, l'anneau de
focus revient au laiton foncé (le clair n'y tenait que ~2,2:1). Le guide des tailles
a été retiré de la fiche produit, à la demande : `SizeGuideModal.jsx` n'est
plus appelé nulle part.

⚠ **`COLORS` (`theme.js`) ne bascule pas** : ses valeurs sont figées pour un
fond clair (encre, laiton foncé). Dans une page publique, écrire les tokens
(`var(--text)`, `var(--text-accent)`…). L'alerte de stock de la fiche
produit a été convertie — ses textes s'écrivaient à l'encre sur l'indigo —,
et ses champs sont passés à `.field`.

**`/commandes`, `/profil` et `/commande` ont été refaites dans le dessin de
l'Espace Gestion**, à la demande : en-tête à sur-titre, titre, filet et ligne de
décompte (`PageHeader` — ⚠ sauf `/profil`, dont la ligne « nom · téléphone » a
été retirée à la demande : elle répétait deux lignes de la carte juste en
dessous) ; **cadre de laiton** posé sur l'indigo de la page,
jamais un aplat (`.gx-cadre`) ; intitulés et en-têtes de tableau en capitales
de laiton ; champs arrondis à 1,2 rem des tiroirs ; squelettes de chargement au
rayon du cadre. Sur `/commandes`, l'état n'est plus binaire : chaque statut
prend **la teinte de l'Espace Gestion** (payée laiton 5,65:1, en livraison bleu
6,30:1, livrée vert 6,66:1, annulée rouge 5,56:1, texte sur un voile de 14 %),
le détail se range en blocs à titre de laiton (« Articles »,
« Récapitulatif »), et le tableau se replie en cartes sous **760 px**, le point
de rupture du back-office. Le formulaire de connexion de `/profil` prend le
même cadre. Dans le **tunnel d'achat**, les trois étapes et le récapitulatif
collant sont des cadres de laiton, le titre d'étape passe au laiton comme un
titre de tiroir, et l'en-tête annonce « 3 pièces · 33 500 FCFA » — le total se
lit dès le premier écran, sans attendre le récapitulatif.

⚠ **Ces deux pages ne sont plus des îlots clairs.** Elles étaient en écru-100
`#F2EBDD` (`theme-clair`) — blanches avant cela, puis au chrome, puis à
l'indigo-700 — et redéfinissaient `--text-accent` à `#7D6624` pour tenir le
seuil AA sur ce fond. Sur l'indigo, les tokens sombres du site suffisent : écru
15,85:1, atténué 6,79:1, laiton clair 7,14:1. Le tunnel d'achat les a suivies : ses cartes
blanches (encre 18,38:1, atténué 6,12:1, laiton foncé 5,13:1) sont devenues
des cadres à leur tour, si bien qu'il **ne reste aucun îlot clair** sur le
site. Les commandes de `/commandes` restent
**toujours dépliées**, à la demande : plus de bouton « Détail / Suivre /
Masquer », plus de colonne d'action ; le filet qui sépare deux commandes suit
le détail.

## Pied de page — il n'y en a plus

Retiré de tout le site, à la demande : `components/Footer.jsx` a été supprimé
et le `Layout` ne pose plus rien sous `<main>`. Il ne portait plus que la
mention « ©2026. Golden Pousso. Tous droits réservés. », qui n'apparaît donc
nulle part. ⚠ `/mentions-legales` n'est liée depuis **aucune** page — c'était
déjà le cas avant ce retrait : elle n'existe que pour qui en connaît
l'adresse. Le pied de page publiait sa hauteur dans `--pied-h`, que la
pagination de l'accueil retranchait ; la variable a disparu avec lui.

## Page d'accueil

Composée dans `frontend/src/pages/HomePage.jsx`, sections dans
`frontend/src/components/home/`. L'ordre suit une progression : on accueille,
on **dit qui l'on est**, on oriente par rayon, on expose, puis on montre la
boutique et les créations, sur lesquelles la page se referme. « La
sélection » (les pièces « Vedette »), qui la fermait, a été supprimée avec
« Vedette » et « Nouveauté ».

⚠ **Barre horizontale fantôme** (corrigée) : un élément en position
absolue posé dans une section se rangeait sur `.hp`, hors de la piste qui
défile — il échappait au rognage et élargissait **tout le document**
(~8 900 px, à cause du texte caché du compteur de « Nos produits »), d'où une
barre de défilement horizontale qui ne menait nulle part. `.hp-page` est
désormais `position: relative` et `.hp` rogne (`overflow: hidden`). Ne pas
retirer l'un ni l'autre ; vérifier que `document.documentElement.scrollWidth`
égale la largeur de la fenêtre après toute nouvelle section.

**La barre de navigation commence par « Accueil »**, puis « Boutique » et
les rayons, à la demande (liens écrits en dur dans `navLinks` pour les deux
premiers, menu mobile compris).

**Elle se parcourt sur les côtés, pas vers le bas** (à la demande) :
`components/home/Pagineur.jsx` range chaque section dans une page de la
largeur de l'écran, et le document ne défile plus — bande de coordonnées,
barre et pages tiennent exactement dans la fenêtre (`--bande-h` + `--nav-h`).
On tourne les pages
par le **sommaire** — au-delà de 900 px, une carte flottante **à gauche**,
décollée du bord, **toujours ouverte**, sur un **voile d'indigo à 85 % et un
flou**, cernée d'un filet de laiton, à la demande : le numéro et le nom de
chaque section (le numéro contre le bord, la courante en laiton suivie d'un
trait), deux chevrons
pour la précédente et la suivante — ou, en petit écran, par les flèches des
côtés, que le sommaire remplace au-delà (la barre de pagination du bas a été
retirée à la demande), le glissement au doigt ou au pavé tactile (défilement natif aimanté,
une page par geste), la molette et le clavier (← →, Page préc./suiv.,
Début/Fin ; ↑ ↓ font défiler une page haute). Une section plus haute que sa
page défile **dans** sa page ; la molette ne tourne la page qu'une fois au
bord, et sur un nouveau geste — l'élan qui vient d'y amener ne la tourne pas,
sans quoi l'inertie d'un pavé tactile sautait des sections. Le glissement est
animé à la main (~750 ms, aimantation coupée le temps du trajet) ; instantané
si le visiteur demande moins d'animations. Un lecteur d'écran entend
« Section 3 sur 6 : … » à chaque page tournée.

Conséquences à connaître :
- Chaque section est **seule dans sa page** : les règles de jonction décrites
  plus bas (`.man + .uv.on-dark`, `.uv + .bp`…) et
  `main > section:last-of-type` ne s'appliquent plus sur l'accueil. Elles
  restent en place, dormantes, pour le jour où la pagination partirait. Les
  pages portent elles-mêmes l'indigo `#161B2D` — l'option `claire` (page
  écrue) reste, inutilisée.
- Une section qui ne rend rien (aperçu sans vidéo) laisse une page vide,
  retirée par `.hp-page:empty` : la
  pagination ne compte que les pages affichées.
- Le nom de chaque section — celui du sommaire, celui qu'annonce le lecteur
  d'écran — est lu dans le premier `<h2>` de sa page : renommer une section
  dans l'Espace Gestion renomme son entrée. Le hero, sans `<h2>`, s'appelle
  « Accueil ».
- Le sommaire est **toujours ouvert** (~226 px), à la demande — il a été
  replié sur ses numéros, les noms se déployant au survol. Les pages lui
  **réservent sa place, à gauche** — il a été à droite —, au-delà de 900 px :
  `--hp-reserve` = le
  bord + la largeur de la carte, **mesurée** et publiée dans
  `--hp-sommaire-l` (les noms viennent de la base) + 2,4 rem d'air, en
  `padding-left` de toutes les pages, hero compris — ouverte en permanence,
  la carte couvrirait sinon la silhouette de gauche du tableau. Chaque
  section se centre dans la largeur qui reste ; la vitrine et la parole du
  hero bornent leur largeur d'autant. Des deux côtés, la réserve aurait coûté
  ~540 px de large. Un nom de plus de 22 rem finit en points de suspension.
  (« Nos produits » faisait exception, son rail défilant sous le sommaire :
  devenu un jeu de cartes, il tient dans la largeur utile — voir plus bas.)
- Le **voile du sommaire** est né sur « Nos produits », pour qu'il reste
  lisible par-dessus les photos, puis a été étendu à **toutes les pages** à
  la demande. Au pire, une photo blanche dessous : écru 11,1:1, noms 5,3:1,
  laiton 5,0:1 — **ne pas descendre sous 85 %** (à 82 %, le laiton tombe à
  4,48:1). Il était transparent avant, avec une variante à l'encre pour une
  page écrue (`.hp-sommaire--claire`) : son propre fond l'a rendue inutile,
  elle a été retirée.
- La vitrine prend la hauteur utile d'une page (`--hp-utile`) au lieu de
  l'écran ; le hero, toute sa page au lieu de `100vh`.
- Plus de réserve en bas des pages : `--hp-bas` (72 px) accueillait la barre
  de pagination, retirée ; `--hp-utile` vaut désormais la page entière.
- **Chaque section tient dans sa page** (au-delà de 900 px de large), à la
  demande : plus haute que l'écran, elle est réduite d'un bloc par `zoom`
  (variable `--hp-zoom`, posée sur la page par `Pagineur`), juste assez pour y
  tenir — jamais sous 70 %, pour que le texte reste lisible ; au-delà, elle
  défile pour le reste. En petit écran, pas de réduction : la page défile.
  `zoom` et non `transform: scale`, qui garderait la hauteur d'origine dans la
  mise en page. La mesure se fait toujours à l'échelle 1, sinon l'ajustement
  oscillerait.
- Chaque section est **calée en haut** de sa page, et `--section-y` y est
  redéfinie à `--hp-haut` (32 px) : titre juste sous la barre de navigation.
  Toutes les sections lisant cette variable, elles se resserrent ensemble
  (vitrine comprise, par `--bp-titre`). ⚠ La règle porte `.hp` en tête pour
  la spécificité — sans lui, `.uv.on-dark` et consorts gardaient leur marge
  de 80 px en plus de leur padding.

**Il n'y a plus d'avis clients nulle part**, à la demande — front et back.
Supprimés : le modèle `Review` (migration `0027`, qui efface aussi les
titres de section `accueil-avis` et `accueil-selection`), l'API publique
(`/products/:slug/reviews/`, `/reviews/recents/`), l'Espace Gestion → Avis
(`AvisPage.jsx`, `/gestion/reviews/`, la carte « avis à modérer » du tableau
de bord), l'admin, la commande `seed_demo_reviews`, `ReviewsSection.jsx`, et
sur la fiche produit la ligne d'étoiles et le nombre d'avis (`rating_avg`,
`review_count` ne sont plus servis). La section « Elles Nous Font Confiance »
de l'accueil était déjà partie, avec `TestimonialsSection.jsx` et
`constants/demonstration.js`. L'historique git garde tout.

⚠ La rangée de réassurance (livraison, paiement, retouches, WhatsApp) a été
retirée, et la bande qui portait ses arguments ne les porte plus non plus :
délai de livraison et moyens de paiement ne sont annoncés **nulle part** avant
le tunnel d'achat.

Cette bande n'est d'ailleurs plus une section d'accueil. Elle est remontée
**au-dessus de la barre de navigation**, posée par le `Layout`, donc en tête
de toutes les pages : `components/BandeCoordonnees.jsx` (anciennement
`home/Ticker.jsx`). Elle reste **visible en permanence** (`position: sticky`)
et publie sa hauteur dans `--bande-h` sur la racine. Ne pas remplacer cette
variable par une hauteur en dur : la rangée passe à deux ou trois lignes en
petit écran.

La barre de navigation colle sous elle, à `top: var(--bande-h)`. **C'est le
conteneur de la navbar qui est `sticky`, pas le `<nav>`** : un élément collant
ne colle que dans les limites de son parent, et le `<nav>` n'aurait eu pour
piste que la hauteur de ce div. La barre passait auparavant de `relative` à
`fixed` au-delà de 80 px de défilement ; pendant ces 80 px elle remontait avec
la page pendant que la bande restait collée, et un écart s'ouvrait entre les
deux. L'état `sticky` du composant ne décide plus que de l'apparence (filet et
flou), plus de la position. Elle publie à son tour sa hauteur dans
`--nav-h`, sur le même modèle — `BandePromo` s'en sert pour occuper exactement
l'écran sous les deux barres. Elle ne porte que l'adresse, le téléphone et l'e-mail,
séparés par des ciseaux, et **ne défile plus** — ses valeurs sont donc
cliquables, ce qu'elles ne pouvaient pas être en mouvement.

⚠ **Ses trois valeurs viennent de la base**, à la demande : le store
`coordonneesStore` lit `GET /coordonnees/` une seule fois par visite (la
bande se remonte à chaque page) et l'Espace Gestion → Coordonnées les
écrit ; après enregistrement, le formulaire repose la valeur dans le
store (`poser`) et la bande suit sans rechargement. `constants/contact.js`
n'est plus la source mais le **repli** (`COORDONNEES_DEFAUT`), affiché
tant que la réponse n'est pas là et si elle n'arrive jamais — un échec ne
se signale pas : un bandeau d'erreur en tête de site pour une adresse qui
n'a pas bougé serait pire que le silence. ⚠ Le **texte** des coordonnées
dans les **mentions légales** (clause 1, droit d'accès) et dans les
e-mails de commande (`settings.CONTACT_PHONE` / `CONTACT_EMAIL`) reste en
dur : les changer ici ne les change pas là. Seul le **lien WhatsApp** des
mentions légales suit, comme celui de la barre.

| # | Section | Fichier | Fond |
|---|---------|---------|------|
| 1 | Hero | `components/Hero.jsx` | indigo |
| 2 | Le mot de la maison | `home/AtelierSection.jsx` | indigo chrome `#161B2D` — panneau pleine largeur |
| 3 | Notre catalogue | `home/UniversGrid.jsx` | indigo chrome `#161B2D` — ⚠ voir ci-dessous, rayons structurels |
| 4 | En vitrine | `components/BandePromo.jsx` | indigo — cinq pièces détourées, entières, sous leur titre |
| 5 | Aperçu de la boutique | `components/VideoCardsSection.jsx` | indigo chrome `#161B2D` — ⚠ voir ci-dessous |
| 6 | Nos produits | `components/CategoryGrid.jsx` | indigo chrome `#161B2D` — jeu de cartes, ferme la page |

**Nos produits** (6) **est un jeu de cartes**, à la demande — il était un
rail qui défilait sans fin. La pièce du dessus est droite et entière ; les
quatre suivantes dépassent derrière, en **éventail** (rotation et décalage
par rang, pivot en bas, un peu assombries), les autres attendent cachées.
Toutes les 3,2 s la carte du dessus **s'envole** vers la droite et repasse
sous le paquet. Le **filet de laiton** sous le compteur « 03 / 08 » est le
temps restant : c'est la fin de son animation qui déclenche la carte
suivante, si bien que **survoler le jeu (ou y mettre le focus) l'arrête**
exactement où il en était (`animation-play-state: paused`) — rien à
resynchroniser. Flèches précédente / suivante ; un clic sur une carte de
l'éventail la fait passer devant, seule celle du dessus mène à la fiche.
Rien ne bouge seul avant que la section soit vue (`useInView`) ni si le
visiteur demande moins d'animations. La carte (photo 2/3, panneau vitré)
est celle de l'ancien rail ; sa largeur est tirée de `--hp-utile`
(`--jeu-l`), bornée à 36 rem et 62 vw. En petit écran, l'éventail se
resserre. **Toutes les pièces** du catalogue, à la demande (il n'en montrait
que huit) : `/products/` pagine par 24 et ignore `page_size`, les pages sont
donc lues à la suite (garde-fou de 20 pages). Seules les cartes utiles sont
dans le DOM : le dessus, l'éventail et la dernière du paquet.

**Le mot de la maison** (2) **ouvre la page**, juste après le hero : le
visiteur sait chez qui il est avant de voir les pièces bouger. Il a suivi un
temps l'aperçu de la boutique, et fermé la page avant cela.

Le panneau va d'un bord à l'autre de la fenêtre (donc `--r-0`), sur
**`#161B2D`** — `--surface-chrome`, l'indigo de la bande de coordonnées et de la
barre —, à la demande, sans filet de laiton autour.
`.on-dark` bascule les tokens de texte et de filet ; le fond et
`--surface` sont repris par `.man-panneau.on-dark`, car `.on-dark` seul
poserait `#0F1320`. Il a été `#0F1320` d'abord, puis écru `#FAF6EE` un temps.

Son padding vertical est porté par le panneau, pas par la `<section>`. Il a
été resserré pendant la période écrue (un écru continu ajoutait 128 px de vide
au rythme de section) et n'a pas bougé depuis.

⚠ **La jonction avec le hero.** Le hero finit sur `#161B2D` : son fondu vers
l'écru (`.hero-fondu-bas`, un calque qui couvrait son dernier tiers) a été
**retiré à la demande**, la section suivante étant désormais sombre. La section
qui suit le hero s'y joint donc sans écart ni séparateur, par deux règles
adossées au voisinage : `main > section:first-of-type + .em.on-dark` (marge à
zéro) et `main > section:first-of-type + .man` (padding à zéro). Dans l'ordre actuel, c'est le mot de la maison qui suit le hero ; si
l'ordre change, la règle de l'aperçu prend le relais. Si
une section **écrue** revient juste après le hero, la cassure nette
réapparaît : le calque de fondu est dans l'historique git.

Trois gestes : la **lettrine** de laiton en tête du premier paragraphe — seul
usage de l'axe `WONK` hors du hero, à 72 px —, le **diptyque** (la seconde
photo posée sur l'angle de la première, cadre de laiton décalé derrière elle)
et la **signature** détachée sous son filet. Le texte est celui de la maison,
repris à la virgule près : la refonte est de mise en page, pas d'écriture.
Le lieu en sur-titre est la constante `LIEU` du composant — le champ `surtitre`
de la clé `accueil-atelier` reste, comme avant, sans effet.

**Au téléphone (≤ 768 px), le texte seul**, à la demande : le diptyque
(`.man-visuels`) est masqué — passé devant la prose, il occupait un écran
entier avant la première ligne. Chargées en différé, les photos n'y sont
pas téléchargées.

**Ses deux photos sont des fichiers statiques du front**, à la demande :
`frontend/public/images/maison/maison-1.webp` et `maison-2.webp`, listés dans
la constante `VISUELS` du composant — plus de requête, ni backend, ni
Cloudinary, ni R2. Pour les changer, remplacer ces fichiers. Elles se
publiaient dans l'Espace Gestion → Contenu du site (« Notre savoir-faire »),
page depuis supprimée :
le bloc, l'API `/atelier-image/` et `/gestion/atelier-image/`, l'admin et le
modèle `AtelierImage` ont été supprimés (migration `0033`, qui efface aussi
les lignes « À propos » et « promotion », que plus rien ne lisait). Les
fichiers d'origine restent dans `backend/media/atelier/`.

**La vitrine** (4), « En vitrine », placée sous « Notre catalogue » à la
demande, est l'ancienne bande de promotion,
devenue **une vitrine sans autre texte que son titre** à la demande : **cinq pièces détourées, entières**, en rangée
sur l'aplat indigo — les deux tenues de femme aux bords (`piece-peche.webp`,
`piece-blanche.webp`), trois tenues d'homme au centre : le bleu et le marron
du troisième tableau du hero, qui les coupe à mi-cuisse
(`promo/homme-bleu.webp`, `catalogue/homme-taupe.webp`), sur mannequins dorés
à tête lisse, et entre eux un boubou blanc brodé à coupe droite
(`promo/boubou-blanc-mince.webp`) — sur un mannequin différent, à visage
sculpté et socle doré. Pour ajouter ou
retirer une pièce : la table `PIECES` en tête du composant, **avec les
dimensions réelles du fichier** — elles bornent la hauteur de la bande. La
rangée se recompose seule (flex, `space-evenly`). Le fichier garde son nom,
`BandePromo.jsx`.

Son **titre**, « En vitrine », est revenu à la demande : il nommait jusque-là
le carrousel de produits (6), renommé « Nos produits ». Il est lu sur la clé
`accueil-promotion`, celle de l'ancienne bande — les deux titres sont dans
`sync_contenu`. Il est **compris dans la hauteur de la bande** : son bloc
prend exactement `--bp-titre`, la rangée occupe ce qui reste dessous, et la
borne de largeur ajoute `--bp-titre` à la hauteur de rangée, sans quoi le
titre se paierait en taille de pièces. `.bp.on-dark` passe le titre en clair
et rend l'indigo du chrome, comme les autres bandes.

Son **fond est uniforme, `#161B2D`**, jusqu'au bord des silhouettes : la
lueur chaude du centre et les ombres portées des pièces ont été retirées à la
demande, pour que la vitrine continue la page d'accueil. Les détourages sont
propres — hors silhouette, l'écart au fond est nul, liseré d'anticrénelage mis
à part (vérifié en amplifiant l'écart ×12) : une tache autour d'une pièce
viendrait du CSS, pas du fichier.

⚠ **La page n'annonce plus aucune promotion.** L'offre est passée de
`FullWidthBanner` (supprimée) au hero, puis du hero à cette bande, qui ne la
porte plus. Une campagne saisie dans l'admin (`HeroPromotion`,
`/hero-promotion/`) ne s'affiche donc **nulle part** : le modèle et l'endpoint
existent toujours côté backend, mais plus rien ne les lit. La mécanique
complète (lecture de l'API, bascule à l'échéance, décompte) se relit dans
l'historique : `git show 5f67b1d:frontend/src/components/BandePromo.jsx`.

La bande a porté tour à tour une photo pleine largeur transférée de
`Redesign_mcommaman.com`, des pièces qui **dérivaient** au défilement (retiré à
la demande), une fausse campagne de démonstration (« Bientôt la Tabaski,
−15 % », retirée — `CAMPAGNE_DEMO` n'existe plus), puis un message d'attente
hors campagne, parti avec le reste du texte.

Pas de photographie de fond, et ce n'est pas un oubli : aucun des 278 clichés
de la maison ne convient. Ce sont des vues de catalogue ; recadrées au format
de la bande, elles coupent les visages à la bouche. Une pièce détourée montre
l'article entier **et** laisse l'aplat libre.

Les deux pièces de femme sont le **même mannequin**, rhabillé par ChatGPT à partir du
premier détourage : même matière dorée, même pose, même éclairage. La
répétition est voulue. Celle de droite n'est **pas retournée** — sa tête est
tournée vers la gauche, donc elle regarde vers le centre de la vitrine.

**Sa hauteur est au maximum** : tout l'écran sous les deux barres collantes
(`--bande-h` + `--nav-h`), bornée par la largeur pour que la rangée entière
tienne dans 90 vw — la somme des ratios des pièces, `--bp-rangee`, calculée
depuis `PIECES`. **Toutes les pièces s'y voient entières, de la coiffe à
l'ourlet**, pieds sur la même ligne de sol, à la hauteur de la bande moins
`--bp-air` (`--s-6`) en haut et en bas. Elles
s'affichent à toutes les largeurs ; sur un téléphone,
cinq silhouettes dans la largeur les rendent petites (~160 px de haut). À cinq
pièces, la rangée est plus large que haute : même en 1 920 × 1 080, c'est la
largeur qui borne la bande — elle n'occupe plus l'écran entier, et les
espaces entre pièces se resserrent. Les
détourages n'ont **aucune** marge transparente en haut : un ancien décalage de
−4 % rognait la tête.

⚠ Le marron fait **900 px** de haut (l'échelle du catalogue), contre ~1 500
pour les autres pièces : à hauteur égale, il est un peu plus doux sur un écran
haute densité. Un original plus grand passé par `outils/exporter_pieces.py`
le réglerait.

⚠ **Même hauteur n'est pas même échelle.** Le premier bleu (catalogue, tête de
cristal) avait été photographié de plus près : à hauteur égale, ~8 % de
carrure en plus que le marron (0,2633 contre 0,2439 de la hauteur du
fichier). Ramené à la même carrure il paraissait trop petit, et cette photo
ne permettait pas les deux. Il a été remplacé par un détourage fourni par la
maison, sur le même type de mannequin que le marron : **0,2446 contre
0,2439**, même échelle à même hauteur, sans correction. Pour une nouvelle
pièce qui détonne : mesurer d'abord (largeur d'épaules à hauteur de fichier
égale) ; le champ `echelle` de `PIECES` corrige une pièce quand aucune
autre photo n'existe.

⚠ **Le boubou blanc du centre a été détouré ici.** Le fichier fourni
(`mince_blanche.png`) n'avait **aucune transparence** : le damier gris et blanc
derrière le mannequin était dessiné dans l'image, comme sur les sites qui
simulent un fond transparent. Le fond a été retiré par la couleur — le damier
est parfaitement neutre (écart entre canaux < 1), le tissu est un blanc bleuté
(234, 238, 253) : tout pixel clair et neutre relié au bord de l'image est du
fond. Si une version avec une vraie couche alpha arrive, la préférer. Il a
remplacé, à la demande, un grand boubou blanc (`blanco.png`) dont les épaules
brodées se lisaient ~17 % plus larges que celles du bleu à même taille de
mannequin.

**Le hero ne dit qu'une chose, et elle ne bouge pas.** Sa parole tient dans la
constante `ACCUEIL` en tête de `Hero.jsx` — « Bienvenue chez Golden Pousso »
et le filet doré. Écrite là et non en base : elle ne
change pas d'une saison à l'autre, et une valeur qui ne bouge jamais n'a pas
besoin d'un formulaire dans l'Espace Gestion.

⚠ **Le bouton « Découvrir la boutique » a été retiré**, à la demande : le
hero n'a plus aucune action — emblème, une ligne, son filet. La boutique se
gagne par la barre de navigation ou par les rayons de « Notre catalogue ».
Sont partis avec lui les clés `lien` / `libelleLien` de `ACCUEIL`, la règle
`.hero-action` et l'import de `Link`.

Il n'y a donc plus ni requête, ni horloge, ni date d'échéance dans ce
composant : il rend la même chose au premier octet et six mois plus tard, et
il ne peut plus rouiller faute d'avoir quoi que ce soit à périmer. Le seul
mouvement qui subsiste est le défilé des tableaux de fond, toutes les six
secondes, coupé si le visiteur demande moins d'animations. Il finit sur
`#161B2D`, sans fondu : voir « La jonction avec le hero », plus haut.

**Au téléphone (≤ 768 px), le hero montre la dame en blanc**, à la demande :
les tableaux, trop larges pour un portrait, y sont masqués, et
`.hero-silhouette` pose `promo/piece-blanche.webp` en pied, centrée, sur un
halo de laiton, fondue dans un voile d'indigo qui monte du bas ; emblème,
titre et filet descendent en bas de page, sur l'indigo franc. C'est un
`<picture>` dont la seule source est réservée au petit écran : l'ordinateur
ne télécharge pas la photo.

Ses tableaux s'affichent **entiers, à leurs proportions** (`object-fit:
contain`), à la demande : en `cover`, dans une page de la pagination plus
basse que l'écran, ils étaient agrandis d'un tiers et amputés d'un quart par
le bas. Composés sur un `#161B2D` exact, ils ne laissent aucune bande visible
sur les côtés. **Le tableau est réduit d'un cran** (`--hero-echelle: 0.92`), à la demande :
il touchait la parole. La parole est bornée à **17 %** de la largeur affichée
du tableau (`--hero-tableau`, réduction comprise) — elle l'était à 22 %.
⚠ Ce qui compte n'est pas la largeur du trou central mais la **colonne libre
centrée sur 50 %**, la seule que la parole occupe : mesurée fichier par
fichier, elle vaut 36,4 % · 34,8 % · 31,0 % · 21,0 % · **20,4 %**. Le tableau
5 commande donc, et 22 % débordaient des deux côtés. Refaire la mesure avant
de toucher à la borne, et à chaque tableau ajouté. Le titre s'y règle aussi
(`--hero-col` / 7,6 : deux lignes, jamais trois), il passe donc de 36 à ~32 px
sur un grand écran. Le tableau est centré dans les deux sens : quand la réserve
du sommaire rend le hero plus étroit que lui, l'indigo se partage entre le
haut et le bas au lieu de laisser une bande vide sous les silhouettes.

### Les cinq rayons sont structurels

`boubous`, `chaussures`, `sacs`, `bijoux`, `cosmetique` existent **toujours**,
dans cet ordre. La grille de `UniversGrid` est bâtie sur
`frontend/src/constants/rayons.js`, pas sur la réponse de `/categories/` :
elle s'affiche complète au premier rendu.

| | source |
|---|---|
| existence, ordre, slug, **photo** | `frontend/src/constants/rayons.js` |
| **nom**, nombre de pièces | base de données (`/categories/`) |

Le propriétaire renomme donc librement un rayon ; il ne peut ni le supprimer
ni changer sa photo. `Category.SLUGS_STRUCTURELS` verrouille la suppression à
trois niveaux — `Model.delete()`, `QuerySet.delete()` (une suppression en
masse ne passe pas par le modèle) et l'admin, qui masque le bouton, retire
l'action groupée, fige le slug et ne propose pas de catégorie parente. Un
rayon de la maison ne se masque pas (le statut « actif » a été retiré) et ne
devient jamais une sous-catégorie : il se renomme, c'est tout.

**Changer la photo d'un rayon** : déposer l'original dans
`backend/media/categories/`, l'ajouter à `RAYONS` dans
`outils/exporter_rayons.py`, relancer le script. Il découpe au ratio exact des
tuiles (1,536) et produit deux largeurs. Aucun `object-position` dans le CSS :
les cinq valeurs réglées à la main ont disparu avec le découpage en amont.

⚠ **`UniversGrid` et `VideoCardsSection` sont hors du système de design,
volontairement.** Ce sont des transferts à l'identique de sections de
`Redesign_mcommaman.com` : palette (rose/ink/stone/gold), police Plus Jakarta
Sans — **sauf la police, passée à Fraunces comme tout le site** —, contenu et
médias de la source, redéclarés en local sur `.uv` et `.em`.
Elles ne lisent aucun token Or & Indigo. Ne pas les « harmoniser » sans demande
explicite.

Exception, à la demande : le **fond** de `UniversGrid` est passé en `#161B2D`
(`.uv.on-dark`, qui bascule aussi le titre et le filet). Ses tuiles détourées
ont ce même indigo (`FOND_RAYON`) et **plus de filet** autour — retiré à la
demande, après avoir valu 1 px à 28 % puis 2 px à 60 % : elles se fondent dans
la section, la grille ne se lit plus que par les pièces et le nom de leur
rayon. Ce nom s'affiche **en texte simple**, écru, laiton clair au survol : la
pastille blanche qui le portait, flèche au survol, a été retirée à la demande.
Les tuiles ont été **allongées** (rang de 340 px au-delà de 1 024 px, 210 à
510 px en dessous) et leur **réserve du bas** — `--uv-sol` (66 px) et
`--uv-sol-large` (80 px) sur `.uv` — relevée : elle valait 44 et 56 px, moins
que la pastille décollée du bord (~51 et ~59 px), et le nom du rayon se posait
sur les pièces. Le nom seul monte à ~36 et ~39 px : la réserve lui laisse de
l'air.

⚠ **`.on-dark` repeint TOUS les titres `<h1>`–`<h4>`** qu'il contient, pas
seulement celui de la section : `.on-dark h3 { color: var(--text-on-dark) }`
l'emporte sur une classe seule. Les noms des rayons, des `<h3>`, avaient viré
à l'écru sur leur pastille blanche, illisibles, du temps où elle existait.
Même vigilance pour tout titre sur fond clair posé à l'intérieur d'une section
`.on-dark`.

**Toute la page d'accueil est sombre**, à la demande : « Le mot de la
maison » (2), « Notre catalogue » (3), « En vitrine » (4), « Aperçu de la
boutique » (5) et « Nos produits » (6) sont toutes en `#161B2D`, comme le hero. Chacune porte son écart en marge au-dessus et son espace intérieur
en haut et en bas ; quand l'une suit directement une autre, l'écart tombe —
`.man + .uv.on-dark`, `.uv + .bp`, `.bp + .em.on-dark`, `.em + .ev.on-dark`
dans l'ordre actuel, et pour les autres voisinages `.man + .em.on-dark`,
`.em.on-dark + .man`, `.man + .ev.on-dark`, `.uv + .em.on-dark`,
`.uv + .ev.on-dark` et `.bp + .ev.on-dark` (aperçu absent, faute de vidéo),
`.ev + .uv.on-dark`, `.ev + .bp` — et
**aucun séparateur** ne marque la jonction : les filets de laiton qui la
dessinaient ont été retirés à la demande, les bandes se fondent. Ces règles sont
adossées au voisinage : un nouvel ordre les réactive ou les éteint seul.
« Aperçu de la boutique » est la seule section transférée à avoir changé de
fond : le reste de son dessin est celui de la source — sauf la disposition
de ses tuiles, à la demande : **toutes sur une ligne**, alignées (une sur
deux descendait de 48 px, par rangées de trois ou quatre), et bornées en
hauteur à la page (`--em-haut-max`, lu sur `--hp-utile`). Quand la section suit le panneau
de « Le mot de la maison », elle s'y joint sans marge (`.man + .uv.on-dark`) :
une marge ouvrirait une bande d'écru entre deux fonds sombres. De même, la
vitrine (`BandePromo`, 4) s'y joint quand elle la suit (`.uv + .bp`) — c'est
le cas dans l'ordre actuel, où elle suit le catalogue, lui-même sous le mot de
la maison.

⚠ **L'aperçu (5) ne rend rien sans vidéo publiée** : sa page disparaît. Une
permutation « avec la section du dessus » doit donc se juger sur ce qui
s'affiche, pas sur l'ordre du fichier.

Conséquences à connaître :
- Leurs liens pointent vers les routes de la source (`/boutique`, `/p/<slug>`)
  et vers des slugs qui n'existent pas ici — ils mènent à la page 404.
- `UniversGrid` n'appelle plus `/categories/` : la grille est statique.
- Les médias transférés pèsent lourd (~12 Mo de vidéo, ~7 Mo de PNG pour les
  tuiles) et ne sont pas optimisés pour une connexion 3G.

**Révélation au défilement** : utiliser `<Reveal>` (`components/Reveal.jsx`) et
`useInView` (`hooks/useInView.js`). Ne pas réécrire d'`IntersectionObserver`
local — il l'était dans quatre fichiers avec quatre seuils différents.

## Fiche produit

`frontend/src/pages/ProduitPage.jsx`. La mise en page vient d'un transfert de
`Redesign_mcommaman.com` (grille 1,05 / 0,95, visuel 4/5, vues en surimpression
sur le bas de la photo). La **palette rose de la source a été retirée** : la
page lit maintenant les tokens Or & Indigo comme le reste du site, plus une
seule couleur en dur. Seule l'ossature reste du transfert.

**La colonne d'achat ne porte aucune information de service.** Son ordre :
rayon (en tête de page) · titre · prix · description ·
couleur · taille · quantité et panier · stock (le cœur est sur la photo). La description est lue tôt,
entre le prix et les choix : on sait ce qu'on achète avant de choisir une
taille.

Elle a porté un temps une carte de trois promesses — prêt-à-porter ou
sur-mesure, moyens de paiement, retouches — retirée à la demande.

⚠ **Aucune information de service n'existe plus avant la validation de
commande.** Les pages `/faq` et `/livraison-retours` ont été supprimées, puis
la carte des promesses avec elles. Frais et délais de livraison, moyens de
paiement, sur-mesure, conditions de retour : rien n'est écrit nulle part sur le
parcours d'achat. Le seul écrit qui subsiste est celui des CGV, dans
`MentionsLegalesPage` — dont les clauses 5 et 6 portent désormais les frais,
délais et procédure de retour en toutes lettres, la page à laquelle elles
renvoyaient n'existant plus.

Si les paniers commencent à être abandonnés au moment de découvrir les frais,
c'est la première chose à remettre : les montants vivent dans
`Order.DELIVERY_FEES`, les moyens de paiement dans `Order.PAYMENT_CHOICES`.

**Le relais WhatsApp du panier.** Sous « Procéder au paiement », le tiroir du
panier porte un second bouton, **« Payer sur WhatsApp »**, à la demande : il
ouvre une conversation avec la maison où **toute la commande est écrite** —
chaque pièce, sa variante, sa quantité, son prix unitaire, son total de ligne,
puis le total général (`messagePanier`, `Navbar.jsx`). C'est le **relais du
paiement en ligne** : si PayDunya ne répond pas (instance endormie, carte
refusée, réseau coupé), le client n'a pas à retaper sa commande et la vente se
finit à la main. Il pèse moins que le bouton de paiement — contour d'écru
contre aplat de laiton, survol écru sur encre 17,05:1 : le paiement en ligne
reste le chemin principal. ⚠ Les montants du message sont **toujours en FCFA**,
jamais dans la devise choisie à l'écran : le panier est stocké en XOF et c'est
en XOF que la maison facture. Le numéro est celui de l'Espace Gestion →
Coordonnées (`useLienWhatsApp`), comme l'icône de la barre.

**Pages d'aide : il n'en reste aucune.** Ni FAQ, ni page livraison. Les seules
pages statiques sont `/mentions-legales` et le suivi de commande. Le support
passe par **l'icône WhatsApp de la barre de navigation** (et l'entrée
« WhatsApp » du menu mobile), pour tous les visiteurs. Elle a été une bulle
flottante posée par le `Layout` (`WhatsAppChat`), retirée à la demande : elle
recouvrait le tiroir du panier.

**La loupe se règle**, à la demande : au survol de la grande photo (pointeur
fin seulement), la **molette** augmente ou diminue le grossissement, et une
commande « − 150 % + » en haut à gauche de la photo fait de même (constante
`LOUPE` : de 125 à 400 %, pas de 25 %, 150 % à l'ouverture ; il était fixé
à 155 %). L'écouteur de molette est posé à la main, non passif — React le
pose en passif et `preventDefault` y serait ignoré. **Au bout de la plage,
la molette rend la main à la page** : tourner vers le bas au plus faible
fait défiler, sans quoi la grande photo bloquerait le défilement. Le niveau
revient à 150 % quand on change de pièce.

**Le prix suit la variante.** `product.price + variant.price_adjustment`, comme
le facture `cartStore` — l'ancien prix décalé d'autant, la remise recalculée
sur les deux nombres affichés. La fiche annonçait `product.price` seul pendant
que le panier réclamait autre chose.

Pas de bouton WhatsApp ici : il a été retiré à la demande, et la barre de
navigation porte déjà l'icône WhatsApp sur toutes les pages.

## Variables d'environnement

**Frontend** (`frontend/.env`) :
```
VITE_API_URL=http://localhost:8000/api/v1
```

**Backend** (`backend/.env`) :
```
SECRET_KEY=...
DEBUG=True
PAYDUNYA_MASTER_KEY=...
PAYDUNYA_PUBLIC_KEY=...
PAYDUNYA_PRIVATE_KEY=...
PAYDUNYA_TOKEN=...
PAYDUNYA_MODE=test
FRONTEND_URL=http://localhost:5174
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
```

En production uniquement (voir `backend/.env.example`) :
```
CLOUDINARY_CLOUD_NAME=...        # images
CLOUDFLARE_R2_ACCOUNT_ID=...     # vidéos — les 5 variables R2 vont ensemble,
CLOUDFLARE_R2_ACCESS_KEY_ID=...  # s'il en manque une, les vidéos retombent
CLOUDFLARE_R2_SECRET_ACCESS_KEY=...  # sur Cloudinary
CLOUDFLARE_R2_BUCKET=...
CLOUDFLARE_R2_PUBLIC_DOMAIN=media.golden-pousso.com
```

Plus aucune vidéo n'est envoyée au serveur (liens Cloudflare uniquement, voir
`ShowcaseVideo`) : `settings.STORAGES['videos']` et
`goldenpousso_backend/video_storage.py` ne servent plus qu'aux anciennes
migrations et à la commande `verifier_r2`.

## Admin Django

URL : `http://localhost:8000/admin/`
Thème Jazzmin — couleur dorée `#C9A84C`
