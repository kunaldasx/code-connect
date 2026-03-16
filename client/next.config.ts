/**
 * Next.js configuration for the client application.
 * Features:
 * - Sentry error tracking
 * - Package optimization
 * - Image domains
 * - Turbo config
 *
 * By Kunal Das
 */

import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(import.meta.dirname, "../../"),
  reactCompiler: true,
  poweredByHeader: false,
  typedRoutes: true,
  logging: {
    browserToTerminal: true,
  },
  experimental: {
    typedEnv: true,
    viewTransition: true,
    inlineCss: true,
    turbopackFileSystemCacheForBuild: true,
    turbopackServerSideNestedAsyncChunking: true,
    cssChunking: "strict",
    optimizePackageImports: [
      "@mdxeditor/editor",
      "@monaco-editor/react",
      "monaco-editor",
    ],
    externalDir: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  transpilePackages: ["monaco-themes"],
  webpack: (config) => {
    // Bypass package.json exports field for monaco-themes
    config.resolve.exportsFields = [];

    return config;
  },
};

export default nextConfig;
