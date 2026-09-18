import type { Metadata, Viewport } from 'next';
import { Cairo, Geist } from 'next/font/google';
import { cookies } from 'next/headers';
import './global.css';
import { PWARegistration } from '@/components/PWARegistration';
import { PWAThemeColorSync } from '@/components/PWAThemeColorSync';
import { AuthOriginGuard } from '@/components/AuthOriginGuard';
import { I18nProvider, type Locale } from '@/lib/i18n';

const geistSans = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
});

const cairo = Cairo({
  variable: '--font-cairo',
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Stocky | Inventory & Stock Management',
  description: 'Enterprise stock management platform for multi-hub logistics',
  applicationName: 'Stocky',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Stocky',
    startupImage: [
      {
        url: '/apple-splash.png',
      },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#D8FF00',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('stocky_locale')?.value;
  const initialLocale: Locale = localeCookie === 'en' ? 'en' : 'ar';
  const dir = initialLocale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={initialLocale} dir={dir} className={`${geistSans.variable} ${cairo.variable}`} suppressHydrationWarning>
      <body
        className="font-sans antialiased bg-stocky-bg-global text-stocky-text-sub min-h-screen"
        suppressHydrationWarning
      >
        <I18nProvider initialLocale={initialLocale}>
          <AuthOriginGuard />
          <PWARegistration />
          <PWAThemeColorSync />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
