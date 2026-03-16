/**
 * Room joining form section component.
 * Features:
 * - Room ID validation
 * - Name input validation
 * - Submit handling
 * - Loading states
 *
 * By Kunal Das
 */

import { useState } from "react";
import * as Form from "@radix-ui/react-form";
import { Spinner } from "@/components/spinner";
import { Input } from "@/components/ui/input";
import { NAME_MAX_LENGTH } from "@/lib/constants";

import type { JoinRoomForm } from "../types";
import { onRoomIdChange } from "../utils";
import {
	labelCls,
	nameInputCls,
	roomIdInputCls,
	submitButtonActive,
	submitButtonBase,
	submitButtonDisabled,
	submitButtonLoading,
} from "../constants";
import { cn } from "@/lib/utils";

interface JoinRoomSectionProps {
	defaultRoomId: string;
	isCreating: boolean;
	isSubmitting: boolean;
	onSubmit: (data: JoinRoomForm) => void;
}

export const JoinRoomSection = ({
	defaultRoomId,
	onSubmit,
	isSubmitting,
	isCreating,
}: JoinRoomSectionProps) => {
	const isDisabled = isCreating || isSubmitting;

	const [nameValue, setNameValue] = useState("");
	const [roomIdValue, setRoomIdValue] = useState(defaultRoomId);
	const canSubmit =
		nameValue.trim() !== "" && roomIdValue.length === 9 && !isDisabled;

	return (
		<section aria-labelledby="join-room-heading">
			<h2 className="sr-only" id="join-room-heading">
				Join a Room
			</h2>

			<Form.Root
				className="flex flex-col gap-5"
				onSubmit={(e) => {
					e.preventDefault();
					const formData = new FormData(e.currentTarget);
					const name = (formData.get("name") as string).trim();
					const roomId = formData.get("roomId") as string;
					onSubmit({ name, roomId });
				}}
			>
				{/* ── Room ID field ── */}
				<Form.Field className="flex flex-col gap-1.5" name="roomId">
					<Form.Label className={labelCls}>ROOM ID</Form.Label>
					<Form.Control asChild>
						<Input
							className={roomIdInputCls}
							defaultValue={defaultRoomId}
							disabled={isDisabled}
							maxLength={9}
							onChange={(e) => {
								onRoomIdChange(e);
								setRoomIdValue(e.target.value);
							}}
							pattern="[A-Z0-9]{4}-[A-Z0-9]{4}"
							placeholder="XXXX-XXXX"
							required
						/>
					</Form.Control>
					<Form.Message
						className="text-red-400 text-xs mt-1"
						match="valueMissing"
					>
						Room ID is required
					</Form.Message>
					<Form.Message
						className="text-red-400 text-xs mt-1"
						match="patternMismatch"
					>
						Invalid room ID — must be XXXX-XXXX
					</Form.Message>
				</Form.Field>

				{/* ── Name field ── */}
				<Form.Field className="flex flex-col gap-1.5" name="name">
					<Form.Label className={labelCls}>YOUR NAME</Form.Label>
					<Form.Control asChild>
						<Input
							autoComplete="name"
							className={nameInputCls}
							disabled={isDisabled}
							maxLength={NAME_MAX_LENGTH}
							placeholder="Enter your display name"
							required
							value={nameValue}
							onChange={(e) => setNameValue(e.target.value)}
						/>
					</Form.Control>
					<Form.Message
						className="text-red-400 text-xs mt-1"
						match="valueMissing"
					>
						Name is required
					</Form.Message>
					<Form.Message
						className="text-red-400 text-xs mt-1"
						match={(value) => value.trim().length > NAME_MAX_LENGTH}
					>
						{`Name must not exceed ${NAME_MAX_LENGTH} characters`}
					</Form.Message>
				</Form.Field>

				{/* ── Submit ── */}
				<Form.Submit asChild>
					<button
						aria-busy={isSubmitting}
						disabled={isDisabled}
						className={cn(
							submitButtonBase,

							isSubmitting
								? submitButtonLoading
								: canSubmit
									? submitButtonActive
									: submitButtonDisabled,
						)}
						onMouseEnter={(e) => {
							if (canSubmit && !isSubmitting)
								e.currentTarget.style.boxShadow =
									"0 18px 48px rgba(176,122,255,0.38)";
						}}
						onMouseLeave={(e) => {
							if (canSubmit && !isSubmitting)
								e.currentTarget.style.boxShadow =
									"0 8px 28px rgba(176,122,255,0.22)";
						}}
					>
						{isSubmitting ? <Spinner className="mr-2 size-4" /> : "⤳ "}
						{isSubmitting ? "ESTABLISHING LINK…" : "BEAM INTO ROOM"}
					</button>
				</Form.Submit>
			</Form.Root>
		</section>
	);
};
