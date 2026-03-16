/**
 * WebRTC service handlers for peer-to-peer video streaming.
 * Features:
 * - Targeted stream signaling
 * - Camera state sync
 * - User notification
 *
 * By Kunal Das
 */

import { StreamServiceMsg } from "../types/message.js";
import type { SignalData } from "simple-peer";
import type { Socket } from "@/types.js";

import * as roomService from "./room-service.js";
import * as userService from "./user-service.js";

// Notify all other users in the room that this user is ready to stream
export const onStreamReady = (socket: Socket) => {
  const room = roomService.getUserRoom(socket);
  const customId = userService.getCustomId(socket.id);
  if (room && customId) {
    socket.to(room).emit(StreamServiceMsg.USER_READY, customId);
  }
};

// Forward the WebRTC signal to the specific target user only
export const handleSignal = (
  socket: Socket,
  data: { signal: SignalData; targetUserID: string },
) => {
  const customId = userService.getCustomId(socket.id);
  if (!customId) {
    return;
  }
  const targetSocketId = userService.getSocketId(data.targetUserID);
  if (!targetSocketId) {
    return;
  }
  socket.to(targetSocketId).emit(StreamServiceMsg.SIGNAL, {
    userID: customId,
    signal: data.signal,
  });
};

// Notify all other users in the room that this user's camera is off
export const onCameraOff = (socket: Socket) => {
  const room = roomService.getUserRoom(socket);
  const customId = userService.getCustomId(socket.id);
  if (room && customId) {
    socket.to(room).emit(StreamServiceMsg.CAMERA_OFF, customId);
  }
};

export const handleMicState = (socket: Socket, micOn: boolean) => {
  const room = roomService.getUserRoom(socket);
  const customId = userService.getCustomId(socket.id);
  if (room && customId) {
    socket.to(room).emit(StreamServiceMsg.MIC_STATE, {
      userID: customId,
      micOn,
    });
  }
};

export const handleSpeakerState = (socket: Socket, speakersOn: boolean) => {
  const room = roomService.getUserRoom(socket);
  const customId = userService.getCustomId(socket.id);
  if (room && customId) {
    socket.to(room).emit(StreamServiceMsg.SPEAKER_STATE, {
      userID: customId,
      speakersOn,
    });
  }
};
