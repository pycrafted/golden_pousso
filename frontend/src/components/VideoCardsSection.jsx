import { useRef, useState, useEffect } from 'react';

const useInView = () => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.08, rootMargin: '-60px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
};

const VideoCard = ({ videoId, index, colIndex }) => {
  const [ref, visible] = useInView();
  const [hovered, setHovered] = useState(false);
  const delay = colIndex * 0.1 + (index % 3) * 0.05;

  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&rel=0&playsinline=1`;

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        overflow: 'hidden',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(36px)',
        transition: `opacity 0.65s ease ${delay}s, transform 0.65s ease ${delay}s`,
      }}
    >
      {/* Wrapper qui scale au hover + overflow:hidden pour rogner l'UI YouTube */}
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '9/16',
        overflow: 'hidden',
        transform: hovered ? 'scale(1.04)' : 'scale(1)',
        transition: 'transform 0.7s ease',
      }}>
        <iframe
          src={embedUrl}
          allow="autoplay; encrypted-media"
          allowFullScreen
          style={{
            position: 'absolute',
            top: '-10%',
            left: 0,
            width: '100%',
            height: '120%',
            border: 'none', display: 'block',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
};

/* ── Remplacer par tes IDs YouTube Shorts ── */
const VIDEO_CARDS = [
  { videoId: 'KN7Q5iMw6TA' },
  { videoId: 'WRHnxjFpjk8' },
  { videoId: 'xMSJ2kl9918' },
];

const VideoCardsSection = () => {
  const [headerRef, headerVisible] = useInView();

  const cols = [0, 1, 2].map((colIndex) => ({
    colIndex,
    cards: VIDEO_CARDS.filter((_, i) => i % 3 === colIndex),
  }));

  return (
    <section style={{ padding: '8rem 0', background: '#FAF6EE' }}>
      <div className="container">

        <div ref={headerRef} style={{
          marginBottom: '6rem', textAlign: 'center',
          opacity: headerVisible ? 1 : 0,
          transform: headerVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.8s ease, transform 0.8s ease',
        }}>
          <p style={{
            fontSize: '1.1rem', fontFamily: 'Inter, sans-serif',
            textTransform: 'uppercase', letterSpacing: '0.3em',
            color: '#B8960A', marginBottom: '1.6rem',
          }}>
            Univers Visuel
          </p>
          <h2 style={{
            fontFamily: 'Aclonica, sans-serif',
            fontSize: 'clamp(3rem, 5vw, 5rem)',
            color: '#1A1208', textTransform: 'uppercase',
            letterSpacing: '0.02em', lineHeight: 1.1,
          }}>
            Nos Créations
            <br />
            <span style={{ color: '#B8960A' }}>en Mouvement</span>
          </h2>
        </div>

        <div className="video-stagger-grid" style={{ maxWidth: '88rem', margin: '0 auto' }}>
          {cols.map(({ colIndex, cards }) => (
            <div
              key={colIndex}
              style={{
                display: 'flex', flexDirection: 'column', gap: '1.6rem',
                marginTop: colIndex !== 1 ? '5rem' : '0',
              }}
            >
              {cards.map((card, i) => (
                <VideoCard
                  key={i}
                  videoId={card.videoId}
                  index={i}
                  colIndex={colIndex}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .video-stagger-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.6rem;
          align-items: start;
        }
        @media (max-width: 1023px) {
          .video-stagger-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .video-stagger-grid > div:nth-child(3) { display: none; }
        }
        @media (max-width: 639px) {
          .video-stagger-grid { grid-template-columns: 1fr !important; }
          .video-stagger-grid > div { margin-top: 0 !important; }
          .video-stagger-grid > div:nth-child(3) { display: flex; }
        }
      `}</style>
    </section>
  );
};

export default VideoCardsSection;
