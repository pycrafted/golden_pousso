import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: { react },
    settings: { react: { version: 'detect' } },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      /* La regle no-undef NE VOIT PAS les composants JSX. Pour l'analyseur,
         un <Navbar /> n'est pas une reference de variable mais un
         JSXIdentifier — un noeud d'un autre type, qu'elle ignore. Un
         composant oublie dans les imports passait donc le lint sans un mot,
         puis jetait un ReferenceError au rendu : faute d'ErrorBoundary,
         React demonte tout l'arbre et le visiteur voit un ECRAN BLANC.

         C'est ce qui est arrive a la page de suivi de commande — celle vers
         laquelle PayDunya renvoie le client apres paiement. Seul le chemin
         nominal etait touche, donc le bug ne se voyait qu'en allant au bout
         d'un vrai paiement. Verifie : le build passait au vert.

         Ne pas retirer cette regle. */
      'react/jsx-no-undef': 'error',
      'react/jsx-uses-vars': 'error',
    },
  },
])
