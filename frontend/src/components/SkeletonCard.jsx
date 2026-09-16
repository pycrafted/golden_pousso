/* Squelette de carte produit. Ses gris clairs en dur (#f0f0f0, #e0e0e0)
   faisaient des taches blanches sur le site passé à l'indigo : il lit
   maintenant « --surface-sunk », mêlé d'un peu de texte pour le reflet —
   plus sombre sur l'écru, plus clair sur l'indigo. */
const SkeletonCard = () => (
  <div className="product" style={{ pointerEvents: 'none' }}>
    <div className="top" style={{
      background: 'linear-gradient(90deg, var(--surface-sunk) 25%, color-mix(in srgb, var(--surface-sunk) 82%, var(--text)) 50%, var(--surface-sunk) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s infinite',
      borderRadius: '1rem',
      aspectRatio: '1',
      width: '100%',
    }} />
    <div className="bottom" style={{ marginTop: '1rem' }}>
      <div style={{
        height: '1.6rem',
        background: 'linear-gradient(90deg, var(--surface-sunk) 25%, color-mix(in srgb, var(--surface-sunk) 82%, var(--text)) 50%, var(--surface-sunk) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s infinite',
        borderRadius: '0.5rem',
        marginBottom: '0.8rem',
        width: '70%',
      }} />
      <div style={{
        height: '1.4rem',
        background: 'linear-gradient(90deg, var(--surface-sunk) 25%, color-mix(in srgb, var(--surface-sunk) 82%, var(--text)) 50%, var(--surface-sunk) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s infinite',
        borderRadius: '0.5rem',
        width: '40%',
      }} />
    </div>

    <style>{`
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `}</style>
  </div>
);

export default SkeletonCard;
