import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.themealdb.com',
        port: '',
        pathname: '/images/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Optimize image quality for better compression - mobile-first approach
    // Match actual display sizes: mobile 100vw (max ~400px), tablet 50vw (max ~500px), desktop 384px
    deviceSizes: [400, 500, 640, 828, 1200, 1920],
    imageSizes: [16, 32, 64, 128, 256, 384, 400], // Include 400px for mobile cards
    // Enable image optimization
    unoptimized: false,
  },
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  // Enable compression
  compress: true,
  // Target modern browsers to reduce legacy JavaScript polyfills
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;
