import { Children, cloneElement, isValidElement } from 'react';
import useInView from '../hooks/useInView';

/**
 * Révélation au défilement — enveloppe son contenu et le fait entrer quand il
 * arrive à l'écran.
 *
 * @param {'up'|'blur'|'scale'} variant  Nature de l'entrée
 * @param {number} delay                 Retard en ms avant l'entrée
 * @param {number} stagger               Si fourni, les enfants DIRECTS entrent
 *                                       les uns après les autres, espacés de
 *                                       cette durée
 *
 * L'animation ne se déclenche jamais tant que la section n'a pas été vue :
 * sinon la cascade se joue dans le vide pendant que le bloc est hors champ, et
 * le visiteur arrive sur du contenu déjà posé.
 *
 * L'état de départ (`.reveal`, opacité 0) vit en CSS et non en style inline :
 * sinon le contenu s'affiche en clair une fraction de seconde avant que React
 * ne monte l'observateur, et toute la page sursaute.
 *
 * `prefers-reduced-motion` est traité globalement dans styles.css, qui ramène
 * toutes les durées à ~0 — rien à gérer ici.
 */
const Reveal = ({
  children,
  variant = 'up',
  delay = 0,
  stagger,
  className = '',
  style,
  ...rest
}) => {
  const [ref, seen] = useInView();

  const animClass = seen
    ? (stagger ? 'reveal-stagger' : `reveal-${variant}`)
    : 'reveal';

  // Avec `stagger`, chaque enfant reçoit son index dans `--i` ; le CSS en
  // déduit son propre retard. On passe par `cloneElement` : muter l'objet
  // élément à la main casse la réconciliation de React.
  const content = stagger
    ? Children.map(children, (child, i) =>
        isValidElement(child)
          ? cloneElement(child, { style: { ...child.props.style, '--i': i } })
          : child
      )
    : children;

  return (
    <div
      ref={ref}
      className={`${animClass} ${className}`.trim()}
      style={{
        animationDelay: delay ? `${delay}ms` : undefined,
        ...(stagger ? { '--step': `${stagger}ms` } : null),
        ...style,
      }}
      {...rest}
    >
      {content}
    </div>
  );
};

export default Reveal;
