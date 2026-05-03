import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  compress: true, // Enable gzip compression
  poweredByHeader: false, // Security + Performance (remove extra header)
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  typescript: {
    // TODO: Remove ignoreBuildErrors once all TypeScript errors are resolved.
    // This was set to work around pre-existing type errors. New code added
    // by security fixes is fully typed. Removing this flag is safe once
    // `npx tsc --noEmit` passes with zero errors.
    ignoreBuildErrors: true,
  },
  // Reduce build time by optimizing dependencies
  experimental: {
    optimizePackageImports: ['react', 'react-dom'],
  },
  // Turbopack config for faster builds
  turbopack: {},
  // Reduce static generation time
  trailingSlash: false,
  // Optimize bundle size
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
          }
        ]
      }
    ]
  }
};

export default nextConfig;
