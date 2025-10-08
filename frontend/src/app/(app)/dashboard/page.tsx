import Dashboard from "@/components/dashboard";
import Navbar from "@/components/dashboard/navbar";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { User } from "@/types/codeEditor";

export default async function DashboardPage() {
	const user = await currentUser();

	if (!user) {
		redirect("/");
	}

	console.log(user.id);

	const userRes = await fetch(
		`${process.env.DATABASE_INITIAL_URL}/api/user?id=${user.id}`
	);
	const userData = (await userRes.json()) as User;
	console.log(userData);

	const sharedRes = await fetch(
		`${process.env.DATABASE_INITIAL_URL}/api/virtualbox/share?id=${user.id}`
	);

	const shared = (await sharedRes.json()) as {
		id: string;
		name: string;
		type: "react" | "node";
		author: {
			id: string;
			name: string;
			email: string;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			image: any;
		};
		sharedOn: Date;
	}[];

	console.log("shared: ", shared);

	return (
		<>
			<Navbar />
			<Dashboard virtualboxes={userData.virtualbox} shared={shared} />
		</>
	);
}
