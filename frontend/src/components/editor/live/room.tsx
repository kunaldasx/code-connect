"use client";

import Loader from "@/components/shared/loader";
import { RoomProvider } from "@/liveblocks.config";
import { ClientSideSuspense } from "@liveblocks/react";
import React from "react";

export function Room({
	id,
	children,
}: {
	id: string;
	children: React.ReactNode;
}) {
	return (
		<RoomProvider
			id={id}
			initialPresence={{
				cursor: null,
			}}
		>
			<ClientSideSuspense fallback={<Loader />}>
				{() => children}
			</ClientSideSuspense>
		</RoomProvider>
	);
}
