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
  // Add transpilePackages if needed for any packages that use require
  transpilePackages: [],
  // Ensure we're using the correct module system
  experimental: {
    esmExternals: 'loose',
  },
};

export default nextConfig;
