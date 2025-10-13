import { useRef, useState, useEffect } from "react";
import { Socket } from "socket.io-client";
import {
	UnfoldVertical,
	Link,
	RotateCw,
	ExternalLink,
	AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface IServerInfo {
	port: number;
	url: string;
	type: "vite" | "next" | "other";
	terminalId: string;
	message: string;
}

interface PreviewWindowProps {
	virtualbox: {
		id: string;
		userId: string;
	};
	socket: Socket;
	collapsed: boolean;
	open: () => void;
}

export default function PreviewWindow({
	virtualbox,
	socket,
	collapsed,
	open,
}: PreviewWindowProps) {
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const [iframeKey, setIframeKey] = useState(0);
	const [previewUrl, setPreviewUrl] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [serverInfo, setServerInfo] = useState<IServerInfo | null>(null);
	const [connectionStatus, setConnectionStatus] = useState<
		"connecting" | "connected" | "error"
	>("connecting");

	useEffect(() => {
		if (!socket) return;

		// Listen for preview server ready events
		const handlePreviewReady = (data: IServerInfo) => {
			console.log("Preview server ready:", data);
			const url = `${process.env.NEXT_PUBLIC_API_INITIAL_URL}${data.url}`;
			setPreviewUrl(url);
			setServerInfo(data);
			setError("");
			setLoading(false);
			setConnectionStatus("connected");

			// Show success toast
			toast.success(data.message || "Development server is ready!");

			// Force iframe refresh after server is ready
			setTimeout(() => {
				setIframeKey((prev) => prev + 1);
			}, 500);
		};

		// Listen for preview server stopped events
		const handlePreviewStopped = (data: {
			terminalId: string;
			message: string;
		}) => {
			console.log("Preview server stopped:", data);
			setPreviewUrl("");
			setServerInfo(null);
			setError(data.message || "Development server has stopped");
			setConnectionStatus("error");
			toast.error(data.message);
		};

		socket.on("previewServerReady", handlePreviewReady);
		socket.on("previewServerStopped", handlePreviewStopped);

		// Check if preview is already available
		checkPreviewStatus();

		return () => {
			socket.off("previewServerReady", handlePreviewReady);
			socket.off("previewServerStopped", handlePreviewStopped);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [socket, virtualbox.id, virtualbox.userId]);

	const checkPreviewStatus = async () => {
		try {
			setLoading(true);
			setConnectionStatus("connecting");

			const response = await fetch(
				`${process.env.NEXT_PUBLIC_API_INITIAL_URL}/api/preview-status/${virtualbox.id}/${virtualbox.userId}`
			);
			const data = await response.json();

			if (data.available && data.server) {
				const url = `${process.env.NEXT_PUBLIC_API_INITIAL_URL}${data.server.url}`;
				setPreviewUrl(url);
				setServerInfo(data.server);
				setError("");
				setConnectionStatus("connected");
			} else {
				setError(
					'Development server not running. Start it with "npm run dev" in the terminal.'
				);
				setConnectionStatus("error");
			}
		} catch (err) {
			console.error("Error checking preview status:", err);
			setError("Failed to connect to preview server");
			setConnectionStatus("error");
		} finally {
			setLoading(false);
		}
	};

	const handleRefresh = () => {
		const iframe = document.getElementById(
			"preview-frame"
		) as HTMLIFrameElement | null;

		if (iframe && previewUrl) {
			const url = new URL(previewUrl, window.location.origin);
			url.searchParams.set("t", Date.now().toString());
			iframe.src = url.href;
			toast.info("Refreshing preview...");
		} else {
			checkPreviewStatus();
		}
	};

	const handleOpenInNewTab = () => {
		if (previewUrl) {
			window.open(previewUrl, "_blank");
		}
	};

	const copyPreviewLink = () => {
		const link = `${process.env.NEXT_PUBLIC_API_INITIAL_URL}/preview/${virtualbox.id}/${virtualbox.userId}`;
		navigator.clipboard.writeText(link);
		toast.success("Preview link copied to clipboard");
	};

	// Status indicator component
	const StatusIndicator = () => {
		if (connectionStatus === "connecting") {
			return (
				<div className="flex items-center gap-1 text-yellow-500">
					<div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
					<span className="text-xs">Connecting...</span>
				</div>
			);
		}
		if (connectionStatus === "connected") {
			return (
				<div className="flex items-center gap-1 text-green-500">
					<div className="w-2 h-2 bg-green-500 rounded-full" />
					<span className="text-xs">Connected</span>
				</div>
			);
		}
		return (
			<div className="flex items-center gap-1 text-red-500">
				<div className="w-2 h-2 bg-red-500 rounded-full" />
				<span className="text-xs">Disconnected</span>
			</div>
		);
	};

	return (
		<>
			<div
				className={`${
					collapsed ? "h-full" : "h-10"
				} select-none w-full flex gap-2`}
			>
				<div className="flex items-center w-full justify-between h-8 rounded-md px-3 bg-secondary">
					<div className="flex items-center gap-2">
						<span className="text-xs">Preview</span>
						{serverInfo && (
							<span className="text-xs text-muted-foreground">
								({serverInfo.type} - port {serverInfo.port})
							</span>
						)}
					</div>

					<div className="flex items-center gap-2">
						<StatusIndicator />

						<div className="flex space-x-1 translate-x-1">
							{collapsed ? (
								<PreviewButton onClick={open} title="Expand">
									<UnfoldVertical className="w-4 h-4" />
								</PreviewButton>
							) : (
								<>
									<PreviewButton
										onClick={copyPreviewLink}
										title="Copy link"
									>
										<Link className="w-4 h-4" />
									</PreviewButton>

									<PreviewButton
										onClick={handleRefresh}
										title="Refresh"
									>
										<RotateCw className="w-4 h-4" />
									</PreviewButton>

									{previewUrl && (
										<PreviewButton
											onClick={handleOpenInNewTab}
											title="Open in new tab"
										>
											<ExternalLink className="w-4 h-4" />
										</PreviewButton>
									)}
								</>
							)}
						</div>
					</div>
				</div>
			</div>

			{!collapsed && (
				<div className="w-full grow rounded-md bg-foreground overflow-hidden">
					{loading ? (
						<div className="flex items-center justify-center h-full bg-background">
							<div className="text-center">
								<div className="inline-flex items-center justify-center w-12 h-12 mb-4">
									<div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
								</div>
								<p className="text-sm text-muted-foreground">
									Checking preview server...
								</p>
							</div>
						</div>
					) : error ? (
						<div className="flex items-center justify-center h-full bg-background">
							<div className="text-center p-6 max-w-md">
								<AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
								<h3 className="text-lg font-semibold mb-2">
									Preview Not Available
								</h3>
								<p className="text-sm text-muted-foreground mb-4">
									{error}
								</p>
								<div className="space-y-2">
									<code className="block bg-secondary px-3 py-2 rounded text-xs">
										npm run dev
									</code>
									<button
										onClick={checkPreviewStatus}
										className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors"
									>
										Check Again
									</button>
								</div>
							</div>
						</div>
					) : (
						<iframe
							key={iframeKey}
							ref={iframeRef}
							className="w-full h-full border-0 overflow-hidden no-scrollbar"
							style={{ overflow: "hidden" }}
							scrolling="no"
							src={`${process.env.NEXT_PUBLIC_API_INITIAL_URL}/preview/${virtualbox.id}/${virtualbox.userId}`}
							sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-downloads allow-popups"
							allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone; midi; clipboard-read; clipboard-write"
						/>
					)}
				</div>
			)}
		</>
	);
}

function PreviewButton({
	children,
	onClick,
	title,
}: {
	children: React.ReactNode;
	onClick: () => void;
	title?: string;
}) {
	return (
		<button
			className="p-0.5 h-5 w-5 ml-0.5 flex items-center justify-center transition-colors bg-transparent hover:bg-muted-foreground/25 cursor-pointer rounded-sm"
			onClick={onClick}
			title={title}
			type="button"
		>
			{children}
		</button>
	);
}
