// next.config.js

const isDev = process.env.NODE_ENV !== "production";

const buildContentSecurityPolicy = () => {
  const scriptSrc = [
    "'self'",
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
  ];

  if (isDev) {
    scriptSrc.push("'unsafe-inline'", "'unsafe-eval'", "blob:");
  } else {
    scriptSrc.push("'unsafe-inline'");
  }

  const connectSrc = [
    "'self'",
    "https://nailfeed-backend-production.up.railway.app",
    "https://api.nailfeed.com",
    "https://www.google-analytics.com",
    "https://www.googletagmanager.com",
    "https://res.cloudinary.com",
    "https://region1.google-analytics.com",
    "https://stats.g.doubleclick.net",
    "https://vitals.vercel-insights.com",
  ];

  if (isDev) {
    connectSrc.push(
      "http://localhost:1337",
      "http://127.0.0.1:1337",
      "ws://localhost:3000",
      "ws://127.0.0.1:3000"
    );
  }

  const imgSrc = [
    "'self'",
    "data:",
    "blob:",
    "https://res.cloudinary.com",
    "https://nailfeed-backend-production.up.railway.app",
    "https://api.nailfeed.com",
    "https://www.google-analytics.com",
    "https://www.googletagmanager.com",
    "https://lh3.googleusercontent.com",
    "https://avatars.githubusercontent.com",
  ];

  if (isDev) {
    imgSrc.push("http://localhost:1337", "http://127.0.0.1:1337");
  }

  const scriptDirective = `script-src ${scriptSrc.join(" ")}`;
  const scriptElemDirective = `script-src-elem ${scriptSrc.join(" ")}`;
  const connectDirective = `connect-src ${connectSrc.join(" ")}`;
  const imgDirective = `img-src ${imgSrc.join(" ")}`;

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    scriptDirective,
    scriptElemDirective,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    imgDirective,
    "font-src 'self' https://fonts.gstatic.com data:",
    connectDirective,
    "media-src 'self' data: blob:",
    "frame-src 'self'",
    !isDev && "upgrade-insecure-requests",
  ]
    .filter(Boolean)
    .join("; ");
};

const CONTENT_SECURITY_POLICY = buildContentSecurityPolicy();

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "Origin-Agent-Cluster", value: "?1" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  images: {
    unoptimized: false,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "nailfeed-backend-production.up.railway.app",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.nailfeed.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "1337",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "1337",
        pathname: "/**",
      },
    ],
  },

  transpilePackages: [],

  async headers() {
    const workerHeaders = [
      ...SECURITY_HEADERS.filter(
        (header) => header.key !== "Content-Security-Policy"
      ),
      { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
      {
        key: "Content-Type",
        value: "application/javascript; charset=utf-8",
      },
      {
        key: "Cache-Control",
        value: "no-cache, no-store, must-revalidate",
      },
    ];

    return [
      {
        source: "/(.*)",
        headers: SECURITY_HEADERS,
      },
      {
        source: "/sw.js",
        headers: workerHeaders,
      },
    ];
  },
};

module.exports = nextConfig;
