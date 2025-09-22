import React, { useEffect } from "react";
import { useVideoStore } from "@/store/videoStore";
import { useUpdateMyPresence, useOthers, useSelf } from "@/liveblocks.config";
import { Camera, CameraOff, Mic, MicOff, Phone, PhoneOff } from "lucide-react";
import { useWebRTC } from "@/hooks/useWebrtc";
import VideoPlayer from "./videoPlayer";

const VideoConference: React.FC = () => {
	const { joinCall, leaveCall, isInCall } = useWebRTC();
	const others = useOthers();
	const self = useSelf(); // Get current user info

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

	// FIXED: Calculate grid layout based on total participants
	const totalParticipants = isInCall ? 1 + peers.size : 0;
	const getGridClass = () => {
		if (totalParticipants <= 2) return "grid-cols-1";
		// if (totalParticipants <= 2) return "grid-cols-2";
		// if (totalParticipants <= 4) return "grid-cols-2";
		return "grid-cols-3";
	};

	return (
		<div className="w-full h-full flex flex-col justify-between items-center gap-4 p-4 overflow-hidden">
			{/* Connection Status */}
			<div className="text-center">
				<h2 className="text-xl font-bold mb-2">Video Conference</h2>
				<p className="text-sm">
					{isInCall
						? `In call with ${peers.size} other${
								peers.size !== 1 ? "s" : ""
						  }`
						: `People in call:
						${others.filter((u) => u.presence?.inCall).length}`}
				</p>

				{/* FIXED: Show other users' presence status */}
				<p className="text-xs mt-1">People Online: {others.length}</p>
			</div>

			{/* Video Grid */}
			<div
				className={`flex-1 grid gap-4 w-full max-w-6xl ${getGridClass()} overflow-auto`}
			>
				{/* Local Video */}
				{isInCall && (
					<VideoPlayer
						stream={localStream}
						muted={true}
						isLocal={true}
						label="You"
						name={"You"}
						avatar={self?.info?.image}
						isVideoEnabled={isVideoEnabled}
					/>
				)}

				{/* Remote Videos */}
				{Array.from(peers.values()).map((peer) => {
					console.log(
						`Rendering peer ${peer.name}, has stream:`,
						peer.avatar
					);
					return (
						<VideoPlayer
							key={peer.id}
							stream={peer.stream}
							muted={false}
							isLocal={false}
							label={`User ${peer.id.slice(0, 8)}`}
							name={peer.name}
							avatar={peer.avatar}
						/>
					);
				})}
			</div>

			{/* Controls */}
			<div className="flex gap-3 justify-center items-center">
				<button
					onClick={handleToggleCall}
					className={`flex items-center gap-2 px-4 py-2 rounded-lg font-sm transition-colors ${
						isInCall
							? "bg-red-700 hover:bg-red-800 text-white"
							: "bg-green-700 hover:bg-green-800 text-white"
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
							className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
								!isVideoEnabled
									? "bg-gray-700 text-gray-300"
									: "bg-primary text-primary-foreground/50"
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
							className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
								!isAudioEnabled
									? "bg-gray-700 text-gray-300"
									: "bg-primary text-primary-foreground/50"
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
