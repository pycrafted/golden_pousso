import { useEffect } from 'react';
import { create } from 'zustand';
import apiClient from '../api/client';
import { COORDONNEES_DEFAUT, lienWhatsApp } from '../constants/contact';

/**
 * Les coordonnées de la boutique — adresse, téléphone, e-mail.
 * ---------------------------------------------------------------------------
 * Elles vivaient dans une constante du frontend. Elles se saisissent
 * maintenant dans l'Espace Gestion (`/gestion/coordonnees`) et la bande qui
 * coiffe toutes les pages les lit ici.
 *
 * ── Pourquoi un store et non un `useEffect` dans la bande ──────────────────
 * Plusieurs lecteurs : la bande, montée sur chaque page ; l'icône WhatsApp de
 * la barre de navigation et l'entrée de son menu mobile (`useLienWhatsApp`) ;
 * les mentions légales ; et le formulaire de gestion, qui doit rafraîchir tout
 * cela dès l'enregistrement — sans quoi l'admin corrige son numéro et continue
 * de lire l'ancien juste au-dessus du formulaire. Le store est leur point
 * commun (`poser`).
 *
 * ── Un seul appel pour toute la visite ─────────────────────────────────────
 * `charger()` est appelé au montage de la bande, donc à chaque changement de
 * page : le drapeau `chargees` et la promesse en cours (`requete`) garantissent
 * qu'un seul aller-retour part, StrictMode compris — qui monte tout deux fois
 * en développement.
 *
 * ── L'échec ne se voit pas ─────────────────────────────────────────────────
 * Pas de toast, pas d'état d'erreur : la bande garde le repli
 * (`COORDONNEES_DEFAUT`), qui sont les valeurs justes dans l'immense majorité
 * des cas — elles ne changent qu'exceptionnellement. Un bandeau d'erreur en
 * tête de site pour une adresse qui n'a pas bougé serait pire que le silence.
 */
let requete = null;

const useCoordonneesStore = create((set, get) => ({
  coordonnees: COORDONNEES_DEFAUT,
  chargees: false,

  charger: () => {
    if (get().chargees) return Promise.resolve();
    if (!requete) {
      requete = apiClient.get('/coordonnees/')
        .then(({ data }) => {
          if (data?.adresse || data?.telephone || data?.email) {
            set({ coordonnees: { ...COORDONNEES_DEFAUT, ...data }, chargees: true });
          }
        })
        .catch(() => { /* on garde le repli, en silence */ })
        .finally(() => { requete = null; });
    }
    return requete;
  },

  /** Après un enregistrement dans l'Espace Gestion : la bande suit aussitôt. */
  poser: (coordonnees) => set({
    coordonnees: { ...COORDONNEES_DEFAUT, ...coordonnees },
    chargees: true,
  }),
}));

export default useCoordonneesStore;

/**
 * Le lien WhatsApp du site, fabriqué à partir du téléphone de la boutique.
 * ---------------------------------------------------------------------------
 * `texte` : le message pré-rempli de la conversation, s'il y en a un.
 *
 * Le hook déclenche lui-même la lecture : l'icône de la barre de navigation
 * est présente sur des pages où la bande ne l'est pas forcément (un futur
 * gabarit sans bande, par exemple), et `charger()` ne part qu'une fois de
 * toute façon.
 */
export const useLienWhatsApp = (texte) => {
  const coordonnees = useCoordonneesStore((s) => s.coordonnees);
  const charger = useCoordonneesStore((s) => s.charger);
  useEffect(() => { charger(); }, [charger]);
  return lienWhatsApp(coordonnees, texte);
};
