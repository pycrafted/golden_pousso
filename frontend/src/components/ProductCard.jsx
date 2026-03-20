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
      style={{ cursor: 'pointer' }}
    >
      <div className="top d-flex" style={{ position: 'relative' }}>
        {product.primary_image ? (
          <img src={product.primary_image} alt={product.name} loading="lazy" />
        ) : (
          <div
            style={{
              width: '100%',
              aspectRatio: '1',
              background: 'var(--grey-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '1rem',
              color: 'var(--default-color)',
              fontSize: '1.2rem',
            }}
          >
            <i className="bx bx-image" style={{ fontSize: '3rem' }}></i>
          </div>
        )}

        {showBadge && (
          <div style={{ position: 'absolute', top: '1rem', left: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {product.is_new && (
              <span style={{
                background: '#C9A84C',
                color: '#fff',
                padding: '0.3rem 0.8rem',
                borderRadius: '2rem',
                fontSize: '1rem',
                fontWeight: '700',
                letterSpacing: '0.05em',
              }}>NOUVEAU</span>
            )}
            {discountPercent && (
              <span style={{
                background: 'var(--primary-color)',
                color: '#fff',
                padding: '0.3rem 0.8rem',
                borderRadius: '2rem',
                fontSize: '1rem',
                fontWeight: '700',
              }}>-{discountPercent}%</span>
            )}
          </div>
        )}

        <div className="icon d-flex">
          <i className="bx bxs-heart"></i>
        </div>
      </div>

      <div className="bottom">
        <div className="d-flex">
          <h4 style={{ fontSize: '1.4rem' }}>{product.name}</h4>
          <button
            className="btn cart-btn"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/produit/${product.slug}`);
            }}
          >
            Voir
          </button>
        </div>
        <div className="d-flex">
          <div className="price">
            {formatFCFA(product.price)}
            {product.old_price && (
              <span style={{
                textDecoration: 'line-through',
                color: 'var(--default-color)',
                fontSize: '1.2rem',
                marginLeft: '0.8rem',
              }}>
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
