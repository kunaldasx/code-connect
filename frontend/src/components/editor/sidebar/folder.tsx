"use client";

import { useEffect, useRef, useState } from "react";
import { TFile, TFolder, TTab } from "./types";
import { getIconForFolder, getIconForOpenFolder } from "vscode-icons-js";
import Image from "next/image";
import SidebarFile from "./file";
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ChevronDown, ChevronRight, Pencil, Trash2 } from "lucide-react";
import {
	dropTargetForElements,
	draggable,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";

export default function SidebarFolder({
	data,
	selectFile,
	handleRename,
	handleDeleteFile,
	handleDeleteFolder,
	movingId,
	deletingFolderId,
}: {
	data: TFolder;
	selectFile: (file: TTab) => void;
	handleRename: (
		id: string,
		newName: string,
		oldName: string,
		type: "file" | "folder"
	) => boolean;
	handleDeleteFile: (file: TFile) => void;
	handleDeleteFolder: (folder: TFolder) => void;
	movingId: string;
	deletingFolderId: string;
}) {
	const ref = useRef(null);
	const [isDraggedOver, setIsDraggedOver] = useState(false);
	const [dragging, setDragging] = useState(false);
	const isDeleting =
		deletingFolderId.length > 0 && data.id.startsWith(deletingFolderId);

	const [isOpen, setIsOpen] = useState(false);
	const folder = isOpen
		? getIconForOpenFolder(data.name)
		: getIconForFolder(data.name);

	const [editing, setEditing] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const el = ref.current;

		if (el) {
			// Setup both draggable and drop target
			const cleanupDraggable = draggable({
				element: el,
				onDragStart: () => setDragging(true),
				onDrop: () => setDragging(false),
				getInitialData: () => ({ id: data.id }),
			});

			const cleanupDropTarget = dropTargetForElements({
				element: el,
				onDragEnter: () => {
					console.log("Drag entered folder:", data.name);
					setIsDraggedOver(true);
				},
				onDragLeave: () => {
					console.log("Drag left folder:", data.name);
					setIsDraggedOver(false);
				},
				onDrop: () => {
					console.log("Drop on folder:", data.name);
					setIsDraggedOver(false);
				},
				getData: () => ({ id: data.id }),
				canDrop: ({ source }) => {
					// Don't allow dropping on itself or if currently moving
					const sourceId = source.data.id as string;
					console.log(
						"canDrop check - source:",
						sourceId,
						"target:",
						data.id
					);
					return sourceId !== data.id && !movingId;
				},
			});

			return () => {
				cleanupDraggable();
				cleanupDropTarget();
			};
		}
	}, [data.id, data.name, movingId]);

	useEffect(() => {
		if (editing) {
			inputRef.current?.focus();
		}
	}, [editing]);

	const renameFolder = () => {
		const renamed = handleRename(
			data.id,
			inputRef.current?.value ?? data.name,
			data.name,
			"folder" // Fix: should be "folder", not "file"
		);

		if (!renamed && inputRef.current) {
			inputRef.current.value = data.name;
		}

		setEditing(false);
	};

	return (
		<ContextMenu>
			<ContextMenuTrigger
				ref={ref}
				disabled={isDeleting || dragging}
				onDoubleClick={() => {
					setEditing(true);
				}}
				onClick={() => setIsOpen((prev) => !prev)}
				className={`${
					isDraggedOver
						? "bg-secondary/50 rounded-t-sm"
						: "rounded-sm"
				} ${
					dragging ? "opacity-50" : ""
				} w-full flex items-center h-7 px-1 transition-colors hover:bg-secondary cursor-pointer rounded-sm`}
			>
				{isOpen ? (
					<ChevronDown className="size-6" />
				) : (
					<ChevronRight className="size-6" />
				)}
				<Image
					src={`/icons/${folder}`}
					alt="Folder icon"
					width={18}
					height={18}
					className="mr-2"
				/>
				{isDeleting ? (
					<>
						<div className="text-muted-foreground animate-pulse">
							Deleting...
						</div>
					</>
				) : (
					<form
						onSubmit={(e) => {
							e.preventDefault();
							renameFolder();
						}}
					>
						<input
							className={`bg-transparent w-full outline-foreground ${
								editing ? "" : "pointer-events-none"
							}`}
							ref={inputRef}
							disabled={!editing}
							defaultValue={data.name}
							onBlur={() => renameFolder()}
						/>
					</form>
				)}
			</ContextMenuTrigger>
			<ContextMenuContent>
				<ContextMenuItem
					onClick={() => {
						setEditing(true);
					}}
				>
					<Pencil className="w-4 h-4 mr-2" />
					Rename
				</ContextMenuItem>
				<ContextMenuItem
					disabled={isDeleting}
					onClick={() => {
						handleDeleteFolder(data);
					}}
				>
					<Trash2 className="w-4 h-4 mr-2" />
					Delete
				</ContextMenuItem>
			</ContextMenuContent>
			{isOpen ? (
				<div
					className={`${
						isDraggedOver ? "rounded-b-sm bg-secondary/50" : ""
					} flex w-full items-stretch`}
				>
					<div className="w-[1px] bg-border mx-2 h-full"></div>
					<div className="flex flex-col grow">
						{data.children?.map((child) =>
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
						)}
					</div>
				</div>
			) : null}
		</ContextMenu>
	);
}
