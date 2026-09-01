import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';

/* ── Carte produit — grilles boutique / catégorie ───────────────────────────
   Cette carte avait sa propre implémentation, qui superposait nom et prix sur
   la photo derrière un dégradé noir. La carte de l'accueil, elle, plaçait le
   texte sous l'image : la même pièce changeait de présentation selon la page.
   `PLPCard` n'est plus qu'un habillage de `ProductCard`, conservé pour ne pas
   toucher aux imports de CategoriePage et BoutiquePage.

   Les grilles PLP tiennent 4 colonnes en desktop, d'où le `sizes` plus serré
   que la valeur par défaut du composant. */
export const PLPCard = ({ product, index }) => (
  <ProductCard
    product={product}
    index={index}
    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
  />
);

/* ── Skeleton ── */
export const SkeletonCard = () => (
  <div style={{ aspectRatio: '3/4', background: '#F2EBDD', borderRadius: 'var(--r-surface)', animation: 'shimmer 1.6s ease-in-out infinite' }} />
);

/* @deprecated — `fadeUp`, `fadeDown` et `shimmer` sont désormais déclarées une
   fois pour toutes dans styles.css. Cette constante ne contient plus rien et
   n'est gardée que le temps de retirer les <style>{PLP_GRID_STYLES}</style>
   des pages qui l'injectent encore. */
export const PLP_GRID_STYLES = '';

export const PLP_INPUT_STYLE = {
  width: '100%', padding: '1rem 0',
  background: 'transparent', border: 'none',
  borderBottom: '1px solid #E3D9C6',
  color: '#12141C', fontSize: '1.3rem', fontFamily: 'var(--font-body)',
  outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};

/* ── Liste d'options sidebar (catégories, tri…) — case cochable + libellé ── */
export const SidebarOptionList = ({ options, activeValue, onSelect }) => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    {options.map((opt) => {
      const active = activeValue === opt.value;
      return (
        <button
          key={opt.value || 'all'}
          onClick={() => onSelect(opt.value)}
          style={{ display: 'flex', alignItems: 'center', gap: '1.4rem', padding: '1.1rem 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid rgba(42,42,42,0.06)' }}
        >
          <span style={{
            width: '1.5rem', height: '1.5rem', borderRadius: 'var(--r-micro)',
            border: `1px solid ${active ? 'var(--text-accent)' : '#E3D9C6'}`,
            background: active ? 'var(--text-accent)' : 'transparent',
            flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
          }}>
            {active && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#FAF6EE" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>}
          </span>
          <span style={{ fontSize: '1.3rem', fontFamily: 'var(--font-body)', color: active ? '#12141C' : '#5E6172', transition: 'color 0.2s' }}>
            {opt.label}
          </span>
        </button>
      );
    })}
  </div>
);

/* ── Filtre prix (min/max FCFA) ── */
export const PriceFilter = ({ minPrice, maxPrice, onApply }) => {
  const [min, setMin] = useState(minPrice);
  const [max, setMax] = useState(maxPrice);
  useEffect(() => setMin(minPrice), [minPrice]);
  useEffect(() => setMax(maxPrice), [maxPrice]);

  const apply = () => onApply(min, max);
  const onKeyDown = (e) => { if (e.key === 'Enter') apply(); };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
        <input
          type="number" min="0" inputMode="numeric" placeholder="Min"
          value={min} onChange={(e) => setMin(e.target.value)} onKeyDown={onKeyDown} onBlur={apply}
          style={PLP_INPUT_STYLE}
        />
        <span style={{ color: '#5E6172' }}>—</span>
        <input
          type="number" min="0" inputMode="numeric" placeholder="Max"
          value={max} onChange={(e) => setMax(e.target.value)} onKeyDown={onKeyDown} onBlur={apply}
          style={PLP_INPUT_STYLE}
        />
      </div>
    </div>
  );
};
