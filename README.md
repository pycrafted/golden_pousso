# Golden Pousso — Boutique de Couture Africaine

Site e-commerce full-stack pour **Golden Pousso**, atelier de couture sénégalais basé à Pikine, Dakar.

## Stack technique

| Couche | Technologie |
|--------|------------|
| Frontend | React 19 + Vite, React Router v6, Zustand, Axios |
| Styles | CSS template lc28-fashion-ecommerce + Boxicons |
| SEO/PWA | react-helmet-async, vite-plugin-pwa |
| Backend | Django 5.2 + Django REST Framework |
| Auth | SimpleJWT (access 1j / refresh 30j) |
| Base de données | SQLite (dev) / PostgreSQL (prod) |
| Admin | Django Admin + Jazzmin |
| Fichiers statiques | WhiteNoise |

## Structure du projet

```
golden_pousso/
├── backend/          # Django REST API
│   ├── accounts/     # Authentification (JWT)
│   ├── store/        # Produits, commandes, contact
│   ├── media/        # Images uploadées
│   └── staticfiles/  # Statiques collectés (prod)
└── frontend/         # React + Vite
    ├── public/       # robots.txt, sitemap.xml, icons PWA
    └── src/
        ├── api/      # Axios client
        ├── components/  # Navbar, Footer, SEOHead…
        ├── pages/    # 9 pages
        └── store/    # Zustand (cart, auth)
```

## Installation — Développement

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
cp .env.example .env           # puis éditer .env
python manage.py migrate
python manage.py loaddata store/fixtures/initial_data.json
python manage.py createsuperuser
python manage.py runserver
```

API disponible sur : http://localhost:8000/api/v1/
Admin : http://localhost:8000/admin/

### Frontend

```bash
cd frontend
npm install
# Créer .env.local si besoin :
# VITE_API_URL=http://localhost:8000/api/v1
npm run dev
```

Boutique disponible sur : http://localhost:5173

## Variables d'environnement

### Backend (`backend/.env`)

| Variable | Défaut | Description |
|----------|--------|-------------|
| `SECRET_KEY` | insecure-dev-key | Clé secrète Django |
| `DEBUG` | `True` | Mode debug |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | Hôtes autorisés |
| `DATABASE_URL` | SQLite | URL PostgreSQL prod |
| `CORS_ALLOWED_ORIGINS` | localhost:5173 | Domaines frontend |

### Frontend (`frontend/.env.local`)

| Variable | Défaut | Description |
|----------|--------|-------------|
| `VITE_API_URL` | `http://localhost:8000/api/v1` | URL de l'API |

## API — Endpoints principaux

```
GET  /api/v1/categories/
GET  /api/v1/collections/
GET  /api/v1/products/          ?category=&min_price=&max_price=&search=&ordering=
GET  /api/v1/products/featured/
GET  /api/v1/products/new/
GET  /api/v1/products/:slug/
POST /api/v1/orders/
GET  /api/v1/orders/:order_number/
GET  /api/v1/orders/mes-commandes/  (auth requise)
POST /api/v1/contact/
POST /api/v1/auth/register/
POST /api/v1/auth/login/
GET  /api/v1/auth/me/
PUT  /api/v1/auth/me/
```

## Production

```bash
# Backend
DEBUG=False python manage.py collectstatic
gunicorn goldenpousso_backend.wsgi:application

# Frontend
npm run build   # génère dist/
# Servir dist/ avec Nginx ou déployer sur Vercel/Netlify
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Accueil (produits vedettes, nouveautés, collections) |
| `/boutique` | Catalogue avec filtres sidebar |
| `/produit/:slug` | Fiche produit (galerie, variantes, stock) |
| `/collections` | Collections avec lightbox |
| `/panier` | Panier (Zustand persist) |
| `/commande` | Tunnel de commande 4 étapes |
| `/mon-compte` | Auth JWT + dashboard (profil, commandes, adresses) |
| `/a-propos` | Histoire, valeurs, équipe, timeline |
| `/contact` | Formulaire + carte Google Maps |
