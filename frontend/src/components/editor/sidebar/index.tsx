"use client";

import { FilePlus, FolderPlus, Loader2, Search, Sparkles } from "lucide-react";
import { TFile, TFolder, TTab } from "./types";
import SidebarFile from "./file";
import SidebarFolder from "./folder";
import { useEffect, useRef, useState } from "react";
import New from "./new";
import { Socket } from "socket.io-client";
import { Virtualbox } from "@/types/codeEditor";
import {
	dropTargetForElements,
	monitorForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { Sidebar, SidebarContent, SidebarGroup } from "@/components/ui/sidebar";
import VideoConference from "../videoConference";
import AIButton from "@/components/shared/aiButton";

export default function AppSidebar({
	sidebarContent,
	virtualboxData,
	setFiles,
	files,
	selectFile,
	handleRename,
	handleDeleteFile,
	handleDeleteFolder,
	socket,
	addNew,
	ai,
	setAi,
	deletingFolderId,
}: {
	sidebarContent: "explorer" | "video-conference";
	virtualboxData: Virtualbox;
	setFiles: (files: (TFile | TFolder)[]) => void;
	files: (TFile | TFolder)[];
	selectFile: (tab: TTab) => void;
	handleRename: (
		id: string,
		newName: string,
		oldName: string,
		type: "file" | "folder"
	) => boolean;
	handleDeleteFile: (file: TFile) => void;
	handleDeleteFolder: (folder: TFolder) => void;
	socket: Socket;
	addNew: (name: string, type: "file" | "folder") => void;
	ai: boolean;
	setAi: React.Dispatch<React.SetStateAction<boolean>>;
	deletingFolderId: string;
}) {
	const ref = useRef(null);
	const [movingId, setMovingId] = useState("");
	const [creatingNew, setCreatingNew] = useState<"file" | "folder" | null>(
		null
	);

	useEffect(() => {
		const el = ref.current;

		if (el) {
			return dropTargetForElements({
				element: el,
				getData: () => ({ id: `projects/${virtualboxData.id}` }),
				canDrop: ({ source }) => {
					const file = files.find(
						(child) => child.id === source.data.id
					);
					const canDrop = !file;
					return canDrop;
				},
			});
		}
	}, [files, virtualboxData.id]);

	useEffect(() => {
		return monitorForElements({
			onDrop: ({ source, location }) => {
				const destination = location.current.dropTargets[0];
				if (!destination) {
					console.log("No destination found");
					return;
				}

				// Add null check for socket
				if (!socket) {
					console.error("Socket is not connected");
					return;
				}

				const fileId = source.data.id as string;
				const folderId = destination.data.id as string;

				const fileFolder = fileId.split("/").slice(0, -1).join("/");

				if (fileFolder === folderId) {
					console.log("File is already in this folder");
					return;
				}

				setMovingId(fileId);

				socket.emit(
					"moveFile",
					fileId,
					folderId,
					(response: (TFolder | TFile)[]) => {
						console.log("Move file response:", response);
						if (response) {
							setFiles(response);
						}
						setMovingId("");
					}
				);
			},
		});
	}, [socket, setFiles, virtualboxData.id]);
	return (
		<Sidebar className="h-full relative max-h-full flex flex-col items-start w-full">
			{sidebarContent === "explorer" ? (
				// File Explorer
				<SidebarContent>
					<div className="flex w-full items-center justify-between h-8 px-4 py-4 border-b">
						<div className="text-muted-foreground">Explorer</div>

						<div className="flex space-x-1">
							<button
								disabled={!!creatingNew}
								onClick={() => setCreatingNew("file")}
								className="disabled:opacity-50 disabled:hover:bg-background h-6 w-6 text-muted-foreground ml-0.5 flex items-center justify-center translate-x-1 bg-transparent hover:bg-muted-foreground/25 cursor-pointer rounded-sm transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
							>
								<FilePlus className="h-4 w-4" />
							</button>
							<button
								disabled={!!creatingNew}
								onClick={() => setCreatingNew("folder")}
								className="disabled:opacity-50 disabled:hover:bg-background h-6 w-6 text-muted-foreground ml-0.5 flex items-center justify-center translate-x-1 bg-transparent hover:bg-muted-foreground/25 cursor-pointer rounded-sm transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
							>
								<FolderPlus className="h-4 w-4" />
							</button>
							<div className="h-6 w-6 text-muted-foreground ml-0.5 flex items-center justify-center translate-x-1 bg-transparent hover:bg-muted-foreground/25 cursor-pointer rounded-sm transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
								<Search className="w-4 h-4" />
							</div>
						</div>
					</div>

					<SidebarGroup
						ref={ref}
						className="rounded-sm w-full flex flex-col"
					>
						{files.length === 0 ? (
							<div className="flex justify-center w-full">
								<Loader2 className="w-4 h-4 animate-spin" />
							</div>
						) : (
							files.map((child) =>
								child.type === "file" ? (
									<SidebarFile
										key={child.id}
										data={child}
										selectFile={selectFile}
										handleRename={handleRename}
										handleDeleteFile={handleDeleteFile}
										movingId={movingId}
										deletingFolderId={deletingFolderId}
									/>
								) : (
									<SidebarFolder
										key={child.id}
										data={child}
										selectFile={selectFile}
										handleRename={handleRename}
										handleDeleteFile={handleDeleteFile}
										handleDeleteFolder={handleDeleteFolder}
										movingId={movingId}
										deletingFolderId={deletingFolderId}
									/>
								)
							)
						)}
						{creatingNew !== null ? (
							<New
								type={creatingNew}
								stopEditing={() => setCreatingNew(null)}
								socket={socket}
								addNew={addNew}
							/>
						) : null}
					</SidebarGroup>
					{/* <SidebarSeparator /> */}

					<SidebarGroup className="w-full space-y-4 px-4 py-4 border-t overflow-hidden">
						<div className="flex items-start justify-start w-full gap-4">
							<div className="flex items-center">
								<Sparkles
									className={`h-4 w-4 mr-2 ${
										ai
											? "text-indigo-500"
											: "text-muted-foreground"
									}`}
								/>
								Copilot
								<span className="font-mono text-muted-foreground inline-block ml-1.5 text-xs leading-none border border-b-2 border-muted-foreground py-1 px-1.5 rounded-md">
									ctrl+G
								</span>
							</div>
							<AIButton checked={ai} onCheckedChange={setAi} />
						</div>
					</SidebarGroup>
				</SidebarContent>
			) : (
				// Code Generation
				<SidebarContent>
					<VideoConference />
				</SidebarContent>
			)}
		</Sidebar>
	);
}
