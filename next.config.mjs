/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, // Enable React strict mode for better development experience
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
  // Ensure experimental features are compatible with React 18
  experimental: {
    serverActions: true,
    // Enable React Server Components
    serverComponents: true,
    // Enable concurrent features
    concurrentFeatures: true,
  },
};

export default nextConfig;
