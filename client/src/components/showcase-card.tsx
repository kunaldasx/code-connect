import Image from "next/image";
import { ShowcaseImage } from "./showcase-grid";

const hexToRgb = (hex: string) => {
	const clean = hex.replace("#", "");

	const bigint = parseInt(clean, 16);

	return {
		r: (bigint >> 16) & 255,
		g: (bigint >> 8) & 255,
		b: bigint & 255,
	};
};

const ShowcaseCard = ({ image }: { image: ShowcaseImage }) => {
	const { r, g, b } = hexToRgb(image.color);

	return (
		<div className="group relative overflow-hidden rounded-[28px] border border-white/5 bg-white/3 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
			{/* Hover border + glow */}
			<div
				className="absolute inset-0 rounded-[28px] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
				style={{
					border: `1px solid rgba(${r},${g},${b},0.28)`,
					boxShadow: `
            0 0 30px rgba(${r},${g},${b},0.18),
            0 0 60px rgba(${r},${g},${b},0.12),
            0 16px 40px rgba(0,0,0,0.45),
            inset 0 0 20px rgba(${r},${g},${b},0.05)
          `,
				}}
			/>

			{/* Colored glow */}
			<div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
				<div
					className="absolute left-1/2 -top-32 size-64 -translate-x-1/2 rounded-full blur-3xl"
					style={{
						background: `rgba(${r},${g},${b},0.12)`,
					}}
				/>

				<div
					className="absolute bottom-0 right-0 size-48 rounded-full blur-3xl"
					style={{
						background: `rgba(${r},${g},${b},0.08)`,
					}}
				/>
			</div>

			<div className="relative aspect-video overflow-hidden">
				<Image
					alt={image.alt}
					fill
					loading="eager"
					src={image.src}
					sizes="(min-width: 1189px) 33vw, (min-width: 560px) 50vw, 100vw"
					className="object-cover transition-all duration-700 group-hover:scale-105"
				/>

				<div className="absolute inset-0 bg-linear-to-t from-[#040816] via-transparent to-transparent" />
			</div>

			<div className="relative p-4">
				<div className="mb-2 flex items-center gap-2">
					<div
						className="flex size-8 items-center justify-center rounded-xl border transition-all duration-500 group-hover:scale-110"
						style={{
							color: image.color,
							background: `rgba(${r},${g},${b},0.12)`,
							borderColor: `rgba(${r},${g},${b},0.25)`,
							boxShadow: `0 0 20px rgba(${r},${g},${b},0.18)`,
						}}
					>
						{image.icon}
					</div>

					<h3 className="font-display text-[12px] font-semibold tracking-wide text-[#DCF0FF]">
						{image.title}
					</h3>
				</div>

				<p className="text-xs leading-relaxed text-[#DCF0FF]/55">
					{image.description}
				</p>
			</div>
		</div>
	);
};

export default ShowcaseCard;
