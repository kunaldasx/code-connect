"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { unshareVirtualbox } from "@/lib/actions";
import { Loader2, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function SharedUser({
	user,
	virtualboxId,
}: {
	user: { id: string; name: string; image: string };
	virtualboxId: string;
}) {
	const [loading, setLoading] = useState(false);

	async function handleUnshare(id: string) {
		setLoading(true);

		await unshareVirtualbox(virtualboxId, user.id);
	}

	return (
		<div className="flex items-center justify-between">
			<div className="flex items-center">
				<Avatar className="mr-2">
					<AvatarImage src={user.image} alt="@shadcn" />
					<AvatarFallback>
						{user.name.slice(0, 1).toUpperCase()}
					</AvatarFallback>
				</Avatar>
				{user.name}
			</div>
			<Button
				disabled={loading}
				onClick={() => handleUnshare(user.id)}
				variant={"ghost"}
				size="sm"
			>
				{loading ? (
					<Loader2 className="animate-spin w-4 h-4" />
				) : (
					<X className="w-4 h-4" />
				)}
			</Button>
		</div>
	);
}
