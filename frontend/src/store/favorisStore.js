import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Les pièces mises de côté.
 * ---------------------------------------------------------------------------
 * Le cœur des cartes produit n'était qu'un useState : il retombait au premier
 * changement de page. Il s'appuie maintenant sur ce magasin, persisté dans le
 * navigateur comme le panier.
 *
 * ── Ce qui est enregistré, et pourquoi si peu ───────────────────────────────
 * Seulement { id, slug }, pas le produit entier. Un favori se garde des
 * semaines : une copie complète figerait le prix, le stock et la photo au jour
 * du clic, et la page afficherait des mois plus tard un tarif qui n'existe
 * plus. La page /favoris relit donc chaque pièce depuis l'API — ce qui lui
 * permet aussi de repérer celles qui ont quitté le catalogue au lieu de
 * planter dessus.
 *
 * Le panier fait l'inverse, et c'est volontaire : lui doit garder le prix vu
 * au moment de l'ajout, c'est ce sur quoi le client s'est engagé.
 *
 * ⚠ Les favoris vivent dans CE navigateur, pas dans le compte client : ils ne
 * suivent pas d'un téléphone à un ordinateur. Le modèle `Customer` n'a pas de
 * champ pour ça. Le jour où il en aura un, c'est ici que la synchronisation se
 * branche — l'interface n'aura pas à bouger.
 */
const useFavorisStore = create(
  persist(
    (set, get) => ({
      items: [], // [{ id, slug }]

      estAime: (id) => get().items.some((f) => f.id === id),

      basculer: (product) => {
        const { items } = get();
        set(items.some((f) => f.id === product.id)
          ? { items: items.filter((f) => f.id !== product.id) }
          : { items: [...items, { id: product.id, slug: product.slug }] });
      },

      retirer: (id) => set({ items: get().items.filter((f) => f.id !== id) }),

      vider: () => set({ items: [] }),
    }),
    { name: 'gp-favoris-v1' }
  )
);

export default useFavorisStore;
