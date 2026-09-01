import { useState, useEffect, useCallback } from 'react';
import CldImg from './CldImg';

/**
 * Zone média d'une carte produit — à poser dans un conteneur `position: relative`
 * (la carte garde ses propres calques : badges, prix, voile « Épuisé »…).
 *
 * C'est la vidéo OU les photos, jamais un mélange des deux :
 *  — vidéo envoyée : elle occupe toute la carte et se lance seule (muette, en
 *    boucle) dès qu'elle entre dans le champ, sans flèche ni point de navigation ;
 *  — sinon : photo principale, bascule vers la photo secondaire au survol.
 *
 * Les photos d'un produit en vidéo restent visibles sur sa fiche produit.
 */
const ProductCardMedia = ({
  product,
  hovered = false,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw',
  widths = [300, 600],
  eager = false,
  placeholder = 'Photo bientôt',
}) => {
  const [videoEl, setVideoEl] = useState(null);
  const videoRef = useCallback((el) => setVideoEl(el), []);

  /* Lecture uniquement quand la carte est à l'écran — au revoir, on met en pause */
  useEffect(() => {
    if (!videoEl) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) videoEl.play?.().catch(() => {}); else videoEl.pause?.(); },
      { threshold: 0.3 }
    );
    obs.observe(videoEl);
    return () => obs.disconnect();
  }, [videoEl]);

  /* ── Vidéo : elle prend toute la carte ── */
  if (product.video_url) {
    return (
      <video
        ref={videoRef}
        src={product.video_url}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={`Vidéo — ${product.name}`}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%', objectFit: 'cover',
          background: '#1A1208',
          pointerEvents: 'none',
          transform: hovered ? 'scale(1.04)' : 'scale(1)',
          transition: 'transform 0.7s ease',
        }}
      />
    );
  }

  /* ── Sans vidéo : photo principale + bascule au survol ── */
  if (!product.primary_image) return <Placeholder label={placeholder} />;

  const secondary = product.secondary_image;
  return (
    <>
      <CldImg
        src={product.primary_image}
        alt={product.name}
        eager={eager}
        sizes={sizes}
        widths={widths}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%', objectFit: 'cover',
          opacity: hovered && secondary ? 0 : 1,
          transform: hovered && !secondary ? 'scale(1.06)' : 'scale(1)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}
      />
      {secondary && (
        <CldImg
          src={secondary}
          alt={product.name}
          sizes={sizes}
          widths={widths}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%', objectFit: 'cover',
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.7s ease',
          }}
        />
      )}
    </>
  );
};

/* ── Placeholder « Photo bientôt » ── */
const Placeholder = ({ label }) => (
  <div style={{
    position: 'absolute', inset: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}>
    <span style={{
      fontSize: '1.1rem', fontFamily: 'var(--font-body)', color: '#7A6A50',
      textTransform: 'uppercase', letterSpacing: '0.1em',
    }}>
      {label}
    </span>
  </div>
);

export default ProductCardMedia;
