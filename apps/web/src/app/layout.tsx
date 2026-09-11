import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import './global.css';
import { PWARegistration } from '@/components/PWARegistration';
import { AuthOriginGuard } from '@/components/AuthOriginGuard';

const geistSans = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500'],
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
  },
};

export const viewport: Viewport = {
  themeColor: '#0057FF',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={geistSans.variable} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Stocky" />
      </head>
      <body
        className="font-sans antialiased bg-stocky-bg-global text-stocky-text-sub min-h-screen"
        suppressHydrationWarning
      >
        <AuthOriginGuard />
        <PWARegistration />
        {children}
      </body>
    </html>
  );
}
