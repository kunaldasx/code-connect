/**
 * Showcase grid component for displaying feature highlights.
 * Features:
 * - Responsive grid layout
 * - Feature descriptions
 * - Icon integration
 *
 * By Kunal Das
 */

import {
	Code2,
	GitPullRequestCreateArrow,
	LayoutTemplate,
	NotebookPen,
	Terminal,
	Video,
} from "lucide-react";
import type { ReactNode } from "react";
import ShowcaseCard from "./showcase-card";

export interface ShowcaseImage {
	alt: string;
	description: string;
	icon: ReactNode;
	src: string;
	title: string;
	color: string;
}

const showcaseImages: ShowcaseImage[] = [
	{
		src: "/images/showcase/collaborate.png",
		alt: "Real-time collaboration",
		title: "Real-time Collaboration",
		description:
			"Code together in real-time with cursor sharing, highlighting, and follow mode",
		icon: <Code2 className="size-4" />,
		color: "#4DF4FF",
	},
	{
		src: "/images/showcase/terminal.png",
		alt: "Shared terminal",
		title: "Shared Terminal",
		description:
			"Execute code and see results together with over 80 supported languages",
		icon: <Terminal className="size-4" />,
		color: "#B07AFF",
	},
	{
		src: "/images/showcase/live-preview.png",
		alt: "Live preview",
		title: "Live Preview",
		description:
			"Preview UI changes instantly with loaded libraries like Tailwind CSS and more",
		icon: <LayoutTemplate className="size-4" />,
		color: "#3FFFB0",
	},
	{
		src: "/images/showcase/github.png",
		alt: "GitHub integrated",
		title: "GitHub Integrated",
		description: "Save your work and open files from your repositories",
		icon: <GitPullRequestCreateArrow className="size-4" />,
		color: "#FF9A4A",
	},
	{
		src: "/images/showcase/notepad.png",
		alt: "Shared notepad",
		title: "Shared Notepad",
		description:
			"Take notes together in real-time with rich text and markdown support",
		icon: <NotebookPen className="size-4" />,
		color: "#FFE160",
	},
	{
		src: "/images/showcase/video.png",
		alt: "Video and voice",
		title: "Video & Voice",
		description: "Communicate with your team using video and voice chat",
		icon: <Video className="size-4" />,
		color: "#FF6FAF",
	},
];

const ShowcaseGrid = () => {
	return (
		<div className="relative w-full">
			{/* Background glow */}
			<div className="pointer-events-none absolute inset-0 overflow-hidden">
				<div
					className="absolute left-1/4 top-20 h-72 w-72 rounded-full bg-cyan-400/10 
          blur-[140px]"
				/>

				<div
					className="absolute bottom-20 right-1/4 h-72 w-72 rounded-full bg-violet-500/10 
          blur-[140px]"
				/>
			</div>

			<div
				className="relative grid grid-cols-1 gap-6 p-4 min-[560px]:grid-cols-2 min-[560px]:p-6 
        min-[1189px]:grid-cols-3 min-[1189px]:gap-8 min-[1189px]:p-0"
			>
				{showcaseImages.map((image) => (
					<ShowcaseCard key={image.title} image={image} />
				))}
			</div>
		</div>
	);
};

export { ShowcaseGrid };
