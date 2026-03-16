/**
 * Socket service for handling pointer/cursor position updates.
 * Features:
 * - Real-time pointer sync
 * - Room-based updates
 * - User identity handling
 *
 * By Kunal Das
 */

import { PointerServiceMsg } from "../types/message.js";
import type { Pointer } from "../types/pointer.js";
import type { Socket } from "@/types.js";

import { getUserRoom } from "./room-service.js";
import { getCustomId } from "./user-service.js";

export const updatePointer = (socket: Socket, pointer: Pointer) => {
  const roomID = getUserRoom(socket);
  if (!roomID) {
    return;
  }

  const customId = getCustomId(socket.id);
  if (customId) {
    socket.to(roomID).emit(PointerServiceMsg.POINTER, customId, pointer);
  }
};
