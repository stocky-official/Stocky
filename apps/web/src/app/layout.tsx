import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './global.css';

const geistSans = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500'], // Strictly weights 300, 400, 500
});

export const metadata: Metadata = {
  title: 'Stocky | Inventory & Stock Management',
  description: 'Enterprise stock management platform for multi-hub logistics',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={geistSans.variable}>
      <body className="font-sans antialiased bg-stocky-bg-global text-stocky-text-sub min-h-screen">
        {children}
      </body>
    </html>
  );
}
