import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useCartStore from '../store/cartStore';

const formatFCFA = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

const Navbar = ({ onUserIconClick }) => {
  const [navOpen, setNavOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const cartRef = useRef(null);
  const navigate = useNavigate();

  const items = useCartStore((s) => s.items);
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // Fermer mini-panier si clic extérieur
  useEffect(() => {
    const handler = (e) => {
      if (cartRef.current && !cartRef.current.contains(e.target)) setCartOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <nav className="navbar">
      <div className="row container d-flex">
        <div className="logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
          <img src="/images/logo.svg" alt="Golden Pousso" />
        </div>

        <div className={`nav-list d-flex${navOpen ? ' show' : ''}`}>
          <Link to="/" onClick={() => setNavOpen(false)}>Accueil</Link>
          <Link to="/boutique" onClick={() => setNavOpen(false)}>Boutique</Link>
          <Link to="/collections" onClick={() => setNavOpen(false)}>Collections</Link>
          <Link to="/a-propos" onClick={() => setNavOpen(false)}>À Propos</Link>
          <Link to="/contact" onClick={() => setNavOpen(false)}>Contact</Link>
          <div className="close" onClick={() => setNavOpen(false)}>
            <i className="bx bx-x"></i>
          </div>
          <a className="user-link" onClick={onUserIconClick}>Connexion</a>
        </div>

        <div className="icons d-flex">
          <div className="icon d-flex" onClick={() => navigate('/boutique')} style={{ cursor: 'pointer' }}>
            <i className="bx bx-search"></i>
          </div>
          <div className="icon user-icon d-flex" onClick={onUserIconClick}>
            <i className="bx bx-user"></i>
          </div>

          {/* Icône panier avec badge et mini-panier */}
          <div ref={cartRef} style={{ position: 'relative' }}>
            <div
              className="icon d-flex"
              onClick={() => setCartOpen((o) => !o)}
              style={{ cursor: 'pointer' }}
            >
              <i className="bx bx-cart"></i>
              {totalItems > 0 && (
                <span style={{
                  position: 'absolute', top: '0.3rem', right: '0.4rem',
                  background: '#C9A84C', color: '#fff', borderRadius: '50%',
                  width: '1.8rem', height: '1.8rem', fontSize: '1rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, border: 'none',
                }}>
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </div>

            {/* Dropdown mini-panier */}
            {cartOpen && (
              <div style={{
                position: 'absolute', top: '120%', right: 0,
                width: '32rem', background: '#fff', borderRadius: '1.2rem',
                boxShadow: '0 8px 30px rgba(0,0,0,0.15)', zIndex: 1000,
                overflow: 'hidden',
              }}>
                <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid #f0f0f0' }}>
                  <strong style={{ fontSize: '1.6rem' }}>Mon Panier ({totalItems})</strong>
                </div>

                {items.length === 0 ? (
                  <p style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--default-color)', fontSize: '1.4rem' }}>
                    Votre panier est vide
                  </p>
                ) : (
                  <>
                    <div style={{ maxHeight: '28rem', overflowY: 'auto' }}>
                      {items.map((item, idx) => (
                        <div key={idx} style={{
                          display: 'flex', gap: '1.2rem', padding: '1.2rem 2rem',
                          borderBottom: '1px solid #f9f9f9', alignItems: 'center',
                        }}>
                          {item.product.primary_image ? (
                            <img src={item.product.primary_image} alt={item.product.name}
                              style={{ width: '5rem', height: '5rem', objectFit: 'cover', borderRadius: '0.6rem', flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: '5rem', height: '5rem', background: '#f0f0f0', borderRadius: '0.6rem', flexShrink: 0 }} />
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '1.3rem', fontWeight: 500, lineHeight: '1.8rem',
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.product.name}
                            </p>
                            {item.variant && (
                              <p style={{ fontSize: '1.1rem', color: 'var(--default-color)', lineHeight: '1.8rem' }}>
                                {[item.variant.size, item.variant.color].filter(Boolean).join(' · ')}
                              </p>
                            )}
                            <p style={{ fontSize: '1.3rem', color: '#C9A84C', fontWeight: 600, lineHeight: '2rem' }}>
                              {item.quantity} × {formatFCFA(item.price)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid #f0f0f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <strong style={{ fontSize: '1.5rem' }}>Total</strong>
                        <strong style={{ fontSize: '1.5rem', color: '#C9A84C' }}>{formatFCFA(totalPrice)}</strong>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={() => { setCartOpen(false); navigate('/panier'); }}
                          className="btn" style={{ flex: 1, fontSize: '1.3rem', padding: '0.8rem' }}>
                          Voir le panier
                        </button>
                        <button onClick={() => { setCartOpen(false); navigate('/commande'); }}
                          className="btn" style={{ flex: 1, fontSize: '1.3rem', padding: '0.8rem', background: '#C9A84C', color: '#fff' }}>
                          Commander
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="hamburger" onClick={() => setNavOpen(true)}>
          <i className="bx bx-menu-alt-right"></i>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
