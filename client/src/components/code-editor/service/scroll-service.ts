/**
 * Monaco editor scroll sync service.
 * Features:
 * - Scroll position tracking
 * - Follow mode support
 * - User-specific scroll syncing
 *
 * By Kunal Das (https://kunaldasx.vercel.app)
 */

import type { Scroll } from "@/types/scroll";

import type * as monaco from "monaco-editor";
import type { RefObject } from "react";

import { storage } from "@/lib/services/storage";

export const updateScroll = (
  editorInstanceRef: RefObject<monaco.editor.IStandaloneCodeEditor | null>,
  userID: string,
  scroll: Scroll,
): void => {
  const editor = editorInstanceRef.current;
  if (!editor) {
    return;
  }

  if (storage.getFollowUserId() !== userID) {
    return; // Prevent duplicate scroll events
  }

  editor.setScrollPosition({ scrollLeft: scroll[0], scrollTop: scroll[1] });
};
