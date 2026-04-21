/**
 * Socket.IO server entry point for CodeConnect.
 * Features:
 * - WebSocket server setup
 * - Service initialization
 * - Message handling
 * - CORS configuration
 *
 * By Kunal Das
 */

import { App } from "uWebSockets.js";
import {
	CodeServiceMsg,
	PointerServiceMsg,
	RoomServiceMsg,
	ScrollServiceMsg,
	StreamServiceMsg,
} from "./types/message.js";
import type { Cursor, EditOp } from "./types/operation.js";
import type { Pointer } from "./types/pointer.js";
import type { Scroll } from "./types/scroll.js";
import type {
	ClientToServerEvents,
	ServerToClientEvents,
} from "./types/socket-events.js";
import type { ExecutionResult } from "./types/terminal.js";
import type { SignalData } from "simple-peer";
import { Server } from "socket.io";

import * as codeService from "./service/code-service.js";
import * as pointerService from "./service/pointer-service.js";
import * as roomService from "./service/room-service.js";
import * as scrollService from "./service/scroll-service.js";
import * as userService from "./service/user-service.js";
import * as webRTCService from "./service/webrtc-service.js";

import {
	ALLOWED_ORIGINS,
	getCorsHeaders,
	isVercelDeployment,
} from "./cors-config.js";

const PORT = 3001;

const app = App();

const io = new Server<ClientToServerEvents, ServerToClientEvents>({
	cors: {
		origin: (origin, callback) => {
			if (process.env.NODE_ENV === "development") {
				callback(null, true);
				return;
			}

			if (
				!origin ||
				ALLOWED_ORIGINS.includes(origin as (typeof ALLOWED_ORIGINS)[number]) ||
				isVercelDeployment(origin)
			) {
				callback(null, true);
			} else {
				callback(new Error("Origin not allowed"));
			}
		},
		methods: ["GET", "POST"], // Socket.IO needs both
		credentials: true,
	},
	transports: ["websocket", "polling"],
	// Allow larger payloads for pasting large code blocks (default is 1MB)
	maxHttpBufferSize: 5e6, // 5MB
	// Recover socket state (rooms, missed packets) after brief disconnects
	connectionStateRecovery: {
		maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
		skipMiddlewares: true,
	},
});
io.attachApp(app);
io.engine.on("connection", (rawSocket) => {
	rawSocket.request = null;
});

app.listen(PORT, (token) => {
	if (!token) {
		console.warn(`Port ${PORT} is already in use`);
	}
	console.log(`codeconnect-server listening on port: ${PORT}`);
});

app.get("/", (res, req) => {
	const origin = req.getHeader("origin");
	const headers = getCorsHeaders(origin);

	for (const [key, value] of Object.entries(headers)) {
		res.writeHeader(key, value);
	}
	res.writeHeader("Content-Type", "text/plain");

	res.end(
		`Hello from codeconnect-server! Go to ${process.env.CLIENT_URL} to start coding.`,
	);
});

app.get("/api/status", (res, req) => {
	const origin = req.getHeader("origin");
	const headers = getCorsHeaders(origin);

	for (const [key, value] of Object.entries(headers)) {
		res.writeHeader(key, value);
	}

	res.writeHeader("Content-Type", "application/json");

	res.end(
		JSON.stringify({
			status: "online",
			uptime: Math.floor(process.uptime()),
			users: io.engine.clientsCount,
		}),
	);
});

io.on("connection", (socket) => {
	socket.on("ping", () => socket.emit("pong"));
	socket.on(RoomServiceMsg.CREATE, async (name: string) =>
		roomService.create(socket, name),
	);
	socket.on(RoomServiceMsg.JOIN, async (roomID: string, name: string) =>
		roomService.join(socket, io, roomID, name),
	);
	socket.on(RoomServiceMsg.LEAVE, async () => roomService.leave(socket, io));
	socket.on(RoomServiceMsg.TERMINATE, async () =>
		roomService.terminate(socket, io),
	);
	socket.on(RoomServiceMsg.SYNC_USERS, async () =>
		roomService.getUsersInRoom(socket, io),
	);
	socket.on(CodeServiceMsg.SYNC_CODE, async () =>
		codeService.syncCode(socket, io),
	);
	socket.on(CodeServiceMsg.UPDATE_CODE, async (op: EditOp) =>
		codeService.updateCode(socket, op),
	);
	socket.on(CodeServiceMsg.UPDATE_CURSOR, async (cursor: Cursor) =>
		userService.updateCursor(socket, cursor),
	);
	socket.on(CodeServiceMsg.SYNC_LANG, async () =>
		codeService.syncLang(socket, io),
	);
	socket.on(CodeServiceMsg.UPDATE_LANG, async (langID: string) =>
		codeService.updateLang(socket, langID),
	);
	socket.on(ScrollServiceMsg.UPDATE_SCROLL, async (scroll: Scroll) =>
		scrollService.updateScroll(socket, scroll),
	);
	socket.on(RoomServiceMsg.SYNC_MD, () => {
		roomService.syncNote(socket, io);
	});
	socket.on(RoomServiceMsg.UPDATE_MD, async (note: string) =>
		roomService.updateNote(socket, note),
	);
	socket.on(CodeServiceMsg.EXEC, async (isExecuting: boolean) =>
		roomService.updateExecuting(socket, isExecuting),
	);
	socket.on(CodeServiceMsg.UPDATE_TERM, async (data: ExecutionResult) =>
		roomService.updateTerminal(socket, data),
	);
	socket.on(StreamServiceMsg.STREAM_READY, () =>
		webRTCService.onStreamReady(socket),
	);
	socket.on(
		StreamServiceMsg.SIGNAL,
		(data: { signal: SignalData; targetUserID: string }) =>
			webRTCService.handleSignal(socket, data),
	);
	socket.on(StreamServiceMsg.CAMERA_OFF, () =>
		webRTCService.onCameraOff(socket),
	);
	socket.on(StreamServiceMsg.MIC_STATE, (micOn: boolean) =>
		webRTCService.handleMicState(socket, micOn),
	);
	socket.on(StreamServiceMsg.SPEAKER_STATE, (speakersOn: boolean) =>
		webRTCService.handleSpeakerState(socket, speakersOn),
	);
	socket.on(PointerServiceMsg.POINTER, (pointer: Pointer) =>
		pointerService.updatePointer(socket, pointer),
	);
	socket.on("disconnecting", () => roomService.leave(socket, io));
});
