import type { R2Files, TFile, TFolder } from "./types.js";
import "dotenv/config";

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

// Updated buildHierarchicalStructure function that works with your fileData structure:
export function buildHierarchicalStructure(
	fileData: Array<{ id: string; data: string }>
): (TFolder | TFile)[] {
	const result: any[] = [];
	const folderMap = new Map<string, any>();

	// First, identify all unique folder paths from the file paths
	const folderPaths = new Set<string>();

	fileData.forEach((file) => {
		const pathParts = file.id.split("/");
		for (let i = 3; i < pathParts.length; i++) {
			const folderPath = pathParts.slice(0, i).join("/");
			folderPaths.add(folderPath);
		}
	});

	console.log("Identified folder paths:", Array.from(folderPaths));

	// Create folder objects and organize them hierarchically
	const sortedFolderPaths = Array.from(folderPaths).sort();

	sortedFolderPaths.forEach((folderPath) => {
		const pathParts = folderPath.split("/");
		const folderName = pathParts[pathParts.length - 1];

		const folder = {
			id: folderPath,
			name: folderName,
			type: "folder" as const,
			children: [] as any[],
		};

		folderMap.set(folderPath, folder);

		if (pathParts.length === 3) {
			// Root level folder (projects/virtualboxId/foldername)
			result.push(folder);
		} else {
			// Nested folder - add to parent
			const parentPath = pathParts.slice(0, -1).join("/");
			const parentFolder = folderMap.get(parentPath);
			if (parentFolder && parentFolder.children) {
				parentFolder.children.push(folder);
			}
		}
	});

	// Now add files to their respective folders or root
	fileData.forEach((file) => {
		const pathParts = file.id.split("/");
		const fileName = pathParts[pathParts.length - 1];

		const fileObj = {
			id: file.id,
			name: fileName,
			type: "file" as const,
		};

		if (pathParts.length === 3) {
			// Root level file (projects/virtualboxId/filename)
			result.push(fileObj);
		} else {
			// File in a folder - find the parent folder
			const parentPath = pathParts.slice(0, -1).join("/");
			const parentFolder = folderMap.get(parentPath);
			if (parentFolder && parentFolder.children) {
				parentFolder.children.push(fileObj);
			} else {
				console.warn(
					`Parent folder not found for file ${file.id}, parent path: ${parentPath}`
				);
			}
		}
	});

	console.log("Built hierarchy:", JSON.stringify(result, null, 2));

	return result;
}
