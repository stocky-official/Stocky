/**
 * Design Tokens for Stocky v0.1.0
 *
 * Centralized design system definitions.
 * CSS variables matching these tokens are declared in apps/web/src/app/global.css.
 */

export const colors = {
  background: {
    global: 'var(--stocky-bg-global)',   // #F9F9F9
    widget: 'var(--stocky-bg-widget)',   // #FFFFFF
  },
  text: {
    main: 'var(--stocky-text-main)',     // #000000
    sub: 'var(--stocky-text-sub)',       // #131313
    inverse: '#FFFFFF',
  },
  brand: {
    primary: 'var(--stocky-primary)',         // #0057FF
    primaryHover: 'var(--stocky-primary-hover)', // #0047D4
    accent: 'var(--stocky-accent)',           // #4D92D1
  },
  border: {
    subtle: 'var(--stocky-border-subtle)', // #EBEBEB
    default: 'var(--stocky-border-default)',
  },
} as const;

export const typography = {
  fontFamily: 'var(--font-sans)',
  weights: {
    light: 300,
    regular: 400,
    medium: 500,
    // Strictly no weights > 500
  },
  sizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    md: '1.125rem',   // 18px
    lg: '1.25rem',    // 20px
    xl: '1.5rem',     // 24px
    max: '2rem',      // 32px (strict maximum font size)
  },
} as const;

export const layout = {
  radius: '12px',     // 0.75rem
  gutter: '16px',     // 1rem
  maxWidth: '1600px', // 1920x1080 display container
} as const;
