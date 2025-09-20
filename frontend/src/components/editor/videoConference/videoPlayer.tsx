import { CameraOff } from "lucide-react";
import { useEffect, useRef } from "react";

// Video Player Component
interface VideoPlayerProps {
	stream: MediaStream | null | undefined;
	muted: boolean;
	isLocal: boolean;
	label: string;
	name?: string;
	avatar?: string;
	isVideoEnabled?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
	stream,
	muted,
	isLocal,
	label,
	name,
	avatar,
	isVideoEnabled = true,
}) => {
	const videoRef = useRef<HTMLVideoElement>(null);

	useEffect(() => {
		if (videoRef.current && stream) {
			videoRef.current.srcObject = stream;
			console.log(`Setting video source for ${label}:`, stream.id);

			// FIXED: Add event listeners to debug video loading
			const videoElement = videoRef.current;

			const handleLoadedMetadata = () => {
				console.log(`Video metadata loaded for ${label}`);
			};

			const handlePlay = () => {
				console.log(`Video playing for ${label}`);
			};

			const handleError = (e: any) => {
				console.error(`Video error for ${label}:`, e);
			};

			videoElement.addEventListener(
				"loadedmetadata",
				handleLoadedMetadata
			);
			videoElement.addEventListener("play", handlePlay);
			videoElement.addEventListener("error", handleError);

			return () => {
				videoElement.removeEventListener(
					"loadedmetadata",
					handleLoadedMetadata
				);
				videoElement.removeEventListener("play", handlePlay);
				videoElement.removeEventListener("error", handleError);
			};
		}
	}, [stream, label]);

	// FIXED: For remote users, we should always show the video element if there's a stream
	const shouldShowVideo = isLocal ? isVideoEnabled : !!stream;
	const showPlaceholder = isLocal && !isVideoEnabled;
	const displayName = name || label;
	const displayInitial = displayName.charAt(0).toUpperCase();

	return (
		<div className="relative w-full h-64 bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
			{shouldShowVideo && stream ? (
				<video
					ref={videoRef}
					autoPlay
					playsInline
					muted={muted}
					className="w-full h-full object-cover"
					style={{
						transform: isLocal ? "scaleX(-1)" : "none", // Mirror local video
					}}
				/>
			) : showPlaceholder ? (
				<div className="flex flex-col items-center justify-center text-white">
					<CameraOff size={40} color="#666" />
					<span className="mt-2 text-sm">Camera Off</span>
				</div>
			) : (
				<div className="flex flex-col items-center justify-center text-white">
					{avatar ? (
						<img
							src={avatar}
							alt={displayName}
							className="w-16 h-16 rounded-full object-cover border-2 border-gray-400"
						/>
					) : (
						<div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xl font-bold">
							{displayInitial}
						</div>
					)}
					<span className="mt-2 text-sm">No Video</span>
				</div>
			)}

			{/* User info overlay */}
			<div className="absolute bottom-2 left-2 flex items-center gap-2 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full">
				{avatar && (
					<img
						src={avatar}
						alt={displayName}
						className="w-6 h-6 rounded-full object-cover"
					/>
				)}
				{!avatar && (
					<div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xs font-bold">
						{displayInitial}
					</div>
				)}
				<span className="text-sm font-medium">{displayName}</span>
			</div>
		</div>
	);
};

export default VideoPlayer;
