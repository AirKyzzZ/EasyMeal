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
    // Optimize image quality for better compression while maintaining visual quality
    // Responsive sizes to match actual display dimensions
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
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
  // Optimize output for modern browsers
  swcMinify: true,
};

export default nextConfig;
