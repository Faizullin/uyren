import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
        port: '8000',
        pathname: '/**',
      },
      // Add your production domain here when needed
      // {
      //   protocol: 'https',
      //   hostname: 'your-api-domain.com',
      //   pathname: '/**',
      // },
    ],
    // Allow optimization for development
    unoptimized: process.env.NODE_ENV === 'development',
  },
  
  eslint: {
    ignoreDuringBuilds: true, // Ignore ESLint errors during build
  },
};

export default nextConfig;
