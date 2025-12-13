/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "sg-studio-backend.onrender.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: isProd,
  },
  eslint: {
    ignoreDuringBuilds: isProd,
  },
};

module.exports = nextConfig;