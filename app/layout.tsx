import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://easymeal.app'),
  title: 'EasyMeal - Discover Amazing Recipes',
  description:
    'Search and discover delicious recipes from around the world. Find meals by ingredients, cuisine, or category with our powerful search and filter system.',
  keywords: ['recipes', 'cooking', 'meals', 'food', 'cuisine', 'ingredients'],
  authors: [{ name: 'EasyMeal Team' }],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/logo.png', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  openGraph: {
    title: 'EasyMeal - Discover Amazing Recipes',
    description: 'Search and discover delicious recipes from around the world.',
    type: 'website',
    images: [
      {
        url: '/logo.png',
        width: 500,
        height: 500,
        alt: 'EasyMeal Logo',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'EasyMeal - Discover Amazing Recipes',
    description: 'Search and discover delicious recipes from around the world.',
    images: ['/logo.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html lang="en">
      <head>
        {/* Preload critical resources */}
        <link rel="dns-prefetch" href="//www.themealdb.com" />
        <link rel="preconnect" href="https://www.themealdb.com" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
