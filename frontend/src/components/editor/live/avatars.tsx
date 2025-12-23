"use client";

import { colorClasses } from "@/lib/colors";
import { useOthers } from "@/liveblocks.config";
import Image from "next/image";

export function Avatars() {
	const users = useOthers();

	return (
		<div className="flex space-x-2 mr-2">
			{users.map(({ connectionId, info }) => {
				return (
					<div
						className={`w-6 h-6 font-mono rounded-full ring-2 ${
							colorClasses[info.color].ring
						} ring-offset-2 ring-offset-background overflow-hidden flex items-center justify-center`}
						key={connectionId}
					>
						<Image
							src={info.image}
							alt="connected user profile"
							width={100}
							height={100}
						/>
					</div>
				);
			})}
		</div>
	);
}
