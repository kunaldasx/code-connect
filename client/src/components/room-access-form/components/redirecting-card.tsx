/**
 * Loading card shown while redirecting to room.
 * Features:
 * - Orbital ring animation
 * - Space-themed copy
 * - Accessible status message
 *
 * By Kunal Das
 */

export const RedirectingCard = () => (
	<div
		aria-live="polite"
		role="status"
		className="room-card-glow relative w-full max-w-sm overflow-hidden rounded-[22px] border border-cyan-300/15 bg-[rgba(5,12,36,0.9)] px-7 py-8 backdrop-blur-[32px]"
	>
		{/* Top shimmer */}
		<div
			aria-hidden="true"
			className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(77,244,255,0.45),rgba(153,102,255,0.25),transparent)]"
		/>

		<div className="flex flex-col items-center gap-5 text-center">
			<div className="relative flex size-14 items-center justify-center">
				<svg
					className="orbit-ring absolute inset-0 size-full"
					viewBox="0 0 56 56"
					fill="none"
				>
					<circle
						cx="28"
						cy="28"
						r="24"
						stroke="rgba(77,244,255,0.12)"
						strokeWidth="2"
					/>

					<circle
						cx="28"
						cy="28"
						r="24"
						stroke="url(#ringGrad)"
						strokeWidth="2"
						strokeLinecap="round"
						strokeDasharray="40 110"
					/>

					<defs>
						<linearGradient
							id="ringGrad"
							x1="0"
							y1="0"
							x2="56"
							y2="56"
							gradientUnits="userSpaceOnUse"
						>
							<stop stopColor="#4DF4FF" />
							<stop offset="1" stopColor="#B07AFF" stopOpacity="0" />
						</linearGradient>
					</defs>
				</svg>

				<div className="orbit-pulse size-3 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(77,244,255,0.6)]" />
			</div>

			<div className="space-y-1">
				<p className="font-display text-[13px] font-bold tracking-[0.06em] text-[#DCF0FF]">
					Locking Orbit
				</p>

				<p className="font-mono text-[11px] text-[#DCF0FF]/35">
					Redirecting to your room…
				</p>
			</div>
		</div>
	</div>
);
