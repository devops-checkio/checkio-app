const createNextIntlPlugin = require("next-intl/plugin");

const withNextIntl = createNextIntlPlugin();

const createSecurityHeaders = (isDevelopment = false) => {
  const baseHeaders = [
    {
      key: "Strict-Transport-Security",
      value: "max-age=63072000; includeSubDomains; preload",
    },
    {
      key: "X-Content-Type-Options",
      value: "nosniff",
    },
    {
      key: "X-Frame-Options",
      value: "DENY",
    },
    {
      key: "X-XSS-Protection",
      value: "1; mode=block",
    },
    {
      key: "Referrer-Policy",
      value: "strict-origin-when-cross-origin",
    },
    {
      key: "Permissions-Policy",
      value:
        "camera=(self), microphone=(), geolocation=(self), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), ambient-light-sensor=(), autoplay=(), encrypted-media=(), fullscreen=(self), picture-in-picture=()",
    },
  ];

  // Different CSP for development and production
  // Allow blob: and self for frame-src and object-src to enable PDF preview
  // Allow blob: for worker-src to enable maplibre-gl workers
  const cspValue =
    "default-src 'self' 'unsafe-eval' 'unsafe-inline'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://maps.googleapis.com https://maps.gstatic.com; style-src 'self' 'unsafe-inline' https://maps.googleapis.com https://fonts.googleapis.com; img-src 'self' data: https: https://maps.googleapis.com https://maps.gstatic.com; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https:; frame-src 'self' blob: https:; object-src 'self' blob: https:; worker-src 'self' blob:; base-uri 'self'; form-action 'self';";
  return [
    ...baseHeaders,
    {
      key: "Content-Security-Policy",
      value: cspValue,
    },
  ];
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure images for AWS S3
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "checkio-images.s3.us-east-1.amazonaws.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "checkio-images.s3.amazonaws.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.s3.us-east-1.amazonaws.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
        port: "",
        pathname: "/**",
      },
    ],
  },

  // Ensure static files are properly served
  async headers() {
    const isDevelopment = process.env.NODE_ENV === "development";
    const securityHeaders = createSecurityHeaders(isDevelopment);

    return [
      {
        source: "/(.*)",
        headers: [
          ...securityHeaders,
          {
            key: "Server",
            value: "CheckIO",
          },
          {
            key: "X-Powered-By",
            value: "CheckIO",
          },
        ],
      },
      {
        source: "/models/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
        ],
      },
    ];
  },

  // Configure webpack to handle large model files
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }

    // Increase size limit for model files
    config.performance = {
      ...config.performance,
      maxAssetSize: 5 * 1024 * 1024, // 5MB
      maxEntrypointSize: 5 * 1024 * 1024, // 5MB
    };

    return config;
  },
};

module.exports = withNextIntl(nextConfig);


// Injected content via Sentry wizard below

const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(module.exports, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "checkio-latam",
  project: "checkio-app",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: "/monitoring",

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
