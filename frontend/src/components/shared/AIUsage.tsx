import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "@/types/codeEditor";
import { Sparkles } from "lucide-react";

export default function AIUsage({ userData }: { userData: User }) {
	if (!userData) return null;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger>
				<div className="w-12 h-12 overflow-hidden flex items-center justify-center group">
					<Sparkles className="group-hover:text-indigo-500" />
				</div>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-48" align="end">
				<div className="py-4 px-4 flex flex-col items-start text-sm w-full">
					<div className="flex items-center">
						<Sparkles className="h-4 w-4 mr-2 text-indigo-500" />
						AI Usage: {userData.generations}/30
					</div>
					<div className="rounded-full w-full mt-2 h-2 overflow-hidden bg-white/25">
						<div
							className="h-full bg-indigo-500 rounded-full"
							style={{
								width: `${(userData.generations * 100) / 30}%`,
							}}
						></div>
					</div>
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
