import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  images: {
    domains: [
      'sg-studio-backend.onrender.com',
      'res.cloudinary.com',
    ],
  },
  typescript: {
    ignoreBuildErrors: isProd, // Ignora errores de TypeScript SOLO en producción
  },
  eslint: {
    ignoreDuringBuilds: isProd, // Ignora errores de ESLint SOLO en producción
  },
};

export default nextConfig;