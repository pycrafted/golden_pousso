# 🏗️ GOLDEN POUSSO — Plan de Développement Claude Code
**Stack :** React (frontend converti depuis lc28-fashion-ecommerce-website) + Django REST Framework (backend)  
**Durée estimée :** 6 à 8 semaines  
**Principe :** Chaque tâche est indépendante, testable, et livrable en 1-2 jours max.

---

## ⚠️ CONVENTIONS POUR CLAUDE CODE

- Chaque tâche commence par lire ce fichier et identifier sa tâche précise
- Chaque tâche se termine par un commit Git avec le numéro de tâche (ex: `feat: TASK-03 catalogue produits`)
- Les variables d'environnement sont dans `.env` (jamais hardcodées)
- Le backend Django expose une **API REST** sur `/api/v1/`
- Le frontend React consomme cette API via `axios` ou `fetch`
- Langue de l'interface : **Français**
- Couleurs de la charte : **or (#C9A84C), noir (#0D0D0D), blanc (#FFFFFF)**

---

## 📦 PHASE 0 — SETUP & ARCHITECTURE
> **Objectif :** Poser les fondations solides avant tout développement fonctionnel.

---

### TASK-01 — Setup Django Backend
**Durée :** 1 jour  
**Priorité :** 🔴 Critique

**Contexte :**  
Créer le projet Django qui servira de backend API pour tout le site Golden Pousso.

**Ce que Claude Code doit faire :**
1. Créer un projet Django nommé `goldenpousso_backend`
2. Installer et configurer : `djangorestframework`, `django-cors-headers`, `python-dotenv`, `Pillow`, `django-filter`
3. Créer l'app principale : `store`
4. Configurer `settings.py` :
   - CORS autorisé pour `http://localhost:5173` (Vite dev server)
   - Base de données : SQLite en dev, PostgreSQL en prod (via variable d'env)
   - Media files pour les images produits (`/media/`)
   - Langue : `fr-FR`, Timezone : `Africa/Dakar`
5. Créer le fichier `.env.example` avec toutes les variables nécessaires
6. Créer `requirements.txt`
7. Lancer les migrations initiales
8. Créer un superuser de test (admin/admin123)

**Structure de dossiers attendue :**
```
backend/
├── goldenpousso_backend/
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── store/
│   ├── models.py
│   ├── views.py
│   ├── serializers.py
│   └── urls.py
├── .env.example
├── manage.py
└── requirements.txt
```

**Critère de validation :** `python manage.py runserver` démarre sans erreur. `http://localhost:8000/api/v1/` retourne un JSON.

---

### TASK-02 — Setup React Frontend (adapter le template)
**Durée :** 1 jour  
**Priorité :** 🔴 Critique

**Contexte :**  
Le template HTML/SCSS `lc28-fashion-ecommerce-website` a déjà été converti en React. Il faut maintenant le connecter à notre backend Django et configurer le routing.

**Ce que Claude Code doit faire :**
1. Installer les dépendances manquantes : `axios`, `react-router-dom`, `zustand` (state management), `react-hot-toast` (notifications)
2. Créer le fichier `src/api/client.js` — instance axios pointant vers `http://localhost:8000/api/v1/`
3. Configurer `react-router-dom` avec les routes suivantes :
   - `/` → Page Accueil
   - `/boutique` → Catalogue produits
   - `/produit/:slug` → Fiche produit
   - `/collections` → Galerie collections
   - `/panier` → Panier
   - `/commande` → Formulaire commande
   - `/mon-compte` → Espace client
   - `/a-propos` → À propos
   - `/contact` → Contact
4. Conserver **exactement** le design visuel du template (couleurs, fonts, layout)
5. Créer un composant `<Layout>` avec Header et Footer du template intégrés
6. Configurer `.env` avec `VITE_API_URL=http://localhost:8000/api/v1`

**Critère de validation :** `npm run dev` démarre. Toutes les routes sont accessibles. Le design du template est intact.

---

## 📦 PHASE 1 — MODÈLES & API DE BASE
> **Objectif :** Créer toute la structure de données et les endpoints REST.

---

### TASK-03 — Modèles Django : Produits & Catalogue
**Durée :** 1 jour  
**Priorité :** 🔴 Critique

**Contexte :**  
Créer les modèles de données pour le catalogue Golden Pousso (4 catégories : Boubous, Chaussures, Sacs, Bijoux).

**Ce que Claude Code doit faire :**

Créer dans `store/models.py` les modèles suivants :

```python
# Catégorie de produit
Category:
  - name (CharField, max 100)
  - slug (SlugField, unique)
  - description (TextField, optionnel)
  - image (ImageField, upload_to='categories/')
  - is_active (BooleanField, default=True)
  - order (IntegerField, default=0)  # pour l'ordre d'affichage

# Collection (ex: "Défilé Été 2025")
Collection:
  - name (CharField)
  - slug (SlugField, unique)
  - description (TextField)
  - cover_image (ImageField, upload_to='collections/')
  - date (DateField)
  - is_featured (BooleanField)
  - is_active (BooleanField)

# Produit
Product:
  - name (CharField)
  - slug (SlugField, unique)
  - category (ForeignKey → Category)
  - collection (ForeignKey → Collection, null=True)
  - description (TextField)
  - price (DecimalField, max_digits=10, decimal_places=0)  # prix en FCFA
  - old_price (DecimalField, null=True)  # pour les promos
  - stock (IntegerField, default=0)
  - is_active (BooleanField)
  - is_featured (BooleanField)  # produit vedette homepage
  - is_new (BooleanField)  # nouveauté
  - created_at (DateTimeField, auto)
  - updated_at (DateTimeField, auto)

# Image produit (galerie multiple)
ProductImage:
  - product (ForeignKey → Product)
  - image (ImageField, upload_to='products/')
  - alt_text (CharField)
  - is_primary (BooleanField)
  - order (IntegerField)

# Variation (taille, couleur)
ProductVariant:
  - product (ForeignKey → Product)
  - size (CharField, null=True)   # ex: S, M, L, XL, 38, 40...
  - color (CharField, null=True)  # ex: Rouge, Bleu...
  - stock (IntegerField)
  - price_adjustment (DecimalField, default=0)
```

**Après les modèles :**
1. Créer et appliquer les migrations
2. Enregistrer tous les modèles dans `admin.py` avec des interfaces admin propres (list_display, search_fields, list_filter)
3. Créer un fichier `fixtures/initial_data.json` avec des données de test (2 catégories, 5 produits fictifs)

**Critère de validation :** L'admin Django `/admin/` affiche tous les modèles. On peut créer un produit avec des images depuis l'admin.

---

### TASK-04 — API REST : Catalogue Produits
**Durée :** 1 jour  
**Priorité :** 🔴 Critique

**Contexte :**  
Exposer les endpoints API que le frontend React va consommer pour afficher les produits.

**Ce que Claude Code doit faire :**

Créer dans `store/serializers.py` et `store/views.py` :

**Endpoints à créer :**

| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/v1/categories/` | Liste des catégories actives |
| GET | `/api/v1/collections/` | Liste des collections |
| GET | `/api/v1/collections/:slug/` | Détail d'une collection |
| GET | `/api/v1/products/` | Liste produits (avec filtres) |
| GET | `/api/v1/products/:slug/` | Détail produit complet |
| GET | `/api/v1/products/featured/` | Produits vedettes (homepage) |
| GET | `/api/v1/products/new/` | Nouveautés |

**Filtres sur `/api/v1/products/` :**
- `?category=boubous`
- `?collection=ete-2025`
- `?min_price=5000&max_price=50000`
- `?search=bazin`
- `?ordering=price` ou `?ordering=-price` (tri prix)
- `?is_featured=true`

**Format de réponse produit (exemple) :**
```json
{
  "id": 1,
  "name": "Grand Boubou Bazin Riche",
  "slug": "grand-boubou-bazin-riche",
  "category": {"name": "Boubous Africains", "slug": "boubous"},
  "price": 45000,
  "old_price": 55000,
  "primary_image": "/media/products/boubou1.jpg",
  "images": [...],
  "variants": [...],
  "is_new": true,
  "is_featured": false,
  "stock": 12
}
```

**Critère de validation :** Tester avec Postman ou curl. Tous les endpoints retournent du JSON valide. Les filtres fonctionnent.

---

## 📦 PHASE 2 — PAGES FRONTEND PRINCIPALES

---

### TASK-05 — Page Accueil (Homepage)
**Durée :** 1-2 jours  
**Priorité :** 🔴 Critique

**Contexte :**  
Adapter la page d'accueil du template React pour afficher des données réelles depuis l'API Django.

**Ce que Claude Code doit faire :**

1. **Hero/Slider** — Garder le slider du template, mais le rendre configurable (images depuis l'admin Django ou hardcodées pour l'instant avec les images du template)

2. **Section Produits Vedettes** — Appeler `/api/v1/products/featured/` et afficher les produits dans les cards du template

3. **Section Nouveautés** — Appeler `/api/v1/products/new/` et afficher les derniers ajouts

4. **Section Collections** — Appeler `/api/v1/collections/` et afficher les collections en grille

5. **Bannière promo** — Texte fixe "La Couture Africaine Autrement" avec CTA vers `/boutique`

**Règles importantes :**
- Afficher un skeleton loader pendant le chargement des données API
- Si l'API est indisponible, afficher un message d'erreur discret (pas de crash)
- Conserver **exactement** le style visuel du template (ne rien changer au CSS)
- Les cards produits doivent être le composant `<ProductCard>` réutilisable

**Composant à créer :**
```jsx
// src/components/ProductCard.jsx
// Props: product (objet complet), showBadge (bool)
// Affiche: image principale, nom, prix (FCFA formaté), badge nouveauté/promo
// Action: clic → navigate vers /produit/:slug
```

**Critère de validation :** La homepage charge et affiche les produits de l'API. Le design du template est préservé à 100%.

---

### TASK-06 — Page Boutique (Catalogue avec filtres)
**Durée :** 1-2 jours  
**Priorité :** 🔴 Critique

**Contexte :**  
Page catalogue complète avec filtrage et tri côté client/serveur.

**Ce que Claude Code doit faire :**

1. **Sidebar filtres** (desktop) / **Drawer filtres** (mobile) :
   - Filtre par catégorie (checkboxes)
   - Filtre par fourchette de prix (slider ou inputs min/max en FCFA)
   - Filtre par couleur (pastilles colorées)
   - Filtre par taille (boutons cliquables)
   - Bouton "Réinitialiser les filtres"

2. **Grille produits** :
   - Afficher les produits depuis `/api/v1/products/` avec les filtres actifs
   - Bouton bascule grille 2 colonnes / 4 colonnes
   - Tri : Prix croissant, Prix décroissant, Nouveautés, Populaires

3. **Pagination** ou **"Charger plus"** (préférer "Charger plus" pour le mobile)

4. **Compteur** : "24 produits trouvés"

5. **État vide** : Message stylisé si aucun produit ne correspond aux filtres

6. **Synchronisation URL** : Les filtres actifs se reflètent dans l'URL (`?category=boubous&min_price=10000`)

**Critère de validation :** On peut filtrer, trier, paginer les produits. Les filtres persistent si on recharge la page.

---

### TASK-07 — Page Fiche Produit
**Durée :** 1-2 jours  
**Priorité :** 🔴 Critique

**Contexte :**  
Page détail d'un produit avec galerie, sélection de variantes et ajout au panier.

**Ce que Claude Code doit faire :**

1. **Galerie photos** :
   - Image principale grande (zoomable au clic)
   - Miniatures cliquables en dessous
   - Navigation gauche/droite entre les images

2. **Informations produit** :
   - Nom du produit (titre H1)
   - Prix en FCFA (formaté : "45 000 FCFA", ancien prix barré si promo)
   - Badge "Nouveau" ou "Promo -X%"
   - Description complète
   - Disponibilité stock ("En stock" / "Stock limité (3 restants)" / "Rupture de stock")

3. **Sélection variantes** :
   - Sélecteur de taille (boutons, griser les tailles épuisées)
   - Sélecteur de couleur (pastilles colorées, croix si épuisée)
   - Afficher le message "Veuillez choisir une taille" si taille non sélectionnée

4. **Sélecteur quantité** (- / nombre / +)

5. **Boutons d'action** :
   - "Ajouter au panier" (bouton principal or)
   - "Acheter maintenant" (redirige direct vers /commande)

6. **Section produits similaires** : 4 produits de la même catégorie (appel `/api/v1/products/?category=xxx`)

**Critère de validation :** On peut sélectionner une taille, une couleur, une quantité et ajouter au panier. La galerie fonctionne.

---

### TASK-08 — Page Collections (Galerie défilés)
**Durée :** 1 jour  
**Priorité :** 🟡 Importante

**Contexte :**  
Page vitrine des collections et défilés Golden Pousso.

**Ce que Claude Code doit faire :**

1. **En-tête page** : Titre "Nos Collections" avec une image de fond élégante

2. **Grille Collections** :
   - Appeler `/api/v1/collections/`
   - Afficher chaque collection avec : image de couverture, nom, date, description courte
   - Au clic → ouvre la collection et filtre la boutique sur cette collection

3. **Section "Collection en Vedette"** : La collection `is_featured=true` s'affiche en grand format en haut

4. **Galerie photos par collection** :
   - Au clic sur une collection, afficher une lightbox/modal avec toutes les photos de la collection
   - Navigation entre les photos

**Critère de validation :** Les collections s'affichent depuis l'API. La lightbox fonctionne.

---

## 📦 PHASE 3 — PANIER & COMMANDE

---

### TASK-09 — Système de Panier (State Management)
**Durée :** 1 jour  
**Priorité :** 🔴 Critique

**Contexte :**  
Le panier est géré côté frontend avec Zustand et persisté dans le localStorage.

**Ce que Claude Code doit faire :**

1. **Store Zustand** `src/store/cartStore.js` :
```javascript
// State:
// - items: [{product, variant, quantity, price}]
// - Dérivés: totalItems, totalPrice

// Actions:
// - addItem(product, variant, quantity)
// - removeItem(productId, variantId)
// - updateQuantity(productId, variantId, quantity)
// - clearCart()
// - getItemCount()
```

2. **Persistance localStorage** : Le panier survit aux rechargements de page

3. **Icône panier dans le Header** : Badge avec le nombre d'articles

4. **Mini-panier (dropdown)** : Au survol/clic de l'icône panier :
   - Liste des articles avec image miniature, nom, prix, quantité
   - Bouton "Voir le panier"
   - Bouton "Commander"
   - Total

5. **Page Panier `/panier`** :
   - Tableau récapitulatif : image, nom, variante, prix unitaire, quantité modifiable, total ligne, bouton supprimer
   - Récapitulatif commande : sous-total, frais de livraison estimés, total
   - Bouton "Continuer mes achats"
   - Bouton "Passer la commande"
   - Si panier vide : illustration et CTA vers la boutique

**Critère de validation :** Ajouter des produits, modifier les quantités, supprimer. Le total se recalcule automatiquement. Le panier persiste après rechargement.

---

### TASK-10 — Modèles Django : Commandes
**Durée :** 1 jour  
**Priorité :** 🔴 Critique

**Contexte :**  
Créer les modèles et l'API pour enregistrer les commandes.

**Ce que Claude Code doit faire :**

Créer dans `store/models.py` :

```python
Order:
  - order_number (CharField, unique, auto-généré ex: "GP-2025-00042")
  - status (CharField, choices: ['pending','confirmed','processing','shipped','delivered','cancelled'])
  - customer_name (CharField)
  - customer_phone (CharField)  # format sénégalais +221xxxxxxxxx
  - customer_email (EmailField, optionnel)
  - delivery_address (TextField)
  - delivery_zone (CharField, choices: ['dakar','thies','pickup'])
  - delivery_fee (DecimalField)
  - subtotal (DecimalField)
  - total (DecimalField)
  - payment_method (CharField, choices: ['orange_money','wave','free_money','cash_on_delivery'])
  - payment_status (CharField, choices: ['pending','paid','failed'])
  - notes (TextField, optionnel)
  - created_at (DateTimeField, auto)
  - updated_at (DateTimeField, auto)

OrderItem:
  - order (ForeignKey → Order)
  - product (ForeignKey → Product)
  - variant (ForeignKey → ProductVariant, null=True)
  - product_name (CharField)  # snapshot du nom au moment de la commande
  - product_price (DecimalField)  # snapshot du prix
  - quantity (IntegerField)
  - line_total (DecimalField)
```

**Endpoints API à créer :**

| Méthode | URL | Description |
|---------|-----|-------------|
| POST | `/api/v1/orders/` | Créer une commande |
| GET | `/api/v1/orders/:order_number/` | Suivre une commande |

**Logique métier :**
- À la création d'une commande, décrémenter le stock des variantes concernées
- Calculer automatiquement les frais de livraison selon la zone :
  - Dakar centre : 1 500 FCFA
  - Dakar banlieue/Pikine : 1 000 FCFA
  - Thiès et environs : 3 000 FCFA
  - Retrait en boutique : Gratuit

**Critère de validation :** POST sur `/api/v1/orders/` avec un panier complet crée une commande en base. Le stock est décrémenté.

---

### TASK-11 — Page Commande (Checkout)
**Durée :** 1-2 jours  
**Priorité :** 🔴 Critique

**Contexte :**  
Formulaire de commande en plusieurs étapes pour finaliser l'achat.

**Ce que Claude Code doit faire :**

**Étape 1 — Livraison :**
- Champ : Nom complet
- Champ : Numéro de téléphone (format sénégalais, validation +221)
- Champ : Email (optionnel)
- Champ : Adresse complète
- Sélecteur zone de livraison (avec affichage dynamique des frais)
- Champ : Notes/instructions (optionnel)

**Étape 2 — Paiement :**
- Choix du mode de paiement (cards avec logo) :
  - 📱 Orange Money
  - 💸 Wave
  - 📲 Free Money
  - 💵 Paiement à la livraison
- Pour les paiements mobile : afficher les instructions (numéro à appeler, montant à envoyer)
- Note : pas d'intégration API de paiement pour l'instant, juste le choix et les instructions

**Étape 3 — Récapitulatif & Confirmation :**
- Tableau récapitulatif de la commande
- Total final avec frais de livraison
- Bouton "Confirmer ma commande" → appel POST `/api/v1/orders/`
- Après succès : redirection vers page de confirmation avec le numéro de commande

**Page confirmation :**
- ✅ "Commande #GP-2025-00042 enregistrée !"
- Instructions de paiement selon le mode choisi
- Bouton "Suivre ma commande"
- Bouton "Continuer mes achats"

**Critère de validation :** On peut passer une commande complète de bout en bout. La commande apparaît dans l'admin Django.

---

## 📦 PHASE 4 — AUTHENTIFICATION & ESPACE CLIENT

---

### TASK-12 — Authentification Django (JWT)
**Durée :** 1 jour  
**Priorité :** 🟡 Importante

**Contexte :**  
Authentification JWT pour que les clients puissent avoir un espace personnel.

**Ce que Claude Code doit faire :**

1. Installer `djangorestframework-simplejwt`
2. Créer un modèle `Customer` qui étend `AbstractUser` :
   - phone (CharField)
   - default_address (TextField, optionnel)
3. Endpoints :
   - `POST /api/v1/auth/register/` — Inscription (nom, téléphone, email, mot de passe)
   - `POST /api/v1/auth/login/` — Connexion → retourne access + refresh tokens
   - `POST /api/v1/auth/refresh/` — Rafraîchir le token
   - `GET /api/v1/auth/me/` — Profil de l'utilisateur connecté
   - `PUT /api/v1/auth/me/` — Modifier le profil
4. Configurer axios côté React pour envoyer automatiquement le token JWT dans les headers
5. Créer un store Zustand `authStore.js` avec :
   - `user`, `token`, `isAuthenticated`
   - Actions: `login()`, `logout()`, `register()`
   - Persistance dans localStorage

**Critère de validation :** On peut s'inscrire, se connecter, et l'API retourne les infos du profil avec le bon token.

---

### TASK-13 — Page Mon Compte & Historique Commandes
**Durée :** 1 jour  
**Priorité :** 🟡 Importante

**Contexte :**  
Espace personnel du client connecté.

**Ce que Claude Code doit faire :**

1. **Guard de route** : Rediriger vers la page de connexion si non authentifié

2. **Page Connexion/Inscription** `/mon-compte/connexion` :
   - Deux onglets : "Se connecter" / "Créer un compte"
   - Formulaires avec validation
   - Gestion des erreurs (mauvais mot de passe, email déjà utilisé)

3. **Dashboard Mon Compte** (accessible si connecté) :
   - Onglet "Mon Profil" : modifier nom, téléphone, email, mot de passe
   - Onglet "Mes Commandes" : liste des commandes avec statut, date, total
   - Au clic sur une commande : détail avec les articles et le statut de livraison
   - Onglet "Mes Adresses" : adresse de livraison par défaut

4. **Lier les commandes au compte** :
   - Si l'utilisateur est connecté quand il commande, lier la commande à son compte
   - Le champ email du checkout pré-rempli avec l'email du compte

**Critère de validation :** Un client connecté voit l'historique de ses commandes.

---

## 📦 PHASE 5 — PAGES STATIQUES & SEO

---

### TASK-14 — Pages Statiques (Contact, À Propos)
**Durée :** 1 jour  
**Priorité :** 🟡 Importante

**Ce que Claude Code doit faire :**

**Page Contact `/contact` :**
- Formulaire : Nom, Email/Téléphone, Sujet, Message
- Bouton envoi → POST `/api/v1/contact/` (créer cet endpoint Django qui envoie un email)
- Afficher l'adresse : "Pikine Tally Boumack, Tableau Gazelle N.2372, Dakar"
- Téléphones : "33 834 10 17 / 78 126 35 35"
- Carte Google Maps intégrée (iframe) pointant sur Pikine
- Liens réseaux sociaux

**Page À Propos `/a-propos` :**
- Histoire de Golden Pousso (texte à rédiger en français, ton élégant)
- Valeurs : Authenticité africaine, Qualité artisanale, Élégance moderne
- Section "Notre équipe" (placeholder avec avatar générique)
- Section "Notre atelier" (photo de l'atelier si disponible, sinon placeholder)

**Endpoint Django à créer :**
- `POST /api/v1/contact/` — Enregistre le message en base et envoie un email à l'admin

**Critère de validation :** Le formulaire de contact envoie les données à l'API. La carte Google Maps s'affiche.

---

### TASK-15 — SEO & Performance
**Durée :** 1 jour  
**Priorité :** 🟢 Secondaire

**Ce que Claude Code doit faire :**

1. Installer `react-helmet-async`
2. Créer un composant `<SEOHead>` utilisé sur chaque page :
   - `<title>` dynamique (ex: "Grand Boubou Bazin | Golden Pousso")
   - `<meta name="description">` descriptif
   - Open Graph tags (pour partage Facebook/WhatsApp)
3. Ajouter des balises alt descriptives sur toutes les images
4. Créer `public/robots.txt` et `public/sitemap.xml` (statique)
5. Optimisation images : s'assurer que les images Django sont servies avec lazy loading côté React (`loading="lazy"`)
6. Ajouter Google Analytics :
   - Créer un composant `<Analytics>` avec le script GA4
   - Variable d'env `VITE_GA_ID` pour l'ID de mesure

**Critère de validation :** Chaque page a un title et une meta description uniques. Les images ont des balises alt.

---

## 📦 PHASE 6 — PWA & FINALISATION

---

### TASK-16 — Progressive Web App (PWA)
**Durée :** 1 jour  
**Priorité :** 🟡 Importante

**Contexte :**  
Permettre aux clients d'installer le site comme une app sur leur téléphone (Android et iOS), sans passer par les stores.

**Ce que Claude Code doit faire :**

1. Installer `vite-plugin-pwa`
2. Configurer `vite.config.js` avec le plugin PWA :
   - `name`: "Golden Pousso"
   - `short_name`: "Golden Pousso"
   - `theme_color`: "#C9A84C" (or de la charte)
   - `background_color`: "#0D0D0D"
   - `display`: "standalone"
   - `start_url`: "/"
3. Créer le fichier `manifest.json` avec toutes les tailles d'icônes (192x192, 512x512)
4. Configurer le Service Worker pour :
   - Mise en cache des assets statiques
   - Mode hors ligne : afficher la page d'accueil même sans connexion
   - Mise en cache du catalogue produits (durée : 1h)
5. Ajouter une bannière "Installer l'application" (prompt natif)
6. Tester l'installation sur Android (Chrome) et iOS (Safari)

**Critère de validation :** Lighthouse PWA score > 90. L'application peut être installée sur Android et iOS.

---

### TASK-17 — Interface d'Administration Django (Améliorée)
**Durée :** 1 jour  
**Priorité :** 🟡 Importante

**Contexte :**  
Améliorer l'admin Django pour que l'équipe Golden Pousso puisse gérer facilement le site sans développeur.

**Ce que Claude Code doit faire :**

1. Installer `django-jazzmin` (thème admin moderne)
2. Configurer Jazzmin avec les couleurs Golden Pousso (or et noir)
3. **Admin Produits** :
   - Afficher inline les images et variantes sur la page produit
   - Action groupée "Activer/Désactiver les produits sélectionnés"
   - Filtre rapide par catégorie et statut stock
   - Champ de recherche sur nom et slug
4. **Admin Commandes** :
   - Vue liste avec : numéro commande, client, total, statut, date
   - Pouvoir changer le statut de la commande depuis la liste (action)
   - Page détail commande : afficher tous les articles commandés
   - Exporter les commandes en CSV (bouton)
5. **Dashboard admin** :
   - Nombre de commandes du jour
   - Chiffre d'affaires du mois
   - Produits en rupture de stock (stock = 0)

**Critère de validation :** L'admin est utilisable par quelqu'un de non-technique. On peut gérer les commandes et produits facilement.

---

### TASK-18 — Tests & Déploiement (Configuration)
**Durée :** 1 jour  
**Priorité :** 🟢 Secondaire

**Ce que Claude Code doit faire :**

1. **Backend Django — configuration prod :**
   - `settings_production.py` avec PostgreSQL, `DEBUG=False`, `ALLOWED_HOSTS`
   - Collecte des fichiers statiques (`collectstatic`)
   - Configuration WhiteNoise pour servir les fichiers statiques
   - Configurer les variables d'env pour Infomaniak

2. **Frontend React — build prod :**
   - `npm run build` → dossier `dist/`
   - Vérifier que toutes les URLs API pointent vers le domaine de prod
   - Variables d'env `.env.production`

3. **Fichier `README.md`** complet avec :
   - Instructions d'installation (backend et frontend)
   - Variables d'environnement nécessaires
   - Commandes utiles
   - Architecture du projet

4. **Tests manuels à effectuer et documenter :**
   - Créer un produit depuis l'admin → il apparaît sur le site
   - Passer une commande complète
   - S'inscrire et consulter l'historique
   - Installer la PWA sur mobile

**Critère de validation :** Le README permet à un autre développeur de lancer le projet en 15 minutes.

---

## 📊 RÉCAPITULATIF DES TÂCHES

| # | Tâche | Durée | Priorité | Phase |
|---|-------|-------|----------|-------|
| TASK-01 | Setup Django Backend | 1j | 🔴 | 0 - Setup |
| TASK-02 | Setup React Frontend | 1j | 🔴 | 0 - Setup |
| TASK-03 | Modèles Django : Produits | 1j | 🔴 | 1 - Modèles |
| TASK-04 | API REST : Catalogue | 1j | 🔴 | 1 - Modèles |
| TASK-05 | Page Accueil | 1-2j | 🔴 | 2 - Frontend |
| TASK-06 | Page Boutique + Filtres | 1-2j | 🔴 | 2 - Frontend |
| TASK-07 | Page Fiche Produit | 1-2j | 🔴 | 2 - Frontend |
| TASK-08 | Page Collections | 1j | 🟡 | 2 - Frontend |
| TASK-09 | Système Panier | 1j | 🔴 | 3 - Commerce |
| TASK-10 | Modèles Django : Commandes | 1j | 🔴 | 3 - Commerce |
| TASK-11 | Page Commande (Checkout) | 1-2j | 🔴 | 3 - Commerce |
| TASK-12 | Authentification JWT | 1j | 🟡 | 4 - Auth |
| TASK-13 | Page Mon Compte | 1j | 🟡 | 4 - Auth |
| TASK-14 | Pages Contact & À Propos | 1j | 🟡 | 5 - Statique |
| TASK-15 | SEO & Performance | 1j | 🟢 | 5 - Statique |
| TASK-16 | PWA | 1j | 🟡 | 6 - Final |
| TASK-17 | Admin Django amélioré | 1j | 🟡 | 6 - Final |
| TASK-18 | Tests & Config déploiement | 1j | 🟢 | 6 - Final |

**Total estimé : 6 à 8 semaines** ✅

---

## 🗺️ ORDRE D'EXÉCUTION RECOMMANDÉ

```
TASK-01 → TASK-02 (setup en parallèle si possible)
    ↓
TASK-03 → TASK-04 (modèles avant l'API)
    ↓
TASK-05 + TASK-06 + TASK-07 (pages principales frontend)
    ↓
TASK-08 (collections)
    ↓
TASK-09 → TASK-10 → TASK-11 (panier et commande, dans cet ordre strict)
    ↓
TASK-12 → TASK-13 (auth avant espace client)
    ↓
TASK-14 + TASK-15 (pages statiques et SEO en parallèle)
    ↓
TASK-16 + TASK-17 (PWA et admin en parallèle)
    ↓
TASK-18 (déploiement en dernier)
```

---

*Document généré pour le projet Golden Pousso — Salon de Couture, Dakar Sénégal*  
*Stack : React + Django REST Framework | Décembre 2025*