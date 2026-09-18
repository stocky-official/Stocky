import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/icons/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--stocky-font-stack)', 'var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        cairo: ['var(--font-cairo)', 'Cairo', 'sans-serif'],
      },
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],       // 12px
        sm: ['0.875rem', { lineHeight: '1.25rem' }],   // 14px
        base: ['1rem', { lineHeight: '1.5rem' }],      // 16px
        md: ['1.125rem', { lineHeight: '1.625rem' }],  // 18px
        lg: ['1.25rem', { lineHeight: '1.75rem' }],    // 20px
        xl: ['1.5rem', { lineHeight: '2rem' }],        // 24px
        '2xl': ['2rem', { lineHeight: '2.5rem' }],     // 32px
      },
      colors: {
        stocky: {
          bg: {
            global: 'var(--stocky-bg-global)',
            widget: 'var(--stocky-bg-widget)',
            subtle: 'var(--stocky-bg-subtle)',
            muted: 'var(--stocky-bg-muted)',
            hover: 'var(--stocky-bg-hover)',
            active: 'var(--stocky-bg-active)',
          },
          text: {
            main: 'var(--stocky-text-main)',
            sub: 'var(--stocky-text-sub)',
            muted: 'var(--stocky-text-muted)',
            placeholder: 'var(--stocky-text-placeholder)',
            disabled: 'var(--stocky-text-disabled)',
            inverse: 'var(--stocky-text-inverse)',
            primary: 'var(--stocky-text-primary)',
          },
          primary: {
            DEFAULT: 'var(--stocky-primary)',
            hover: 'var(--stocky-primary-hover)',
          },
          accent: {
            DEFAULT: 'var(--stocky-accent)',
            hover: 'var(--stocky-accent-hover)',
            soft: 'var(--stocky-accent-soft)',
          },
          border: {
            subtle: 'var(--stocky-border-subtle)',
            default: 'var(--stocky-border-default)',
            hover: 'var(--stocky-border-hover)',
            focus: 'var(--stocky-border-focus)',
            active: 'var(--stocky-border-active)',
          },
          status: {
            info: {
              DEFAULT: 'var(--stocky-status-info-fg)',
              bg: 'var(--stocky-status-info-bg)',
              fg: 'var(--stocky-status-info-fg)',
              border: 'var(--stocky-status-info-border)',
            },
            success: {
              DEFAULT: 'var(--stocky-status-success-fg)',
              bg: 'var(--stocky-status-success-bg)',
              fg: 'var(--stocky-status-success-fg)',
              border: 'var(--stocky-status-success-border)',
            },
            warning: {
              DEFAULT: 'var(--stocky-status-warning-fg)',
              bg: 'var(--stocky-status-warning-bg)',
              fg: 'var(--stocky-status-warning-fg)',
              border: 'var(--stocky-status-warning-border)',
            },
            critical: {
              DEFAULT: 'var(--stocky-status-critical-fg)',
              bg: 'var(--stocky-status-critical-bg)',
              fg: 'var(--stocky-status-critical-fg)',
              border: 'var(--stocky-status-critical-border)',
            },
            hold: {
              DEFAULT: 'var(--stocky-status-hold-fg)',
              bg: 'var(--stocky-status-hold-bg)',
              fg: 'var(--stocky-status-hold-fg)',
              border: 'var(--stocky-status-hold-border)',
            },
            muted: {
              DEFAULT: 'var(--stocky-status-muted-fg)',
              bg: 'var(--stocky-status-muted-bg)',
              fg: 'var(--stocky-status-muted-fg)',
              border: 'var(--stocky-status-muted-border)',
            },
          },
        },
      },
      borderRadius: {
        none: '0px',
        xs: 'var(--stocky-radius-xs)',
        sm: 'var(--stocky-radius-sm)',
        widget: 'var(--stocky-radius-widget)',
        card: 'var(--stocky-radius-card)',
        xl: 'var(--stocky-radius-xl)',
        '3xl': '1.5rem',
        pill: 'var(--stocky-radius-full)',
        full: 'var(--stocky-radius-full)',
        DEFAULT: 'var(--stocky-radius-widget)',
      },
      boxShadow: {
        bevel: 'var(--stocky-shadow-bevel)',
        'bevel-hover': 'var(--stocky-shadow-bevel-hover)',
        'bevel-dock': 'var(--stocky-shadow-bevel-dock)',
        'bevel-float': 'var(--stocky-shadow-bevel-float)',
        drawer: 'var(--stocky-shadow-drawer)',
        none: 'none',
      },
      zIndex: {
        sticky: 'var(--stocky-z-sticky-nav)',
        dropdown: 'var(--stocky-z-dropdown)',
        dock: 'var(--stocky-z-dock)',
        drawer: 'var(--stocky-z-drawer)',
        modal: 'var(--stocky-z-modal)',
        toast: 'var(--stocky-z-toast)',
        tooltip: 'var(--stocky-z-tooltip)',
      },
      spacing: {
        gutter: '1rem',
      },
      maxWidth: {
        view: '1600px',
      },
    },
  },
  plugins: [],
};

export default config;
