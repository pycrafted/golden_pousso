import { Link, useNavigate } from 'react-router-dom';
import useCartStore from '../store/cartStore';
import SEOHead from '../components/SEOHead';
import useSettingsStore, { formatPrice } from '../store/settingsStore';

/* ── Palette ── */
const C = {
  bg:        '#0A0A0A',
  panel:     '#111111',
  border:    '#1E1E1E',
  borderMid: '#2A2A2A',
  gold:      '#D4AF37',
  terra:     '#C2662D',
  cream:     '#F5F0EB',
  muted:     '#8A8A8A',
};

const PanierPage = () => {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();
  const currency = useSettingsStore((s) => s.currency);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal   = items.reduce((s, i) => s + i.price * i.quantity, 0);

  /* ── Panier vide ── */
  if (items.length === 0) {
    return (
      <>
        <SEOHead title="Mon Panier" url="/panier" noindex />
        <div style={{
          background: C.bg, minHeight: '100vh', color: C.cream,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center',
        }}>
          {/* Icône panier vide */}
          <div style={{
            width: '8rem', height: '8rem', borderRadius: '50%',
            background: 'rgba(212,175,55,0.06)',
            border: `1px solid rgba(212,175,55,0.2)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '3rem',
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          </div>
          <p style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.3em', color: C.gold, marginBottom: '1.6rem' }}>
            Golden Pousso
          </p>
          <h2 style={{
            fontFamily: 'Aclonica, serif',
            fontSize: 'clamp(2.8rem, 4vw, 4rem)',
            color: C.cream, letterSpacing: '-0.01em',
            lineHeight: 1.1, marginBottom: '1.6rem',
          }}>
            Votre panier est vide
          </h2>
          <p style={{ fontSize: '1.4rem', fontFamily: 'Inter, sans-serif', color: C.muted, marginBottom: '4.5rem', lineHeight: 1.7, maxWidth: '44rem' }}>
            Découvrez nos créations et ajoutez vos pièces préférées.
          </p>
          <Link
            to="/boutique"
            style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '1.6rem 5rem',
              background: C.gold, color: '#0A0A0A',
              fontSize: '1.1rem', fontFamily: 'Inter, sans-serif',
              fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
              textDecoration: 'none', transition: 'background 0.25s, color 0.25s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = C.terra; e.currentTarget.style.color = C.cream; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = C.gold; e.currentTarget.style.color = '#0A0A0A'; }}
          >
            Explorer la boutique
          </Link>
        </div>
      </>
    );
  }

  /* ── Panier rempli ── */
  return (
    <>
      <SEOHead title="Mon Panier" url="/panier" noindex />

      <div style={{ background: C.bg, minHeight: '100vh', color: C.cream, paddingTop: '10rem', paddingBottom: '10rem' }}>
        <div style={{ maxWidth: '130rem', margin: '0 auto', padding: '0 4rem' }}>

          {/* ── En-tête ── */}
          <div style={{ marginBottom: '5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem' }}>
              <div style={{ width: '4.8rem', height: '1px', background: C.gold }} />
              <p style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.3em', color: C.gold }}>
                Golden Pousso
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.6rem' }}>
              <h1 style={{
                fontFamily: 'Aclonica, serif',
                fontSize: 'clamp(3rem, 4vw, 4.5rem)',
                color: C.cream, letterSpacing: '-0.02em', lineHeight: 1.1,
              }}>
                Mon panier
                <span style={{ fontSize: '2rem', color: C.muted, fontFamily: 'Inter, sans-serif', fontWeight: 400, marginLeft: '1.6rem' }}>
                  ({totalItems} article{totalItems > 1 ? 's' : ''})
                </span>
              </h1>
              <button
                onClick={clearCart}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '1.2rem', fontFamily: 'Inter, sans-serif',
                  textTransform: 'uppercase', letterSpacing: '0.15em',
                  color: C.muted, transition: 'color 0.2s',
                  padding: 0,
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#EF4444'}
                onMouseLeave={(e) => e.currentTarget.style.color = C.muted}
              >
                Vider le panier
              </button>
            </div>
          </div>

          {/* ── Grille : articles + récap ── */}
          <div className="panier-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 38rem', gap: '6rem', alignItems: 'flex-start' }}>

            {/* ══ Liste des articles ══ */}
            <div>
              {/* En-tête colonnes — desktop only */}
              <div className="panier-cols" style={{
                display: 'grid', gridTemplateColumns: '1fr 12rem 14rem 12rem 4rem',
                gap: '1rem', padding: '0 0 1.6rem',
                borderBottom: `1px solid ${C.borderMid}`,
                marginBottom: '0.4rem',
              }}>
                {['Produit', 'Prix', 'Quantité', 'Total', ''].map((h) => (
                  <span key={h} style={{
                    fontSize: '1rem', fontFamily: 'Inter, sans-serif',
                    textTransform: 'uppercase', letterSpacing: '0.2em', color: C.muted,
                    textAlign: h === 'Total' ? 'right' : h === 'Quantité' ? 'center' : h === 'Prix' ? 'center' : 'left',
                  }}>
                    {h}
                  </span>
                ))}
              </div>

              {/* Lignes articles */}
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="panier-row"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 12rem 14rem 12rem 4rem',
                    gap: '1rem',
                    padding: '2.8rem 0',
                    borderBottom: `1px solid ${C.border}`,
                    alignItems: 'center',
                  }}
                >
                  {/* Produit */}
                  <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', minWidth: 0 }}>
                    {/* Miniature */}
                    <div style={{
                      width: '8rem', height: '10rem', flexShrink: 0,
                      background: '#1A1A1A', overflow: 'hidden',
                    }}>
                      {item.product.primary_image ? (
                        <img
                          src={item.product.primary_image}
                          alt={item.product.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '1rem', color: '#333', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'Inter, sans-serif' }}>—</span>
                        </div>
                      )}
                    </div>
                    {/* Nom + variante */}
                    <div style={{ minWidth: 0 }}>
                      <Link
                        to={`/produit/${item.product.slug}`}
                        style={{
                          fontSize: '1.4rem', fontFamily: 'Inter, sans-serif',
                          fontWeight: 500, color: C.cream,
                          textDecoration: 'none', lineHeight: 1.4,
                          display: 'block',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          transition: 'color 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.color = C.gold}
                        onMouseLeave={(e) => e.currentTarget.style.color = C.cream}
                      >
                        {item.product.name}
                      </Link>
                      {item.variant && (
                        <p style={{ fontSize: '1.2rem', fontFamily: 'Inter, sans-serif', color: C.muted, marginTop: '0.4rem' }}>
                          {[item.variant.size, item.variant.color].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Prix unitaire */}
                  <span style={{ textAlign: 'center', fontSize: '1.4rem', fontFamily: 'Inter, sans-serif', color: C.gold }}>
                    {formatPrice(item.price, currency)}
                  </span>

                  {/* Quantité */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem' }}>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.variant?.id ?? null, item.quantity - 1)}
                      style={{
                        width: '3.2rem', height: '3.2rem',
                        background: 'transparent',
                        border: `1px solid ${C.borderMid}`,
                        color: C.muted, cursor: 'pointer',
                        fontSize: '1.6rem', lineHeight: 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'border-color 0.2s, color 0.2s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.borderMid; e.currentTarget.style.color = C.muted; }}
                    >
                      −
                    </button>
                    <span style={{
                      width: '3.2rem', textAlign: 'center',
                      fontSize: '1.5rem', fontFamily: 'Inter, sans-serif',
                      fontWeight: 600, color: C.cream,
                    }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.variant?.id ?? null, item.quantity + 1)}
                      style={{
                        width: '3.2rem', height: '3.2rem',
                        background: 'transparent',
                        border: `1px solid ${C.borderMid}`,
                        color: C.muted, cursor: 'pointer',
                        fontSize: '1.6rem', lineHeight: 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'border-color 0.2s, color 0.2s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.borderMid; e.currentTarget.style.color = C.muted; }}
                    >
                      +
                    </button>
                  </div>

                  {/* Total ligne */}
                  <span style={{ textAlign: 'right', fontSize: '1.5rem', fontFamily: 'Inter, sans-serif', fontWeight: 700, color: C.cream }}>
                    {formatPrice(item.price * item.quantity, currency)}
                  </span>

                  {/* Supprimer */}
                  <button
                    onClick={() => removeItem(item.product.id, item.variant?.id ?? null)}
                    title="Retirer du panier"
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: C.borderMid, padding: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#EF4444'}
                    onMouseLeave={(e) => e.currentTarget.style.color = C.borderMid}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              ))}

              {/* Lien continuer ses achats */}
              <div style={{ marginTop: '3rem' }}>
                <Link
                  to="/boutique"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.8rem',
                    fontSize: '1.2rem', fontFamily: 'Inter, sans-serif',
                    textTransform: 'uppercase', letterSpacing: '0.15em',
                    color: C.muted, textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = C.cream}
                  onMouseLeave={(e) => e.currentTarget.style.color = C.muted}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                  Continuer mes achats
                </Link>
              </div>
            </div>

            {/* ══ Récapitulatif ══ */}
            <div style={{
              background: C.panel,
              border: `1px solid ${C.borderMid}`,
              padding: '3.5rem',
              position: 'sticky', top: '12rem',
            }}>
              {/* Barre décorative top */}
              <div style={{ height: '3px', background: `linear-gradient(to right, ${C.gold}, ${C.terra}, transparent)`, margin: '-3.5rem -3.5rem 3.5rem' }} />

              <h3 style={{
                fontFamily: 'Aclonica, serif', fontSize: '2rem',
                color: C.gold, marginBottom: '3rem', letterSpacing: '0.02em',
              }}>
                Récapitulatif
              </h3>

              {/* Sous-total */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem', marginBottom: '2.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '1.3rem', fontFamily: 'Inter, sans-serif', color: C.muted }}>
                    Sous-total ({totalItems} article{totalItems > 1 ? 's' : ''})
                  </span>
                  <span style={{ fontSize: '1.4rem', fontFamily: 'Inter, sans-serif', color: C.cream }}>
                    {formatPrice(subtotal, currency)}
                  </span>
                </div>

                {/* Livraison — calculée à la commande */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <span style={{ fontSize: '1.3rem', fontFamily: 'Inter, sans-serif', color: C.muted }}>
                    Livraison
                  </span>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '1.3rem', fontFamily: 'Inter, sans-serif', color: C.muted, fontStyle: 'italic' }}>
                      Calculée à la commande
                    </span>
                    <p style={{ fontSize: '1.05rem', fontFamily: 'Inter, sans-serif', color: '#555', marginTop: '0.3rem' }}>
                      À partir de 1 000 FCFA
                    </p>
                  </div>
                </div>
              </div>

              {/* Séparateur */}
              <div style={{ height: '1px', background: C.borderMid, marginBottom: '2.8rem' }} />

              {/* Total */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '3.5rem' }}>
                <span style={{
                  fontSize: '1.2rem', fontFamily: 'Inter, sans-serif',
                  textTransform: 'uppercase', letterSpacing: '0.2em', color: C.muted,
                }}>
                  Total estimé
                </span>
                <span style={{
                  fontFamily: 'Aclonica, serif', fontSize: '2.6rem', color: C.gold,
                }}>
                  {formatPrice(subtotal, currency)}
                </span>
              </div>

              {/* CTA commander */}
              <button
                onClick={() => navigate('/commande')}
                style={{
                  width: '100%', padding: '1.8rem',
                  background: C.gold, color: '#0A0A0A',
                  border: 'none', cursor: 'pointer',
                  fontSize: '1.1rem', fontFamily: 'Inter, sans-serif',
                  fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
                  transition: 'background 0.25s, color 0.25s',
                  marginBottom: '2rem',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = C.terra; e.currentTarget.style.color = C.cream; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = C.gold; e.currentTarget.style.color = '#0A0A0A'; }}
              >
                Passer la commande →
              </button>

              {/* Badges sécurité */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '2rem', flexWrap: 'wrap',
                paddingTop: '2rem', borderTop: `1px solid ${C.border}`,
              }}>
                {[
                  { icon: '🔒', text: 'Paiement sécurisé' },
                  { icon: '📱', text: 'Orange Money · Wave' },
                ].map(({ icon, text }) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                    <span style={{ fontSize: '1.05rem', fontFamily: 'Inter, sans-serif', color: '#555', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      {text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1100px) {
          .panier-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          .panier-cols { display: none !important; }
          .panier-row  {
            grid-template-columns: 1fr auto !important;
            grid-template-rows: auto auto;
            gap: 1.6rem !important;
          }
          .panier-row > *:nth-child(2),
          .panier-row > *:nth-child(3),
          .panier-row > *:nth-child(4) { display: none !important; }
        }
      `}</style>
    </>
  );
};

export default PanierPage;
