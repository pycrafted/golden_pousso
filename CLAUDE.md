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
| Media | Images : Cloudinary — Vidéos : Cloudflare R2 (prod), local (dev) |
| Paiement | PayDunya |
| Déploiement | Render (backend), Vercel (frontend) |

## API

- Base URL dev : `http://localhost:8000/api/v1/`
- Auth : JWT (access 4h, refresh 7j), header `Authorization: Bearer <token>`
- Pagination : 24 items/page (`?page=N`)
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

- `Product` — prix, stock, featured, new_arrival, variants
  ⚠ Plus de **collection** : le modèle `Collection`, le FK `Product.collection`,
  le filtre `?collection=`, les pages `/collections/:slug` et
  `/gestion/collections` ont été supprimés (migration `0021`). Le catalogue ne
  se range plus que par rayon (`Category`).
- `ProductVariant` — taille, couleur, prix propre
- `Order` — statut, méthode paiement, zone livraison, PayDunya ref
- `Customer` (User) — téléphone (identifiant), adresse, avatar
- `ShowcaseVideo` — séquences de l'« Univers visuel ». `poster` (affiche avant
  lecture) et `product` (pièce présentée) sont **facultatifs** : renseigner
  `product` fait apparaître une carte cliquable photo/nom/prix en pied de
  tuile. Réglables dans `/admin/` ; l'Espace Gestion → Vidéos ne les expose
  pas encore côté formulaire React.
  ⚠ `video` est **obligatoire**, à la création comme dans le modèle : le
  sérialiseur de gestion le déclare facultatif pour qu'une modification de
  titre n'oblige pas à renvoyer le fichier, et son `validate` le réimpose à la
  création. Sans cela une ligne vide s'enregistrait, marquée « Visible », et
  donnait une tuile blanche en page d'accueil. Le champ porte
  `storage=video_storage` comme `Product.video` — sans lui il suivait le
  stockage par défaut, soit le disque local en développement : les vidéos
  marchaient en local et nulle part ailleurs.
  ⚠ **En production, la vidéo se fournit par un LIEN**, pas par un envoi de
  fichier. Le propriétaire dépose dans Cloudflare et colle l'adresse dans
  `video_lien` ; le sérialiseur public la sert en priorité sur le fichier.
  L'envoi classique répondait 502 sans laisser de trace dans les journaux :
  l'instance Render gratuite s'endort au bout de quinze minutes, et son proxy
  ne retient pas des dizaines de mégaoctets le temps du réveil.
  Deux voies subsistent derrière le lien, dans cet ordre : `video_cle` (dépôt
  direct sur R2 par URL signée obtenue de `/gestion/videos/lien-envoi/`, qui
  exige une règle CORS `PUT` sur le bucket) puis l'envoi multipart, qui sert au
  développement. Un lien collé rend les deux sans effet.

## Conventions

- Composants React : PascalCase, fichiers `.jsx`
- API calls : via `client.js` (jamais fetch natif)
- Images prod : `CldImg` (Cloudinary), pas `<img>` direct
- Styles : `styles.css` global (pas Tailwind) — **voir Design system ci-dessous**
- Icônes : Boxicons (`bx-*`)
- Toasts : `react-hot-toast`
- SEO : `<SEOHead>` composant wrappant `react-helmet-async`

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

L'état vide se pose toujours en trois morceaux : constat, phrase, **action**.
Sans la porte de sortie, l'utilisateur n'a que le bouton « retour » du
navigateur.

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

## Page d'accueil

Composée dans `frontend/src/pages/HomePage.jsx`, sections dans
`frontend/src/components/home/`. L'ordre suit une progression : orienter,
montrer, presser, raconter, prouver, ouvrir la conversation.

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
flou), plus de la position. Elle ne porte que l'adresse, le téléphone et l'e-mail,
séparés par des ciseaux, et **ne défile plus** — ses valeurs sont donc
cliquables, ce qu'elles ne pouvaient pas être en mouvement.

| # | Section | Fichier | Fond |
|---|---------|---------|------|
| 1 | Hero | `components/Hero.jsx` | indigo |
| 2 | En mouvement | `components/VideoCardsSection.jsx` | ⚠ voir ci-dessous |
| 3 | Catégories | `home/UniversGrid.jsx` | ⚠ voir ci-dessous — rayons structurels |
| 4 | Nos créations | `components/CategoryGrid.jsx` | écru |
| 5 | La sélection | `HomePage.jsx` (local) | écru |
| 6 | L'atelier | `home/AtelierSection.jsx` | écru |
| 7 | Avis | `components/TestimonialsSection.jsx` | écru |

**La promotion est passée dans le hero.** `FullWidthBanner` — la bande
photo pleine largeur qui portait « Bientôt la Tabaski / −15 % sur les
boubous » au milieu de la page — a été supprimée, son offre reprise par
`components/Hero.jsx`. Le même rabais annoncé deux fois sur une page se lit
comme deux offres différentes. La page ne presse donc plus en son milieu :
elle presse d'entrée.

⚠ **Le hero est daté.** Sa parole vit dans deux constantes en tête de
`Hero.jsx` : `OFFRE` (la campagne) et `PERMANENT` (la promesse de la maison).
`OFFRE.fin` est une date ISO relue toutes les heures ; le jour de l'échéance
passé, le hero bascule seul sur `PERMANENT` — il n'y a rien à débrancher en
urgence. `fin` et `finLisible` doivent dire la même date : l'une est lue par
la machine, l'autre par le client. La Tabaski suit le calendrier lunaire, sa
date se vérifie, elle ne se calcule pas.

Un décompte (« Plus que N jours ») s'ajoute au sur-titre dans les quinze
derniers jours seulement — deux mois à l'avance il ne presse personne.

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
l'action groupée, fige le slug et cache le champ image. Pour retirer un rayon
de l'affichage : décocher **actif**.

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
rayon (en tête de page) · titre · avis · prix · description ·
couleur · taille · quantité, panier, cœur · stock. La description est lue tôt,
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

**Pages d'aide : il n'en reste aucune.** Ni FAQ, ni page livraison. Les seules
pages statiques sont `/mentions-legales` et le suivi de commande. Le support
passe par la bulle WhatsApp du `Layout`.

**Le prix suit la variante.** `product.price + variant.price_adjustment`, comme
le facture `cartStore` — l'ancien prix décalé d'autant, la remise recalculée
sur les deux nombres affichés. La fiche annonçait `product.price` seul pendant
que le panier réclamait autre chose.

Pas de bouton WhatsApp ici : il a été retiré à la demande, et le `Layout` pose
déjà une bulle flottante sur toutes les pages.

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
CLOUDFLARE_R2_PUBLIC_DOMAIN=media.goldenpousso.com
```

Le stockage vidéo est choisi dans `settings.STORAGES['videos']` et branché sur le champ
via `goldenpousso_backend/video_storage.py`. Les images ne passent jamais par R2.

## Admin Django

URL : `http://localhost:8000/admin/`
Thème Jazzmin — couleur dorée `#C9A84C`
