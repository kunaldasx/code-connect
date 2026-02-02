// previewProxy.ts
import { createProxyMiddleware } from "http-proxy-middleware";
import type { Request, Response, NextFunction } from "express";
import type { IncomingMessage, ServerResponse } from "http";
import type { Socket } from "net";
import type { Server } from "socket.io";

interface PreviewServer {
	port: number;
	url: string;
	type: "vite" | "next" | "other";
	startedAt: Date;
}

// Store active preview servers
export const previewServers = new Map<string, PreviewServer>();

// Regex patterns to detect dev servers starting
const DEV_SERVER_PATTERNS = [
	// Vite patterns
	{
		regex: /Local:\s+https?:\/\/localhost:(\d+)/i,
		type: "vite" as const,
	},
	{
		regex: /VITE v[\d.]+ ready in \d+ ms[\s\S]*Local:\s+https?:\/\/localhost:(\d+)/i,
		type: "vite" as const,
	},
	// Next.js patterns
	{
		regex: /started server on.*http:\/\/localhost:(\d+)/i,
		type: "next" as const,
	},
	// Generic pattern
	{
		regex: /(?:server|Server|listening|Listening).*?(?:localhost|127\.0\.0\.1):(\d+)/i,
		type: "other" as const,
	},
];

function isHttpResponse(
	res: ServerResponse<IncomingMessage> | Socket
): res is ServerResponse<IncomingMessage> {
	return (
		typeof (res as ServerResponse<IncomingMessage>).writeHead === "function"
	);
}

// Helper function to strip ANSI escape codes
export function stripAnsiCodes(str: string): string {
	return str.replace(
		// eslint-disable-next-line no-control-regex
		/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
		""
	);
}

// Detect dev server from terminal output
export function detectDevServer(
	output: string
): { port: number; type: "vite" | "next" | "other" } | null {
	const cleanOutput = stripAnsiCodes(output);

	for (const pattern of DEV_SERVER_PATTERNS) {
		const match = cleanOutput.match(pattern.regex);
		if (match && match[1]) {
			const port = parseInt(match[1], 10);
			if (port > 1024 && port < 65535) {
				return { port, type: pattern.type };
			}
		}
	}
	return null;
}

// Create enhanced preview proxy middleware with WebSocket support
export function createPreviewProxy(io?: Server) {
	return (req: Request, res: Response, next: NextFunction) => {
		const projectId = req.params.projectId;
		const userId = req.params.userId;
		const serverKey = `${projectId}_${userId}`;
		const server = previewServers.get(serverKey);

		if (!server) {
			return res.status(503).send(`
				<!DOCTYPE html>
				<html>
					<head>
						<title>Preview Not Available</title>
						<style>
							body { 
								font-family: system-ui; 
								padding: 2rem; 
								text-align: center;
								background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
								color: white;
								min-height: 100vh;
								display: flex;
								align-items: center;
								justify-content: center;
								margin: 0;
							}
							.container {
								background: rgba(255,255,255,0.1);
								padding: 3rem;
								border-radius: 1rem;
								backdrop-filter: blur(10px);
							}
							h1 { margin-bottom: 1rem; }
							code {
								background: rgba(0,0,0,0.2);
								padding: 0.5rem 1rem;
								border-radius: 0.5rem;
								display: inline-block;
								margin-top: 1rem;
							}
							.loading-spinner {
								display: inline-block;
								width: 20px;
								height: 20px;
								border: 3px solid rgba(255,255,255,0.3);
								border-radius: 50%;
								border-top-color: white;
								animation: spin 1s ease-in-out infinite;
							}
							@keyframes spin {
								to { transform: rotate(360deg); }
							}
						</style>
						<script>
							// Auto-refresh every 2 seconds to check if server is ready
							setTimeout(() => location.reload(), 2000);
						</script>
					</head>
					<body>
						<div class="container">
							<h1>📦 Preview Server Not Running</h1>
							<p>Waiting for development server to start...</p>
							<code>npm run dev</code>
							<div style="margin-top: 2rem;">
								<div class="loading-spinner"></div>
							</div>
						</div>
					</body>
				</html>
			`);
		}

		const targetUrl = `http://localhost:${server.port}`;
		const basePath = `/preview/${projectId}/${userId}`;

		// Create the proxy middleware
		const proxy = createProxyMiddleware({
			target: targetUrl,
			changeOrigin: true,
			ws: true, // Enable WebSocket proxy

			// Remove the base path when forwarding to the dev server
			pathRewrite: (path) => {
				const newPath = path.replace(basePath, "");
				return newPath || "/";
			},

			// Don't verify SSL certificates (for development)
			secure: false,

			// Handle errors gracefully
			on: {
				error: (err, req, res) => {
					console.error("Proxy error:", err.message);

					// Type guard to check if res is a ServerResponse
					if (res && isHttpResponse(res)) {
						if (!res.headersSent) {
							res.writeHead(502, { "Content-Type": "text/html" });
							res.end(`
							<!DOCTYPE html>
							<html>
								<head>
									<title>Proxy Error</title>
									<style>
										body { 
											font-family: system-ui; 
											padding: 2rem; 
											text-align: center;
											background: #f44336;
											color: white;
											min-height: 100vh;
											display: flex;
											align-items: center;
											justify-content: center;
											margin: 0;
										}
										.error-container {
											background: rgba(0,0,0,0.2);
											padding: 2rem;
											border-radius: 1rem;
										}
									</style>
								</head>
								<body>
									<div class="error-container">
										<h1>⚠️ Preview Server Error</h1>
										<p>Unable to connect to development server</p>
										<p>Port: ${server.port}</p>
										<p>Please check if the server is running</p>
									</div>
								</body>
							</html>
							`);
						}
					}
				},

				proxyReq: (proxyReq, req, res) => {
					// Log for debugging
					console.log(
						`[PROXY] ${req.method} ${req.url} -> ${targetUrl}${req.url}`
					);

					// Set proper headers for Vite
					if (server.type === "vite") {
						// Preserve the original host for Vite HMR
						proxyReq.setHeader(
							"X-Forwarded-Host",
							req.headers.host || ""
						);
						proxyReq.setHeader("X-Forwarded-Proto", "http");
						proxyReq.setHeader(
							"X-Forwarded-For",
							(req as Request).ip || ""
						);
					}
				},

				proxyRes: (proxyRes, req, res) => {
					// Add CORS headers if needed
					proxyRes.headers["access-control-allow-origin"] = "*";
					proxyRes.headers["access-control-allow-methods"] =
						"GET, POST, PUT, DELETE, OPTIONS";
					proxyRes.headers["access-control-allow-headers"] =
						"Content-Type";

					// Handle HTML responses for Vite
					if (
						server.type === "vite" &&
						proxyRes.headers["content-type"]?.includes("text/html")
					) {
						// Mark that we need to modify this response
						(proxyRes as any).__needsRewrite = true;

						// Store the original pipe method
						const originalPipe = proxyRes.pipe;
						let chunks: Buffer[] = [];

						// Override pipe to collect and modify the response
						proxyRes.pipe = function (
							destination: any,
							options?: any
						) {
							// Collect all chunks
							proxyRes.on("data", (chunk: Buffer) => {
								chunks.push(chunk);
							});

							proxyRes.on("end", () => {
								let html =
									Buffer.concat(chunks).toString("utf-8");

								// Inject Vite client configuration
								const viteConfig = `
									<script type="module">
										// Store original fetch for later use
										const originalFetch = window.fetch;
										
										// Override fetch to handle module requests
										window.fetch = function(input, init) {
											if (typeof input === 'string') {
												// Handle absolute paths
												if (input.startsWith('/') && !input.startsWith('${basePath}')) {
													// Don't modify Vite internal paths
													if (!input.startsWith('/@') && !input.includes('node_modules')) {
														input = '${basePath}' + input;
													}
												}
											}
											return originalFetch.call(this, input, init);
										};

										// Fix dynamic imports
										const originalImport = window.__import || ((id) => import(id));
										window.__import = (id) => {
											if (id.startsWith('/') && !id.startsWith('${basePath}')) {
												if (!id.startsWith('/@') && !id.includes('node_modules')) {
													id = '${basePath}' + id;
												}
											}
											return originalImport(id);
										};

										// Configure base URL for the application
										window.__BASE_URL__ = '${basePath}';
									</script>
								`;

								// Fix Vite client script
								html = html.replace(
									'<script type="module" src="/@vite/client"></script>',
									`<script type="module" src="${basePath}/@vite/client"></script>`
								);

								// Fix the main module script
								html = html.replace(
									/(<script[^>]*type="module"[^>]*src=")([^"]+)"/g,
									(match, prefix, src) => {
										// Don't modify Vite internal paths or absolute URLs
										if (
											src.startsWith("http") ||
											src.startsWith("/@")
										) {
											if (src.startsWith("/@")) {
												return `${prefix}${basePath}${src}"`;
											}
											return match;
										}
										// Add base path to relative paths
										if (src.startsWith("/")) {
											return `${prefix}${basePath}${src}"`;
										}
										return match;
									}
								);

								// Inject our configuration
								if (html.includes("</head>")) {
									html = html.replace(
										"</head>",
										`${viteConfig}</head>`
									);
								} else {
									html = viteConfig + html;
								}

								// Update content length
								const newContent = Buffer.from(html, "utf-8");
								res.setHeader(
									"content-length",
									newContent.length.toString()
								);

								// Send the modified response
								destination.write(newContent);
								destination.end();
							});

							return destination;
						};
					}
				},
			},
		});

		return proxy(req, res, next);
	};
}
