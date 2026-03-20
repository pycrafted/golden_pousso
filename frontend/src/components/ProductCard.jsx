import { useNavigate } from 'react-router-dom';

const formatFCFA = (price) =>
  new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';

const ProductCard = ({ product, showBadge = true }) => {
  const navigate = useNavigate();

  const discountPercent =
    product.old_price && product.old_price > product.price
      ? Math.round(((product.old_price - product.price) / product.old_price) * 100)
      : null;

  return (
    <div
      className="product"
      onClick={() => navigate(`/produit/${product.slug}`)}
      style={{ cursor: 'pointer', position: 'relative', borderRadius: '1.2rem', overflow: 'hidden' }}
    >
      <div className="top d-flex" style={{ position: 'relative', overflow: 'hidden' }}>
        {product.primary_image ? (
          <img
            src={product.primary_image}
            alt={product.name}
            loading="lazy"
            style={{ transition: 'transform 0.4s ease', width: '100%', display: 'block' }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          />
        ) : (
          <div style={{
            width: '100%', aspectRatio: '1',
            background: 'linear-gradient(135deg, #f5f5f5, #ece9e3)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            color: '#C9A84C',
          }}>
            <i className="bx bx-hive" style={{ fontSize: '4rem', marginBottom: '0.5rem' }}></i>
            <span style={{ fontSize: '1.1rem', color: 'var(--default-color)' }}>Golden Pousso</span>
          </div>
        )}

        {/* Badges */}
        {showBadge && (
          <div style={{ position: 'absolute', top: '1rem', left: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', zIndex: 2 }}>
            {product.is_new && (
              <span style={{
                background: '#C9A84C', color: '#fff',
                padding: '0.3rem 0.9rem', borderRadius: '2rem',
                fontSize: '1rem', fontWeight: 700, letterSpacing: '0.06em',
                boxShadow: '0 2px 8px #C9A84C55',
              }}>NOUVEAU</span>
            )}
            {discountPercent && (
              <span style={{
                background: '#e53935', color: '#fff',
                padding: '0.3rem 0.9rem', borderRadius: '2rem',
                fontSize: '1rem', fontWeight: 700,
                boxShadow: '0 2px 8px #e5393544',
              }}>-{discountPercent}%</span>
            )}
          </div>
        )}

        {/* Rupture de stock */}
        {product.stock === 0 && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3,
          }}>
            <span style={{
              background: '#fff', color: '#333', padding: '0.6rem 1.6rem',
              borderRadius: '2rem', fontSize: '1.2rem', fontWeight: 700, letterSpacing: '0.05em',
            }}>Rupture de stock</span>
          </div>
        )}

        <div className="icon d-flex">
          <i className="bx bxs-heart"></i>
        </div>
      </div>

      <div className="bottom">
        <div className="d-flex">
          <h4 style={{ fontSize: '1.4rem', fontWeight: 600, lineHeight: 1.3 }}>{product.name}</h4>
          <button
            className="btn cart-btn"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/produit/${product.slug}`);
            }}
            style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            Voir
          </button>
        </div>
        <div className="d-flex" style={{ marginTop: '0.4rem' }}>
          <div className="price" style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span style={{ color: '#C9A84C', fontWeight: 700, fontSize: '1.5rem' }}>{formatFCFA(product.price)}</span>
            {product.old_price && (
              <span style={{ textDecoration: 'line-through', color: 'var(--default-color)', fontSize: '1.2rem' }}>
                {formatFCFA(product.old_price)}
              </span>
            )}
          </div>
          <div className="rating">
            <i className="bx bxs-star"></i>
            <i className="bx bxs-star"></i>
            <i className="bx bxs-star"></i>
            <i className="bx bxs-star"></i>
            <i className="bx bxs-star"></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
