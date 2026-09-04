import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/icons/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        // Strictly no weights > 500 allowed
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],       // 12px
        sm: ['0.875rem', { lineHeight: '1.25rem' }],   // 14px
        base: ['1rem', { lineHeight: '1.5rem' }],      // 16px
        md: ['1.125rem', { lineHeight: '1.625rem' }],  // 18px
        lg: ['1.25rem', { lineHeight: '1.75rem' }],    // 20px
        xl: ['1.5rem', { lineHeight: '2rem' }],        // 24px
        '2xl': ['2rem', { lineHeight: '2.5rem' }],     // 32px (STRICT MAXIMUM FONT SIZE)
      },
      colors: {
        stocky: {
          bg: {
            global: 'var(--stocky-bg-global)',   // #F9F9F9
            widget: 'var(--stocky-bg-widget)',   // #FFFFFF
          },
          text: {
            main: 'var(--stocky-text-main)',     // #000000
            sub: 'var(--stocky-text-sub)',       // #131313
          },
          primary: {
            DEFAULT: 'var(--stocky-primary)',         // #0057FF
            hover: 'var(--stocky-primary-hover)',     // #0047D4
          },
          accent: {
            DEFAULT: 'var(--stocky-accent)',          // #4D92D1
            soft: 'var(--stocky-accent-soft)',
          },
          border: {
            subtle: 'var(--stocky-border-subtle)',    // #EBEBEB
            default: 'var(--stocky-border-default)',  // #E2E2E2
          },
        },
      },
      borderRadius: {
        widget: '12px',
        card: '24px',
        '3xl': '1.5rem',
        pill: '9999px',
        DEFAULT: '12px',
      },
      boxShadow: {
        bevel: '0 2px 14px -2px rgba(15, 23, 42, 0.04)',
        'bevel-hover': '0 6px 20px -3px rgba(15, 23, 42, 0.07)',
        'bevel-dock': '0 10px 32px -4px rgba(0, 0, 0, 0.08), 0 2px 8px -2px rgba(0, 0, 0, 0.04)',
        'bevel-float': '0 20px 40px -10px rgba(0, 0, 0, 0.12)',
        none: 'none',
      },
      spacing: {
        gutter: '1rem', // 16px
      },
      maxWidth: {
        view: '1600px', // 1920x1080 display container
      },
    },
  },
  plugins: [],
};

export default config;
