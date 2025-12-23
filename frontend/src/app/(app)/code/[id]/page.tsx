import Navbar from "@/components/editor/navbar";
import { Room } from "@/components/editor/live/room";
import { User, UsersToVirtualboxes, Virtualbox } from "@/types/codeEditor";
import { currentUser } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import CodeEditorWrapper from "@/components/editor/codeEditorWrapper";

const getUserData = async (id: string) => {
	const userRes = await fetch(
		`${process.env.DATABASE_INITIAL_URL}/api/user?id=${id}`
	);
	const userData = (await userRes.json()) as User;
	return userData;
};

const getVirtualboxData = async (id: string) => {
	const virtualboxRes = await fetch(
		`${process.env.DATABASE_INITIAL_URL}/api/virtualbox?id=${id}`
	);
	const virtualboxData: Virtualbox = await virtualboxRes.json();
	return virtualboxData;
};

const getSharedUsers = async (usersToVirtualboxes: UsersToVirtualboxes[]) => {
	const shared = await Promise.all(
		usersToVirtualboxes?.map(async (user) => {
			const userRes = await fetch(
				`${process.env.DATABASE_INITIAL_URL}/api/user?id=${user.userId}`
			);
			const userData: User = await userRes.json();
			return {
				id: userData.id,
				name: userData.name,
				image: userData.image,
			};
		})
	);
	return shared;
};

export default async function CodePage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const user = await currentUser();
	const { id: virtualboxId } = await params;

	if (!user) {
		redirect("/");
	}

	const userData = await getUserData(user.id);
	const virtualboxData = await getVirtualboxData(virtualboxId);
	const shared = await getSharedUsers(
		virtualboxData.usersToVirtualboxes ?? []
	);

	const isOwner = virtualboxData.userId === user.id;
	const isSharedUser = shared.some((utv) => utv.id === user.id);

	if (!isOwner && !isSharedUser) {
		return notFound();
	}

	return (
		<div className="overflow-hidden overscroll-none w-screen flex flex-col h-screen bg-background">
			<Room id={virtualboxId}>
				<Navbar
					userData={userData}
					virtualboxData={virtualboxData}
					shared={shared}
				/>
				<div className="w-screen flex flex-1">
					<CodeEditorWrapper
						userData={userData}
						virtualboxData={virtualboxData}
					/>
				</div>
			</Room>
		</div>
	);
}
