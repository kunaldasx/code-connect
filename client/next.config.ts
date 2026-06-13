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
	transpilePackages: [
		"monaco-themes",
		"@mdxeditor/editor",
		"micromark-util-symbol",
		"mdast-util-highlight-mark",
		"micromark-extension-highlight-mark",
		"estree-util-visit",
	],
	webpack: (config) => {
		config.resolve.exportsFields = [];
		// Fix broken subpath export caused by exportsFields override
		config.resolve.alias = {
			...config.resolve.alias,
			"estree-util-visit/do-not-use-color": path.resolve(
				process.cwd(),
				"node_modules/estree-util-visit/lib/color.js",
			),
		};
		return config;
	},
};

export default nextConfig;
