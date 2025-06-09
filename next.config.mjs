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
  },
  reactStrictMode: true, // Or your existing config
  // Your existing headers function if you have one, for example:
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp', // Required for SharedArrayBuffer, e.g. for @imgly/background-removal
          },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Prevent fs module from being bundled on the client
      config.resolve.fallback = {
        ...config.resolve.fallback, // Spread existing fallbacks
        fs: false, // Tells webpack to use an empty module for 'fs'
        path: false, // Often related, good to handle as well
        // 'canvas' might also be needed if fabric tries to load node-canvas
        // canvas: false, // Uncomment if you see errors related to 'canvas' module
      };
    }
    return config;
  },
  // Any other configurations you have
};

export default nextConfig
