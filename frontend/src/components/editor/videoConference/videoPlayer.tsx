import { CameraOff } from "lucide-react";
import { useEffect, useRef } from "react";

// Video Player Component
interface VideoPlayerProps {
	stream: MediaStream | null | undefined;
	muted: boolean;
	isLocal: boolean;
	label: string;
	isVideoEnabled?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
	stream,
	muted,
	isLocal,
	label,
	isVideoEnabled = true,
}) => {
	const videoRef = useRef<HTMLVideoElement>(null);

	useEffect(() => {
		if (videoRef.current && stream) {
			videoRef.current.srcObject = stream;
		}
	}, [stream]);

	return (
		<div className="w-full">
			<video
				ref={videoRef}
				autoPlay
				playsInline
				muted={muted}
				style={{
					display: isLocal && !isVideoEnabled ? "none" : "block",
				}}
			/>
			{isLocal && !isVideoEnabled && (
				<div className="">
					<CameraOff size={40} color="#666" />
				</div>
			)}
			<div className="video-label">{label}</div>
		</div>
	);
};

export default VideoPlayer;
