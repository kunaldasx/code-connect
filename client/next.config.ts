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

type Resource = {
	request: string;
};

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
	transpilePackages: ["monaco-themes", "@mdxeditor/editor"],
	webpack: (config, { webpack }) => {
		// Targeted bypass for monaco-themes only — avoids globally
		// disabling exports fields which breaks @mdxeditor and estree-util-visit
		config.plugins.push(
			new webpack.NormalModuleReplacementPlugin(
				/^monaco-themes\//,
				(resource: Resource) => {
					resource.request = path.resolve(
						process.cwd(),
						"node_modules",
						resource.request,
					);
				},
			),
		);
		return config;
	},
};

export default nextConfig;
