import { StarsBackground } from "@/components/animate-ui/components/backgrounds/stars";
import { currentUser } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import logo from "@/assets/logo.png";
import AnimatedButton from "@/components/shared/animatedButton";

export default async function Home() {
	const user = await currentUser();

	if (user) {
		redirect("/dashboard");
	}
	return (
		<StarsBackground
			starColor="#b88bc8"
			className="flex w-full overflow-x-hidden overscroll-none flex-col justify-center items-center p-12"
		>
			<div className="w-full max-w-screen-md px-8 flex flex-col items-center gap-4 mt-12">
				<Image
					src={logo}
					height={100}
					width={100}
					alt="logo"
					className="object-cover"
				/>
				<h1 className="text-3xl font-semibold text-center leading-7">
					Code Connect
					<br />
					<span className="text-sm">
						Collaborate Smarter, Code Together
					</span>
				</h1>
				<div className="text-muted-foreground text-center">
					Code Connect is your all-in-one platform for real-time
					coding and communication. Whether you’re pair programming,
					running a coding workshop, or building a project with your
					team, Code Connect makes collaboration seamless. Our live
					editor lets multiple contributors work on the same codebase
					simultaneously, with every keystroke synced instantly.
					Built-in video conferencing keeps the conversation flowing,
					so you can discuss ideas, debug issues, and ship faster—all
					without switching tabs.
				</div>
				<div className="flex space-x-4">
					<Link href={"/sign-up"}>
						<AnimatedButton>Go To App</AnimatedButton>
					</Link>
				</div>
				<div className="w-full rounded-lg bg-neutral-800 aspect-video" />
			</div>
		</StarsBackground>
	);
}
