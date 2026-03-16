/**
 * Typed Socket.IO server types for compile-time event safety.
 *
 * By Kunal Das
 */

import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "./types/socket-events.js";
import type { Server as IOServer, Socket as IOSocket } from "socket.io";

export type Server = IOServer<ClientToServerEvents, ServerToClientEvents>;
export type Socket = IOSocket<ClientToServerEvents, ServerToClientEvents>;
