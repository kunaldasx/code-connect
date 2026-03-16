/**
 * Socket service for handling scroll position synchronization.
 * Features:
 * - Room-based scroll updates
 * - User identification
 * - Socket messaging
 *
 * By Kunal Das
 */

import { ScrollServiceMsg } from "../types/message.js";
import type { Scroll } from "../types/scroll.js";
import type { Socket } from "@/types.js";

import { getUserRoom } from "./room-service.js";
import { getCustomId } from "./user-service.js";

export const updateScroll = (socket: Socket, scroll: Scroll) => {
  const roomID = getUserRoom(socket);
  if (!roomID) {
    return;
  }

  const customId = getCustomId(socket.id);
  if (customId) {
    socket.to(roomID).emit(ScrollServiceMsg.UPDATE_SCROLL, customId, scroll);
  }
};
