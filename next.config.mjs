/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    domains: ['nailfeed-backend-production.up.railway.app'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nailfeed-backend-production.up.railway.app',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
