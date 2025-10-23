import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // ⚠️ Temporaneamente ignora errori TypeScript durante il build
    ignoreBuildErrors: true,
  },
  eslint: {
    // ⚠️ Temporaneamente ignora errori ESLint durante il build
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'didieffeb2b.com',
        pathname: '/img_catalogo_norm/**',
      },
      {
        protocol: 'https',
        hostname: 'shop.didieffeb2b.com',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://shop.didieffeb2b.com';
    return [
      {
        source: '/admin/api/:path*',
        destination: `${apiUrl}/admin/api/:path*`,
      },
    ];
  },
  async headers() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://shop.didieffeb2b.com';
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
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com", // unsafe-eval needed for Next.js dev, Google for Sign-In
              "style-src 'self' 'unsafe-inline'",
              `img-src 'self' data: https://didieffeb2b.com ${apiUrl} https://*.googleusercontent.com`,
              "font-src 'self' data:",
              `connect-src 'self' ${apiUrl} https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://*.firebaseio.com https://accounts.google.com`,
              "frame-src https://accounts.google.com",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; ')
          },
        ],
      },
    ];
  },
};

export default nextConfig;
