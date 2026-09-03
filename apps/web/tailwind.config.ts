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
        DEFAULT: '12px',
      },
      boxShadow: {
        none: 'none', // Strict: No shadows allowed
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
