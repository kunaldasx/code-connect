"use client";

import { Link, RotateCw, UnfoldVertical } from "lucide-react";
import React, { useRef, useState } from "react";
import { toast } from "sonner";

export default function PreviewWindow({
	collapsed,
	open,
}: {
	collapsed: boolean;
	open: () => void;
}) {
	const ref = useRef<HTMLIFrameElement>(null);
	const [iframeKey, setIframeKey] = useState(0);
	return (
		<>
			<div
				className={`${
					collapsed ? "h-full" : "h-10"
				} select-none w-full flex gap-2`}
			>
				<div className="flex items-center w-full justify-between h-8 rounded-md px-3 bg-secondary">
					<div className="text-xs">Preview </div>

					<div className="flex space-x-1 translate-x-1">
						{collapsed ? (
							<PreviewButton onClick={open}>
								<UnfoldVertical className="w-4 h-4" />
							</PreviewButton>
						) : (
							<>
								<PreviewButton
									onClick={() => {
										navigator.clipboard.writeText(
											process.env
												.NEXT_PUBLIC_PREVIEW_INITIAL_URL!
										);
										toast.info(
											"Copied preview link to clipboard"
										);
									}}
								>
									<Link className="w-4 h-4" />
								</PreviewButton>

								<PreviewButton
									onClick={() => {
										setIframeKey((prev) => prev + 1);
									}}
								>
									<RotateCw className="w-4 h-4" />
								</PreviewButton>
							</>
						)}
					</div>
				</div>
			</div>
			{collapsed ? null : (
				<div className="w-full grow rounded-md bg-foreground">
					<iframe
						key={iframeKey}
						ref={ref}
						width={"100%"}
						height={"100%"}
						src={process.env.NEXT_PUBLIC_PREVIEW_INITIAL_URL!}
					/>
				</div>
			)}
		</>
	);
}

function PreviewButton({
	children,
	onClick,
}: {
	children: React.ReactNode;
	onClick: () => void;
}) {
	return (
		<div
			className="p-0.5 h-5 w-5 ml-0.5 flex items-center justify-center transition-colors bg-transparent hover:bg-muted-foreground/25 cursor-pointer rounded-sm"
			onClick={onClick}
		>
			{children}
		</div>
	);
}
