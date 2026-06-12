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
	poweredByHeader: false,
	experimental: {
		reactCompiler: true,
		typedRoutes: true,
		typedEnv: true,
		viewTransition: true,
		inlineCss: true,
		cssChunking: "strict",
		optimizePackageImports: [
			"@mdxeditor/editor",
			"@monaco-editor/react",
			"monaco-editor",
		],
		externalDir: true,
	},
	images: {
		qualities: [75, 100],
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
		config.resolve.exportsFields = [];
		return config;
	},
};

export default nextConfig;
