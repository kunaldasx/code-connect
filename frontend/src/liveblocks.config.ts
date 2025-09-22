/* eslint-disable @typescript-eslint/no-empty-object-type */
import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";
import { colors } from "./lib/colors";

// Liveblocks client
const client = createClient({
	// publicApiKey: "",
	authEndpoint: "/api/lib-auth",
});

// ==== Types ====
type Presence = {
	cursor: { x: number; y: number } | null;
	inCall?: boolean;
	userName?: string;
	userColor?: string;
};
export type Storage = {};
export type UserMeta = {
	id: string;
	info: {
		name: string;
		email: string;
		color: keyof typeof colors;
		image: string;
	};
};
type RoomEvent =
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	| { type: "webrtc-signal"; from: string; to: string; signal: any }
	| { type: "user-joined-call"; userId: string }
	| { type: "user-left-call"; userId: string };

export type ThreadMetadata = {};

export type UserAwareness = {
	user?: UserMeta["info"];
};
export type AwarenessList = [number, UserAwareness][];

// ==== Room Context ====
export const {
	RoomProvider,
	useOthers,
	useMyPresence,
	useUpdateMyPresence,
	useSelf,
	useBroadcastEvent,
	useEventListener,
	useRoom,
} = createRoomContext<Presence, Storage, UserMeta, RoomEvent, ThreadMetadata>(
	client
);

// ==== Yjs Provider (non-generic) ====
// If you want to type it, just alias the class directly.
export type TypedLiveblocksProvider = LiveblocksYjsProvider;
