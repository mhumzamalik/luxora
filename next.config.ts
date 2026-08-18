import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // C-2 fix: restrict image hostnames to only known-good domains.
  // Avoid wildcard hostname: "**" to prevent SSRF via the Next.js image optimizer.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "source.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "*.supabase.net",
      },
    ],
  },

  // H-1 fix: add HTTP security headers to every response.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent MIME-type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },

          // Block clickjacking
          {
            key: "X-Frame-Options",
            value: "DENY",
          },

          // Control referrer information leakage
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },

          // Force HTTPS for 2 years
          // Only effective in production behind TLS
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },

          // Restrict browser feature access
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=()",
          },

          // Content Security Policy
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",

              // Next.js requires these in some development configurations.
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.sentry-cdn.com",

              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",

              "font-src 'self' https://fonts.gstatic.com",

              // Image sources
              "img-src 'self' data: blob: https://images.unsplash.com https://source.unsplash.com https://plus.unsplash.com https://*.supabase.co https://*.supabase.net",

              // API / WebSocket connections
              "connect-src 'self' https://*.supabase.co https://*.supabase.net https://api.openai.com https://*.sentry.io",

              // Prevent the app from being embedded in frames
              "frame-ancestors 'none'",

              // Restrict document base URLs
              "base-uri 'self'",

              // Restrict form submissions
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  widenClientFileUpload: true,
});