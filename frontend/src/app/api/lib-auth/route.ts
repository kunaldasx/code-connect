import { colors } from "@/lib/colors";
import { User } from "@/types/codeEditor";
import { currentUser } from "@clerk/nextjs/server";
import { Liveblocks } from "@liveblocks/node";
import { NextRequest } from "next/server";

const liveblocks = new Liveblocks({
	secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

export async function POST(request: NextRequest) {
	const clerkUser = await currentUser();

	if (!clerkUser) {
		return new Response("Unauthorized", { status: 401 });
	}

	const res = await fetch(
		`${process.env.DATABASE_INITIAL_URL}/api/user?id=${clerkUser.id}`
	);
	const user = (await res.json()) as User;

	const colorNames = Object.keys(colors);
	const randomColor = colorNames[
		Math.floor(Math.random() * colorNames.length)
	] as keyof typeof colors;
	const code = colors[randomColor];

	const session = liveblocks.prepareSession(user.id, {
		userInfo: {
			id: user.id,
			name: user.name,
			email: user.email,
			color: randomColor,
			image: clerkUser.imageUrl,
		},
	});

	user.virtualbox.forEach((virtualbox) => {
		session.allow(`${virtualbox.id}`, session.FULL_ACCESS);
	});
	user.usersToVirtualboxes.forEach((userToVirtualbox) => {
		session.allow(`${userToVirtualbox.virtualboxId}`, session.FULL_ACCESS);
	});

	const { body, status } = await session.authorize();
	return new Response(body, { status });
}
