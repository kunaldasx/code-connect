/**
 * Room access form that handles room creation and joining.
 * Features:
 * - Room creation form
 * - Room joining form
 * - Form validation
 * - Redirection handling
 *
 * By Kunal Das
 */

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { toast } from "sonner";
import { parseError } from "@/lib/utils";

import { BackButton } from "./components/back-button";
import { CreateRoomSection } from "./components/create-room-section";
import { InvitedSection } from "./components/invited-section";
import { JoinRoomSection } from "./components/join-room-section";
import { RedirectingCard } from "./components/redirecting-card";
import type { CreateRoomForm, JoinRoomForm } from "./types";
import { createRoom, isRoomIdValid, joinRoom } from "./utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

interface RoomAccessFormProps {
	roomId: string;
}

const RoomAccessForm = ({ roomId }: RoomAccessFormProps) => {
	const router = useRouter();
	const [isCreating, setIsCreating] = useState(false);
	const [isJoining, setIsJoining] = useState(false);
	const [isSuccessful, setIsSuccessful] = useState(false);

	const handleJoinRoom = async (data: JoinRoomForm) => {
		setIsJoining(true);
		try {
			const joinPromise = joinRoom(data.roomId, data.name);
			toast.promise(joinPromise, {
				loading: "Establishing link…",
				success: () => {
					router.push(`/room/${data.roomId}`);
					return "✦ Orbit locked. Happy coding!";
				},
				error: (error) => `Failed to join room.\n${parseError(error)}`,
			});
			await joinPromise;
			setIsSuccessful(true);
		} catch {
			// Toast already handles the error
		} finally {
			setIsJoining(false);
		}
	};

	const handleCreateRoom = async (data: CreateRoomForm) => {
		setIsCreating(true);
		try {
			const createPromise = createRoom(data.name);
			toast.promise(createPromise, {
				loading: "Launching room…",
				success: (rid) => {
					router.push(`/room/${rid}`);
					navigator.clipboard.writeText(rid);
					return "⊕ Room launched. Happy coding!";
				},
				error: (error) => `Failed to create room.\n${parseError(error)}`,
			});
			await createPromise;
			setIsSuccessful(true);
		} catch {
			// Toast already handles the error
		} finally {
			setIsCreating(false);
		}
	};

	if (isSuccessful) {
		return <RedirectingCard />;
	}

	const hasValidInvite = roomId && isRoomIdValid(roomId);
	const hasInvalidId = roomId && !isRoomIdValid(roomId);

	return (
		<>
			<div className="w-full max-w-[510px]">
				{/* ── Glass card ── */}
				<div
					role="region"
					aria-label="Room access form"
					className="room-card-glow relative overflow-hidden rounded-[26px] border border-cyan-300/15 bg-[rgba(5,12,36,0.88)] p-[30px] backdrop-blur-[32px]"
				>
					{/* Top shimmer line */}
					<div
						aria-hidden="true"
						className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(77,244,255,0.45),rgba(153,102,255,0.25),transparent)]"
					/>
					{/* Bottom shimmer line */}
					<div
						aria-hidden="true"
						className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,85,153,0.15),rgba(77,244,255,0.1),transparent)]"
					/>

					<div className="grid w-full items-center gap-5" role="group">
						{hasValidInvite ? (
							<>
								<div
									aria-live="polite"
									className="panel-fade space-y-2 text-center"
									role="status"
								>
									<p className="mb-1 font-mono text-[9px] tracking-[3px] text-cyan-300/55">
										{"// INCOMING INVITATION"}
									</p>
									<h2 className="m-0 font-display text-[22px] font-bold text-[#DCF0FF]">
										{"You've Been Invited"}
									</h2>
									<p className="text-[13px] text-[#DCF0FF]/40">
										Room:{" "}
										<span className="font-mono font-semibold tracking-[4px] text-cyan-300">
											{roomId}
										</span>
									</p>
								</div>

								<InvitedSection
									isCreating={isCreating}
									isSubmitting={isJoining}
									onSubmit={handleJoinRoom}
									roomId={roomId}
								/>
								<BackButton
									disabled={isJoining}
									onClick={() => router.push("/")}
								/>
							</>
						) : hasInvalidId ? (
							<div
								aria-live="polite"
								className="panel-fade flex flex-col space-y-4 text-center"
								role="status"
							>
								<p className="font-display text-[18px] font-bold text-[#DCF0FF]">
									Invalid Room ID
								</p>
								<p className="text-[13px] text-[#DCF0FF]/40">
									Please check the invite link and try again.
									<br />
									Room ID format:{" "}
									<span className="font-mono font-semibold tracking-[4px] text-cyan-300">
										XXXX-XXXX
									</span>
								</p>
								<BackButton
									disabled={isJoining}
									onClick={() => router.push("/")}
								/>
							</div>
						) : (
							<Tabs defaultValue="create" className="w-full">
								{/* ── Tab strip ── */}
								<TabsList className="mb-7 grid h-auto! w-full grid-cols-2 rounded-[15px] border-0 bg-black/45 p-1">
									<TabsTrigger
										value="create"
										className="rounded-xl border border-transparent py-3 font-display text-[10px] font-bold tracking-[0.22em] text-[rgba(220,240,255,0.28)] transition-all duration-300 data-[state=active]:border-cyan-400/25 data-[state=active]:bg-linear-to-br data-[state=active]:from-cyan-400/11 data-[state=active]:to-violet-500/[0.07] data-[state=active]:text-cyan-300 data-[state=active]:shadow-[0_0_20px_rgba(77,244,255,0.07)]"
									>
										⊕ CREATE
									</TabsTrigger>

									<TabsTrigger
										value="join"
										className="rounded-xl border border-transparent py-3 font-display text-[10px] font-bold tracking-[0.22em] text-[rgba(220,240,255,0.28)] transition-all duration-300 data-[state=active]:border-violet-400/25 data-[state=active]:bg-linear-to-br data-[state=active]:from-violet-400/11 data-[state=active]:to-fuchsia-500/[0.07] data-[state=active]:text-violet-300 data-[state=active]:shadow-[0_0_20px_rgba(176,122,255,0.07)]"
									>
										⤳ JOIN
									</TabsTrigger>
								</TabsList>

								<TabsContent value="create" className="panel-fade">
									<CreateRoomSection
										isJoining={isJoining}
										isSubmitting={isCreating}
										onSubmit={handleCreateRoom}
									/>
								</TabsContent>

								<TabsContent value="join" className="panel-fade">
									<JoinRoomSection
										defaultRoomId=""
										isCreating={isCreating}
										isSubmitting={isJoining}
										onSubmit={handleJoinRoom}
									/>
								</TabsContent>
							</Tabs>
						)}
					</div>
				</div>
			</div>
		</>
	);
};

export { RoomAccessForm };
