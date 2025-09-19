// import {
// 	DeleteServiceCommand,
// 	DescribeServicesCommand,
// 	ECSClient,
// 	StopTaskCommand,
// } from "@aws-sdk/client-ecs";
import type { R2Files } from "./types.js";
import "dotenv/config";
import { error } from "console";

// const client = new ECSClient({
// 	region: "us-east-1",
// 	credentials: {
// 		accessKeyId: "",
// 		secretAccessKey: "",
// 	},
// });

// export const testDescribe = async () => {
// 	const command = new DescribeServicesCommand({
// 		cluster: "virtualboxcc",
// 		services: ["virtualboxcc"],
// 	});

// 	const response = await client.send(command);
// 	console.log("describing:", response);
// 	return response;
// };

// export const stopServer = async (service: string) => {
// 	const command = new DeleteServiceCommand({
// 		cluster: "virtualboxcc",
// 		service,
// 		force: true,
// 	});

// 	try {
// 		const response = await client.send(command);
// 		console.log("Stopped server:", response);
// 	} catch (error) {
// 		console.error("Error stopping server: ", error);
// 	}
// };

export const renameFile = async (
	fileId: string,
	newFileId: string,
	data: string
): Promise<boolean> => {
	try {
		const res = await fetch(
			`${process.env.STORAGE_INITIAL_URL}/api/rename`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ fileId, newFileId, data }),
			}
		);

		if (!res.ok) {
			console.error(
				`❌ renameFile failed: ${res.status} ${res.statusText}`
			);
			return false;
		}

		return true;
	} catch (err) {
		console.error("❌ renameFile network error:", err);
		return false;
	}
};

export const saveFile = async (fileId: string, data: string) => {
	try {
		const res = await fetch(`${process.env.STORAGE_INITIAL_URL}/api/save`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ fileId, data }),
		});

		if (!res.ok) {
			console.error(
				`❌ saveFile failed: ${res.status} ${res.statusText}`
			);
			return false;
		}

		return true;
	} catch (error) {
		console.error("❌ saveFile network error:", error);
		return false;
	}
};

export const createFile = async (fileId: string) => {
	try {
		const res = await fetch(`${process.env.STORAGE_INITIAL_URL}/api`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ fileId }),
		});

		if (!res.ok) {
			console.error(
				`❌ createFile failed: ${res.status} ${res.statusText}`
			);
			return false;
		}

		return true;
	} catch (error) {
		console.error("❌ createFile network error:", error);
		return false;
	}
};

export const deleteFile = async (fileId: string) => {
	try {
		const res = await fetch(`${process.env.STORAGE_INITIAL_URL}/api`, {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ fileId }),
		});

		if (!res.ok) {
			console.error(
				`❌ deleteFile failed: ${res.status} ${res.statusText}`
			);
			return false;
		}

		return true;
	} catch (error) {
		console.error("❌ deleteFile network error:", error);
		return false;
	}
};

export const generateCode = async ({
	fileName,
	code,
	line,
	instructions,
}: {
	fileName: string;
	code: string;
	line: number;
	instructions: string;
}) => {
	try {
		return await fetch(process.env.WORKERS_AI_API_URI!, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${process.env.WORKERS_AI_API_TOKEN}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				messages: [
					{
						role: "system",
						content:
							"You are an expert coding assistant who reads from an existing code file, and suggests code to add to the file. You may be given instructions on what to generate, which you should follow. You should generate code that is correct, efficient, and follows best practices. You should also generate code that is clear and easy to read.",
					},
					{
						role: "user",
						content: `The file is called ${fileName}.`,
					},
					{
						role: "user",
						content: `Here are my instructions on what to generate: ${instructions}.`,
					},
					{
						role: "user",
						content: `Suggest me code to insert at line ${line} in my file. Give only the code, and NOTHING else. DO NOT include backticks in your response. My code file content is as follows  
            
            ${code}`,
					},
				],
			}),
		});
	} catch (err) {
		console.error("❌ generateCode network error:", err);
		return null;
	}
};

export const getProjectSize = async (id: string) => {
	try {
		const res = await fetch(
			`${process.env.STORAGE_INITIAL_URL}/api/size?virtualboxId=${id}`
		);

		return ((await res.json()) as any).size;
	} catch (error) {
		console.log("[getProjectSize network error]", error);
		return null;
	}
};

export const getFolder = async (folderId: string) => {
	try {
		const res = await fetch(
			`${process.env.STORAGE_INITIAL_URL}/api?folderId=${folderId}`
		);

		const data: R2Files = (await res.json()) as R2Files;

		return data.objects.map((obj) => obj.key);
	} catch (error) {
		console.log("[getFolder network error]", error);
		return null;
	}
};
