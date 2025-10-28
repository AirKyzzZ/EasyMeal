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
  title: 'EasyMeal - Discover Amazing Recipes',
  description: 'Search and discover delicious recipes from around the world. Find meals by ingredients, cuisine, or category with our powerful search and filter system.',
  keywords: ['recipes', 'cooking', 'meals', 'food', 'cuisine', 'ingredients'],
  authors: [{ name: 'EasyMeal Team' }],
  openGraph: {
    title: 'EasyMeal - Discover Amazing Recipes',
    description: 'Search and discover delicious recipes from around the world.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
