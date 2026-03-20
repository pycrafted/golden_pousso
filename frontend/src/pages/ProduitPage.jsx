import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import ProductCard from '../components/ProductCard';
import SkeletonCard from '../components/SkeletonCard';
import SEOHead from '../components/SEOHead';
import apiClient from '../api/client';
import useCartStore from '../store/cartStore';

const formatFCFA = (price) => new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';

const ProduitPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const addItem = useCartStore((s) => s.addItem);

  const [product, setProduct] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [zoomOpen, setZoomOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    setSelectedImage(0);
    setSelectedSize('');
    setSelectedColor('');
    setQuantity(1);

    apiClient.get(`/products/${slug}/`)
      .then((r) => {
        setProduct(r.data);
        // Charger produits similaires
        return apiClient.get('/products/', { params: { category: r.data.category.slug } });
      })
      .then((r) => {
        const all = r.data.results ?? r.data;
        setSimilar(all.filter((p) => p.slug !== slug).slice(0, 4));
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <section className="section container">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', marginTop: '2rem' }}>
        <SkeletonCard />
        <div>
          {[80, 60, 40, 90, 50].map((w, i) => (
            <div key={i} style={{
              height: '2rem', background: '#f0f0f0', borderRadius: '0.5rem',
              width: `${w}%`, marginBottom: '1.5rem',
              animation: 'shimmer 1.4s infinite',
            }} />
          ))}
        </div>
      </div>
    </section>
  );

  if (error || !product) return (
    <section className="section container" style={{ textAlign: 'center', padding: '8rem 2rem' }}>
      <i className="bx bx-error-circle" style={{ fontSize: '6rem', color: 'var(--primary-color)', display: 'block', marginBottom: '2rem' }}></i>
      <h2>Produit introuvable</h2>
      <Link to="/boutique" className="btn" style={{ marginTop: '2rem', display: 'inline-block' }}>
        Retour à la boutique
      </Link>
    </section>
  );

  const images = product.images?.length ? product.images : [];
  const currentImage = images[selectedImage];

  const sizes = [...new Set(product.variants?.map((v) => v.size).filter(Boolean))];
  const colors = [...new Set(product.variants?.map((v) => v.color).filter(Boolean))];

  const stockVariant = product.variants?.find(
    (v) => (!selectedSize || v.size === selectedSize) && (!selectedColor || v.color === selectedColor)
  );
  const availableStock = stockVariant?.stock ?? product.stock;

  const stockLabel =
    availableStock === 0 ? { text: 'Rupture de stock', color: 'var(--primary-color)' } :
    availableStock <= 3 ? { text: `Stock limité (${availableStock} restants)`, color: '#e8a000' } :
    { text: 'En stock', color: '#22c55e' };

  const discountPercent =
    product.old_price && product.old_price > product.price
      ? Math.round(((product.old_price - product.price) / product.old_price) * 100)
      : null;

  const handleAddToCart = () => {
    if (sizes.length > 0 && !selectedSize) {
      toast.error('Veuillez choisir une taille');
      return;
    }
    const variant = product.variants?.find(
      (v) => (!selectedSize || v.size === selectedSize) && (!selectedColor || v.color === selectedColor)
    ) ?? null;
    addItem(product, variant, quantity);
    toast.success(`${product.name} ajouté au panier !`);
  };

  const handleBuyNow = () => {
    if (sizes.length > 0 && !selectedSize) {
      toast.error('Veuillez choisir une taille');
      return;
    }
    navigate('/commande');
  };

  return (
    <section className="section">
      <SEOHead
        title={product.name}
        description={product.description ? product.description.slice(0, 155) : undefined}
        image={product.primary_image}
        url={`/produit/${product.slug}`}
        type="product"
      />
      <div className="container">
        {/* Breadcrumb */}
        <nav style={{ fontSize: '1.3rem', color: 'var(--default-color)', marginBottom: '3rem' }}>
          <Link to="/">Accueil</Link> &gt; <Link to="/boutique">Boutique</Link> &gt;{' '}
          <Link to={`/boutique?category=${product.category.slug}`}>{product.category.name}</Link> &gt;{' '}
          <span style={{ color: 'var(--black-color)' }}>{product.name}</span>
        </nav>

        {/* Contenu principal */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem', alignItems: 'flex-start' }}>

          {/* ── Galerie ── */}
          <div>
            {/* Image principale */}
            <div
              onClick={() => images.length && setZoomOpen(true)}
              style={{
                borderRadius: '1.5rem', overflow: 'hidden',
                aspectRatio: '1', background: 'var(--grey-color)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: images.length ? 'zoom-in' : 'default',
                boxShadow: 'var(--box-shadow-1)',
                position: 'relative',
              }}
            >
              {currentImage ? (
                <img src={currentImage.image} alt={currentImage.alt_text || product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <i className="bx bx-image" style={{ fontSize: '6rem', color: '#ccc' }}></i>
              )}
              {images.length > 1 && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); setSelectedImage((i) => (i - 1 + images.length) % images.length); }}
                    style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', color: '#fff', borderRadius: '50%', width: '3.5rem', height: '3.5rem', cursor: 'pointer', fontSize: '1.8rem' }}>
                    <i className="bx bx-chevron-left"></i>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setSelectedImage((i) => (i + 1) % images.length); }}
                    style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.4)', color: '#fff', borderRadius: '50%', width: '3.5rem', height: '3.5rem', cursor: 'pointer', fontSize: '1.8rem' }}>
                    <i className="bx bx-chevron-right"></i>
                  </button>
                </>
              )}
            </div>

            {/* Miniatures */}
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                {images.map((img, i) => (
                  <div key={img.id} onClick={() => setSelectedImage(i)}
                    style={{
                      width: '7rem', height: '7rem', borderRadius: '0.8rem', overflow: 'hidden',
                      border: selectedImage === i ? '2px solid #C9A84C' : '2px solid transparent',
                      cursor: 'pointer', flexShrink: 0,
                    }}>
                    <img src={img.image} alt={img.alt_text} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Infos produit ── */}
          <div>
            {/* Badges */}
            <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1.5rem' }}>
              {product.is_new && (
                <span style={{ background: '#C9A84C', color: '#fff', padding: '0.3rem 1rem', borderRadius: '2rem', fontSize: '1.2rem', fontWeight: 700 }}>NOUVEAU</span>
              )}
              {discountPercent && (
                <span style={{ background: 'var(--primary-color)', color: '#fff', padding: '0.3rem 1rem', borderRadius: '2rem', fontSize: '1.2rem', fontWeight: 700 }}>-{discountPercent}%</span>
              )}
            </div>

            <h1 style={{ fontSize: '2.8rem', marginBottom: '1rem', lineHeight: '1.3' }}>{product.name}</h1>

            <p style={{ color: 'var(--default-color)', fontSize: '1.4rem', marginBottom: '0.5rem' }}>
              Catégorie : <Link to={`/boutique?category=${product.category.slug}`} style={{ color: '#C9A84C' }}>{product.category.name}</Link>
            </p>

            {/* Prix */}
            <div style={{ margin: '2rem 0', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <span style={{ fontSize: '3rem', fontWeight: 700, color: '#C9A84C' }}>{formatFCFA(product.price)}</span>
              {product.old_price && (
                <span style={{ fontSize: '2rem', color: 'var(--default-color)', textDecoration: 'line-through' }}>
                  {formatFCFA(product.old_price)}
                </span>
              )}
            </div>

            {/* Stock */}
            <p style={{ color: stockLabel.color, fontSize: '1.4rem', marginBottom: '2rem', fontWeight: 500 }}>
              <i className="bx bx-circle" style={{ marginRight: '0.5rem' }}></i>
              {stockLabel.text}
            </p>

            {/* Description */}
            <p style={{ color: 'var(--default-color)', lineHeight: '2.8rem', marginBottom: '2.5rem' }}>
              {product.description}
            </p>

            {/* Tailles */}
            {sizes.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '1.6rem', marginBottom: '1rem' }}>Taille</h4>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {sizes.map((size) => {
                    const v = product.variants?.find((v) => v.size === size);
                    const soldOut = v && v.stock === 0;
                    return (
                      <button key={size} onClick={() => !soldOut && setSelectedSize(size)}
                        style={{
                          padding: '0.6rem 1.5rem', borderRadius: '0.5rem', cursor: soldOut ? 'not-allowed' : 'pointer',
                          border: `2px solid ${selectedSize === size ? '#C9A84C' : '#e0e0e0'}`,
                          background: selectedSize === size ? '#C9A84C' : '#fff',
                          color: soldOut ? '#ccc' : selectedSize === size ? '#fff' : 'var(--black-color)',
                          fontSize: '1.4rem', textDecoration: soldOut ? 'line-through' : 'none',
                        }}>
                        {size}
                      </button>
                    );
                  })}
                </div>
                {sizes.length > 0 && !selectedSize && (
                  <p style={{ color: 'var(--primary-color)', fontSize: '1.3rem', marginTop: '0.5rem' }}>
                    Veuillez choisir une taille
                  </p>
                )}
              </div>
            )}

            {/* Couleurs */}
            {colors.length > 0 && (
              <div style={{ marginBottom: '2.5rem' }}>
                <h4 style={{ fontSize: '1.6rem', marginBottom: '1rem' }}>Couleur</h4>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  {colors.map((color) => (
                    <button key={color} onClick={() => setSelectedColor(color)}
                      style={{
                        padding: '0.6rem 1.5rem', borderRadius: '0.5rem', cursor: 'pointer',
                        border: `2px solid ${selectedColor === color ? '#C9A84C' : '#e0e0e0'}`,
                        background: selectedColor === color ? '#C9A84C11' : '#fff',
                        fontSize: '1.4rem',
                      }}>
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantité */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '3rem' }}>
              <h4 style={{ fontSize: '1.6rem' }}>Quantité</h4>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e0e0e0', borderRadius: '0.8rem', overflow: 'hidden' }}>
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  style={{ padding: '0.8rem 1.5rem', cursor: 'pointer', background: 'var(--grey-color)', fontSize: '1.8rem' }}>−</button>
                <span style={{ padding: '0.8rem 2rem', fontSize: '1.6rem', fontWeight: 600 }}>{quantity}</span>
                <button onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
                  style={{ padding: '0.8rem 1.5rem', cursor: 'pointer', background: 'var(--grey-color)', fontSize: '1.8rem' }}>+</button>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              <button className="btn" onClick={handleAddToCart}
                disabled={availableStock === 0}
                style={{ background: '#C9A84C', color: '#fff', flex: 1, minWidth: '16rem', opacity: availableStock === 0 ? 0.5 : 1 }}>
                <i className="bx bx-cart-add" style={{ marginRight: '0.5rem' }}></i>
                Ajouter au panier
              </button>
              <button className="btn" onClick={handleBuyNow}
                disabled={availableStock === 0}
                style={{ flex: 1, minWidth: '16rem', opacity: availableStock === 0 ? 0.5 : 1 }}>
                Acheter maintenant
              </button>
            </div>
          </div>
        </div>

        {/* ── Produits similaires ── */}
        {similar.length > 0 && (
          <div style={{ marginTop: '6rem' }}>
            <div className="title">
              <span>VOUS AIMEREZ AUSSI</span>
              <h2>Produits Similaires</h2>
            </div>
            <div className="products" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem' }}>
              {similar.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>

      {/* ── Zoom modal ── */}
      {zoomOpen && currentImage && (
        <div onClick={() => setZoomOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, cursor: 'zoom-out',
        }}>
          <img src={currentImage.image} alt={currentImage.alt_text}
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '1rem' }} />
          <button onClick={() => setZoomOpen(false)}
            style={{ position: 'fixed', top: '2rem', right: '2rem', background: 'rgba(255,255,255,0.2)', color: '#fff', width: '4rem', height: '4rem', borderRadius: '50%', cursor: 'pointer', fontSize: '2rem' }}>
            <i className="bx bx-x"></i>
          </button>
        </div>
      )}
    </section>
  );
};

export default ProduitPage;
