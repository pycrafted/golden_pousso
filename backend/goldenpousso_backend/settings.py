import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-6+8q847blh%o63o9_#f@1pfhf4+&bzo7+r#h2q-x302^#0&o&w')

DEBUG = os.environ.get('DEBUG', 'True') == 'True'

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

JAZZMIN_SETTINGS = {
    'site_title': 'Golden Pousso Admin',
    'site_header': 'Golden Pousso',
    'site_brand': 'Golden Pousso',
    'welcome_sign': 'Bienvenue dans l\'administration Golden Pousso',
    'copyright': 'Golden Pousso © 2025',
    'search_model': ['store.Product', 'store.Order', 'accounts.Customer'],
    'topmenu_links': [
        {'name': 'Boutique', 'url': 'http://localhost:5173', 'new_window': True},
        {'name': 'API', 'url': '/api/v1/', 'new_window': True},
    ],
    'show_sidebar': True,
    'navigation_expanded': True,
    'hide_apps': [],
    'icons': {
        'store.category': 'fas fa-tags',
        'store.product': 'fas fa-tshirt',
        'store.order': 'fas fa-shopping-bag',
        'store.contactmessage': 'fas fa-envelope',
        'accounts.customer': 'fas fa-users',
    },
    'default_icon_parents': 'fas fa-chevron-circle-right',
    'default_icon_children': 'fas fa-circle',
    'related_modal_active': True,
    'custom_css': None,
    'custom_js': None,
    'use_google_fonts_cdn': True,
    'show_ui_builder': False,
    'changeform_format': 'horizontal_tabs',
    'language_chooser': False,
}

JAZZMIN_UI_TWEAKS = {
    'navbar_small_text': False,
    'footer_small_text': False,
    'body_small_text': False,
    'brand_small_text': False,
    'brand_colour': 'navbar-warning',
    'accent': 'accent-warning',
    'navbar': 'navbar-dark',
    'no_navbar_border': False,
    'navbar_fixed': True,
    'layout_boxed': False,
    'footer_fixed': False,
    'sidebar_fixed': True,
    'sidebar': 'sidebar-dark-warning',
    'sidebar_nav_small_text': False,
    'sidebar_disable_expand': False,
    'sidebar_nav_child_indent': False,
    'sidebar_nav_compact_style': False,
    'sidebar_nav_legacy_style': False,
    'sidebar_nav_flat_style': False,
    'theme': 'default',
    'dark_mode_theme': None,
    'button_classes': {
        'primary': 'btn-primary',
        'secondary': 'btn-secondary',
        'info': 'btn-info',
        'warning': 'btn-warning',
        'danger': 'btn-danger',
        'success': 'btn-success',
    },
}

INSTALLED_APPS = [
    'jazzmin',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third-party
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    # Media storage
    'cloudinary_storage',
    'cloudinary',
    # Local
    'store',
    'accounts',
]

AUTH_USER_MODEL = 'accounts.Customer'

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'goldenpousso_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'goldenpousso_backend.wsgi.application'

# Base de données : SQLite en dev, PostgreSQL en prod (via DATABASE_URL)
if os.environ.get('DATABASE_URL'):
    import dj_database_url
    DATABASES = {
        'default': dj_database_url.config(default=os.environ.get('DATABASE_URL'))
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'Africa/Dakar'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Cloudinary — médias en production
CLOUDINARY_STORAGE = {
    'CLOUD_NAME': os.environ.get('CLOUDINARY_CLOUD_NAME', ''),
    'API_KEY':    os.environ.get('CLOUDINARY_API_KEY', ''),
    'API_SECRET': os.environ.get('CLOUDINARY_API_SECRET', ''),
}

# Cloudflare R2 — hébergement des vidéos (aucun frais de sortie, contrairement à Cloudinary
# où la bande passante vidéo épuise vite le quota). Tant que ces variables ne sont pas
# renseignées, les vidéos suivent le stockage historique : rien ne casse.
R2_ACCOUNT_ID        = os.environ.get('CLOUDFLARE_R2_ACCOUNT_ID', '')
R2_ACCESS_KEY_ID     = os.environ.get('CLOUDFLARE_R2_ACCESS_KEY_ID', '')
R2_SECRET_ACCESS_KEY = os.environ.get('CLOUDFLARE_R2_SECRET_ACCESS_KEY', '')
R2_BUCKET_NAME       = os.environ.get('CLOUDFLARE_R2_BUCKET', '')
# Domaine personnalisé branché sur le bucket (ex. media.goldenpousso.com). L'adresse
# r2.dev de Cloudflare est limitée en débit et réservée aux tests : à ne pas utiliser ici.
R2_PUBLIC_DOMAIN     = os.environ.get('CLOUDFLARE_R2_PUBLIC_DOMAIN', '')

R2_ENABLED = all([
    R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_DOMAIN,
])

# TOUT part sur R2 — images comprises — dès que les cinq variables sont là.
#
# Les images passaient auparavant par Cloudinary, pour ses transformations à la volée.
# Ce n'est plus nécessaire : `store/imaging.py` fabrique les trois largeurs web à
# l'enregistrement, et le frontend déduit les autres du nom de fichier. R2 n'a donc
# rien à transformer, il rend des fichiers.
#
# ⚠ Cloudinary reste le repli en production tant que R2 n'est pas configuré : sans ces
# deux lignes, une variable R2 oubliée ferait écrire les médias sur le disque éphémère
# de Render, qui est effacé à chaque déploiement.
# ⚠ LES IMAGES NE PARTENT SUR R2 QU'EN PRODUCTION, et c'est délibéré.
# En développement elles restent sur le disque : les centaines de fichiers déjà
# présents dans backend/media/ n'existent pas sur le bucket, et router `default`
# vers R2 en local afficherait des images cassées partout. Les VIDÉOS, elles,
# suivent R2 dès qu'il est configuré — c'est le comportement d'origine, et elles
# sont trop lourdes pour le disque local.
if R2_ENABLED and not DEBUG:
    _MEDIA_STORAGE = 'goldenpousso_backend.video_storage.R2MediaStorage'
    _VIDEO_STORAGE = 'goldenpousso_backend.video_storage.R2VideoStorage'
elif R2_ENABLED:
    _MEDIA_STORAGE = 'django.core.files.storage.FileSystemStorage'
    _VIDEO_STORAGE = 'goldenpousso_backend.video_storage.R2VideoStorage'
elif not DEBUG:
    _MEDIA_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
    # Sans R2, Cloudinary exige resource_type='video' : le stockage par défaut du paquet
    # envoie tout en 'image' et rejetterait les MP4.
    _VIDEO_STORAGE = 'cloudinary_storage.storage.VideoMediaCloudinaryStorage'
else:
    _MEDIA_STORAGE = 'django.core.files.storage.FileSystemStorage'
    _VIDEO_STORAGE = 'django.core.files.storage.FileSystemStorage'

STORAGES = {
    'default': {
        'BACKEND': _MEDIA_STORAGE,
    },
    'videos': {
        'BACKEND': _VIDEO_STORAGE,
    },
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedStaticFilesStorage',
    },
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS — dev: tout autoriser, prod: domaine réel via env var
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
else:
    _cors_origins = os.environ.get('CORS_ALLOWED_ORIGINS', '')
    CORS_ALLOWED_ORIGINS = [o.strip() for o in _cors_origins.split(',') if o.strip()]
    CORS_ALLOWED_ORIGIN_REGEXES = [r'^https://golden-pousso[\w-]*\.vercel\.app$']

# Sécurité production (activée si DEBUG=False)
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT = False  # Render gère le SSL en amont
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'

# Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 24,
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '200/day',
        'user': '1000/day',
        'login': '10/min',
        'contact': '5/hour',
    },
    **({} if DEBUG else {
        'DEFAULT_THROTTLE_CLASSES': [
            'rest_framework.throttling.AnonRateThrottle',
            'rest_framework.throttling.UserRateThrottle',
        ],
    }),
}

from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=4),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
}

# PayDunya
PAYDUNYA_MASTER_KEY = os.environ.get('PAYDUNYA_MASTER_KEY', '')
PAYDUNYA_PUBLIC_KEY = os.environ.get('PAYDUNYA_PUBLIC_KEY', '')
PAYDUNYA_PRIVATE_KEY = os.environ.get('PAYDUNYA_PRIVATE_KEY', '')
PAYDUNYA_TOKEN = os.environ.get('PAYDUNYA_TOKEN', '')
PAYDUNYA_MODE = os.environ.get('PAYDUNYA_MODE', 'test')

FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
BACKEND_URL = os.environ.get('BACKEND_URL', 'http://localhost:8000')

# Email — console en dev, SMTP en prod
if DEBUG:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
else:
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
    EMAIL_PORT = int(os.environ.get('EMAIL_PORT', 587))
    EMAIL_USE_TLS = True
    EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
    EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')

DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'Golden Pousso <noreply@goldenpousso.com>')
CONTACT_PHONE = os.environ.get('CONTACT_PHONE', '+221 XX XXX XX XX')
CONTACT_EMAIL = os.environ.get('CONTACT_EMAIL', 'contact@goldenpousso.com')
