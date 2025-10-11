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
		if (totalParticipants <= 1) return "grid-cols-1";
		if (totalParticipants <= 2) return "grid-cols-2";
		if (totalParticipants <= 4) return "grid-cols-2";
		return "grid-cols-3";
	};

	return (
		<div className="w-full h-full flex flex-col justify-between items-center gap-4 p-4 bg-gray-900 min-h-screen">
			{/* Connection Status */}
			<div className="text-white text-center">
				<h2 className="text-xl font-bold mb-2">Video Conference</h2>
				<p className="text-sm text-gray-300">
					{isInCall
						? `In call with ${peers.size} other${
								peers.size !== 1 ? "s" : ""
						  }`
						: "Not in call"}
				</p>
				{/* FIXED: Show other users' presence status */}
				<p className="text-xs text-gray-400 mt-1">
					Others in call:{" "}
					{others.filter((user) => user.presence?.inCall).length}
				</p>
			</div>

			{/* Video Grid */}
			<div
				className={`flex-1 grid gap-4 w-full max-w-6xl ${getGridClass()}`}
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
						`Rendering peer ${peer.id}, has stream:`,
						!!peer.stream
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
					className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
						isInCall
							? "bg-red-600 hover:bg-red-700 text-white"
							: "bg-green-600 hover:bg-green-700 text-white"
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
							className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
								!isVideoEnabled
									? "bg-gray-600 text-gray-300"
									: "bg-blue-600 hover:bg-blue-700 text-white"
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
							className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
								!isAudioEnabled
									? "bg-gray-600 text-gray-300"
									: "bg-blue-600 hover:bg-blue-700 text-white"
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

			{/* Debug Info */}
			{process.env.NODE_ENV === "development" && (
				<div className="text-xs text-gray-500 max-w-md">
					<div>Local stream: {localStream ? "Yes" : "No"}</div>
					<div>Peers: {peers.size}</div>
					<div>Others online: {others.length}</div>
					<div>
						Others in call:{" "}
						{others.filter((u) => u.presence?.inCall).length}
					</div>
				</div>
			)}
		</div>
	);
};

export default VideoConference;
