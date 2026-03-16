"use client";

import * as ResizablePrimitive from "react-resizable-panels";
import { GripVertical } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

const ResizablePanelGroup = ({
	className,
	...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
	<ResizablePrimitive.PanelGroup
		className={cn(
			"flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
			className,
		)}
		{...props}
	/>
);

const ResizablePanel = ResizablePrimitive.Panel;

const ResizableHandle = ({
	withHandle,
	// hitAreaMargins is a react-resizable-panels v2+ prop.
	// It extends the mouse-detection zone in JS — bypassing CSS stacking issues entirely.
	// 'fine' = mouse/trackpad pixels, 'coarse' = touch pixels
	hitAreaMargins = { coarse: 20, fine: 10 },
	className,
	...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
	withHandle?: boolean;
}) => (
	<ResizablePrimitive.PanelResizeHandle
		hitAreaMargins={hitAreaMargins}
		className={cn(
			// z-10 ensures the handle sits ABOVE adjacent panels in z-order,
			// so its hit area isn't blocked by panels that render later in the DOM
			"relative z-10 flex w-px items-center justify-center bg-border",
			"after:absolute after:inset-y-0 after:left-1/2 after:w-4 after:-translate-x-1/2",
			"hover:bg-primary/30 transition-colors duration-150",
			"focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1",
			"data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full",
			"data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-4",
			"data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2",
			"data-[panel-group-direction=vertical]:after:translate-x-0",
			"[&[data-panel-group-direction=vertical]>div]:rotate-90",
			className,
		)}
		{...props}
	>
		{withHandle && (
			<div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
				<GripVertical className="h-2.5 w-2.5" />
			</div>
		)}
	</ResizablePrimitive.PanelResizeHandle>
);

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
