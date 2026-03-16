"use client";

import { useEffect, useRef } from "react";

// ── Module-level constants ────────────────────────────────────────────────────
const TAU = Math.PI * 2;
const STAR_N = 300;
const MAX_MET = 12; // meteor pool cap

/**
 * Sin look-up table with linear interpolation.
 * Replaces 300 Math.sin calls/frame (~18 000/s at 60 fps) with a fast
 * array read + a lerp — typically 3-5× faster than the transcendental.
 */
const SIN_RES = 4096;
const SIN_LUT = new Float32Array(SIN_RES + 1);
for (let i = 0; i <= SIN_RES; i++) SIN_LUT[i] = Math.sin((i / SIN_RES) * TAU);

const lsin = (x) => {
	const n = (((x % TAU) + TAU) % TAU) * (SIN_RES / TAU);
	const lo = n | 0;
	return SIN_LUT[lo] + (SIN_LUT[lo + 1] - SIN_LUT[lo]) * (n - lo);
};

// Static — defined outside the component so it's never re-created on render.
const NEBULAE = [
	{
		w: 680,
		pos: { top: "-10%", left: "-18%" },
		col: "77,244,255",
		o: 0.05,
		d: "0s",
		dur: 24,
	},
	{
		w: 560,
		pos: { top: "28%", right: "-12%" },
		col: "140,80,255",
		o: 0.07,
		d: "-9s",
		dur: 28,
	},
	{
		w: 460,
		pos: { bottom: "4%", left: "12%" },
		col: "255,70,150",
		o: 0.045,
		d: "-5s",
		dur: 20,
	},
];
// ─────────────────────────────────────────────────────────────────────────────

const StarCanvas = () => {
	const canvasRef = useRef(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const dpr = window.devicePixelRatio || 1;
		const ctx = canvas.getContext("2d");

		let raf,
			frame = 0,
			W = 0,
			H = 0;

		// ── Stars ─────────────────────────────────────────────────────────────
		// Typed arrays keep star data dense in memory → better cache coherency
		// vs an array of plain objects.
		const stX = new Float32Array(STAR_N); // normalised x ∈ [0, 1]
		const stY = new Float32Array(STAR_N); // normalised y ∈ [0, 1]
		const stR = new Float32Array(STAR_N); // radius (CSS px)
		const stPh = new Float32Array(STAR_N); // phase (radians)
		const stSp = new Float32Array(STAR_N); // phase speed
		const stBa = new Float32Array(STAR_N); // base alpha

		for (let i = 0; i < STAR_N; i++) {
			stX[i] = Math.random();
			stY[i] = Math.random();
			stR[i] = Math.random() * 1.4 + 0.15;
			stPh[i] = Math.random() * TAU;
			stSp[i] = 0.003 + Math.random() * 0.011;
			stBa[i] = 0.1 + Math.random() * 0.85;
		}

		// ── Meteors ───────────────────────────────────────────────────────────
		// Fixed-capacity pool with swap-remove: O(1) deletion, zero allocation.
		// Replaces the per-frame Array.filter() in the original.
		const mX = new Float32Array(MAX_MET);
		const mY = new Float32Array(MAX_MET);
		const mVx = new Float32Array(MAX_MET);
		const mVy = new Float32Array(MAX_MET);
		const mLi = new Float32Array(MAX_MET); // lifetime: 1 → 0
		const mLn = new Float32Array(MAX_MET); // tail length
		const mCy = new Uint8Array(MAX_MET); // colour: 0 = cyan, 1 = purple
		let mN = 0; // active count

		const spawnMeteor = () => {
			if (mN >= MAX_MET) return;
			const i = mN++;
			mX[i] = W + 60;
			mY[i] = Math.random() * H * 0.55;
			mVx[i] = -(8 + Math.random() * 11);
			mVy[i] = 3 + Math.random() * 6;
			mLi[i] = 1;
			mLn[i] = 90 + Math.random() * 150;
			mCy[i] = Math.random() < 0.5 ? 0 : 1;
		};

		const removeMeteor = (i) => {
			const last = --mN;
			if (i === last) return; // already the last element
			mX[i] = mX[last];
			mY[i] = mY[last];
			mVx[i] = mVx[last];
			mVy[i] = mVy[last];
			mLi[i] = mLi[last];
			mLn[i] = mLn[last];
			mCy[i] = mCy[last];
		};

		// ── Resize ────────────────────────────────────────────────────────────
		// DPR-aware: canvas buffer at device resolution, draw commands in CSS px.
		// ctx.setTransform is idempotent — safe to call on every resize unlike
		// ctx.scale which would compound on each call.
		const resize = () => {
			W = window.innerWidth;
			H = window.innerHeight;
			canvas.width = Math.round(W * dpr);
			canvas.height = Math.round(H * dpr);
			canvas.style.width = W + "px";
			canvas.style.height = H + "px";
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		};
		resize();
		window.addEventListener("resize", resize);

		// ── Draw loop ─────────────────────────────────────────────────────────
		const draw = () => {
			ctx.clearRect(0, 0, W, H);

			// Stars — set colour once; vary only globalAlpha per star.
			// Avoids ~300 `rgba(...)` string constructions / frame.
			ctx.fillStyle = "rgb(200,225,255)";
			for (let i = 0; i < STAR_N; i++) {
				// Wrap phase to [0, TAU) to prevent float precision drift over time.
				stPh[i] = (stPh[i] + stSp[i]) % TAU;
				const s = Math.abs(lsin(stPh[i]));
				ctx.globalAlpha = stBa[i] * (0.12 + 0.88 * s ** 1.6);
				ctx.beginPath();
				ctx.arc(stX[i] * W, stY[i] * H, stR[i], 0, TAU);
				ctx.fill();
			}
			ctx.globalAlpha = 1;

			if (frame % 200 === 0 && Math.random() > 0.25) spawnMeteor();

			// lineWidth is constant across all meteors — hoist it out of the loop.
			ctx.lineWidth = 1.6;

			// Iterate backwards so swap-remove inside the loop stays safe.
			for (let i = mN - 1; i >= 0; i--) {
				mLi[i] -= 0.017;
				if (mLi[i] <= 0) {
					removeMeteor(i);
					continue;
				}

				mX[i] += mVx[i];
				mY[i] += mVy[i];

				const li = mLi[i];
				const col = mCy[i] === 0 ? "77,244,255" : "160,120,255";
				const mag = Math.hypot(mVx[i], mVy[i]);
				const tx = mX[i] - (mVx[i] / mag) * mLn[i];
				const ty = mY[i] - (mVy[i] / mag) * mLn[i];

				// Tail
				const tail = ctx.createLinearGradient(mX[i], mY[i], tx, ty);
				tail.addColorStop(0, `rgba(${col},${li * 0.9})`);
				tail.addColorStop(0.3, `rgba(${col},${li * 0.4})`);
				tail.addColorStop(1, "transparent");
				ctx.beginPath();
				ctx.moveTo(mX[i], mY[i]);
				ctx.lineTo(tx, ty);
				ctx.strokeStyle = tail;
				ctx.stroke();

				// Head glow
				const glow = ctx.createRadialGradient(mX[i], mY[i], 0, mX[i], mY[i], 7);
				glow.addColorStop(0, `rgba(${col},${li})`);
				glow.addColorStop(1, "transparent");
				ctx.beginPath();
				ctx.arc(mX[i], mY[i], 7, 0, TAU);
				ctx.fillStyle = glow;
				ctx.fill();
			}

			frame++;
			raf = requestAnimationFrame(draw);
		};

		draw();

		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener("resize", resize);
		};
	}, []);

	return (
		<>
			<canvas
				ref={canvasRef}
				style={{
					position: "fixed",
					inset: 0,
					pointerEvents: "none",
					zIndex: 0,
				}}
			/>

			{/* Nebula blobs */}
			<div
				style={{
					position: "fixed",
					inset: 0,
					pointerEvents: "none",
					zIndex: 0,
				}}
			>
				{NEBULAE.map(({ w, pos, col, o, d, dur }, i) => (
					<div
						key={i}
						style={{
							position: "absolute",
							width: w,
							height: w,
							...pos,
							borderRadius: "50%",
							background: `radial-gradient(circle, rgba(${col},${o}) 0%, transparent 70%)`,
							filter: "blur(85px)",
							animation: `nebula ${dur}s ease-in-out infinite`,
							animationDelay: d,
						}}
					/>
				))}
			</div>
		</>
	);
};

export default StarCanvas;
