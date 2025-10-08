"use server";

import { revalidatePath } from "next/cache";

export async function createVirtualbox(body: {
	type: string;
	name: string;
	visibility: string;
}) {
	const res = await fetch(
		`${process.env.DATABASE_INITIAL_URL}/api/virtualbox`,
		{
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		}
	);

	return await res.text();
}

export async function deleteVirtualbox(id: string) {
	await fetch(`${process.env.DATABASE_INITIAL_URL}/api/virtualbox?id=${id}`, {
		method: "DELETE",
	});

	revalidatePath("/dashboard");
}

export async function updateVirtualbox(body: {
	id: string;
	name?: string;
	visibility?: "public" | "private";
}) {
	await fetch(`${process.env.DATABASE_INITIAL_URL}/api/virtualbox`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});

	revalidatePath("/dashboard");
}

export async function shareVirtualbox(virtualboxId: string, email: string) {
	try {
		const res = await fetch(
			`${process.env.DATABASE_INITIAL_URL}/api/virtualbox/share`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ virtualboxId, email }),
			}
		);
		const text = await res.text();

		if (res.status !== 200) {
			return { success: false, message: text };
		}

		revalidatePath(`/code/${virtualboxId}`);
		return { success: true, message: "Shared successfully" };
	} catch (err) {
		return { success: false, message: err };
	}
}

export async function unshareVirtualbox(virtualboxId: string, userId: string) {
	await fetch(`${process.env.DATABASE_INITIAL_URL}/api/virtualbox/share`, {
		method: "DELETE",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ virtualboxId, userId }),
	});

	revalidatePath(`/code/${virtualboxId}`);
}

export async function generateCode() {
	await fetch(
		"https://api.cloudflare.com/client/v4/accounts/b8a66f8a4ddbd419ef8e4bdfeea7aa60/ai/run/@cf/meta/llama-3-8b-instruct",
		{
			method: "POST",
			headers: {
				Authorization:
					"Bearer RBd66QH1LW3WFFjoarc1TBGgON0UcekCk3EnU_uC",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				messages: [
					{
						role: "system",
						content:
							"You are an expert coding assistant who reads from an existing code file, and suggests code to add to the file.",
					},
					{
						role: "user",
						content: "",
					},
				],
			}),
		}
	);
}
