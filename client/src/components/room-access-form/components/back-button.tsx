/**
 * Back button component that navigates back to room creation/joining.
 * Features:
 * - Click handling
 * - Disabled state support
 * - Space-themed styling
 *
 * By Kunal Das
 */

import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
	disabled: boolean;
	onClick: () => void;
}

const BackButton = ({ onClick, disabled }: BackButtonProps) => (
	<button
		aria-label="Back to create or join room page"
		disabled={disabled}
		onClick={onClick}
		type="button"
		className=" flex items-center gap-2 border-none bg-transparent p-0 font-mono text-[11px] tracking-[0.08em] text-cyan-300/55 transition-all duration-200 hover:opacity-80 disabled:pointer-events-none disabled:opacity-30"
	>
		<ArrowLeft aria-hidden="true" size={13} />
		<span>BACK TO BASE</span>
	</button>
);

export { BackButton };
