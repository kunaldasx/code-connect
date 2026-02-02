import {
	createProxyMiddleware,
	responseInterceptor,
} from "http-proxy-middleware";
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
	// Vite patterns - handle both regular and base path URLs
	{
		regex: /Local:\s+https?:\/\/localhost:(\d+)/i,
		type: "vite" as const,
	},
	{
		regex: /VITE v[\d.]+ ready in \d+ ms[\s\S]*Local:\s+https?:\/\/localhost:(\d+)/i,
		type: "vite" as const,
	},
	// Handle Vite with base path URLs
	{
		regex: /Local:\s+https?:\/\/localhost:(\d+)\/preview\/[^\/]+\/[^\/]+\//i,
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

			// Handle path rewriting for Vite base path
			pathRewrite: (path) => {
				console.log(`[PATH REWRITE DEBUG] Original path: ${path}`);
				console.log(`[PATH REWRITE DEBUG] Base path: ${basePath}`);

				// Check if path starts with basePath (proxied requests)
				if (path.startsWith(basePath)) {
					const newPath = path.substring(basePath.length) || "/";
					console.log(
						`[PATH REWRITE] ${path} -> ${newPath} (proxy path stripped)`
					);
					return newPath;
				} else {
					console.log(
						`[PATH REWRITE] ${path} -> ${path} (direct path, no rewrite needed)`
					);
					return path;
				}
			},

			// Don't verify SSL certificates (for development)
			secure: false,

			// Self-handle responses for Vite to rewrite HTML paths
			selfHandleResponse: server.type === "vite",

			// Handle errors and responses
			on: {
				error: (err, req, res) => {
					console.error(`Proxy error for ${projectId}_${userId}:`, err.message);
					
					// Check if this is a connection refused error (server stopped)
					if (err.message.includes('ECONNREFUSED') || err.message.includes('connect ECONNREFUSED')) {
						console.log(`[PROXY] Server ${projectId}_${userId} appears to be down, removing from registry`);
						// Remove the dead server from registry
						previewServers.delete(`${projectId}_${userId}`);
					}

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
										<h1>&#x26A0; Preview Server Error</h1>
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

				// HTML rewriting response handler for Vite
				proxyRes:
					server.type === "vite"
						? responseInterceptor(
								async (responseBuffer, proxyRes, req, res) => {
									// Add CORS headers
									proxyRes.headers[
										"access-control-allow-origin"
									] = "*";
									proxyRes.headers[
										"access-control-allow-methods"
									] = "GET, POST, PUT, DELETE, OPTIONS";
									proxyRes.headers[
										"access-control-allow-headers"
									] = "Content-Type";

									// Add cache control for development (prevent aggressive caching)
									if (
										req.url?.endsWith(".js") ||
										req.url?.endsWith(".jsx") ||
										req.url?.includes("/@vite/")
									) {
										proxyRes.headers["cache-control"] =
											"no-cache, no-store, must-revalidate";
										proxyRes.headers["pragma"] = "no-cache";
										proxyRes.headers["expires"] = "0";
									}

									// Log the response for debugging
									console.log(
										`[PROXY RESPONSE] ${req.url} -> ${proxyRes.statusCode} (${proxyRes.headers["content-type"]})`
									);

									// Fix MIME types for JavaScript files (including 304 responses)
									if (
										req.url?.endsWith(".js") ||
										req.url?.includes("/@vite/") ||
										req.url?.includes(".js?")
									) {
										proxyRes.headers["content-type"] =
											"application/javascript; charset=utf-8";
										console.log(
											`[MIME FIX] Fixed JS type for ${req.url} (${proxyRes.statusCode})`
										);
									} else if (
										req.url?.endsWith(".jsx") ||
										req.url?.includes(".jsx?")
									) {
										proxyRes.headers["content-type"] =
											"application/javascript; charset=utf-8";
										console.log(
											`[MIME FIX] Fixed JSX type for ${req.url} (${proxyRes.statusCode})`
										);
									} else if (
										req.url?.endsWith(".css") ||
										req.url?.includes(".css?")
									) {
										proxyRes.headers["content-type"] =
											"text/css; charset=utf-8";
									} else if (req.url?.endsWith(".svg")) {
										proxyRes.headers["content-type"] =
											"image/svg+xml";
										console.log(
											`[MIME FIX] Fixed SVG type for ${req.url}`
										);
									} else if (
										req.url?.includes("?import") ||
										req.url?.includes("?direct")
									) {
										proxyRes.headers["content-type"] =
											"application/javascript; charset=utf-8";
									}

									// Fix HTML content to rewrite absolute paths
									if (
										proxyRes.headers[
											"content-type"
										]?.includes("text/html")
									) {
										let html =
											responseBuffer.toString("utf8");
										console.log(
											"[HTML REWRITER] Processing HTML response"
										);

										// Fix src and href attributes that start with /
										html = html.replace(
											/(src|href)="(\/[^"]*)"/g,
											(match, attr, path) => {
												if (
													!path.startsWith(basePath)
												) {
													const newPath = `${attr}="${basePath}${path}"`;
													console.log(
														`[HTML FIX] ${match} -> ${newPath}`
													);
													return newPath;
												}
												return match;
											}
										);

										// Also fix import statements in script tags
										html = html.replace(
											/import\s*\(["'](\/[^"']*)["']\)/g,
											(match, path) => {
												if (
													!path.startsWith(basePath)
												) {
													const newPath = `import("${basePath}${path}")`;
													console.log(
														`[HTML FIX IMPORT] ${match} -> ${newPath}`
													);
													return newPath;
												}
												return match;
											}
										);

										// Fix import from statements
										html = html.replace(
											/import\s+[^"']*from\s*["'](\/[^"']*)["']/g,
											(match, path) => {
												if (
													!path.startsWith(basePath)
												) {
													const newMatch =
														match.replace(
															path,
															`${basePath}${path}`
														);
													console.log(
														`[HTML FIX FROM] ${match} -> ${newMatch}`
													);
													return newMatch;
												}
												return match;
											}
										);

										return html;
									}

									// Fix JavaScript module imports
									if (
										proxyRes.headers[
											"content-type"
										]?.includes("javascript") ||
										req.url?.includes(".js") ||
										req.url?.includes("@vite")
									) {
										let js =
											responseBuffer.toString("utf8");
										console.log(
											`[JS REWRITER] Processing JS response for ${req.url}`
										);

										// Fix import statements in JS files (including node_modules paths)
										const originalJs = js;
										js = js.replace(
											/import\s*\(["'](\/[^"']*)["']\)/g,
											(match, path) => {
												if (
													!path.startsWith(
														basePath
													) &&
													!path.startsWith("/@fs/")
												) {
													const newPath = `import("${basePath}${path}")`;
													console.log(
														`[JS FIX IMPORT] ${match} -> ${newPath}`
													);
													return newPath;
												}
												return match;
											}
										);

										// Fix import from statements in JS files (including node_modules)
										js = js.replace(
											/import\s+[^"']*from\s*["'](\/[^"']*)["']/g,
											(match, path) => {
												if (
													!path.startsWith(
														basePath
													) &&
													!path.startsWith("/@fs/")
												) {
													const newMatch =
														match.replace(
															path,
															`${basePath}${path}`
														);
													console.log(
														`[JS FIX FROM] ${match} -> ${newMatch}`
													);
													return newMatch;
												}
												return match;
											}
										);

										// Fix regular import statements (without quotes captured in previous regex)
										js = js.replace(
											/import\s+["'](\/[^"']*)["']/g,
											(match, path) => {
												if (
													!path.startsWith(
														basePath
													) &&
													!path.startsWith("/@fs/")
												) {
													const newMatch =
														match.replace(
															path,
															`${basePath}${path}`
														);
													console.log(
														`[JS FIX DIRECT] ${match} -> ${newMatch}`
													);
													return newMatch;
												}
												return match;
											}
										);

										if (js !== originalJs) {
											console.log(
												`[JS REWRITER] Modified JS content for ${req.url}`
											);
											return js;
										}
									}

									return responseBuffer;
								}
						  )
						: (proxyRes, req, res) => {
								// Simple handler for non-Vite servers
								proxyRes.headers[
									"access-control-allow-origin"
								] = "*";
								proxyRes.headers[
									"access-control-allow-methods"
								] = "GET, POST, PUT, DELETE, OPTIONS";
								proxyRes.headers[
									"access-control-allow-headers"
								] = "Content-Type";
								console.log(
									`[PROXY RESPONSE] ${req.url} -> ${proxyRes.statusCode} (${proxyRes.headers["content-type"]})`
								);
						  },

				// Handle proxy requests
				proxyReq: (proxyReq, req, res) => {
					// Extract the target path (remove base path)
					const targetPath = req.url?.replace(basePath, "") || "/";

					// Log for debugging
					console.log(
						`[PROXY] ${req.method} ${req.url} -> ${targetUrl}${targetPath}`
					);
					console.log(
						`[PROXY HEADERS] Accept: ${req.headers.accept}`
					);
					console.log(
						`[PROXY HEADERS] User-Agent: ${req.headers["user-agent"]}`
					);

					// Set proper headers for Vite
					if (server.type === "vite") {
						// Vite needs the correct Host header
						proxyReq.setHeader("Host", `localhost:${server.port}`);

						// Preserve original headers for HMR
						proxyReq.setHeader(
							"X-Forwarded-Host",
							req.headers.host || ""
						);
						proxyReq.setHeader("X-Forwarded-Proto", "http");
						proxyReq.setHeader(
							"X-Forwarded-For",
							(req as Request).ip || ""
						);

						// Accept headers for proper content negotiation
						if (!proxyReq.getHeader("Accept")) {
							proxyReq.setHeader(
								"Accept",
								req.headers.accept ||
									"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
							);
						}

						// User-Agent for compatibility
						if (!proxyReq.getHeader("User-Agent")) {
							proxyReq.setHeader(
								"User-Agent",
								req.headers["user-agent"] ||
									"Code-Connect-Proxy/1.0"
							);
						}
					}
				},
			},
		});

		return proxy(req, res, next);
	};
}
