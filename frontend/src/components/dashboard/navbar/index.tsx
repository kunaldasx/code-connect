import Image from "next/image";
import Logo from "@/assets/logo.png";
import { dark } from "@clerk/themes";
import Link from "next/link";
import DashboardNavbarSearch from "./search";
import { User } from "@/types/codeEditor";
import ThemeButton from "@/components/shared/themeButton";
import { UserButton } from "@clerk/nextjs";

export default function Navbar({ userData }: { userData: User }) {
	return (
		<div className="h-14 px-2 w-full border-b border-border flex items-center justify-between">
			<div className="flex items-center space-x-4">
				<Link
					href={"/"}
					className="ring-offset-2 ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none rounded-sm"
				>
					<Image src={Logo} alt="Logo" width={36} height={36} />
				</Link>
				<div className="text-sm font-medium flex items-center">
					Virtualbox
				</div>
			</div>
			<div className="flex items-center space-x-2">
				<DashboardNavbarSearch />
				<ThemeButton />
				<UserButton appearance={{ theme: dark }} />
			</div>
		</div>
	);
}
