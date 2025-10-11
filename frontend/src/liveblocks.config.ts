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
export type Presence = {};
export type Storage = {};
export type UserMeta = {
	id: string;
	info: {
		name: string;
		email: string;
		color: keyof typeof colors;
	};
};
export type RoomEvent = {};
export type ThreadMetadata = {};

export type UserAwareness = {
	user?: UserMeta["info"];
};
export type AwarenessList = [number, UserAwareness][];

// ==== Room Context ====
export const { RoomProvider, useRoom, useSelf, useOthers, useMyPresence } =
	createRoomContext<Presence, Storage, UserMeta, RoomEvent, ThreadMetadata>(
		client
	);

// ==== Yjs Provider (non-generic) ====
// If you want to type it, just alias the class directly.
export type TypedLiveblocksProvider = LiveblocksYjsProvider;
