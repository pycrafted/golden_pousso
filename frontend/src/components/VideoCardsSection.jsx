import { useState, useEffect, useCallback } from 'react';
import apiClient from '../api/client';

const useIsMobile = () => {
  const [mobile, setMobile] = useState(() => window.innerWidth <= 767);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth <= 767);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return mobile;
};

const CARD_REM = 27;
const GAP_REM  = 1.6;
const STEP     = CARD_REM + GAP_REM;
const BASE     = -STEP;

// Ref-callback plutôt que useRef : cette section rend `null` tant que les vidéos ne sont
// pas chargées, donc le nœud DOM n'existe pas encore lors du tout premier rendu. Un useEffect
// à deps [] classique raterait son attachement ; ici l'observer se (ré)attache dès que le
// nœud apparaît réellement (une fois les vidéos arrivées).
const useInView = () => {
  const [node, setNode] = useState(null);
  const [visible, setVisible] = useState(false);
  const ref = useCallback((el) => setNode(el), []);

  useEffect(() => {
    if (!node) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.08, rootMargin: '-60px' }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [node]);

  return [ref, visible];
};

const VideoCardsSection = () => {
  const isMobile = useIsMobile();
  const [headerRef, headerVisible] = useInView();
  const [videos, setVideos] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const n = videos.length;

  useEffect(() => {
    apiClient.get('/videos/').then(({ data }) => setVideos(data)).catch(() => {}).finally(() => setLoaded(true));
  }, []);

  const [activeIdx,         setActiveIdx]         = useState(0);
  const [offset,            setOffset]            = useState(BASE);
  const [animated,          setAnimated]          = useState(false);
  const [sliding,           setSliding]           = useState(false);
  const [playingDelta,      setPlayingDelta]      = useState(null);
  const [hoveredDelta,      setHoveredDelta]      = useState(null);
  /*
   * Pendant l'animation, la carte "centre visuel" est à delta=dir.
   * À l'état de repos, le centre visuel est toujours delta=0.
   */
  const [visualCenterDelta, setVisualCenterDelta] = useState(0);

  const getIdx = useCallback((delta) =>
    ((activeIdx + delta) % n + n) % n, [activeIdx, n]);

  const go = useCallback((dir) => {
    if (sliding) return;
    setPlayingDelta(null);
    setSliding(true);
    setAnimated(true);
    setVisualCenterDelta(dir);
    setOffset(BASE + dir * -STEP);

    setTimeout(() => {
      setAnimated(false);
      setVisualCenterDelta(0);
      setActiveIdx(prev => ((prev + dir) % n + n) % n);
      setOffset(BASE);
      setTimeout(() => setSliding(false), 50);
    }, 500);
  }, [sliding, n]);

  const containerW = 3 * CARD_REM + 2 * GAP_REM;
  const deltas = [-2, -1, 0, 1, 2];

  const effectiveCenter = animated ? visualCenterDelta : 0;

  const cardTransition = (!sliding || animated)
    ? 'transform 0.5s ease, margin-top 0.5s ease'
    : 'none';

  if (n === 0) return null; // rien tant que le propriétaire n'a pas ajouté de vidéo (Espace Gestion → Vidéos)

  const centerVideoUrl = videos[getIdx(0)].video_url;

  if (isMobile) {
    return (
      <section style={{ padding: '6rem 0', background: '#FAF6EE' }}>
        <div className="container">
          {/* En-tête */}
          <div ref={headerRef} style={{
            marginBottom: '4rem', textAlign: 'center',
            opacity: headerVisible ? 1 : 0,
            transform: headerVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.8s ease, transform 0.8s ease',
          }}>
            <p style={{ fontSize: '1.1rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.3em', color: '#B8960A', marginBottom: '1.6rem' }}>
              Univers Visuel
            </p>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 'clamp(2.4rem, 7vw, 4rem)', color: '#1A1208', textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: 1.1 }}>
              Nos Créations<br /><span style={{ color: '#B8960A' }}>en Mouvement</span>
            </h2>
          </div>

          {/* Carte unique */}
          <div style={{ width: 'min(32rem, 85vw)', margin: '0 auto' }}>
            <div style={{ position: 'relative', aspectRatio: '9/16', overflow: 'hidden', borderRadius: '4px', background: '#1a1208' }}>
              {playingDelta === 0 ? (
                <video
                  key={centerVideoUrl}
                  src={centerVideoUrl}
                  controls
                  autoPlay
                  playsInline
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <>
                  <video src={centerVideoUrl} muted playsInline preload="metadata" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
                  <div
                    onClick={() => setPlayingDelta(0)}
                    style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2 }}
                  >
                    <div style={{ width: '5.6rem', height: '5.6rem', borderRadius: '50%', background: 'rgba(255,255,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.35)' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="#B8960A"><polygon points="6 3 20 12 6 21 6 3" /></svg>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Flèches sous la carte */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2.4rem', marginTop: '3rem' }}>
            <button onClick={() => { setPlayingDelta(null); go(-1); }} disabled={sliding}
              style={{ width: '5rem', height: '5rem', borderRadius: '50%', background: 'transparent', border: 'none', cursor: sliding ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: sliding ? 0.3 : 1 }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#B8960A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <button onClick={() => { setPlayingDelta(null); go(1); }} disabled={sliding}
              style={{ width: '5rem', height: '5rem', borderRadius: '50%', background: 'transparent', border: 'none', cursor: sliding ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: sliding ? 0.3 : 1 }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#B8960A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>
        </div>
      </section>
    );
  }

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
            fontFamily: 'Syne, sans-serif',
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
            pos={{ left:  `calc(50% - ${containerW / 2}rem - 8rem)` }} />

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
                const videoUrl = videos[idx]?.video_url;
                const isCenter   = delta === effectiveCenter;
                const isVisible  = Math.abs(delta) <= 1;
                const isPlaying  = playingDelta === delta;
                const isHovered  = hoveredDelta === delta;

                return (
                  <div
                    key={delta}
                    onMouseEnter={isVisible ? () => setHoveredDelta(delta) : undefined}
                    onMouseLeave={isVisible ? () => setHoveredDelta(null) : undefined}
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
                      background: '#1a1208',
                    }}>

                      {/* Aperçu (1ère image de la vidéo) — visible tant que la vidéo n'est pas lancée */}
                      {!isPlaying && (
                        <video
                          src={videoUrl}
                          muted
                          playsInline
                          preload="metadata"
                          style={{
                            position: 'absolute', inset: 0,
                            width: '100%', height: '100%',
                            objectFit: 'cover', display: 'block',
                            pointerEvents: 'none',
                            transition: 'transform 0.3s ease',
                            transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                          }}
                        />
                      )}

                      {/* Voile sombre sur les cartes latérales — s'allège au hover */}
                      {!isCenter && !isPlaying && (
                        <div style={{
                          position: 'absolute', inset: 0,
                          background: isHovered ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.38)',
                          transition: 'background 0.3s ease',
                          zIndex: 1,
                        }} />
                      )}

                      {/* Lecteur vidéo — dès que l'utilisateur lance la lecture */}
                      {isPlaying && (
                        <video
                          key={videoUrl}
                          src={videoUrl}
                          controls
                          autoPlay
                          playsInline
                          style={{
                            position: 'absolute', inset: 0,
                            width: '100%', height: '100%',
                            objectFit: 'cover', display: 'block',
                          }}
                        />
                      )}

                      {/* Bouton play — toute carte visible, vidéo non lancée */}
                      {isVisible && !isPlaying && (
                        <div
                          onClick={() => setPlayingDelta(delta)}
                          style={{
                            position: 'absolute', inset: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer',
                            zIndex: 2,
                            opacity: 1,
                          }}
                        >
                          <div style={{
                            width: isCenter ? '5.6rem' : '4.4rem',
                            height: isCenter ? '5.6rem' : '4.4rem',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.92)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
                            transition: 'transform 0.2s ease',
                            transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                          }}>
                            <svg
                              width={isCenter ? 24 : 18}
                              height={isCenter ? 24 : 18}
                              viewBox="0 0 24 24" fill="#B8960A"
                            >
                              <polygon points="6 3 20 12 6 21 6 3" />
                            </svg>
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <ArrowBtn dir="right" onClick={() => go(1)}  disabled={sliding}
            pos={{ right: `calc(50% - ${containerW / 2}rem - 8rem)` }} />
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
        transform: hovered ? 'translateY(-50%) scale(1.1)' : 'translateY(-50%) scale(1)',
        ...pos,
        zIndex: 2,
        width: '6rem', height: '6rem',
        borderRadius: '50%',
        border: 'none',
        background: 'transparent',
        cursor: disabled ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'transform 0.2s ease',
        opacity: disabled ? 0.3 : 1,
      }}
    >
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none"
        stroke="#B8960A" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round">
        {dir === 'left'
          ? <polyline points="15 18 9 12 15 6" />
          : <polyline points="9 18 15 12 9 6" />}
      </svg>
    </button>
  );
};

export default VideoCardsSection;
