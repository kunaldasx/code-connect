"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

export default function AboutModal({
	open,
	setOpen,
}: {
	open: boolean;
	setOpen: (open: boolean) => void;
}) {
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className="leading-normal">
						🚀 Code Connect – Collaborate Smarter, Code Together
					</DialogTitle>
				</DialogHeader>
				<div className="text-sm text-muted-foreground">
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

				<DialogHeader>
					<DialogTitle>
						🛠 Under the Hood – Powered by Modern Tech
					</DialogTitle>
				</DialogHeader>
				<ul className="text-sm text-muted-foreground list-inside list-disc">
					<li>
						Frontend → Next.js, TypeScript, Tailwind CSS, shadcn/ui
					</li>

					<li>
						Real-Time Collaboration → Liveblocks + Socket.io for
						instant, low-latency updates
					</li>

					<li>
						Video & Audio Conferencing → WebRTC for seamless
						peer-to-peer communication
					</li>

					<li>
						Backend → Node.js + Express for scalable API and server
						logic
					</li>

					<li>
						Authentication → Clerk for secure, frictionless user
						management
					</li>

					<li>
						Database → Cloudflare D1 (SQLite) for structured data
					</li>

					<li>
						File & Asset Storage → Cloudflare R2 for reliable object
						storage
					</li>
				</ul>
				<div className="text-sm text-muted-foreground">
					Together, these technologies make Code Connect not just a
					code editor—but a collaborative workspace built for
					developers who want to work smarter, not harder.
				</div>
			</DialogContent>
		</Dialog>
	);
}
