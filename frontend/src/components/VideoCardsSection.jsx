import { useRef, useState, useEffect, useCallback } from 'react';

const CARD_REM = 27;
const GAP_REM  = 1.6;
const STEP     = CARD_REM + GAP_REM;
const BASE     = -STEP;

/* ── Ajouter / remplacer les IDs YouTube Shorts ── */
const VIDEOS = [
  { videoId: 'KN7Q5iMw6TA' },
  { videoId: 'WRHnxjFpjk8' },
  { videoId: 'xMSJ2kl9918' },
  { videoId: 'KN7Q5iMw6TA' }, // remplacer
  { videoId: 'WRHnxjFpjk8' }, // remplacer
];

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

const VideoCardsSection = () => {
  const [headerRef, headerVisible] = useInView();
  const n = VIDEOS.length;

  const [activeIdx,          setActiveIdx]          = useState(0);
  const [offset,             setOffset]             = useState(BASE);
  const [animated,           setAnimated]           = useState(false);
  const [sliding,            setSliding]            = useState(false);
  /*
   * Pendant l'animation, la carte "centre visuel" est à delta=dir.
   * À l'état de repos, le centre visuel est toujours delta=0.
   */
  const [visualCenterDelta,  setVisualCenterDelta]  = useState(0);

  const getIdx = useCallback((delta) =>
    ((activeIdx + delta) % n + n) % n, [activeIdx, n]);

  const go = useCallback((dir) => {
    if (sliding) return;
    setSliding(true);
    setAnimated(true);
    setVisualCenterDelta(dir);          // la carte entrante est à delta=dir
    setOffset(BASE + dir * -STEP);

    setTimeout(() => {
      /* Reset instantané : tout bascule sans transition */
      setAnimated(false);
      setVisualCenterDelta(0);          // delta=0 reprend le rôle de centre
      setActiveIdx(prev => ((prev + dir) % n + n) % n);
      setOffset(BASE);
      setTimeout(() => setSliding(false), 50);
    }, 500);
  }, [sliding, n]);

  const containerW = 3 * CARD_REM + 2 * GAP_REM;
  const deltas = [-2, -1, 0, 1, 2];

  /*
   * Pendant l'animation : le "centre" est visualCenterDelta (1 ou -1).
   * Au repos : le "centre" est toujours 0.
   */
  const effectiveCenter = animated ? visualCenterDelta : 0;

  /*
   * Transitions :
   * - Pendant l'animation  → on anime scale + margin-top (carte entrante monte, sortante descend)
   * - Pendant le reset     → 'none' pour que tout bascule instantanément
   * - Au repos             → on anime pour les interactions futures
   */
  const cardTransition = (!sliding || animated)
    ? 'transform 0.5s ease, margin-top 0.5s ease'
    : 'none';

  return (
    <section style={{ padding: '8rem 0', background: '#FAF6EE' }}>
      <div className="container">

        {/* En-tête */}
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

        {/* Carousel + flèches */}
        <div style={{ position: 'relative' }}>

          <ArrowBtn dir="left"  onClick={() => go(-1)} disabled={sliding}
            pos={{ left:  `calc(50% - ${containerW / 2}rem - 6rem)` }} />

          <div style={{
            width: `${containerW}rem`,
            maxWidth: '100%',
            margin: '0 auto',
            overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'start',
              gap: `${GAP_REM}rem`,
              transform: `translateX(${offset}rem)`,
              transition: animated ? 'transform 0.5s cubic-bezier(0.4,0,0.2,1)' : 'none',
              willChange: 'transform',
            }}>
              {deltas.map((delta) => {
                const idx      = getIdx(delta);
                const videoId  = VIDEOS[idx].videoId;
                // style visuel animé (monte/descend pendant le slide)
                const isCenter = delta === effectiveCenter;
                // autoplay uniquement sur delta=0, jamais changé pendant l'animation
                const isAutoplay = delta === 0;

                const embedUrl = isAutoplay
                  ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0&modestbranding=1&playsinline=1`
                  : `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=0&modestbranding=1&rel=0`;

                return (
                  <div
                    key={delta}
                    style={{
                      flex: `0 0 ${CARD_REM}rem`,
                      marginTop: isCenter ? '0' : '5rem',
                      transform: isCenter ? 'scale(1)' : 'scale(0.94)',
                      transition: cardTransition,
                    }}
                  >
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      aspectRatio: '9/16',
                      overflow: 'hidden',
                      borderRadius: '4px',
                    }}>
                      <iframe
                        src={embedUrl}
                        allow="autoplay; encrypted-media; fullscreen"
                        allowFullScreen
                        style={{
                          position: 'absolute',
                          top: isCenter ? '0' : '-10%',
                          left: 0,
                          width: '100%',
                          height: isCenter ? '100%' : '120%',
                          border: 'none', display: 'block',
                          pointerEvents: isAutoplay ? 'auto' : 'none',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <ArrowBtn dir="right" onClick={() => go(1)}  disabled={sliding}
            pos={{ right: `calc(50% - ${containerW / 2}rem - 6rem)` }} />
        </div>

        {/* Points de navigation */}
        <div style={{
          display: 'flex', justifyContent: 'center',
          gap: '0.8rem', marginTop: '3.2rem',
        }}>
          {VIDEOS.map((_, i) => (
            <div key={i} style={{
              width: i === activeIdx ? '2.4rem' : '0.6rem',
              height: '0.6rem', borderRadius: '3px',
              background: i === activeIdx ? '#B8960A' : '#D0C0A0',
              transition: 'width 0.3s ease, background 0.3s ease',
            }} />
          ))}
        </div>

      </div>
    </section>
  );
};

const ArrowBtn = ({ dir, onClick, disabled, pos }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'absolute', top: '50%',
        transform: 'translateY(-50%)',
        ...pos,
        zIndex: 2,
        width: '4.8rem', height: '4.8rem',
        borderRadius: '50%',
        border: '1.5px solid #B8960A',
        background: hovered ? '#B8960A' : 'transparent',
        cursor: disabled ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.2s ease',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke={hovered ? '#FAF6EE' : '#B8960A'} strokeWidth="2"
        style={{ transition: 'stroke 0.2s ease' }}>
        {dir === 'left'
          ? <polyline points="15 18 9 12 15 6" />
          : <polyline points="9 18 15 12 9 6" />}
      </svg>
    </button>
  );
};

export default VideoCardsSection;
