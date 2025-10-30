import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import React from 'react';

import './globals.css';

// Optimized font loading - only load main font, mono font as fallback
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  // Reduce font file size by limiting subsets
  weight: ['400', '500', '600', '700'], // Only load needed weights
});

// Removed geistMono preload to reduce requests - using system fallback
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  fallback: ['monospace'], // System font fallback
});

export const metadata: Metadata = {
  metadataBase: new URL('https://easymealapp.netlify.app'),
  title: {
    default: 'EasyMeal - Discover Amazing Recipes | Free Recipe Finder',
    template: '%s | EasyMeal',
  },
  description:
    'Search and discover thousands of delicious recipes from around the world. Find meals by ingredients, cuisine, or category with our powerful search and filter system. Free recipe finder with step-by-step instructions, cooking videos, and ingredient lists.',
  keywords: [
    'recipes',
    'recipe finder',
    'cooking',
    'meals',
    'food recipes',
    'cuisine',
    'ingredients',
    'cooking recipes',
    'free recipes',
    'recipe search',
    'meal planning',
    'home cooking',
    'recipe ideas',
    'cooking inspiration',
    'recipe collection',
    'international recipes',
    'world cuisine',
    'recipe database',
  ],
  authors: [{ name: 'EasyMeal Team' }],
  creator: 'EasyMeal',
  publisher: 'EasyMeal',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
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
    type: 'website',
    locale: 'en_US',
    url: 'https://easymealapp.netlify.app',
    siteName: 'EasyMeal',
    title: 'EasyMeal - Discover Amazing Recipes | Free Recipe Finder',
    description:
      'Search and discover thousands of delicious recipes from around the world. Find meals by ingredients, cuisine, or category with our powerful search and filter system.',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'EasyMeal - Free Recipe Finder and Cooking Inspiration',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EasyMeal - Discover Amazing Recipes',
    description:
      'Search and discover thousands of delicious recipes from around the world. Find meals by ingredients, cuisine, or category.',
    images: ['/logo.png'],
    creator: '@easymeal',
    site: '@easymeal',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add these when you have verification codes
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // yahoo: 'your-yahoo-verification-code',
  },
  category: 'Food & Cooking',
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
        <link rel="dns-prefetch" href="https://www.themealdb.com" />
        <link
          rel="preconnect"
          href="https://www.themealdb.com"
          crossOrigin="anonymous"
        />
        <link rel="preload" as="image" href="/logo.png" />
        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'EasyMeal',
              url: 'https://easymealapp.netlify.app',
              description:
                'Search and discover thousands of delicious recipes from around the world. Find meals by ingredients, cuisine, or category with our powerful search and filter system.',
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate:
                    'https://easymealapp.netlify.app/?search={search_term_string}',
                },
                'query-input': 'required name=search_term_string',
              },
              publisher: {
                '@type': 'Organization',
                name: 'EasyMeal',
                logo: {
                  '@type': 'ImageObject',
                  url: 'https://easymealapp.netlify.app/logo.png',
                },
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'EasyMeal',
              url: 'https://easymealapp.netlify.app',
              description:
                'Free recipe finder with step-by-step instructions, cooking videos, and ingredient lists.',
              applicationCategory: 'Food & Drink',
              operatingSystem: 'Any',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
