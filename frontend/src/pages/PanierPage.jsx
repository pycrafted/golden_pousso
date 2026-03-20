import { Link, useNavigate } from 'react-router-dom';
import useCartStore from '../store/cartStore';

const formatFCFA = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';
const FRAIS_LIVRAISON = 1500;

const PanierPage = () => {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const total = subtotal + (items.length > 0 ? FRAIS_LIVRAISON : 0);

  if (items.length === 0) return (
    <section className="section container" style={{ textAlign: 'center', padding: '8rem 2rem' }}>
      <i className="bx bx-cart" style={{ fontSize: '8rem', color: '#C9A84C', display: 'block', marginBottom: '2rem' }}></i>
      <h2 style={{ marginBottom: '1rem' }}>Votre panier est vide</h2>
      <p style={{ color: 'var(--default-color)', marginBottom: '3rem' }}>
        Découvrez notre boutique et ajoutez des articles à votre panier.
      </p>
      <Link to="/boutique" className="btn" style={{ background: '#C9A84C', color: '#fff' }}>
        Explorer la boutique
      </Link>
    </section>
  );

  return (
    <section className="section">
      <div className="container">
        <div className="title">
          <span>GOLDEN POUSSO</span>
          <h2>Mon Panier ({totalItems} article{totalItems > 1 ? 's' : ''})</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 34rem', gap: '4rem', alignItems: 'flex-start' }}>

          {/* Tableau articles */}
          <div>
            {/* En-tête */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 10rem 12rem 10rem 4rem',
              gap: '1rem', padding: '1.2rem 1.5rem',
              background: '#f9f9f9', borderRadius: '1rem',
              fontSize: '1.4rem', fontWeight: 600, color: 'var(--default-color)',
              marginBottom: '1rem',
            }}>
              <span>Produit</span>
              <span style={{ textAlign: 'center' }}>Prix</span>
              <span style={{ textAlign: 'center' }}>Quantité</span>
              <span style={{ textAlign: 'right' }}>Total</span>
              <span></span>
            </div>

            {/* Lignes */}
            {items.map((item, idx) => (
              <div key={idx} style={{
                display: 'grid', gridTemplateColumns: '1fr 10rem 12rem 10rem 4rem',
                gap: '1rem', padding: '1.5rem', alignItems: 'center',
                borderBottom: '1px solid #f0f0f0',
              }}>
                {/* Produit */}
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  {item.product.primary_image ? (
                    <img src={item.product.primary_image} alt={item.product.name}
                      style={{ width: '7rem', height: '7rem', objectFit: 'cover', borderRadius: '0.8rem', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: '7rem', height: '7rem', background: '#f0f0f0', borderRadius: '0.8rem', flexShrink: 0 }} />
                  )}
                  <div>
                    <Link to={`/produit/${item.product.slug}`} style={{ fontSize: '1.5rem', fontWeight: 500, lineHeight: '2rem' }}>
                      {item.product.name}
                    </Link>
                    {item.variant && (
                      <p style={{ fontSize: '1.2rem', color: 'var(--default-color)', lineHeight: '2rem' }}>
                        {[item.variant.size, item.variant.color].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Prix unitaire */}
                <span style={{ textAlign: 'center', fontSize: '1.4rem', color: '#C9A84C', fontWeight: 600 }}>
                  {formatFCFA(item.price)}
                </span>

                {/* Quantité */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={() => updateQuantity(item.product.id, item.variant?.id ?? null, item.quantity - 1)}
                    style={{ width: '2.8rem', height: '2.8rem', borderRadius: '0.5rem', background: '#f0f0f0', cursor: 'pointer', fontSize: '1.6rem' }}>
                    −
                  </button>
                  <span style={{ width: '3rem', textAlign: 'center', fontSize: '1.5rem', fontWeight: 600 }}>{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product.id, item.variant?.id ?? null, item.quantity + 1)}
                    style={{ width: '2.8rem', height: '2.8rem', borderRadius: '0.5rem', background: '#f0f0f0', cursor: 'pointer', fontSize: '1.6rem' }}>
                    +
                  </button>
                </div>

                {/* Total ligne */}
                <span style={{ textAlign: 'right', fontSize: '1.5rem', fontWeight: 700 }}>
                  {formatFCFA(item.price * item.quantity)}
                </span>

                {/* Supprimer */}
                <button
                  onClick={() => removeItem(item.product.id, item.variant?.id ?? null)}
                  style={{ background: 'none', cursor: 'pointer', color: '#ccc', fontSize: '2rem' }}
                  title="Supprimer">
                  <i className="bx bx-x"></i>
                </button>
              </div>
            ))}

            {/* Actions bas de tableau */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <Link to="/boutique" className="btn" style={{ background: '#f0f0f0', color: 'var(--black-color)' }}>
                <i className="bx bx-arrow-back" style={{ marginRight: '0.5rem' }}></i>
                Continuer mes achats
              </Link>
              <button onClick={clearCart} style={{
                background: 'none', color: 'var(--primary-color)', cursor: 'pointer',
                fontSize: '1.4rem', textDecoration: 'underline',
              }}>
                Vider le panier
              </button>
            </div>
          </div>

          {/* Récapitulatif */}
          <div style={{
            background: '#fff', borderRadius: '1.5rem', padding: '2.5rem',
            boxShadow: 'var(--box-shadow-1)', position: 'sticky', top: '2rem',
          }}>
            <h3 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Récapitulatif</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.5rem' }}>
                <span style={{ color: 'var(--default-color)' }}>Sous-total</span>
                <span>{formatFCFA(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.5rem' }}>
                <span style={{ color: 'var(--default-color)' }}>Livraison estimée</span>
                <span>{formatFCFA(FRAIS_LIVRAISON)}</span>
              </div>
              <div style={{ height: '1px', background: '#f0f0f0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.8rem', fontWeight: 700 }}>
                <span>Total</span>
                <span style={{ color: '#C9A84C' }}>{formatFCFA(total)}</span>
              </div>
            </div>

            <button
              className="btn"
              onClick={() => navigate('/commande')}
              style={{ width: '100%', background: '#C9A84C', color: '#fff', fontSize: '1.6rem', padding: '1.5rem' }}>
              Passer la commande
              <i className="bx bx-right-arrow-alt" style={{ marginLeft: '0.8rem' }}></i>
            </button>

            <p style={{ fontSize: '1.2rem', color: 'var(--default-color)', textAlign: 'center', marginTop: '1.5rem', lineHeight: '2rem' }}>
              <i className="bx bx-lock" style={{ marginRight: '0.4rem' }}></i>
              Paiement sécurisé · Orange Money · Wave · Livraison à domicile
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PanierPage;
