import { lazy } from 'react';

/**
 * `lazy()` qui survit à une mise en ligne.
 * ---------------------------------------------------------------------------
 * Chaque page est un fichier à part, dont le nom change à chaque build
 * (`BoutiquePage-Dp2BMCyH.js`). Un visiteur dont l'onglet — ou le service
 * worker — a gardé l'ANCIENNE page principale réclame donc, en changeant de
 * page, un fichier qui n'existe plus : 404, `lazy()` échoue, et l'écran reste
 * blanc jusqu'à ce qu'il actualise lui-même.
 *
 * Ici, l'échec recharge la page une fois : le navigateur reprend la page
 * principale à jour, qui connaît les nouveaux noms. Le drapeau en
 * sessionStorage empêche une boucle si le fichier manque pour une autre
 * raison (serveur en panne) : la seconde fois, l'erreur remonte normalement.
 */
const CLE = 'gp-recharge-apres-mise-en-ligne';

export default function lazyRecharge(importer) {
  return lazy(() =>
    importer()
      .then((module) => {
        sessionStorage.removeItem(CLE);
        return module;
      })
      .catch((erreur) => {
        if (!sessionStorage.getItem(CLE)) {
          sessionStorage.setItem(CLE, '1');
          window.location.reload();
          // Rien à afficher pendant le rechargement : on ne rend pas l'erreur.
          return new Promise(() => {});
        }
        throw erreur;
      }),
  );
}
