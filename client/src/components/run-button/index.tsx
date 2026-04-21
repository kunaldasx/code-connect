/**
 * Run button component for code execution control.
 * Features:
 * - Code execution triggering
 * - Execution cancellation
 * - Args/stdin input handling
 * - Status indication
 *
 * By Kunal Das
 */

import { CodeServiceMsg } from "@/types/message";
import type { ExecutionResult } from "@/types/terminal";
import type { Monaco } from "@monaco-editor/react";
import { OctagonX, Play } from "lucide-react";
import type * as monaco from "monaco-editor";
import {
	type Dispatch,
	type SetStateAction,
	useEffect,
	useRef,
	useState,
} from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { getSocket } from "@/lib/socket";
import { cn } from "@/lib/utils";

import { AboutPopover } from "./components/about-popover";
import { ArgsInputPopover } from "./components/args-stdin-popover";
import { cancelExecution, executeCode } from "./utils";
import { PISTON_API_URL } from "@/lib/constants";

interface RunButtonProps {
	className?: string;
	editor: monaco.editor.IStandaloneCodeEditor | null;
	monaco: Monaco | null;
	setOutput: Dispatch<SetStateAction<ExecutionResult[]>>;
}

const RunButton = ({
	monaco,
	editor,
	setOutput,
	className,
}: RunButtonProps) => {
	const socket = getSocket();
	const abortControllerRef = useRef<AbortController | null>(null);
	const [isRunning, setIsRunning] = useState(false);
	const [args, setArgs] = useState<string[]>([]);
	const [stdin, setStdin] = useState("");
	const [showUnavailableModal, setShowUnavailableModal] = useState(false);

	useEffect(() => {
		socket.on(CodeServiceMsg.EXEC, (isExecuting: boolean) =>
			setIsRunning(isExecuting),
		);

		return () => {
			socket.off(CodeServiceMsg.EXEC);
		};
	}, [socket]);

	return (
		<>
			<div className="flex items-center gap-1">
				<div className="animate-fade-in-top">
					<Button
						aria-busy={isRunning}
						aria-label={isRunning ? "Cancel execution" : "Run code"}
						className={cn(
							"hover:opacity-80! disabled:opacity-50! h-7 rounded-r-none bg-(--toolbar-accent) px-2 py-0 text-(--panel-text-accent) transition-opacity hover:bg-(--toolbar-accent)",
							isRunning && "bg-red-600 hover:bg-red-700",
							className,
						)}
						disabled={!editor}
						onClick={
							!PISTON_API_URL
								? () => setShowUnavailableModal(true)
								: isRunning
									? () =>
											cancelExecution(
												abortControllerRef,
												setIsRunning,
												setOutput,
											)
									: () =>
											executeCode(
												monaco,
												editor,
												setOutput,
												setIsRunning,
												abortControllerRef,
												args,
												stdin,
											)
						}
					>
						{isRunning ? (
							<>
								<OctagonX aria-hidden="true" className="mr-0 size-4 sm:mr-1" />
								<span className="hidden sm:flex">Cancel</span>
							</>
						) : (
							<>
								<Play
									aria-hidden="true"
									className="mr-0 size-4 fill-white sm:mr-1"
								/>
								<span className="hidden sm:flex">Run Code</span>
							</>
						)}
					</Button>

					<ArgsInputPopover
						disabled={isRunning || !editor}
						onArgsChange={setArgs}
						onStdinChange={setStdin}
					/>
				</div>

				<AboutPopover />
			</div>

			<Dialog
				open={showUnavailableModal}
				onOpenChange={setShowUnavailableModal}
			>
				<DialogContent className="max-w-sm border-[rgba(77,244,255,0.22)] bg-[#0c1122] text-white">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2 text-[rgba(77,244,255,0.9)]">
							<OctagonX className="size-4 text-red-400" aria-hidden="true" />
							Code Runner Not Available in Demo
						</DialogTitle>
						<DialogDescription className="text-slate-400">
							To keep hosting costs low, code execution is disabled in the
							public demo. You can enable it locally by running the project with
							a Piston container. See the README for setup instructions.
						</DialogDescription>
					</DialogHeader>
				</DialogContent>
			</Dialog>
		</>
	);
};

export { RunButton };
