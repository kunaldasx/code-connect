import express from "express";
import type { Express } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import getVirtualboxFiles from "./getVirtualboxFiles.js";
import { z } from "zod";
import {
	createFile,
	deleteFile,
	generateCode,
	getFolder,
	getProjectSize,
	renameFile,
	saveFile,
} from "./utils.js";
import path from "path";
import fs from "fs";
import { spawn } from "@homebridge/node-pty-prebuilt-multiarch";
import type {
	IDisposable,
	IPty,
} from "@homebridge/node-pty-prebuilt-multiarch";
import os from "os";
import {
	MAX_BODY_SIZE,
	createFileRL,
	createFolderRL,
	deleteFileRL,
	renameFileRL,
	saveFileRL,
} from "./ratelimit.js";
import type { User } from "./types.js";
import { fileURLToPath } from "url";
import "dotenv/config";
import { error } from "console";

const app: Express = express();

const port = process.env.PORT || 4000;

const httpServer = createServer(app);
const io = new Server(httpServer, {
	cors: {
		origin: "*",
	},
	// Add connection timeout and other options
	connectTimeout: 60000,
	pingTimeout: 60000,
	pingInterval: 25000,
});

let inactivityTimeout: NodeJS.Timeout | null = null;
const connectionAttempts = new Map<string, number>();
const CONNECTION_COOLDOWN = 1000; // 1 second cooldown

// Enhanced connection tracking
const connectedUsers = new Map<
	string,
	{
		socketId: string;
		userId: string;
		virtualboxId: string;
		isOwner: boolean;
		connectedAt: Date;
	}
>();

// Track owners separately for quick lookup
const connectedOwners = new Set<string>();

const virtualboxSessions = new Map<
	string,
	{
		files: any[];
		fileData: Array<{ id: string; data: string }>;
		lastSyncTime: Date;
	}
>();

const terminals: {
	[id: string]: {
		terminal: IPty;
		onData: IDisposable;
		onExit: IDisposable;
	};
} = {};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dirName = path.join(__dirname, "..");

const handshakeSchema = z.object({
	userId: z.string(),
	virtualboxId: z.string(),
	EIO: z.string().optional(),
	transport: z.string().optional(),
	t: z.string().optional(),
});

// Helper function to get user connection key
const getUserConnectionKey = (userId: string, virtualboxId: string): string => {
	return `${userId}:${virtualboxId}`;
};

// Helper function to disconnect existing user connection
const disconnectExistingUser = (userKey: string) => {
	const existingConnection = connectedUsers.get(userKey);
	if (existingConnection) {
		console.log(`Disconnecting existing connection for user: ${userKey}`);
		const existingSocket = io.sockets.sockets.get(
			existingConnection.socketId
		);
		if (existingSocket) {
			existingSocket.emit(
				"forceDisconnect",
				"New connection established"
			);
			existingSocket.disconnect(true);
		}
		connectedUsers.delete(userKey);
		if (existingConnection.isOwner) {
			connectedOwners.delete(existingConnection.virtualboxId);
		}
	}
};

io.use(async (socket, next) => {
	try {
		const q = socket.handshake.query;

		const parseQuery = handshakeSchema.safeParse(q);

		if (!parseQuery.success) {
			console.log("Invalid query parameters:", parseQuery.error);
			next(new Error("Invalid request"));
			return;
		}

		const { virtualboxId, userId } = parseQuery.data;
		console.log(
			"Connection attempt - virtualboxId:",
			virtualboxId,
			"userId:",
			userId
		);

		// Check for rapid reconnection attempts
		const lastAttempt = connectionAttempts.get(userId);
		const now = Date.now();

		if (lastAttempt && now - lastAttempt < CONNECTION_COOLDOWN) {
			console.log(`Rejecting rapid reconnection from user: ${userId}`);
			next(new Error("Too many connection attempts"));
			return;
		}

		connectionAttempts.set(userId, now);

		// Check for duplicate connection
		const userKey = getUserConnectionKey(userId, virtualboxId);
		const existingConnection = connectedUsers.get(userKey);

		if (existingConnection && existingConnection.socketId !== socket.id) {
			console.log(`Duplicate connection detected for user: ${userKey}`);
			// Disconnect the existing connection
			disconnectExistingUser(userKey);
		}

		const dbUser = await fetch(
			`${process.env.DATABASE_INITIAL_URL}/api/user?id=${userId}`
		);

		if (!dbUser.ok) {
			next(new Error("Failed to fetch user data"));
			return;
		}

		const dbUserJSON: User = (await dbUser.json()) as User;

		if (!dbUserJSON) {
			next(new Error("User not found"));
			return;
		}

		const virtualbox = dbUserJSON.virtualbox.find(
			(v: any) => v.id === virtualboxId
		);

		const sharedVirtualboxes = dbUserJSON.usersToVirtualboxes.find(
			(utv: any) => utv.virtualboxId === virtualboxId
		);

		if (!virtualbox && !sharedVirtualboxes) {
			next(new Error("Invalid credentials"));
			return;
		}

		const isOwner = virtualbox !== undefined;

		// Store connection info in socket data
		socket.data = {
			id: virtualboxId,
			userId,
			isOwner,
			userKey,
		};

		next();
	} catch (error) {
		console.error("[❌ Middleware error]", error);
		next(new Error("Internal server error"));
	}
});

io.on("connection", async (socket) => {
	console.log("Socket connected:", socket.id);

	if (inactivityTimeout) clearTimeout(inactivityTimeout);

	const data = socket.data as {
		userId: string;
		id: string;
		isOwner: boolean;
		userKey: string;
	};

	// Register the new connection
	connectedUsers.set(data.userKey, {
		socketId: socket.id,
		userId: data.userId,
		virtualboxId: data.id,
		isOwner: data.isOwner,
		connectedAt: new Date(),
	});

	if (data.isOwner) {
		connectedOwners.add(data.id);
		console.log(`Owner connected for virtualbox: ${data.id}`);
	} else if (!connectedOwners.has(data.id)) {
		console.log("The virtual box owner is not connected");
		socket.emit("disableAccess", "The virtualbox owner is not connected.");
		// Still register the connection but in a disabled state
		return;
	}

	// Load files ONCE on connection
	let virtualboxFiles = virtualboxSessions.get(data.id);

	if (!virtualboxFiles) {
		// First connection for this virtualbox - load from API
		const freshFiles = await getVirtualboxFiles(data.id);
		if (freshFiles) {
			virtualboxFiles = {
				files: freshFiles.files,
				fileData: freshFiles.fileData,
				lastSyncTime: new Date(),
			};
			virtualboxSessions.set(data.id, virtualboxFiles);
		}
	}

	virtualboxFiles?.fileData.forEach((file) => {
		const filePath = path.join(dirName, file.id);
		fs.mkdirSync(path.dirname(filePath), { recursive: true });
		fs.writeFile(filePath, file.data, function (err) {
			if (err) console.error("Error writing file:", err);
		});
	});

	socket.emit("loaded", virtualboxFiles?.files);

	// Add a heartbeat to detect dead connections
	const heartbeatInterval = setInterval(() => {
		socket.emit("ping");
	}, 30000);

	// Helper function to update in-memory state and sync to API
	const updateVirtualboxState = async (updateFn: (state: any) => void) => {
		if (virtualboxFiles) {
			updateFn(virtualboxFiles);
			virtualboxFiles.lastSyncTime = new Date();
		}
	};

	socket.on("pong", () => {
		// Client is still alive
	});

	// Handle force disconnect from server
	socket.on("forceDisconnect", (reason: string) => {
		console.log(`Force disconnect: ${reason}`);
		socket.disconnect();
	});

	socket.on("getFile", async (fileId: string, callback) => {
		try {
			const file = virtualboxFiles?.fileData.find((f) => f.id === fileId);

			if (!file) {
				callback(null);
				return;
			}

			callback(file.data);
		} catch (error) {
			console.error("Error getting file:", error);
			callback(null);
		}
	});

	socket.on("saveFile", async (fileId: string, body: string) => {
		try {
			await saveFileRL.consume(data.userId, 1);

			if (Buffer.byteLength(body, "utf-8") > MAX_BODY_SIZE) {
				socket.emit(
					"rateLimit",
					"Rate limited: file size too large. Please reduce the file size."
				);
				return;
			}

			await updateVirtualboxState((state) => {
				const file = state.fileData.find((f: any) => f.id === fileId);
				if (file) {
					file.data = body;
				}
			});

			fs.writeFile(path.join(dirName, fileId), body, function (err) {
				if (err) console.error("Error writing file:", err);
			});

			await saveFile(fileId, body);
		} catch (e) {
			socket.emit(
				"rateLimit",
				"Rate limited: file saving. Please slow down."
			);
		}
	});

	socket.on("createFile", async (name: string, callback) => {
		try {
			const size: number = await getProjectSize(data.id);
			if (size > 200 * 1024 * 1024) {
				io.emit(
					"rateLimit",
					"Rate Limited: project size exceeded. Please delete some files."
				);
				callback({ success: false });
			}
			await createFileRL.consume(data.userId, 1);
			const id = `projects/${data.id}/${name}`;

			await updateVirtualboxState((state) => {
				state.files.push({ id, name, type: "file" });
				state.fileData.push({ id, data: "" });
			});

			fs.writeFile(path.join(dirName, id), "", function (err) {
				if (err) throw err;
			});

			await createFile(id);
			callback({ success: true });
		} catch (e) {
			io.emit(
				"rateLimit",
				"Rate limited: file saving. Please slow down."
			);
		}
	});

	socket.on(
		"moveFile",
		async (fileId: string, folderId: string, callback) => {
			try {
				const file = virtualboxFiles?.fileData.find(
					(f: any) => f.id === fileId
				);
				if (!file) {
					callback(null);
					return;
				}

				const parts = fileId.split("/");
				const fileName = parts.pop();
				const newFileId = folderId + "/" + fileName;

				// Update in-memory state FIRST
				await updateVirtualboxState((state) => {
					// Update fileData
					const fileToUpdate = state.fileData.find(
						(f: any) => f.id === fileId
					);
					if (fileToUpdate) {
						fileToUpdate.id = newFileId;
					}

					// Update files array
					const fileInList = state.files.find(
						(f: any) => f.id === fileId
					);
					if (fileInList) {
						fileInList.id = newFileId;
					}
				});

				// Update filesystem
				fs.rename(
					path.join(dirName, fileId),
					path.join(dirName, newFileId),
					(err) => {
						if (err) {
							console.error("Error moving file on disk:", err);
							// Revert in-memory state if filesystem operation fails
							updateVirtualboxState((state) => {
								const fileToRevert = state.fileData.find(
									(f: any) => f.id === newFileId
								);
								if (fileToRevert) {
									fileToRevert.id = fileId;
								}
								const fileInListToRevert = state.files.find(
									(f: any) => f.id === newFileId
								);
								if (fileInListToRevert) {
									fileInListToRevert.id = fileId;
								}
							});
						}
					}
				);

				// Update database async
				renameFile(fileId, newFileId, file.data).catch((err) => {
					console.error("Failed to sync file move to database:", err);
				});

				// Return updated files from memory (NO API CALL)
				callback(virtualboxFiles?.files);
			} catch (error) {
				console.error("Error in moveFile:", error);
				callback(null);
			}
		}
	);

	socket.on("deleteFile", async (fileId: string, callback) => {
		try {
			await deleteFileRL.consume(data.userId, 1);

			const file = virtualboxFiles?.fileData.find((f) => f.id === fileId);
			if (!file) {
				callback(virtualboxFiles?.files);
				return;
			}

			// Update in-memory state FIRST
			await updateVirtualboxState((state) => {
				state.fileData = state.fileData.filter(
					(f: any) => f.id !== fileId
				);
				state.files = state.files.filter((f: any) => f.id !== fileId);
			});

			// Update filesystem
			fs.unlink(path.join(dirName, fileId), (err) => {
				if (err) {
					console.error("Error deleting file from disk:", err);
				}
			});

			// Update database async
			deleteFile(fileId).catch((err) => {
				console.error("Failed to sync file deletion to database:", err);
			});

			// Return updated files from memory (NO API CALL)
			callback(virtualboxFiles?.files);
		} catch (e) {
			socket.emit(
				"rateLimit",
				"Rate limited: file deletion. Please slow down."
			);
			callback(virtualboxFiles?.files);
		}
	});

	socket.on("getFolder", async (folderId: string, callback) => {
		try {
			// Try to get folder contents from memory first
			const folderFiles = virtualboxFiles?.files.filter(
				(file: any) =>
					file.id.startsWith(folderId + "/") && file.id !== folderId
			);

			if (folderFiles && folderFiles.length > 0) {
				// Return from memory
				callback(folderFiles.map((f: any) => f.id));
			} else {
				// Fallback to API call if needed
				const files = await getFolder(folderId);
				callback(files);
			}
		} catch (error) {
			console.error("Error getting folder:", error);
			callback([]);
		}
	});

	socket.on("deleteFolder", async (folderId: string, callback) => {
		try {
			// Get folder contents from memory first
			const folderFiles =
				virtualboxFiles?.fileData
					.filter((f: any) => f.id.startsWith(folderId + "/"))
					.map((f: any) => f.id) || [];

			// If no files in memory, fallback to API
			const filesToDelete =
				folderFiles.length > 0
					? folderFiles
					: await getFolder(folderId);

			if (filesToDelete && filesToDelete.length > 0) {
				// Update in-memory state FIRST
				await updateVirtualboxState((state) => {
					state.fileData = state.fileData.filter(
						(f: any) => !filesToDelete.includes(f.id)
					);
					state.files = state.files.filter(
						(f: any) =>
							!filesToDelete.includes(f.id) &&
							!f.id.startsWith(folderId + "/")
					);
				});

				// Update filesystem and database
				await Promise.all(
					filesToDelete.map(async (file: string) => {
						// Delete from filesystem
						fs.unlink(path.join(dirName, file), (err) => {
							if (err) {
								console.error(
									`Error deleting file ${file} from disk:`,
									err
								);
							}
						});

						// Delete from database async
						deleteFile(file).catch((err) => {
							console.error(
								`Failed to sync deletion of ${file} to database:`,
								err
							);
						});
					})
				);
			}

			// Return updated files from memory (NO API CALL)
			callback(virtualboxFiles?.files);
		} catch (error) {
			console.error("Error deleting folder:", error);
			callback(virtualboxFiles?.files);
		}
	});

	socket.on(
		"renameFolder",
		async (oldFolderId: string, newFolderId: string, callback) => {
			try {
				// Get all files in the folder from memory
				const folderFiles =
					virtualboxFiles?.fileData.filter((f: any) =>
						f.id.startsWith(oldFolderId + "/")
					) || [];

				if (folderFiles.length === 0) {
					callback(virtualboxFiles?.files);
					return;
				}

				// Update in-memory state FIRST
				await updateVirtualboxState((state) => {
					// Update fileData
					state.fileData.forEach((f: any) => {
						if (f.id.startsWith(oldFolderId + "/")) {
							f.id = f.id.replace(oldFolderId, newFolderId);
						}
					});

					// Update files array
					state.files.forEach((f: any) => {
						if (f.id.startsWith(oldFolderId + "/")) {
							f.id = f.id.replace(oldFolderId, newFolderId);
						}
					});
				});

				// Update filesystem
				fs.rename(
					path.join(dirName, oldFolderId),
					path.join(dirName, newFolderId),
					(err) => {
						if (err) {
							console.error(
								"Error renaming folder on disk:",
								err
							);
						}
					}
				);

				// Update database for all files in folder async
				folderFiles.forEach((file: any) => {
					const newFileId = file.id.replace(oldFolderId, newFolderId);
					renameFile(file.id, newFileId, file.data).catch((err) => {
						console.error(
							`Failed to sync rename of ${file.id} to database:`,
							err
						);
					});
				});

				// Return updated files from memory (NO API CALL)
				callback(virtualboxFiles?.files);
			} catch (error) {
				console.error("Error renaming folder:", error);
				callback(virtualboxFiles?.files);
			}
		}
	);

	socket.on("createFolder", async (name: string, callback) => {
		try {
			await createFolderRL.consume(data.userId, 1);

			const id = `projects/${data.id}/${name}`;

			// Update in-memory state FIRST
			await updateVirtualboxState((state) => {
				// Add folder to files array
				state.files.push({
					id,
					name,
					type: "folder",
				});
			});

			// Create folder on filesystem
			fs.mkdir(path.join(dirName, id), { recursive: true }, (err) => {
				if (err) {
					console.error("Error creating folder on disk:", err);
					// Revert in-memory state if filesystem operation fails
					updateVirtualboxState((state) => {
						state.files = state.files.filter(
							(f: any) => f.id !== id
						);
					});
				}
			});

			callback({ success: true, files: virtualboxFiles?.files });
		} catch (e) {
			socket.emit(
				"rateLimit",
				"Rate limited: folder creation. Please slow down"
			);
			callback({ success: false });
		}
	});

	socket.on(
		"resizeTerminal",
		(dimensions: { cols: number; rows: number }) => {
			try {
				Object.values(terminals).forEach((t) => {
					t.terminal.resize(dimensions.cols, dimensions.rows);
				});
			} catch (error) {
				console.error("Error resizing terminals:", error);
			}
		}
	);

	socket.on(
		"renameFile",
		async (fileId: string, newName: string, callback) => {
			try {
				await renameFileRL.consume(data.userId, 1);

				const file = virtualboxFiles?.fileData.find(
					(f) => f.id === fileId
				);
				if (!file) {
					callback({ success: false, error: "File not found" });
					return;
				}

				const parts = fileId.split("/");
				const newFileId =
					parts.slice(0, parts.length - 1).join("/") + "/" + newName;

				// Update in-memory state FIRST
				await updateVirtualboxState((state) => {
					// Update fileData
					const fileToUpdate = state.fileData.find(
						(f: any) => f.id === fileId
					);
					if (fileToUpdate) {
						fileToUpdate.id = newFileId;
					}

					// Update files array
					const fileInList = state.files.find(
						(f: any) => f.id === fileId
					);
					if (fileInList) {
						fileInList.id = newFileId;
						fileInList.name = newName;
					}
				});

				// Update filesystem
				fs.rename(
					path.join(dirName, fileId),
					path.join(dirName, newFileId),
					(err) => {
						if (err) {
							console.error("Error renaming file on disk:", err);
							// Revert in-memory state if filesystem operation fails
							updateVirtualboxState((state) => {
								const fileToRevert = state.fileData.find(
									(f: any) => f.id === newFileId
								);
								if (fileToRevert) {
									fileToRevert.id = fileId;
								}
								const fileInListToRevert = state.files.find(
									(f: any) => f.id === newFileId
								);
								if (fileInListToRevert) {
									fileInListToRevert.id = fileId;
									fileInListToRevert.name =
										parts[parts.length - 1]; // original name
								}
							});
						}
					}
				);

				// Update database async
				renameFile(fileId, newFileId, file.data).catch((err) => {
					console.error(
						"Failed to sync file rename to database:",
						err
					);
				});

				callback({ success: true, files: virtualboxFiles?.files });
			} catch (e) {
				socket.emit(
					"rateLimit",
					"Rate limited: file renaming. Please slow down."
				);
				callback({ success: false, error: "Rate limited" });
			}
		}
	);

	socket.on("createTerminal", (id: string, callback) => {
		if (terminals[id]) {
			console.log("Terminal already exists:", id);
			callback(false);
			return;
		}

		if (Object.keys(terminals).length >= 4) {
			console.log("Max terminals reached");
			callback(false);
			return;
		}

		console.log("Creating terminal:", id);

		try {
			const pty = spawn(
				os.platform() === "win32" ? "powershell.exe" : "bash",
				[],
				{
					name: "xterm",
					cols: 100,
					rows: 30,
					cwd: path.join(dirName, "projects", data.id),
				}
			);

			const onData = pty.onData((data) => {
				// Send data to all connected sockets
				io.emit("terminalResponse", {
					id,
					data,
				});
			});

			const onExit = pty.onExit((code) => {
				console.log(`Terminal ${id} exited with code:`, code);
				// Clean up terminal on exit
				if (terminals[id]) {
					try {
						// Safely dispose handlers
						if (
							terminals[id].onData &&
							typeof terminals[id].onData.dispose === "function"
						) {
							terminals[id].onData.dispose();
						}
						if (
							terminals[id].onExit &&
							typeof terminals[id].onExit.dispose === "function"
						) {
							terminals[id].onExit.dispose();
						}
					} catch (err) {
						console.error(
							"Error disposing terminal handlers:",
							err
						);
					}
					delete terminals[id];
				}
			});

			terminals[id] = {
				terminal: pty,
				onData,
				onExit,
			};

			// Clear screen after terminal is ready
			setTimeout(() => {
				if (terminals[id] && terminals[id].terminal) {
					try {
						terminals[id].terminal.write(
							os.platform() === "win32" ? "cls\r" : "clear\r"
						);
					} catch (err) {
						console.error("Error clearing terminal screen:", err);
					}
				}
			}, 100);

			callback(true); // Success
		} catch (error) {
			console.error("Error creating terminal:", error);
			callback(false); // Failure
		}
	});

	socket.on("closeTerminal", (id: string, callback) => {
		if (!terminals[id]) {
			console.log("Terminal does not exist:", id);
			callback();
			return;
		}

		try {
			terminals[id].onData.dispose();
			terminals[id].onExit.dispose();
			delete terminals[id];
			console.log("Terminal closed:", id);
		} catch (error) {
			console.error("Error closing terminal:", error);
		}

		callback();
	});

	socket.on("terminalData", (id: string, data: string) => {
		if (!terminals[id]) {
			console.log("Terminal not found:", id);
			return;
		}

		try {
			terminals[id].terminal.write(data);
		} catch (error) {
			console.error("Error writing to terminal:", error);
		}
	});

	socket.on(
		"terminalResize",
		(id: string, dimensions: { cols: number; rows: number }) => {
			if (!terminals[id]) {
				return;
			}

			try {
				terminals[id].terminal.resize(dimensions.cols, dimensions.rows);
			} catch (error) {
				console.error("Error resizing terminal:", error);
			}
		}
	);

	socket.on(
		"generateCode",
		async (
			fileName: string,
			code: string,
			line: number,
			instructions: string,
			callback
		) => {
			try {
				const fetchPromise = fetch(
					`${process.env.DATABASE_INITIAL_URL}/api/virtualbox/generate`,
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							userId: data.userId,
						}),
					}
				);

				const generateCodePromise = generateCode({
					fileName,
					code,
					line,
					instructions,
				});

				const [fetchResponse, generateCodeResponse] = await Promise.all(
					[fetchPromise, generateCodePromise]
				);
				const json = await generateCodeResponse?.json();
				callback(json);
			} catch (err) {
				console.error("❌ generateCode handler error:", err);
				callback({ error: "Internal server error" });
			}
		}
	);

	socket.on("disconnect", async (reason) => {
		console.log(`Socket disconnected: ${socket.id}, reason: ${reason}`);

		clearInterval(heartbeatInterval);

		// Clean up connection tracking
		const connectionInfo = connectedUsers.get(data.userKey);
		if (connectionInfo && connectionInfo.socketId === socket.id) {
			connectedUsers.delete(data.userKey);

			if (data.isOwner) {
				connectedOwners.delete(data.id);

				// Clean up terminals when owner disconnects
				Object.entries(terminals).forEach(([termId, termInfo]) => {
					const { terminal, onData, onExit } = termInfo;
					if (os.platform() !== "win32") terminal.kill();
					onData.dispose();
					onExit.dispose();
					delete terminals[termId];
				});

				console.log("Owner disconnected, notifying other users");
				socket.broadcast.emit("ownerDisconnected");
			} else {
				console.log("Shared user disconnected");
			}
		}

		// Handle inactivity timeout
		const sockets = await io.fetchSockets();
		if (inactivityTimeout) {
			clearTimeout(inactivityTimeout);
		}

		if (sockets.length === 0) {
			inactivityTimeout = setTimeout(async () => {
				const currentSockets = await io.fetchSockets();
				if (currentSockets.length === 0) {
					console.log(
						"No users connected for 15 seconds - cleanup complete"
					);
				}
			}, 15000);
		}
	});
});

// Add endpoint to check connected users (useful for debugging)
app.get("/debug/connections", (req, res) => {
	const connections = Array.from(connectedUsers.entries()).map(
		([key, info]) => ({
			userKey: key,
			...info,
			connectedFor: Date.now() - info.connectedAt.getTime(),
		})
	);

	res.json({
		totalConnections: connectedUsers.size,
		owners: Array.from(connectedOwners),
		connections,
	});
});

httpServer.listen(port, () => {
	console.log(`[🚀 Server running on port ${port}]`);
});
