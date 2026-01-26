import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import RefreshHandler from '@/components/RefreshHandler';
import IdleLogout from '@/components/IdleLogout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://kapilla-logistics.vercel.app'),
  title: {
    default: 'Kapilla Logistics',
    template: '%s | Kapilla Logistics',
  },
  description: 'Global Logistics & Tracking System - Fast, Reliable, Secure.',
  openGraph: {
    title: 'Kapilla Logistics',
    description: 'Track your shipment in real-time across our global network.',
    url: '/',
    siteName: 'Kapilla Logistics',
    images: [
      {
        url: '/logo.png',
        width: 800,
        height: 600,
        alt: 'Kapilla Logistics Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kapilla Logistics',
    description: 'Global Logistics & Tracking System',
    images: ['/logo.png'],
  },
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <RefreshHandler />
          <IdleLogout />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
