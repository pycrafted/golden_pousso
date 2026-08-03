/**
 * Golden Pousso — design tokens
 * Source unique de vérité pour couleurs, rayon et polices.
 * Ne pas redéfinir de palette locale dans les pages/composants — importer d'ici.
 */
export const COLORS = {
  ink: '#1A1208',              // texte foncé sur fond clair + fond des zones sombres (nav/footer/hero)
  cream: '#FAF6EE',            // fond dominant clair + texte clair sur fond sombre
  gold: '#B8960A',             // accent unique (or)
  terracotta: '#C2662D',       // accent secondaire (hover, promo)
  mutedOnLight: '#7A6A50',
  mutedOnDark: 'rgba(250,246,238,0.6)',
};

export const RADIUS = '2px';

export const FONT_DISPLAY = "'Syne', sans-serif";
export const FONT_BODY = "'Inter', sans-serif";
