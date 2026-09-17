import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import BandeCoordonnees from './BandeCoordonnees';
import Navbar from './Navbar';
import Loader from './Loader';

/**
 * Le chrome du site — les barres, montées UNE fois pour tout le site.
 * ---------------------------------------------------------------------------
 * La bande de coordonnées et la barre de navigation sont les mêmes composants
 * depuis toujours, mais elles étaient rendues par DEUX mises en page sœurs :
 * `Layout` (le site) et `GestionLayout` (l'Espace Gestion). Passer de l'une à
 * l'autre démontait donc les barres et les remontait aussitôt — le même
 * composant, mais une autre instance. Ce qui se voyait :
 *
 *   — `--bande-h` et `--nav-h` sont retirées de la racine au démontage et
 *     republiées au montage : pendant une image, la barre se recale en haut ;
 *   — l'état « collée » de la barre (filet, flou) repart de zéro ;
 *   — le tiroir du panier, le menu mobile et les menus de devise se referment,
 *     et les hauteurs se remesurent.
 *
 * ⚠ Elles sont donc posées ICI, au-dessus des deux mises en page, à la
 * demande : une seule instance pour tout le site, qui ne bouge plus quand on
 * passe de `/gestion` à `/`. `Layout` ne porte plus que le `<main>` du site
 * public, `GestionLayout` que son cadre et son sommaire.
 *
 * ── Le `<Suspense>` est ici aussi, et c'est le point ───────────────────────
 * Les pages sont chargées à la demande (`lazy`). S'il vivait au-dessus du
 * chrome, comme avant, le repli remplacerait la page ENTIÈRE — barres
 * comprises — et les démonterait à chaque première visite d'une page. Posé
 * sous les barres, il ne remplace que le contenu : les barres restent.
 *
 * ── Les notifications ──────────────────────────────────────────────────────
 * ⚠ Le `<Toaster>` ne vivait que dans `Layout` : sur les pages de l'Espace
 * Gestion, AUCUN toast ne s'affichait — ni « Compte créé », ni « Coordonnées
 * mises à jour », ni les messages d'erreur du serveur, que le code envoie
 * pourtant depuis toujours. Monté ici, il sert les deux.
 */
const Chrome = () => (
  <>
    <BandeCoordonnees />
    <Navbar />

    <Suspense fallback={<Loader plein={false} />}>
      <Outlet />
    </Suspense>

    {/* En haut a droite, le toast se posait PAR-DESSUS la bande de
        coordonnees et sur la croix de fermeture des tiroirs, dans le coin le
        plus dur a atteindre au pouce — alors que « ajoute au panier » est le
        seul retour visible d'un ajout sur telephone. Il passe en bas au
        doigt, au-dessus de la barre gestuelle. */}
    <Toaster
      position={typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
        ? 'bottom-center' : 'top-right'}
      containerStyle={{ bottom: 'calc(1.6rem + env(safe-area-inset-bottom, 0px))' }}
    />
  </>
);

export default Chrome;
