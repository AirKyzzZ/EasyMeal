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
    // Reduced sizes to minimize requests and page weight
    deviceSizes: [640, 828, 1200, 1920], // Reduced from 8 to 4 sizes
    imageSizes: [16, 32, 64, 128, 256, 384], // Reduced sizes
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
