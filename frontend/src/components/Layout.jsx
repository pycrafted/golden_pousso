import { Outlet } from 'react-router-dom';

/* La mise en page du SITE PUBLIC — rien que son <main>.
   ---------------------------------------------------------------------------
   La bande de coordonnées, la barre de navigation et les notifications sont
   montées au-dessus, dans `Chrome`, pour tout le site : elles étaient ici ET
   dans `GestionLayout`, donc démontées puis remontées à chaque passage de
   l'un à l'autre.

   Plus de bulle WhatsApp flottante (`WhatsAppChat`), à la demande : posée en
   bas à droite de toutes les pages, elle recouvrait le tiroir du panier — son
   sous-total et son bouton de paiement. Le lien WhatsApp est désormais une
   icône de la barre de navigation, et une entrée du menu mobile (Navbar).

   Plus de pied de page non plus, à la demande — voir CLAUDE.md. */
function Layout() {
  return (
    /* Tout le site public sur l'indigo #161B2D — voir « .site-page » dans
       styles.css. La bande et la barre restent hors de <main>. */
    <main className="site-page on-dark">
      <Outlet />
    </main>
  );
}

export default Layout;
