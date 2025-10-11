import React, { useEffect } from "react";
import { useVideoStore } from "@/store/videoStore";
import { useUpdateMyPresence } from "@/liveblocks.config";
import { Camera, CameraOff, Mic, MicOff, Phone, PhoneOff } from "lucide-react";
import { useWebRTC } from "@/hooks/useWebrtc";
import VideoPlayer from "./videoPlayer";

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
		<div className="w-full h-full flex flex-col justify-between items-center gap-4 p-4">
			{/* Video Grid */}
			<div
				className={`flex-1 grid gap-2 w-ful ${
					peers.size > 1 ? "grid-cols-2" : "grid-cols-1"
				} `}
			>
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
			<div className="flex gap-3 justify-center items-center">
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
		</div>
	);
};

export default VideoConference;
