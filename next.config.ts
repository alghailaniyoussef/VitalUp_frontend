import type { NextConfig } from "next";
import path from 'path';

// Module resolution configuration for @ alias

const nextConfig : NextConfig= {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://vital-up-production.up.railway.app',
    NEXT_PUBLIC_FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://vital-up-frontend.vercel.app',
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };
    return config;
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://vital-up-production.up.railway.app';
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
      {
        source: '/sanctum/:path*',
        destination: `${apiUrl}/sanctum/:path*`,
      },
      {
        source: '/login',
        destination: `${apiUrl}/login`,
      },
      {
        source: '/logout',
        destination: `${apiUrl}/logout`,
      },
      {
        source: '/register',
        destination: `${apiUrl}/api/register`,
      }
    ]
  },
  async headers() {
    const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://vital-up-frontend.vercel.app';
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: frontendUrl },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ]
      }
    ]
  }
};

export default nextConfig;