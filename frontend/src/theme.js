/**
 * Golden Pousso — design tokens « Or & Indigo »
 * ---------------------------------------------------------------------------
 * Miroir JS de `styles.css`. Les deux fichiers DOIVENT rester synchronisés :
 * `styles.css` fait autorité, celui-ci existe uniquement pour les styles
 * inline qui ne peuvent pas lire une variable CSS.
 *
 * Règle de fond : préférer TOUJOURS une classe CSS (`.btn`, `.eyebrow`,
 * `.price`, `.media`…) à un style inline. Ce module est une passerelle pour
 * le code non encore migré, pas une invitation à en écrire davantage.
 *
 * ── Le piège du doré ───────────────────────────────────────────────────────
 * Un seul « or » ne peut pas servir les deux fonds. Mesures WCAG 2.1 :
 *
 *   #C6A43D sur indigo #0F1320 → 7,74:1  ✅ AAA
 *   #C6A43D sur écru   #FAF6EE → 2,22:1  ❌ échoue même en grand texte
 *   #836B26 sur écru   #FAF6EE → 4,76:1  ✅ AA
 *   #836B26 sur la carte dorée → 4,67:1  ✅ AA
 *
 * D'où `goldOnDark` et `goldOnLight`. `gold` est un alias de `goldOnLight`
 * (le fond dominant du site est clair) conservé pour le code historique.
 */

/* ── Palette brute ─────────────────────────────────────────────────────── */
export const PALETTE = {
  indigo900: '#0F1320',
  indigo800: '#161B2D',
  indigo700: '#202742',

  ecru50:  '#FAF6EE',
  ecru100: '#F2EBDD',
  ecru200: '#E3D9C6',

  brass400: '#C6A43D',
  brass700: '#836B26',

  terra500: '#C2662D',
  terra700: '#9A4E1C',

  ink:   '#12141C',
  slate: '#5E6172',

  success:  '#1E7A46',
  danger:   '#B3261E',
  whatsapp: '#25D366',
};

/* ── Tokens sémantiques ────────────────────────────────────────────────── */
export const COLORS = {
  // Surfaces
  surface:       PALETTE.ecru50,
  surfaceSunk:   PALETTE.ecru100,
  surfaceDark:   PALETTE.indigo900,
  surfaceDark2:  PALETTE.indigo800,

  // Texte sur fond clair
  text:       PALETTE.ink,
  textMuted:  PALETTE.slate,
  textAccent: PALETTE.brass700,
  textPromo:  PALETTE.terra700,

  // Texte sur fond sombre
  textOnDark:       PALETTE.ecru50,
  textOnDarkMuted:  'rgba(250,246,238,0.62)',
  textOnDarkAccent: PALETTE.brass400,

  // Filets — l'or est structurel, il vit ici plutôt qu'en aplat
  line:           PALETTE.ecru200,
  lineAccent:     'rgba(131,107,38,0.32)',
  lineDark:       'rgba(255,255,255,0.10)',
  lineDarkAccent: 'rgba(198,164,61,0.28)',

  // Or explicite — préférer ces deux-là à `gold`
  goldOnDark:  PALETTE.brass400,
  goldOnLight: PALETTE.brass700,

  // États
  success:  PALETTE.success,
  danger:   PALETTE.danger,
  whatsapp: PALETTE.whatsapp,

  /* ── Alias historiques ───────────────────────────────────────────────────
     Conservés pour ne pas casser les 18 modules qui les importent déjà.
     Le rôle est identique, la teinte suit la nouvelle direction. */
  ink:          PALETTE.ink,
  cream:        PALETTE.ecru50,
  gold:         PALETTE.brass700,   // ⚠️ variante fond CLAIR — sur fond sombre : goldOnDark
  terracotta:   PALETTE.terra500,
  mutedOnLight: PALETTE.slate,
  mutedOnDark:  'rgba(250,246,238,0.62)',
};

/* ── Rayons ────────────────────────────────────────────────────────────────
   La couture se coupe net : le rayon tend vers 0. L'ancienne échelle
   (--r-surface: 1.8rem) donnait le galet arrondi des templates SaaS. */
export const RADIUS_SCALE = {
  none:   '0',      // média, cartes, sections
  subtle: '2px',    // boutons, champs
  mark:   '4px',    // badges
  pill:   '999px',  // chips uniquement
};

export const RADIUS = RADIUS_SCALE.subtle;

/* ── Typographie ───────────────────────────────────────────────────────────
   UNE SEULE FAMILLE : Fraunces, partout. Les trois constantes sont conservées
   parce que ~235 styles inline les nomment, et parce qu'elles disent encore
   quel RÔLE tient un texte — si une seconde famille revient, il n'y aura que
   cette ligne à changer.

   Fraunces remplace Syne, dessinée en 2017 pour un centre d'art sur un brief
   de forme « étrange » — un registre d'institution culturelle, étranger au
   vêtement et à la main.

   Préférer la classe CSS ou `var(--font-display)` à ces constantes : elles ne
   servent qu'aux styles inline qui ne peuvent pas lire une variable CSS. */
export const FONT_DISPLAY   = "'Fraunces', Georgia, 'Times New Roman', serif";
export const FONT_BODY      = FONT_DISPLAY;
export const FONT_EDITORIAL = FONT_DISPLAY;

export const TYPE = {
  display: 'clamp(4.8rem, 8vw, 9.6rem)',
  h1:      'clamp(3.6rem, 5vw, 5.6rem)',
  h2:      'clamp(2.8rem, 4vw, 4.2rem)',
  h3:      'clamp(2.0rem, 2.4vw, 2.6rem)',
  lead:    '1.8rem',
  body:    '1.5rem',
  sm:      '1.35rem',
  xs:      '1.2rem',
  eyebrow: '1.1rem',
};

export const TRACKING = {
  display: '-0.02em',
  tight:   '-0.01em',
  eyebrow: '0.28em',
  button:  '0.16em',
};

/* ── Espacement — base 8px ─────────────────────────────────────────────── */
export const SPACE = {
  1: '0.4rem',  2: '0.8rem',  3: '1.2rem',  4: '1.6rem',  5: '2.4rem',
  6: '3.2rem',  7: '4.8rem',  8: '6.4rem',  9: '9.6rem', 10: '12.8rem',
};

/* ── Mouvement ─────────────────────────────────────────────────────────────
   Une seule courbe pour tout le site : l'easeOutQuint décélère lentement,
   c'est ce qui fait « cher ». Le `ease` par défaut du navigateur fait
   « template ». */
export const MOTION = {
  ease:   'cubic-bezier(0.22, 1, 0.36, 1)',
  easeIn: 'cubic-bezier(0.64, 0, 0.78, 0)',
  fast:   '160ms',
  base:   '280ms',
  slow:   '520ms',
};

/* ── Élévation — le filet plutôt que le flou ───────────────────────────── */
export const SHADOW = {
  overlay: '0 1.6rem 4.8rem -1.6rem rgba(15,19,32,0.32)',
  lift:    '0 0.8rem 2.4rem -1.2rem rgba(15,19,32,0.24)',
};
