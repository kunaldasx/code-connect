import { create } from "zustand";

interface Peer {
	id: string;
	peer: any; // SimplePeer instance
	stream?: MediaStream;
}

interface VideoStore {
	localStream: MediaStream | null;
	peers: Map<string, Peer>;
	isVideoEnabled: boolean;
	isAudioEnabled: boolean;
	isInCall: boolean;

	setLocalStream: (stream: MediaStream | null) => void;
	addPeer: (userId: string, peer: any, stream?: MediaStream) => void;
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

	addPeer: (userId, peer, stream) => {
		set((state) => {
			const newPeers = new Map(state.peers);
			newPeers.set(userId, { id: userId, peer, stream });
			return { peers: newPeers };
		});
	},

	removePeer: (userId) => {
		set((state) => {
			const newPeers = new Map(state.peers);
			const peer = newPeers.get(userId);
			if (peer) {
				peer.peer.destroy();
				newPeers.delete(userId);
			}
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
			peer.peer.destroy();
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
