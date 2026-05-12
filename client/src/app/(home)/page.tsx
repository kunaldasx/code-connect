/**
 * Home page component that displays the landing page with:
 * - Room access form
 * - Animated background
 * - Feature showcase grid
 * - About and latency test buttons
 * - Server status indicator
 *
 * By Kunal Das
 */

import { Suspense } from "react";

import { AboutButton } from "@/components/about-button";
import { RoomAccessForm } from "@/components/room-access-form";
import { Status } from "@/components/status";
import StarCanvas from "@/components/star-canvas";
import Orb from "@/components/animated-orb-bg";
import { ShowcaseGrid } from "@/components/showcase-grid";

export default async function Page({ searchParams }: PageProps<"/">) {
	const params = await searchParams;
	const roomId = params.room?.toString() || "";

	return (
		<>
			<div
				aria-hidden="true"
				role="presentation"
				className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_22%_22%,#090428_0%,#020610_45%,#010209_100%)]"
			/>

			<StarCanvas />

			<div style={{ width: "100%", height: "100%", position: "fixed" }}>
				<Orb hue={0} forceHoverState={false} backgroundColor="#000000" />
			</div>

			<main className="dark relative flex min-h-full w-full flex-col min-[1189px]:flex-row">
				{/* Left Section - Form */}
				<div className="flex min-h-[700px] w-full flex-col justify-center p-4 min-[1189px]:w-5/12 min-[1189px]:items-center min-[560px]:p-8">
					<div className="w-full flex flex-col items-center min-[1189px]:items-start">
						<div className="mb-6 space-y-6">
							<h1 className="mb-[22px] font-['Orbitron',sans-serif] text-[clamp(30px,4vw,48px)] font-black leading-[1.06] tracking-[-0.8px] max-[1189px]:text-center">
								<span
									className="bg-[linear-gradient(128deg,#DCF0FF_0%,#4DF4FF_35%,#9966FF_70%,#FF5599_100%)] bg-size-[200%_100%] bg-clip-text text-transparent"
									style={{ animation: "shimmer 7s linear infinite" }}
								>
									Code Connect
								</span>

								<br />

								<span className="text-[clamp(28px,3.5vw,40px)] text-[#DCF0FF]">
									Your Coding Space,
								</span>

								<br />

								<span className="text-[clamp(20px,3vw,30px)] font-normal text-[rgba(220,240,255,0.45)]">
									Reimagined.
								</span>
							</h1>

							<p className="max-w-[440px] text-[14px] leading-[1.85] text-[rgba(220,240,255,0.46)] max-[1189px]:text-center">
								No sign-up. No installs. Share a Room ID and start coding with
								your team instantly — directly in your browser.
							</p>
						</div>

						<Suspense fallback={null}>
							<div className="h-80 w-full flex justify-center items-center">
								<RoomAccessForm roomId={roomId} />
							</div>
						</Suspense>
					</div>
				</div>

				{/* Right Section - Showcase Grid */}
				<div className="dark relative flex w-full max-w-5xl flex-1 items-start justify-center max-[1189px]:px-8 min-[1189px]:py-14 min-[1189px]:w-7/12 min-[1189px]:pr-8">
					<ShowcaseGrid />
				</div>

				<div className="dark fixed right-3 bottom-2.5 flex items-center gap-x-3">
					<Status />
					<AboutButton />
				</div>
			</main>
		</>
	);
}
