"use client";

import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { colorClasses } from "@/lib/colors";
import { useOthers } from "@/liveblocks.config";
import Image from "next/image";

export function Avatars() {
	const users = useOthers();

	return (
		<div className="flex space-x-2 pr-4">
			{users.map(({ connectionId, info }) => {
				return (
					<Tooltip key={connectionId}>
						<TooltipTrigger asChild>
							<div
								className={`w-6 h-6 font-mono rounded-full ring-2 ${
									colorClasses[info.color].ring
								} ring-offset-2 ring-offset-background overflow-hidden flex items-center justify-center relative`}
								key={connectionId}
							>
								<Image
									src={info.image}
									alt="connected user profile"
									width={100}
									height={100}
								/>
							</div>
						</TooltipTrigger>
						<TooltipContent>
							<p>{info.name}</p>
						</TooltipContent>
					</Tooltip>
				);
			})}
		</div>
	);
}
