import { useState, useEffect, useCallback } from 'react';

/**
 * `true` dès que l'élément a été vu une fois — l'observateur se débranche
 * ensuite, la révélation ne rejoue pas au défilement inverse.
 * ---------------------------------------------------------------------------
 * Ce hook était réécrit à l'identique dans HomePage, TestimonialsSection
 * et VideoCardsSection, avec quatre seuils et quatre
 * marges différents : les sections n'entraient pas au même moment selon
 * l'endroit d'où le code avait été copié.
 *
 * Ref-callback plutôt que `useRef` : une section peut rendre `null` le temps
 * de charger ses données, donc le nœud DOM n'existe pas au premier rendu. Un
 * `useEffect` à dépendances vides raterait son attachement — ici l'observateur
 * se (ré)attache dès que le nœud apparaît réellement.
 *
 * @param {string} rootMargin  Marge de déclenchement. Par défaut la section
 *                             entre quand son sommet a dépassé 12 % du bas de
 *                             l'écran : elle est déjà lisible quand elle
 *                             s'anime, jamais après coup.
 * @returns {[Function, boolean]} La ref à poser sur le nœud, et l'état vu.
 */
const useInView = (rootMargin = '0px 0px -12% 0px') => {
  const [node, setNode] = useState(null);
  const [seen, setSeen] = useState(false);
  const ref = useCallback((el) => setNode(el), []);

  useEffect(() => {
    if (!node || seen) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          obs.disconnect();
        }
      },
      { rootMargin }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [node, seen, rootMargin]);

  return [ref, seen];
};

export default useInView;
