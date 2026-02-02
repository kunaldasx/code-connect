import { createProxyMiddleware } from "http-proxy-middleware";
import type { IncomingMessage } from "http";
import type { Socket } from "net";
import net from "net";
import { previewServers } from "./preview.js";

// Track active WebSocket connections
const activeWebSocketConnections = new Map<string, Set<Socket>>();

// Function to check if a server is actually running
function checkServerHealth(port: number): Promise<boolean> {
	return new Promise((resolve) => {
		const socket = new net.Socket();
		const timeout = 1000; // 1 second timeout

		socket.setTimeout(timeout);

		socket.on("connect", () => {
			socket.destroy();
			resolve(true);
		});

		socket.on("error", () => {
			resolve(false);
		});

		socket.on("timeout", () => {
			socket.destroy();
			resolve(false);
		});

		socket.connect(port, "localhost");
	});
}

// Cleanup dead servers periodically
setInterval(async () => {
	for (const [serverKey, server] of previewServers.entries()) {
		const isHealthy = await checkServerHealth(server.port);
		if (!isHealthy) {
			console.log(
				`[HEALTH CHECK] Server ${serverKey} on port ${server.port} is not responding, removing...`
			);
			previewServers.delete(serverKey);

			// Close any active WebSocket connections for this server
			const connections = activeWebSocketConnections.get(serverKey);
			if (connections) {
				connections.forEach((socket) => {
					try {
						socket.destroy();
					} catch (e) {
						console.error("Error destroying socket:", e);
					}
				});
				activeWebSocketConnections.delete(serverKey);
			}
		}
	}
}, 5000); // Check every 5 seconds

export function setupWebSocketProxy(httpServer: any) {
	// WebSocket proxy for Vite HMR and other WebSocket connections
	httpServer.on(
		"upgrade",
		async (request: IncomingMessage, socket: Socket, head: Buffer) => {
			const url = request.url;

			if (!url) {
				socket.destroy();
				return;
			}

			console.log(`[WS] Upgrade request for: ${url}`);

			// Check if this is a preview WebSocket connection
			const match = url.match(/^\/preview\/([^\/]+)\/([^\/]+)(.*)/);
			if (match) {
				const projectId = match[1];
				const userId = match[2];
				const remainingPath = match[3] || "/";
				const serverKey = `${projectId}_${userId}`;
				const server = previewServers.get(serverKey);

				if (server) {
					// First check if the server is actually healthy
					const isHealthy = await checkServerHealth(server.port);
					if (!isHealthy) {
						console.log(
							`[WS] Server ${serverKey} on port ${server.port} is not responding, removing...`
						);
						previewServers.delete(serverKey);
						socket.write(
							"HTTP/1.1 503 Service Unavailable\r\n\r\n"
						);
						socket.destroy();
						return;
					}

					console.log(
						`[WS] Found server for ${serverKey} on port ${server.port}`
					);

					// Track this WebSocket connection
					if (!activeWebSocketConnections.has(serverKey)) {
						activeWebSocketConnections.set(serverKey, new Set());
					}
					activeWebSocketConnections.get(serverKey)!.add(socket);

					// Create a WebSocket proxy for this connection
					const wsProxy = createProxyMiddleware({
						target: `ws://localhost:${server.port}`,
						ws: true,
						changeOrigin: true,

						// Rewrite the path to remove the preview prefix
						pathRewrite: (path) => {
							const basePath = `/preview/${projectId}/${userId}`;
							const newPath = path.replace(basePath, "");
							console.log(
								`[WS] Rewriting path: ${path} -> ${
									newPath || "/"
								}`
							);
							return newPath || "/";
						},

						// Enhanced error handling
						on: {
							error: (err, req, socket) => {
								console.error(
									`[WS] Proxy error for ${serverKey}:`,
									err.message
								);

								// Check if this is a connection refused error (server stopped)
								if (
									err.message.includes("ECONNREFUSED") ||
									err.message.includes("connect ECONNREFUSED")
								) {
									console.log(
										`[WS] Server ${serverKey} appears to be down, removing from registry`
									);
									// Remove the dead server from registry
									previewServers.delete(serverKey);
								}

								if (
									socket &&
									typeof socket.destroy === "function"
								) {
									socket.destroy();
								}
							},

							proxyReqWs: (
								proxyReq,
								req,
								socket,
								options,
								head
							) => {
								console.log(
									`[WS] Proxying WebSocket to localhost:${server.port}${remainingPath}`
								);

								// Set headers for Vite
								if (server.type === "vite") {
									proxyReq.setHeader(
										"Origin",
										`http://localhost:${server.port}`
									);
									proxyReq.setHeader(
										"Host",
										`localhost:${server.port}`
									);
								}
							},

							open: (proxySocket) => {
								console.log(
									`[WS] WebSocket connection opened for ${serverKey}`
								);

								// Listen for messages from the target server
								proxySocket.on("message", (data) => {
									// For Vite HMR, we might need to rewrite some paths in the messages
									if (server.type === "vite") {
										try {
											const message = data.toString();
											// Log HMR messages for debugging
											if (message.includes("update")) {
												console.log(
													`[WS HMR] Update message:`,
													message.substring(0, 100)
												);
											}
										} catch (e) {
											// Binary message, ignore
										}
									}
								});
							},

							close: (proxyRes, proxySocket, proxyHead) => {
								console.log(
									`[WS] WebSocket connection closed for ${serverKey}`
								);

								// Remove this socket from tracking
								const connections =
									activeWebSocketConnections.get(serverKey);
								if (connections) {
									connections.delete(socket);
									if (connections.size === 0) {
										activeWebSocketConnections.delete(
											serverKey
										);
									}
								}
							},
						},
					});

					// Upgrade the connection
					try {
						wsProxy.upgrade(request, socket, head);
					} catch (err) {
						console.error(
							"[WS] Failed to upgrade connection:",
							err
						);
						socket.destroy();
					}
				} else {
					console.log(`[WS] No server found for ${serverKey}`);
					// No server available, close the connection
					socket.write("HTTP/1.1 503 Service Unavailable\r\n\r\n");
					socket.destroy();
				}
			} else {
				// Not a preview WebSocket, check if it's for Socket.IO or other services
				console.log(`[WS] Non-preview WebSocket request: ${url}`);
				// Let other handlers deal with it
			}
		}
	);
}
