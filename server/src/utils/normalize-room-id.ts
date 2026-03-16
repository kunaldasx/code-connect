/**
 * Utility function for normalizing room IDs by removing hyphens.
 * Features:
 * - Hyphen removal
 * - Room ID formatting
 *
 * By Kunal Das
 */

export const normalizeRoomId = (roomId: string): string => {
  return roomId.replace(/-/g, "");
};
