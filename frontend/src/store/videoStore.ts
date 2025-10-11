import { create } from "zustand";

interface Peer {
	id: string;
	peer: any; // SimplePeer instance
	stream?: MediaStream;
	name?: string;
	avatar?: string;
}

interface VideoStore {
	localStream: MediaStream | null;
	peers: Map<string, Peer>;
	isVideoEnabled: boolean;
	isAudioEnabled: boolean;
	isInCall: boolean;

	setLocalStream: (stream: MediaStream | null) => void;
	addPeer: (
		userId: string,
		peer: any,
		stream?: MediaStream,
		name?: string,
		avatar?: string
	) => void;
	removePeer: (userId: string) => void;
	toggleVideo: () => void;
	toggleAudio: () => void;
	setIsInCall: (inCall: boolean) => void;
	cleanup: () => void;
}

export const useVideoStore = create<VideoStore>((set, get) => ({
	localStream: null,
	peers: new Map(),
	isVideoEnabled: true,
	isAudioEnabled: true,
	isInCall: false,

	setLocalStream: (stream) => set({ localStream: stream }),

	addPeer: (userId, peer, stream, name, avatar) => {
		set((state) => {
			const newPeers = new Map(state.peers);
			const existingPeer = newPeers.get(userId);

			// FIXED: Update existing peer or create new one
			if (existingPeer) {
				// Update existing peer with new stream if provided
				newPeers.set(userId, {
					...existingPeer,
					peer: peer || existingPeer.peer,
					stream: stream || existingPeer.stream,
					name: name || existingPeer.name,
					avatar: avatar || existingPeer.avatar,
				});
			} else {
				// Create new peer
				newPeers.set(userId, {
					id: userId,
					peer,
					stream,
					name,
					avatar,
				});
			}

			console.log(`Added/Updated peer ${userId}, has stream:`, !!stream);
			return { peers: newPeers };
		});
	},

	removePeer: (userId) => {
		set((state) => {
			const newPeers = new Map(state.peers);
			const peer = newPeers.get(userId);
			if (peer) {
				// FIXED: Only destroy if peer exists and has destroy method
				if (peer.peer && typeof peer.peer.destroy === "function") {
					peer.peer.destroy();
				}
				newPeers.delete(userId);
			}
			console.log(`Removed peer ${userId}`);
			return { peers: newPeers };
		});
	},

	toggleVideo: () => {
		const { localStream, isVideoEnabled } = get();
		if (localStream) {
			const videoTrack = localStream.getVideoTracks()[0];
			if (videoTrack) {
				videoTrack.enabled = !isVideoEnabled;
				set({ isVideoEnabled: !isVideoEnabled });
			}
		}
	},

	toggleAudio: () => {
		const { localStream, isAudioEnabled } = get();
		if (localStream) {
			const audioTrack = localStream.getAudioTracks()[0];
			if (audioTrack) {
				audioTrack.enabled = !isAudioEnabled;
				set({ isAudioEnabled: !isAudioEnabled });
			}
		}
	},

	setIsInCall: (inCall) => set({ isInCall: inCall }),

	cleanup: () => {
		const { localStream, peers } = get();

		// Stop local stream
		if (localStream) {
			localStream.getTracks().forEach((track) => track.stop());
		}

		// Destroy all peer connections
		peers.forEach((peer) => {
			if (peer.peer && typeof peer.peer.destroy === "function") {
				peer.peer.destroy();
			}
		});

		set({
			localStream: null,
			peers: new Map(),
			isInCall: false,
			isVideoEnabled: true,
			isAudioEnabled: true,
		});
	},
}));
