import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'sitemap.xml'],
      manifest: {
        name: 'Golden Pousso',
        short_name: 'Golden Pousso',
        description: 'Atelier de couture africaine haut de gamme — Dakar, Sénégal',
        // Alignés sur la barre du site. Le doré était celui de l'admin
        // Django, et le fond blanc faisait un éclair blanc au lancement
        // avant que l'indigo de la page ne s'affiche.
        theme_color: '#161B2D',
        background_color: '#161B2D',
        display: 'standalone',
        start_url: '/',
        lang: 'fr',
        /* ⚠ LE MANIFESTE NE DÉCLARAIT QU'UN SVG, et Chrome/Android NE S'EN
           SERT PAS pour l'icône d'accueil : il lui faut du PNG en 192 et
           512. C'est pourquoi le téléphone posait une icône générique au
           lieu du logo — et pourquoi l'invitation à installer ne
           s'affichait pas, ces deux tailles étant exigées.

           `maskable` est la version qu'Android rogne lui-même en cercle, en
           goutte ou en carré arrondi selon le lanceur : le logo y est
           rentré pour survivre au découpage. Sans elle, le système pose
           l'icône carrée dans une pastille blanche.

           Les fichiers sont fabriqués depuis public/logo-embleme.png —
           le SEUL des cinq logos du dossier à avoir un vrai canal alpha.
           lologogogo.png et logo-golden-pousso.png ont leur damier de
           fausse transparence PEINT dans l'image (alpha à 255 partout) :
           s'en servir incruste le damier dans l'icône. */
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MiB
        globPatterns: ['**/*.{js,css,html,ico,woff2}'],
        globIgnores: ['**/images/**'],
        /* Les caches des versions precedentes sont effaces a chaque mise a
           jour : sans cela ils s'empilent dans le telephone, et un visiteur
           pouvait se voir servir un fragment d'une ancienne version. */
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            /* ⚠ `collections`, `hero-banner` et `atelier-image` N'EXISTENT
               PLUS (modeles supprimes) : la regle ne couvrait plus que
               products et categories.

               Et surtout, le cache durait VINGT-QUATRE HEURES en
               « stale-while-revalidate » : la proprietaire ajoutait une
               piece depuis son telephone et ne la voyait pas apparaitre.
               Meme chose pour un stock qui tombe a zero, ou un prix
               corrige. Une heure suffit a couvrir une visite ; au-dela, le
               cache ment plus qu'il ne sert. */
            urlPattern: /^https:\/\/.*\/api\/v1\/(products|categories|coordonnees)/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 },
            },
          },
          {
            urlPattern: /^https:\/\/res\.cloudinary\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cloudinary-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /\.(png|jpg|jpeg|webp|svg)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
})
