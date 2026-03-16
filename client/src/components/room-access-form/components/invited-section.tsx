/**
 * Room joining form section component for invited users.
 * Features:
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
import { cn } from "@/lib/utils";
import {
	labelCls,
	nameInputCls,
	submitButtonActive,
	submitButtonBase,
	submitButtonDisabled,
	submitButtonLoading,
} from "../constants";

interface InvitedSectionProps {
	isCreating: boolean;
	isSubmitting: boolean;
	onSubmit: (data: JoinRoomForm) => void;
	roomId: string;
}

export const InvitedSection = ({
	roomId,
	onSubmit,
	isSubmitting,
	isCreating,
}: InvitedSectionProps) => {
	const isDisabled = isCreating || isSubmitting;
	const [nameValue, setNameValue] = useState("");
	const canSubmit = nameValue.trim() !== "" && !isDisabled;

	return (
		<section aria-label="Join Room Form">
			<Form.Root
				className="flex flex-col gap-5"
				onSubmit={(e) => {
					e.preventDefault();
					const formData = new FormData(e.currentTarget);
					const name = (formData.get("name") as string).trim();
					onSubmit({ name, roomId });
				}}
			>
				<Form.Field className="flex flex-col gap-1.5" name="name">
					<Form.Label className={labelCls}>YOUR NAME</Form.Label>
					<Form.Control asChild>
						<Input
							autoComplete="name"
							autoFocus
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
