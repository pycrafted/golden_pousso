import { useState, useEffect } from 'react';

/**
 * `true` quand le système est réglé sur « réduire les animations ».
 * ---------------------------------------------------------------------------
 * styles.css neutralise déjà les transitions CSS via `@media
 * (prefers-reduced-motion: reduce)`. Ce hook sert aux comportements que le CSS
 * ne peut pas atteindre — typiquement la lecture automatique des vidéos, qui
 * est du mouvement au même titre qu'une transition et doit se taire aussi.
 *
 * L'écouteur reste branché : le réglage peut changer pendant la session.
 */
const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  );

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
};

export default usePrefersReducedMotion;
