"use client";

import Image from "next/image";
import Logo from "@/assets/logo.png";
import { dark, shadcn } from "@clerk/themes";
import Link from "next/link";
import DashboardNavbarSearch from "./search";
import { User } from "@/types/codeEditor";
import { UserButton } from "@clerk/nextjs";
import { ThemeTogglerButton } from "@/components/animate-ui/components/buttons/theme-toggler";
import { useTheme } from "next-themes";

export default function Navbar({ userData }: { userData: User }) {
	const { theme } = useTheme();
	return (
		<div className="h-14 px-2 w-full border-b border-border flex items-center justify-between">
			<div className="flex items-center space-x-4">
				<Link
					href={"/"}
					className="ring-offset-2 ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none rounded-sm"
				>
					<Image src={Logo} alt="Logo" width={36} height={36} />
				</Link>
				<div className="text-2xl font-semibold flex items-center">
					Code Connect
				</div>
			</div>
			<div className="flex items-center space-x-4">
				<DashboardNavbarSearch />
				<ThemeTogglerButton variant="ghost" />
				<UserButton
					appearance={{ theme: theme === dark ? dark : shadcn }}
				/>
			</div>
		</div>
	);
}
