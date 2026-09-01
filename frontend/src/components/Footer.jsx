/**
 * Pied de page — la mention et rien d'autre.
 * ---------------------------------------------------------------------------
 * Il portait un bouton « Créer un compte », deux colonnes (« À Propos de
 * Nous », « Liens Utiles ») et leurs filets dorés. Tout a été retiré à la
 * demande : il ne reste que la mention de propriété.
 *
 * Ce que ce retrait emporte, à savoir avant d'y revenir :
 * — les seuls liens vers `/mon-compte`, `/commande/suivi` et le service client
 *   WhatsApp qui vivaient là. Le compte et le panier restent dans la barre de
 *   navigation, et la bulle WhatsApp du `Layout` est posée sur toutes les
 *   pages ; le SUIVI DE COMMANDE, lui, n'est plus lié depuis nulle part — la
 *   route `/commande/suivi` existe toujours, il faut en connaître l'adresse ;
 * — le seul texte qui disait où la maison coud (Dakar, atelier de Pikine).
 *
 * Écrit en tokens et non dans la palette locale `C` que le fichier portait :
 * `.on-dark` bascule d'un coup les couleurs de texte et de filet, c'est la
 * façon dont le reste du site traite une surface sombre.
 */
const Footer = () => (
  <footer
    className="on-dark"
    style={{
      /* Même fond que la bande et la barre de navigation : le chrome du site
         est d'un seul ton, l'indigo-900 est réservé au contenu (hero). */
      background: 'var(--surface-chrome)',
      padding: 'var(--s-4) var(--page-pad)',
    }}
  >
    <p style={{
      textAlign: 'center',
      fontFamily: 'var(--font-body)',
      fontSize: 'var(--t-sm)',
      /* La hauteur du pied de page, c'est deux fois le padding plus cette
         ligne. L'interligne de lecture (`--lh-body`, 1,7) ajoutait 16 px de
         blanc autour d'une ligne unique qui n'a rien à aérer. */
      lineHeight: 1.2,
      color: 'var(--text-muted)',
    }}>
      ©2026. Golden Pousso. Tous droits réservés.
    </p>
  </footer>
);

export default Footer;
