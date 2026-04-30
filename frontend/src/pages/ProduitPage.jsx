import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import SkeletonCard from '../components/SkeletonCard';
import SEOHead from '../components/SEOHead';
import apiClient from '../api/client';
import useCartStore from '../store/cartStore';

const formatFCFA = (price) => new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
const toEUR = (fcfa) => Math.round(fcfa / 655.957);

/* ── Boutons de partage ── */
const ShareButtons = ({ product }) => {
  const [copied, setCopied] = useState(false);
  const url = window.location.href;
  const text = `${product.name} — ${new Intl.NumberFormat('fr-FR').format(product.price)} FCFA sur Golden Pousso`;

  const shareWhatsApp = () => window.open(`https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`, '_blank');
  const shareFacebook = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  const copyLink = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const btnBase = {
    display: 'flex', alignItems: 'center', gap: '0.6rem',
    padding: '0.8rem 1.6rem',
    border: '1px solid #2A2A2A', borderRadius: '2px',
    background: 'transparent', cursor: 'pointer',
    fontSize: '1.2rem', fontFamily: 'Inter, sans-serif',
    letterSpacing: '0.08em', transition: 'border-color 0.2s, color 0.2s',
  };

  return (
    <div style={{ marginTop: '3rem', paddingTop: '2.4rem', borderTop: '1px solid #2A2A2A', display: 'flex', alignItems: 'center', gap: '1.2rem', flexWrap: 'wrap' }}>
      <span style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#7A6A50' }}>
        Partager
      </span>
      <button onClick={shareWhatsApp} style={{ ...btnBase, color: '#25D366' }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#25D366'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = '#CEC0A0'}
      >
        <i className="bx bxl-whatsapp" style={{ fontSize: '1.7rem' }}></i> WhatsApp
      </button>
      <button onClick={shareFacebook} style={{ ...btnBase, color: '#1877F2' }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#1877F2'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = '#CEC0A0'}
      >
        <i className="bx bxl-facebook" style={{ fontSize: '1.7rem' }}></i> Facebook
      </button>
      <button onClick={copyLink} style={{ ...btnBase, color: copied ? '#22c55e' : '#7A6A50', borderColor: copied ? '#22c55e' : '#CEC0A0' }}>
        <i className={`bx ${copied ? 'bx-check' : 'bx-link'}`} style={{ fontSize: '1.7rem' }}></i>
        {copied ? 'Copié !' : 'Copier'}
      </button>
    </div>
  );
};

/* ── PLPCard (produits similaires) ── */
const SimilarCard = ({ product }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const outOfStock = product.stock === 0;

  return (
    <div
      onClick={() => !outOfStock && navigate(`/produit/${product.slug}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: outOfStock ? 'default' : 'pointer',
        opacity: outOfStock ? 0.55 : 1,
        transform: hovered && !outOfStock ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'transform 0.3s ease',
      }}
    >
      <div style={{ position: 'relative', aspectRatio: '3/4', overflow: 'hidden', marginBottom: '1.6rem', background: '#E8DCC8', borderRadius: '2px' }}>
        {product.primary_image ? (
          <img src={product.primary_image} alt={product.name} loading="lazy"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
              opacity: hovered && product.secondary_image ? 0 : 1,
              transform: hovered && !product.secondary_image ? 'scale(1.08)' : 'scale(1)',
              transition: 'opacity 0.7s ease, transform 0.7s ease' }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '1.1rem', color: '#7A6A50', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Photo bientôt</span>
          </div>
        )}
        {product.secondary_image && (
          <img src={product.secondary_image} alt={product.name} loading="lazy"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: hovered ? 1 : 0, transition: 'opacity 0.7s ease' }} />
        )}
      </div>
      <h3 style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.4rem', fontWeight: 500, color: '#1A1208', marginBottom: '0.4rem' }}>{product.name}</h3>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '1.3rem', color: '#B8960A' }}>
        {formatFCFA(product.price)}
        <span style={{ color: '#7A6A50', marginLeft: '0.4rem' }}>| {toEUR(product.price)} €</span>
      </p>
    </div>
  );
};

/* ── Page principale ── */
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
    <div style={{ background: '#FAF6EE', minHeight: '100vh', padding: '16rem 4rem 8rem' }}>
      <div style={{ maxWidth: '120rem', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6rem' }}>
        <SkeletonCard />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingTop: '2rem' }}>
          {[70, 45, 30, 80, 55].map((w, i) => (
            <div key={i} style={{ height: '2rem', background: '#E8DCC8', borderRadius: '2px', width: `${w}%`, animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:.3} 50%{opacity:.7} }`}</style>
    </div>
  );

  if (error || !product) return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', textAlign: 'center' }}>
      <div>
        <p style={{ fontSize: '4rem', marginBottom: '2rem', color: '#B8960A' }}>✕</p>
        <h2 style={{ fontFamily: 'Aclonica, serif', fontSize: '2.8rem', color: '#1A1208', marginBottom: '1.2rem' }}>Produit introuvable</h2>
        <Link to="/boutique" style={{ fontSize: '1.2rem', fontFamily: 'Inter, sans-serif', color: '#B8960A', textDecoration: 'none', borderBottom: '1px solid #D4AF37', paddingBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
          Retour à la boutique
        </Link>
      </div>
    </div>
  );

  const images = product.images?.length ? product.images : [];
  const currentImage = images[selectedImage];
  const sizes = [...new Set(product.variants?.map((v) => v.size).filter(Boolean))];
  const colors = [...new Set(product.variants?.map((v) => v.color).filter(Boolean))];
  const stockVariant = product.variants?.find(
    (v) => (!selectedSize || v.size === selectedSize) && (!selectedColor || v.color === selectedColor)
  );
  const availableStock = stockVariant?.stock ?? product.stock;
  const outOfStock = availableStock === 0;
  const discountPercent = product.old_price && product.old_price > product.price
    ? Math.round(((product.old_price - product.price) / product.old_price) * 100)
    : null;

  const handleAddToCart = () => {
    if (sizes.length > 0 && !selectedSize) { toast.error('Veuillez choisir une taille'); return; }
    const variant = product.variants?.find(
      (v) => (!selectedSize || v.size === selectedSize) && (!selectedColor || v.color === selectedColor)
    ) ?? null;
    addItem(product, variant, quantity);
    toast.success(`${product.name} ajouté au panier !`);
  };

  const handleBuyNow = () => {
    if (sizes.length > 0 && !selectedSize) { toast.error('Veuillez choisir une taille'); return; }
    const variant = product.variants?.find(
      (v) => (!selectedSize || v.size === selectedSize) && (!selectedColor || v.color === selectedColor)
    ) ?? null;
    addItem(product, variant, quantity);
    navigate('/commande');
  };

  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh', color: '#1A1208', paddingTop: '10rem', paddingBottom: '10rem' }}>
      <SEOHead
        title={product.name}
        description={product.description ? product.description.slice(0, 155) : undefined}
        image={product.primary_image}
        url={`/produit/${product.slug}`}
        type="product"
      />

      <div style={{ maxWidth: '120rem', margin: '0 auto', padding: '0 4rem' }}>



        {/* ── Contenu principal ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8rem', alignItems: 'flex-start' }} className="produit-grid">

          {/* ── Galerie ── */}
          <div>
            {/* Image principale */}
            <div
              onClick={() => images.length && setZoomOpen(true)}
              style={{
                aspectRatio: '3/4', overflow: 'hidden',
                background: '#E8DCC8', borderRadius: '2px',
                cursor: images.length ? 'zoom-in' : 'default',
                position: 'relative',
              }}
            >
              {currentImage ? (
                <img src={currentImage.image} alt={currentImage.alt_text || product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '1.2rem', color: '#7A6A50', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Photo bientôt</span>
                </div>
              )}

              {/* Flèches navigation */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedImage((i) => (i - 1 + images.length) % images.length); }}
                    style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', width: '4rem', height: '4rem', background: 'rgba(250,246,238,0.9)', border: '1px solid #2A2A2A', color: '#1A1208', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', transition: 'border-color 0.2s, color 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#B8960A'; e.currentTarget.style.color = '#B8960A'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#CEC0A0'; e.currentTarget.style.color = '#1A1208'; }}
                  >
                    <i className="bx bx-chevron-left"></i>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedImage((i) => (i + 1) % images.length); }}
                    style={{ position: 'absolute', right: '1.2rem', top: '50%', transform: 'translateY(-50%)', width: '4rem', height: '4rem', background: 'rgba(250,246,238,0.9)', border: '1px solid #2A2A2A', color: '#1A1208', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', transition: 'border-color 0.2s, color 0.2s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#B8960A'; e.currentTarget.style.color = '#B8960A'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#CEC0A0'; e.currentTarget.style.color = '#1A1208'; }}
                  >
                    <i className="bx bx-chevron-right"></i>
                  </button>
                </>
              )}

              {/* Indice zoom */}
              {images.length > 0 && (
                <div style={{ position: 'absolute', bottom: '1.2rem', right: '1.2rem', background: 'rgba(250,246,238,0.9)', border: '1px solid #2A2A2A', borderRadius: '2px', padding: '0.4rem 0.8rem', fontSize: '1rem', fontFamily: 'Inter, sans-serif', color: '#7A6A50', letterSpacing: '0.1em' }}>
                  + zoom
                </div>
              )}
            </div>

            {/* Miniatures */}
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.2rem', flexWrap: 'wrap' }}>
                {images.map((img, i) => (
                  <div key={img.id} onClick={() => setSelectedImage(i)}
                    style={{
                      width: '7rem', aspectRatio: '3/4', overflow: 'hidden',
                      border: `1px solid ${selectedImage === i ? '#B8960A' : '#CEC0A0'}`,
                      cursor: 'pointer', flexShrink: 0,
                      background: '#E8DCC8', borderRadius: '2px',
                      transition: 'border-color 0.2s',
                    }}>
                    <img src={img.image} alt={img.alt_text} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Infos produit ── */}
          <div style={{ paddingTop: '2rem' }}>

            {/* Badges */}
            <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '2rem' }}>
              {product.is_new && (
                <span style={{ background: '#B8960A', color: '#FAF6EE', padding: '0.4rem 1.2rem', fontSize: '1rem', fontFamily: 'Inter, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                  Nouveau
                </span>
              )}
              {discountPercent && (
                <span style={{ background: '#C2662D', color: '#1A1208', padding: '0.4rem 1.2rem', fontSize: '1rem', fontFamily: 'Inter, sans-serif', fontWeight: 700, letterSpacing: '0.1em' }}>
                  −{discountPercent}%
                </span>
              )}
            </div>

            {/* Catégorie */}
            <p style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.25em', color: '#B8960A', marginBottom: '1.2rem' }}>
              <Link to={`/boutique?category=${product.category.slug}`} style={{ color: '#B8960A', textDecoration: 'none' }}>
                {product.category.name}
              </Link>
            </p>

            {/* Nom */}
            <h1 style={{ fontFamily: 'Aclonica, serif', fontSize: 'clamp(2.8rem, 3.5vw, 4rem)', color: '#1A1208', letterSpacing: '-0.01em', lineHeight: 1.1, marginBottom: '2.4rem' }}>
              {product.name}
            </h1>

            {/* Prix */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1.6rem', marginBottom: '0.8rem' }}>
              <span style={{ fontFamily: 'Aclonica, serif', fontSize: '2.8rem', color: '#B8960A', letterSpacing: '-0.01em' }}>
                {formatFCFA(product.price)}
              </span>
              {product.old_price && (
                <span style={{ fontSize: '1.8rem', color: '#7A6A50', textDecoration: 'line-through', fontFamily: 'Inter, sans-serif' }}>
                  {formatFCFA(product.old_price)}
                </span>
              )}
            </div>

            {/* Stock */}
            <p style={{
              fontSize: '1.2rem', fontFamily: 'Inter, sans-serif', letterSpacing: '0.1em',
              textTransform: 'uppercase', marginBottom: '3rem',
              color: outOfStock ? '#ef4444' : availableStock <= 3 ? '#e8a000' : '#22c55e',
            }}>
              ● {outOfStock ? 'Rupture de stock' : availableStock <= 3 ? `Stock limité — ${availableStock} restant${availableStock > 1 ? 's' : ''}` : 'En stock'}
            </p>

            {/* Description */}
            {product.description && (
              <p style={{ fontSize: '1.4rem', fontFamily: 'Inter, sans-serif', color: '#7A6A50', lineHeight: 1.8, marginBottom: '3rem', borderTop: '1px solid #2A2A2A', paddingTop: '2.4rem' }}>
                {product.description}
              </p>
            )}

            {/* Tailles */}
            {sizes.length > 0 && (
              <div style={{ marginBottom: '2.4rem' }}>
                <p style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#7A6A50', marginBottom: '1.2rem' }}>
                  Taille
                </p>
                <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                  {sizes.map((size) => {
                    const v = product.variants?.find((v) => v.size === size);
                    const soldOut = v && v.stock === 0;
                    const active = selectedSize === size;
                    return (
                      <button key={size} onClick={() => !soldOut && setSelectedSize(active ? '' : size)}
                        disabled={soldOut}
                        style={{
                          padding: '0.8rem 2rem', borderRadius: '2px',
                          cursor: soldOut ? 'not-allowed' : 'pointer',
                          border: `1px solid ${active ? '#B8960A' : '#CEC0A0'}`,
                          background: active ? '#B8960A' : 'transparent',
                          color: soldOut ? '#CEC0A0' : active ? '#FAF6EE' : '#1A1208',
                          fontSize: '1.3rem', fontFamily: 'Inter, sans-serif', letterSpacing: '0.08em',
                          textDecoration: soldOut ? 'line-through' : 'none',
                          transition: 'all 0.2s ease',
                        }}>
                        {size}
                      </button>
                    );
                  })}
                </div>
                {sizes.length > 0 && !selectedSize && (
                  <p style={{ fontSize: '1.2rem', fontFamily: 'Inter, sans-serif', color: '#C2662D', marginTop: '0.8rem' }}>
                    Choisissez une taille
                  </p>
                )}
              </div>
            )}

            {/* Couleurs */}
            {colors.length > 0 && (
              <div style={{ marginBottom: '2.4rem' }}>
                <p style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#7A6A50', marginBottom: '1.2rem' }}>
                  Couleur
                </p>
                <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                  {colors.map((color) => {
                    const active = selectedColor === color;
                    return (
                      <button key={color} onClick={() => setSelectedColor(active ? '' : color)}
                        style={{
                          padding: '0.8rem 2rem', borderRadius: '2px', cursor: 'pointer',
                          border: `1px solid ${active ? '#B8960A' : '#CEC0A0'}`,
                          background: active ? 'rgba(212,175,55,0.1)' : 'transparent',
                          color: active ? '#B8960A' : '#1A1208',
                          fontSize: '1.3rem', fontFamily: 'Inter, sans-serif',
                          transition: 'all 0.2s ease',
                        }}>
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantité */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '3rem' }}>
              <p style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#7A6A50' }}>
                Quantité
              </p>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #2A2A2A' }}>
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  style={{ width: '4rem', height: '4rem', background: 'transparent', border: 'none', color: '#1A1208', cursor: 'pointer', fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#E8DCC8'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >−</button>
                <span style={{ minWidth: '4rem', textAlign: 'center', fontSize: '1.6rem', fontFamily: 'Inter, sans-serif', color: '#1A1208', fontVariantNumeric: 'tabular-nums' }}>
                  {quantity}
                </span>
                <button onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
                  style={{ width: '4rem', height: '4rem', background: 'transparent', border: 'none', color: '#1A1208', cursor: 'pointer', fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#E8DCC8'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >+</button>
              </div>
            </div>

            {/* CTA */}
            <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap' }}>
              <button onClick={handleAddToCart} disabled={outOfStock}
                style={{
                  flex: 1, minWidth: '18rem', padding: '1.6rem 2rem',
                  background: outOfStock ? '#E8DCC8' : '#B8960A',
                  color: outOfStock ? '#7A6A50' : '#FAF6EE',
                  border: 'none', cursor: outOfStock ? 'not-allowed' : 'pointer',
                  fontSize: '1.2rem', fontFamily: 'Inter, sans-serif',
                  fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em',
                  transition: 'background 0.25s, color 0.25s',
                }}
                onMouseEnter={(e) => { if (!outOfStock) { e.currentTarget.style.background = '#C2662D'; e.currentTarget.style.color = '#1A1208'; } }}
                onMouseLeave={(e) => { if (!outOfStock) { e.currentTarget.style.background = '#B8960A'; e.currentTarget.style.color = '#FAF6EE'; } }}
              >
                {outOfStock ? 'Épuisé' : 'Ajouter au panier'}
              </button>
              <button onClick={handleBuyNow} disabled={outOfStock}
                style={{
                  flex: 1, minWidth: '18rem', padding: '1.6rem 2rem',
                  background: 'transparent',
                  color: outOfStock ? '#7A6A50' : '#1A1208',
                  border: `1px solid ${outOfStock ? '#CEC0A0' : '#1A1208'}`,
                  cursor: outOfStock ? 'not-allowed' : 'pointer',
                  fontSize: '1.2rem', fontFamily: 'Inter, sans-serif',
                  fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.2em',
                  transition: 'border-color 0.25s, color 0.25s',
                }}
                onMouseEnter={(e) => { if (!outOfStock) { e.currentTarget.style.borderColor = '#B8960A'; e.currentTarget.style.color = '#B8960A'; } }}
                onMouseLeave={(e) => { if (!outOfStock) { e.currentTarget.style.borderColor = '#1A1208'; e.currentTarget.style.color = '#1A1208'; } }}
              >
                Acheter maintenant
              </button>
            </div>

            {/* Partager */}
            <ShareButtons product={product} />

            {/* Réassurance mini */}
            <div style={{ marginTop: '3rem', paddingTop: '2.4rem', borderTop: '1px solid #2A2A2A', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { icon: 'bx-car', text: 'Livraison Dakar & Thiès — retrait gratuit en boutique' },
                { icon: 'bx-store', text: 'Atelier à Pikine Tally Boumack, Dakar' },
                { icon: 'bx-shield', text: 'Paiement sécurisé — Wave, Orange Money, Free Money' },
              ].map(({ icon, text }) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                  <i className={`bx ${icon}`} style={{ fontSize: '1.8rem', color: '#B8960A' }}></i>
                  <span style={{ fontSize: '1.3rem', fontFamily: 'Inter, sans-serif', color: '#7A6A50' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Produits similaires ── */}
        {similar.length > 0 && (
          <div style={{ marginTop: '10rem', borderTop: '1px solid #2A2A2A', paddingTop: '7rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '1.6rem' }}>
              <div style={{ width: '4.8rem', height: '1px', background: '#B8960A' }} />
              <p style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.3em', color: '#B8960A' }}>
                Vous aimerez aussi
              </p>
            </div>
            <h2 style={{ fontFamily: 'Aclonica, serif', fontSize: 'clamp(2.8rem, 4vw, 4.2rem)', color: '#1A1208', letterSpacing: '-0.02em', marginBottom: '5rem' }}>
              Pièces similaires
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2.4rem' }} className="similar-grid">
              {similar.map((p) => <SimilarCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>

      {/* ── Zoom modal ── */}
      {zoomOpen && currentImage && (
        <div
          onClick={() => setZoomOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, cursor: 'zoom-out' }}
        >
          <img src={currentImage.image} alt={currentImage.alt_text}
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }} />
          <button
            onClick={() => setZoomOpen(false)}
            style={{ position: 'fixed', top: '2rem', right: '2rem', width: '4.4rem', height: '4.4rem', background: 'transparent', border: '1px solid #2A2A2A', color: '#1A1208', cursor: 'pointer', fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#B8960A'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#CEC0A0'}
          >
            <i className="bx bx-x"></i>
          </button>
          {/* Navigation dans le zoom */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedImage((i) => (i - 1 + images.length) % images.length); }}
                style={{ position: 'fixed', left: '2rem', top: '50%', transform: 'translateY(-50%)', width: '4.4rem', height: '4.4rem', background: 'transparent', border: '1px solid #2A2A2A', color: '#1A1208', cursor: 'pointer', fontSize: '2.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <i className="bx bx-chevron-left"></i>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedImage((i) => (i + 1) % images.length); }}
                style={{ position: 'fixed', right: '2rem', top: '50%', transform: 'translateY(-50%)', width: '4.4rem', height: '4.4rem', background: 'transparent', border: '1px solid #2A2A2A', color: '#1A1208', cursor: 'pointer', fontSize: '2.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <i className="bx bx-chevron-right"></i>
              </button>
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:.3} 50%{opacity:.7} }
        @media (max-width: 900px) { .produit-grid { grid-template-columns: 1fr !important; gap: 4rem !important; } }
        @media (max-width: 700px) { .similar-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 480px) { .similar-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
};

export default ProduitPage;
