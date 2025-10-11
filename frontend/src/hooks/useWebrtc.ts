import { useRef, useCallback } from "react";
import SimplePeer from "simple-peer";
import {
	useBroadcastEvent,
	useEventListener,
	useOthers,
	useSelf,
} from "@liveblocks/react";
import { useVideoStore } from "@/store/videoStore";

interface SignalData {
	from: string;
	to: string;
	signal: SimplePeer.SignalData;
}

export function useWebRTC() {
	const broadcast = useBroadcastEvent();
	const others = useOthers();
	const self = useSelf();
	const peersRef = useRef<Map<string, SimplePeer.Instance>>(new Map());

	const {
		localStream,
		setLocalStream,
		addPeer,
		removePeer,
		setIsInCall,
		cleanup,
		isInCall,
	} = useVideoStore();

	// Initialize local media stream
	const initializeMediaStream = useCallback(async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: {
					width: { ideal: 1280 },
					height: { ideal: 720 },
				},
				audio: true,
			});
			setLocalStream(stream);
			return stream;
		} catch (error) {
			console.error("Error accessing media devices:", error);
			return new MediaStream();
		}
	}, [setLocalStream]);

	// Determine who should be the initiator based on user IDs
	const shouldInitiate = useCallback(
		(otherUserId: string) => {
			const myId = self?.id;
			if (!myId) return false;
			// Use string comparison to ensure deterministic behavior
			// The user with the "smaller" ID always initiates
			return myId < otherUserId;
		},
		[self?.id]
	);

	// Create a peer connection
	const createPeer = useCallback(
		(
			userId: string,
			initiator: boolean,
			stream: MediaStream
		): SimplePeer.Instance => {
			console.log(
				`Creating peer with ${userId}, initiator: ${initiator}`
			);

			// Get user info from others array - FIXED: Use correct Liveblocks structure
			const userInfo = others.find((user) => user.id === userId);
			const userName =
				userInfo?.info?.name || `User ${userId.slice(0, 8)}`;
			const userAvatar = userInfo?.info?.image;

			const peer = new SimplePeer({
				initiator,
				trickle: false,
				stream,
				config: {
					iceServers: [
						{ urls: "stun:stun.l.google.com:19302" },
						{ urls: "stun:stun1.l.google.com:19302" },
					],
				},
			});

			peer.on("signal", (data) => {
				console.log(`Sending signal to ${userId}:`, data.type);
				// Send signal to the other peer via Liveblocks
				broadcast({
					type: "webrtc-signal",
					from: self?.id || "",
					to: userId,
					signal: data,
				});
			});

			peer.on("stream", (remoteStream) => {
				console.log(`Received stream from ${userId}`);
				// Add the remote stream to the store - FIXED: Pass the stream parameter
				addPeer(userId, peer, remoteStream, userName, userAvatar);
			});

			peer.on("error", (err) => {
				console.error(`Peer connection error with ${userId}:`, err);
				removePeer(userId);
				peersRef.current.delete(userId);
			});

			peer.on("close", () => {
				console.log(`Peer connection closed with ${userId}`);
				removePeer(userId);
				peersRef.current.delete(userId);
			});

			peer.on("connect", () => {
				console.log(`Peer connected with ${userId}`);
			});

			peersRef.current.set(userId, peer);
			// FIXED: Only add to store initially without stream, it will be updated when stream event fires
			addPeer(userId, peer, undefined, userName, userAvatar);

			return peer;
		},
		[broadcast, self?.id, addPeer, removePeer, others]
	);

	// Join the call
	const joinCall = useCallback(async () => {
		try {
			const stream = await initializeMediaStream();
			setIsInCall(true);

			// FIXED: Wait a bit for presence to update, then notify others
			setTimeout(() => {
				broadcast({
					type: "user-joined-call",
					userId: self?.id,
				});
			}, 100);

			// Create peer connections with all users already in the call
			// Only initiate if we should be the initiator
			setTimeout(() => {
				others.forEach((user) => {
					if (
						user.presence?.inCall &&
						shouldInitiate(user.id ?? "")
					) {
						console.log(
							`Initiating connection with existing user ${user.id}`
						);
						createPeer(user.id ?? "", true, stream);
					}
				});
			}, 200);
		} catch (error) {
			console.error("Failed to join call:", error);
			setIsInCall(false);
		}
	}, [
		initializeMediaStream,
		setIsInCall,
		broadcast,
		self?.id,
		others,
		createPeer,
		shouldInitiate,
	]);

	// Leave the call
	const leaveCall = useCallback(() => {
		// Notify others that you've left
		broadcast({
			type: "user-left-call",
			userId: self?.id,
		});

		// Clean up all connections and streams
		cleanup();
		peersRef.current.clear();
	}, [broadcast, self?.id, cleanup]);

	// Handle incoming WebRTC signals
	useEventListener(({ event }) => {
		// FIXED: Check event structure properly
		if (event?.type === "webrtc-signal" && isInCall) {
			const signalData = event as unknown as SignalData;
			const { from, to, signal } = signalData;

			// Only process signals meant for us
			if (to !== self?.id) return;

			console.log(`Received signal from ${from}:`, signal.type);

			let peer = peersRef.current.get(from);

			if (!peer && localStream) {
				// Create a new peer connection if it doesn't exist
				// We are NOT the initiator since we're receiving a signal first
				console.log(`Creating non-initiator peer for ${from}`);
				peer = createPeer(from, false, localStream);
			}

			if (peer && signal) {
				try {
					peer.signal(signal);
				} catch (error) {
					console.error(`Error signaling peer ${from}:`, error);
				}
			}
		}

		// Handle user joining the call
		if (event?.type === "user-joined-call" && isInCall) {
			const { userId } = event as any;

			// Skip if it's our own event
			if (userId === self?.id) return;

			console.log(`User ${userId} joined the call`);

			// Only create connection if we should initiate AND don't already have a peer
			if (
				localStream &&
				!peersRef.current.has(userId) &&
				shouldInitiate(userId)
			) {
				console.log(
					`User ${userId} joined, we should initiate connection`
				);
				// FIXED: Add a small delay to ensure both users are ready
				setTimeout(() => {
					createPeer(userId, true, localStream);
				}, 300);
			} else {
				console.log(
					`User ${userId} joined, waiting for them to initiate`
				);
			}
		}

		// Handle user leaving the call
		if (event?.type === "user-left-call") {
			const { userId } = event as any;
			const peer = peersRef.current.get(userId);
			if (peer) {
				console.log(`User ${userId} left, cleaning up connection`);
				peer.destroy();
				peersRef.current.delete(userId);
				removePeer(userId);
			}
		}
	});

	return {
		joinCall,
		leaveCall,
		isInCall,
	};
}
