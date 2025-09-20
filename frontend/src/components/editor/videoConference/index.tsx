import React, { useEffect, useRef } from "react";
import { useVideoStore } from "@/store/videoStore";
import { useUpdateMyPresence } from "@/liveblocks.config";
import { Camera, CameraOff, Mic, MicOff, Phone, PhoneOff } from "lucide-react";
import { useWebRTC } from "@/hooks/useWebrtc";

const VideoConference: React.FC = () => {
	const { joinCall, leaveCall, isInCall } = useWebRTC();

	const {
		localStream,
		peers,
		isVideoEnabled,
		isAudioEnabled,
		toggleVideo,
		toggleAudio,
	} = useVideoStore();

	const updateMyPresence = useUpdateMyPresence();

	// Update presence when joining/leaving call
	useEffect(() => {
		updateMyPresence({ inCall: isInCall });
	}, [isInCall, updateMyPresence]);

	const handleToggleCall = async () => {
		if (isInCall) {
			leaveCall();
		} else {
			await joinCall();
		}
	};

	return (
		<div className="video-conference-container">
			{/* Video Grid */}
			<div className="video-grid">
				{/* Local Video */}
				{isInCall && (
					<VideoPlayer
						stream={localStream}
						muted={true}
						isLocal={true}
						label="You"
						isVideoEnabled={isVideoEnabled}
					/>
				)}

				{/* Remote Videos */}
				{Array.from(peers.values()).map((peer) => (
					<VideoPlayer
						key={peer.id}
						stream={peer.stream}
						muted={false}
						isLocal={false}
						label={`User ${peer.id.slice(0, 8)}`}
					/>
				))}
			</div>

			{/* Controls */}
			<div className="video-controls">
				<button
					onClick={handleToggleCall}
					className={`control-btn ${
						isInCall ? "btn-leave" : "btn-join"
					}`}
				>
					{isInCall ? (
						<>
							<PhoneOff size={20} />
							<span>Leave Call</span>
						</>
					) : (
						<>
							<Phone size={20} />
							<span>Join Call</span>
						</>
					)}
				</button>

				{isInCall && (
					<>
						<button
							onClick={toggleVideo}
							className={`control-btn ${
								!isVideoEnabled ? "btn-disabled" : ""
							}`}
						>
							{isVideoEnabled ? (
								<Camera size={20} />
							) : (
								<CameraOff size={20} />
							)}
						</button>

						<button
							onClick={toggleAudio}
							className={`control-btn ${
								!isAudioEnabled ? "btn-disabled" : ""
							}`}
						>
							{isAudioEnabled ? (
								<Mic size={20} />
							) : (
								<MicOff size={20} />
							)}
						</button>
					</>
				)}
			</div>

			{/* Styles */}
			{/* <style jsx>{`
				.video-conference-container {
					position: fixed;
					top: 0;
					right: 0;
					width: 400px;
					height: 100vh;
					background: #1a1a1a;
					display: flex;
					flex-direction: column;
					z-index: 1000;
					border-left: 1px solid #333;
				}

				.video-grid {
					flex: 1;
					display: grid;
					grid-template-columns: 1fr;
					gap: 10px;
					padding: 10px;
					overflow-y: auto;
				}

				.video-controls {
					display: flex;
					justify-content: center;
					gap: 10px;
					padding: 20px;
					background: #0a0a0a;
					border-top: 1px solid #333;
				}

				.control-btn {
					display: flex;
					align-items: center;
					gap: 8px;
					padding: 10px 20px;
					border: none;
					border-radius: 8px;
					background: #2a2a2a;
					color: white;
					cursor: pointer;
					transition: all 0.2s;
				}

				.control-btn:hover {
					background: #3a3a3a;
				}

				.btn-join {
					background: #10b981;
				}

				.btn-join:hover {
					background: #059669;
				}

				.btn-leave {
					background: #ef4444;
				}

				.btn-leave:hover {
					background: #dc2626;
				}

				.btn-disabled {
					background: #ef4444;
				}

				@media (max-width: 768px) {
					.video-conference-container {
						width: 100%;
					}
				}
			`}</style> */}
		</div>
	);
};

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
		<div className="video-player">
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
				<div className="video-placeholder">
					<CameraOff size={40} color="#666" />
				</div>
			)}
			<div className="video-label">{label}</div>

			{/* <style jsx>{`
				.video-player {
					position: relative;
					background: #0a0a0a;
					border-radius: 8px;
					overflow: hidden;
					aspect-ratio: 16/9;
				}

				.video-player video {
					width: 100%;
					height: 100%;
					object-fit: cover;
				}

				.video-placeholder {
					position: absolute;
					top: 0;
					left: 0;
					right: 0;
					bottom: 0;
					display: flex;
					align-items: center;
					justify-content: center;
					background: #0a0a0a;
				}

				.video-label {
					position: absolute;
					bottom: 10px;
					left: 10px;
					padding: 4px 8px;
					background: rgba(0, 0, 0, 0.7);
					color: white;
					border-radius: 4px;
					font-size: 12px;
				}
			`}</style> */}
		</div>
	);
};

export default VideoConference;
