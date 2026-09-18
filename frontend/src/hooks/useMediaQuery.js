import { useEffect, useState } from 'react';

/**
 * Suit une requête média depuis React.
 * ---------------------------------------------------------------------------
 * Le style se règle en CSS, jamais ici : une requête média en JavaScript ne
 * sert qu'à ce que le CSS ne peut pas faire — NE PAS RENDRE un composant.
 * Masqué en CSS (`display: none`), il est monté quand même : ses effets
 * tournent et ses requêtes partent. « Nos produits » lit ainsi TOUT le
 * catalogue, page d'API après page d'API, pour un jeu de cartes que le
 * téléphone n'affiche pas.
 *
 * La valeur de départ est lue en synchrone, avant la première image : lue dans
 * un effet, elle aurait fait afficher puis disparaître les sections.
 *
 * L'écouteur suit les changements — rotation d'un téléphone, fenêtre
 * redimensionnée sur un ordinateur.
 */
export const useMediaQuery = (requete) => {
  const [correspond, setCorrespond] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(requete).matches,
  );

  useEffect(() => {
    const ecran = window.matchMedia(requete);
    const suivre = () => setCorrespond(ecran.matches);
    suivre();
    ecran.addEventListener('change', suivre);
    return () => ecran.removeEventListener('change', suivre);
  }, [requete]);

  return correspond;
};

/** Le seuil « téléphone » du site — celui du hero et du mot de la maison. */
export const ECRAN_TELEPHONE = '(max-width: 768px)';

export const useTelephone = () => useMediaQuery(ECRAN_TELEPHONE);

export default useMediaQuery;
