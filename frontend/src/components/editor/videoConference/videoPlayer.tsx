import { CameraOff } from "lucide-react";
import Image from "next/image";
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

	// Additional effect to handle video track enabling/disabling
	useEffect(() => {
		if (videoRef.current && stream) {
			const videoElement = videoRef.current;

			// Always ensure the video element has the stream
			if (videoElement.srcObject !== stream) {
				videoElement.srcObject = stream;
			}

			if (isVideoEnabled) {
				// Force video to play when video is re-enabled
				videoElement.play().catch((error) => {
					console.log(`Auto-play failed for ${label}:`, error);
				});
			}
		}
	}, [isVideoEnabled, stream, label]);

	// For local video: use isVideoEnabled prop directly (trust the parent component)
	// For remote video: check if stream exists and has active video tracks
	const shouldShowVideo = isLocal
		? isVideoEnabled && stream
		: stream && stream.getVideoTracks().length > 0;

	const displayName = name || label;
	const displayInitial = displayName.charAt(0).toUpperCase();

	return (
		<div className="relative w-full h-40 bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
			{shouldShowVideo ? (
				<video
					key={`${label}-${isVideoEnabled}`} // Force re-render when video state changes
					ref={videoRef}
					autoPlay
					playsInline
					muted={muted}
					className="w-full h-full object-cover"
					style={{
						transform: isLocal ? "scaleX(-1)" : "none", // Mirror local video
					}}
				/>
			) : (
				// Show avatar for both: no stream OR video disabled
				<div className="flex flex-col items-center justify-center text-white">
					{avatar ? (
						<Image
							src={avatar}
							alt={displayName}
							width={50}
							height={50}
							className="rounded-full object-cover border-2 border-gray-400"
						/>
					) : (
						<div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xl font-bold">
							{displayInitial}
						</div>
					)}
				</div>
			)}

			{/* User info overlay */}
			<div className="absolute bottom-2 left-2 flex items-center gap-2 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full">
				{avatar ? (
					<img
						src={avatar}
						alt={displayName}
						className="w-6 h-6 rounded-full object-cover"
					/>
				) : (
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
