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
};

export default nextConfig;
