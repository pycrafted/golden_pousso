import SEOHead from '../components/SEOHead';

import Hero from '../components/Hero';
import UniversGrid from '../components/home/UniversGrid';
import CategoryGrid from '../components/CategoryGrid';
import VideoCardsSection from '../components/VideoCardsSection';
import BandePromo from '../components/BandePromo';
import AtelierSection from '../components/home/AtelierSection';
import Pagineur from '../components/home/Pagineur';

/* ── Page d'accueil ─────────────────────────────────────────────────────────
   L'ordre suit une progression : on accueille, on DIT QUI L'ON EST, on
   oriente par rayon, on expose (la vitrine, sous le catalogue, à la
   demande), puis on montre la boutique et les créations, sur lesquelles la
   page se referme. Le visiteur sait chez qui il est, puis ce que la maison
   vend, avant de voir les pièces bouger.
   LA PAGE SE PARCOURT SUR LES CÔTÉS, à la demande : chaque section occupe
   une page de la largeur de l'écran, et le document ne défile plus — voir
   components/home/Pagineur.jsx. Les pages portent l'indigo #161B2D, comme le
   hero — tout le site public l'est.
   Chaque section étant seule dans sa page, les règles de jonction des
   composants (« .man + .uv », « .uv + .bp », « .bp + .em », « .em + .ev »)
   dorment : elles reprendraient sans la pagination.

   La SÉLECTION (« Nos plus belles pièces »), qui fermait la page, a été
   SUPPRIMÉE avec les pièces « Vedette » qu'elle affichait : « Vedette » et
   « Nouveauté » ont été retirées du site à la demande. L'historique git la
   garde.

   La section des avis (« Elles Nous Font Confiance ») a été SUPPRIMÉE à la
   demande, avec son composant et les six avis de démonstration qu'elle
   affichait à défaut d'avis réels. L'historique git la garde.

   La bande de coordonnées qui suivait le hero est remontée au-dessus de la
   barre de navigation (`components/BandeCoordonnees.jsx`, posée par le
   `Layout`) : le hero enchaîne donc directement sur le mot de la maison.

   ⚠ LA PAGE N'ANNONCE PLUS AUCUNE PROMOTION. L'offre est passée de
   `FullWidthBanner` (supprimée) au hero, puis du hero à `BandePromo`, devenue
   depuis une vitrine sans texte, à la demande. Une campagne saisie dans
   l'admin ne s'affiche donc nulle part. La mécanique complète se relit dans
   l'historique git : `git show 5f67b1d:frontend/src/components/BandePromo.jsx`.

   ⚠ La rangée de réassurance (livraison, paiement, retouches, WhatsApp) a été
   retirée, et la bande qui portait ses arguments ne porte plus que les
   coordonnées. Délai de livraison et moyens de paiement ne sont annoncés nulle
   part avant le tunnel d'achat. */
const HomePage = () => (
  <>
    <SEOHead url="/" />

    <Pagineur
      pages={[
        /* ── 1. Le seuil ── Sans <h2> : son entrée du sommaire s'appelle
           « Accueil ». */
        { cle: 'seuil', titre: 'Accueil', contenu: <Hero /> },

        /* ── 2. Raconter : qui parle, juste après le seuil ──
           Le seul actif incopiable de la maison, et le seul endroit de la
           page où elle s'exprime en son nom. */
        { cle: 'maison', contenu: <AtelierSection /> },

        /* ── 3. Orienter : la seule entrée par rayon de la page ── */
        { cle: 'catalogue', contenu: <UniversGrid /> },

        /* ── 4. Exposer : la vitrine (« En vitrine ») ──
           Sous le catalogue, à la demande. Cinq pièces détourées sur
           l'indigo, entières, sous leur titre : les deux tenues de femme aux
           bords, trois tenues d'homme au centre. */
        { cle: 'vitrine', contenu: <BandePromo /> },

        /* ── 5. Montrer : l'aperçu de la boutique, les pièces en mouvement ──
           Sans vidéo publiée, la section ne rend rien : sa page disparaît. */
        { cle: 'apercu', contenu: <VideoCardsSection /> },

        /* ── 6. Montrer : les créations (« Nos produits ») — la dernière ── */
        { cle: 'produits', contenu: <CategoryGrid /> },
      ]}
    />
  </>
);

export default HomePage;
