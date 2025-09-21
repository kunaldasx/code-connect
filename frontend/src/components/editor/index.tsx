"use client";

import {
	FileJson,
	FilesIcon,
	Loader2,
	Plus,
	SquareTerminal,
	TerminalSquare,
	VideoIcon,
} from "lucide-react";
import { Button } from "../ui/button";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "../ui/resizable";
import { BeforeMount, Editor, OnMount } from "@monaco-editor/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import monaco from "monaco-editor";
import { useClerk } from "@clerk/nextjs";
import FileTab from "../shared/fileTab";
import TerminalTab from "../shared/terminalTab";
import { TFile, TFolder, TTab } from "./sidebar/types";
import { io, Socket } from "socket.io-client";
import { processFileType } from "@/lib/utils";
import { toast } from "sonner";
import EditorTerminal from "./terminal";
import GenerateInput from "./generate";
import * as Y from "yjs";
import { MonacoBinding } from "y-monaco";
import { LiveblocksYjsProvider } from "@liveblocks/yjs";
import { Cursors } from "./live/cursors";
import { User, Virtualbox } from "@/types/codeEditor";
import { Terminal } from "@xterm/xterm";
import { createId } from "@paralleldrive/cuid2";
import DisableAccessModal from "./live/disableModel";
import PreviewWindow from "./preview";
import { ImperativePanelHandle } from "react-resizable-panels";
import { TypedLiveblocksProvider, useRoom } from "@/liveblocks.config";
import { Awareness } from "y-protocols/awareness";
import { SidebarContent, SidebarProvider } from "../ui/sidebar";
import AppSidebar from "./sidebar";

export default function CodeEditor({
	userData,
	virtualboxData,
}: {
	userData: User;
	virtualboxData: Virtualbox;
}) {
	const [editorRef, setEditorRef] =
		useState<monaco.editor.IStandaloneCodeEditor>();
	const [tabs, setTabs] = useState<TTab[]>([]);
	const [activeId, setActiveId] = useState<string>("");
	const [ai, setAi] = useState(false);
	const [files, setFiles] = useState<(TFile | TFolder)[]>([]);
	const [editorLanguage, setEditorLanguage] = useState<string | undefined>(
		undefined
	);
	const [activeFile, setActiveFile] = useState<string | null>(null);
	const [terminals, setTerminals] = useState<
		{ id: string; terminal: Terminal | null }[]
	>([]);
	const [provider, setProvider] = useState<TypedLiveblocksProvider>();
	const monacoRef = useRef<typeof monaco | null>(null);
	const [cursorLine, setCursorLine] = useState(0);
	const [activeTerminalId, setActiveTerminalId] = useState("");
	const [creatingTerminal, setCreatingTerminal] = useState(false);

	const generateRef = useRef<HTMLDivElement>(null);
	const [generate, setGenerate] = useState<{
		show: boolean;
		id: string;
		width: number;
		line: number;
		widget: monaco.editor.IContentWidget | undefined;
		pref: monaco.editor.ContentWidgetPositionPreference[];
	}>({ show: false, id: "", width: 0, widget: undefined, line: 0, pref: [] });
	const [decorations, setDecorations] = useState<{
		options: monaco.editor.IModelDeltaDecoration[];
		instance: monaco.editor.IEditorDecorationsCollection | undefined;
	}>({
		options: [],
		instance: undefined,
	});
	const editorContainerRef = useRef<HTMLDivElement>(null);
	const generateWidgetRef = useRef<HTMLDivElement>(null);

	const [disableAccess, setDisableAccess] = useState({
		isDisabled: false,
		message: "",
	});
	const [deletingFolderId, setDeletingFolderId] = useState("");
	const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(
		virtualboxData.type !== "react"
	);
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [sidebarContent, setSidebarContent] = useState<
		"explorer" | "video-conference"
	>("explorer");

	const previewPanelRef = useRef<ImperativePanelHandle>(null);
	const sidebarPanelRef = useRef<ImperativePanelHandle>(null);

	// ✅ FIXED: Create socket instance using useRef to persist across renders
	const socketRef = useRef<Socket | null>(null);

	const [isConnecting, setIsConnecting] = useState(false);

	// ✅ FIXED: Memoize socket connection parameters to avoid reconnections
	const connectionParams = useMemo(
		() => ({
			userId: userData.id,
			virtualboxId: virtualboxData.id,
			url: process.env.NEXT_PUBLIC_API_INITIAL_URL,
		}),
		[userData.id, virtualboxData.id]
	);

	// const activeTerminal = terminals.find((t) => t.id === activeTerminalId);

	const resizeObserver = new ResizeObserver((entries) => {
		for (const entry of entries) {
			const { width } = entry.contentRect;
			setGenerate((prev) => {
				return { ...prev, width };
			});
		}
	});

	// ✅ FIXED: Proper socket initialization and cleanup
	useEffect(() => {
		if (isConnecting) {
			console.log("Already connecting, skipping...");
			return;
		}

		let mounted = true;
		let socket: Socket | null = null;

		const initSocket = async () => {
			try {
				// Wait a bit to ensure any cleanup from previous render is complete
				await new Promise((resolve) => setTimeout(resolve, 100));
				setIsConnecting(true);

				if (!mounted) return;

				// Prevent multiple connections
				if (socketRef.current?.connected) {
					console.log(
						"Socket already connected, reusing existing connection"
					);
					return;
				}

				// Clean up any existing socket first
				if (socketRef.current) {
					console.log("Cleaning up existing socket");
					socketRef.current.removeAllListeners();
					socketRef.current.disconnect();
					socketRef.current = null;
					// Wait for disconnect to complete
					await new Promise((resolve) => setTimeout(resolve, 100));
				}

				if (!mounted) return;

				console.log("Creating new socket connection");

				// Create socket instance
				socket = io(
					`${connectionParams.url}?userId=${connectionParams.userId}&virtualboxId=${connectionParams.virtualboxId}`,
					{
						reconnection: false, // Disable auto-reconnection
						transports: ["websocket"],
						timeout: 10000,
					}
				);

				socketRef.current = socket;

				// Connection event handlers
				const onConnect = () => {
					if (!mounted) return;
					console.log("Socket connected successfully");
				};

				const onDisconnect = (reason: string) => {
					if (!mounted) return;
					console.log("Socket disconnected:", reason);

					setTerminals([]);
				};

				const onConnectError = (error: Error) => {
					if (!mounted) return;
					console.error("Socket connection error:", error);
				};

				// Business logic event handlers
				const onLoadedEvent = (files: (TFolder | TFile)[]) => {
					if (!mounted) return;
					console.log("Files loaded:", files);
					setFiles(files);
				};

				const onRateLimit = (message: string) => {
					toast.error(message);
				};

				const onDisableAccess = (message: string) => {
					setDisableAccess({
						isDisabled: true,
						message: message,
					});
				};

				const onOwnerDisconnected = () => {
					setDisableAccess({
						isDisabled: true,
						message: "The virtualbox owner has disconnected.",
					});
				};

				const onForceDisconnect = (reason: string) => {
					console.log("Force disconnected:", reason);
					toast.info("New connection established elsewhere");
				};

				// Register all event listeners
				socket.on("connect", onConnect);
				socket.on("disconnect", onDisconnect);
				socket.on("connect_error", onConnectError);
				socket.on("loaded", onLoadedEvent);
				socket.on("rateLimit", onRateLimit);
				socket.on("disableAccess", onDisableAccess);
				socket.on("ownerDisconnected", onOwnerDisconnected);
				socket.on("forceDisconnect", onForceDisconnect);

				// Setup resize observer
				if (editorContainerRef.current && mounted) {
					resizeObserver.observe(editorContainerRef.current);
				}
			} catch (error) {
				console.log("[InitSocket Error]", error);
			} finally {
				setIsConnecting(false);
			}
		};

		initSocket();

		// Cleanup function
		return () => {
			mounted = false;
			setIsConnecting(false);
			console.log("Cleaning up socket connection");

			if (socketRef.current) {
				socketRef.current.removeAllListeners();
				socketRef.current.disconnect();
				socketRef.current = null;
			}

			resizeObserver.disconnect();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		connectionParams.userId,
		connectionParams.virtualboxId,
		connectionParams.url,
	]);

	// ✅ FIXED: Helper function to get socket instance safely
	const getSocket = useCallback(() => {
		if (!socketRef.current?.connected) {
			console.warn("Socket not connected");
			return null;
		}
		return socketRef.current;
	}, []);

	// ✅ FIXED: Update all socket.emit calls to use getSocket()
	const selectFile = async (tab: TTab) => {
		if (tab.id === activeId) return;

		const socket = getSocket();
		if (!socket) return;

		const exists = tabs.find((t) => t.id === tab.id);
		setTabs((prev) => {
			if (exists) {
				return prev;
			}
			return [...prev, tab];
		});

		socket.emit("getFile", tab.id, (response: string) => {
			if (response === null) {
				console.error("Failed to fetch file", tab.id);
				return;
			}
			setActiveFile(response);
			setEditorLanguage(processFileType(tab.name));
			setActiveId(tab.id);
		});
	};

	const closeTab = (id: string) => {
		const numTabs = tabs.length;
		const index = tabs.findIndex((t) => t.id === id);

		if (index === -1) return;

		const nextId =
			activeId === id
				? numTabs === 1
					? null
					: index < numTabs - 1
					? tabs[index + 1].id
					: tabs[index - 1].id
				: activeId;

		setTabs((prev) => prev.filter((t) => t.id !== id));

		if (!nextId) {
			setActiveId("");
		} else {
			const nextTab = tabs.find((t) => t.id === nextId);

			if (nextTab) selectFile(nextTab);
		}
	};

	const clerk = useClerk();

	const handleEditorMount: OnMount = (editor, monaco) => {
		setEditorRef(editor);
		monacoRef.current = monaco;

		editor.onDidChangeCursorPosition((e) => {
			const { column, lineNumber } = e.position;
			if (lineNumber === cursorLine) return;
			setCursorLine(lineNumber);

			const model = editor.getModel();
			const endColumn = model?.getLineContent(lineNumber).length || 0;

			setDecorations((prev) => {
				return {
					...prev,
					options: [
						{
							range: new monaco.Range(
								lineNumber,
								column,
								lineNumber,
								endColumn
							),
							options: {
								afterContentClassName: "inline-decoration",
							},
						},
					],
				};
			});
		});

		editor.onDidBlurEditorText(() => {
			setDecorations((prev) => {
				return {
					...prev,
					options: [],
				};
			});
		});

		editor.addAction({
			id: "generate",
			label: "Generate",
			keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyG],
			precondition:
				"editorTextFocus && !suggestWidgetVisible && !renameInputVisible && !inSnippetMode && !quickFixWidgetVisible",
			run: () => {
				setGenerate((prev) => {
					return {
						...prev,
						show: !prev.show,
						pref: [
							monaco.editor.ContentWidgetPositionPreference.BELOW,
						],
					};
				});
			},
		});
	};

	const createTerminal = () => {
		try {
			const socket = getSocket();
			if (!socket) {
				toast.error("Not connected to server");
				return;
			}

			setCreatingTerminal(true);
			const id = createId();
			console.log("Creating terminal:", id);

			// Add terminal to state immediately
			setTerminals((prev) => [...prev, { id, terminal: null }]);
			setActiveTerminalId(id);

			// Emit createTerminal without delay
			socket.emit("createTerminal", id, (success: boolean) => {
				if (!success) {
					// Remove the terminal if creation failed
					setTerminals((prev) => prev.filter((t) => t.id !== id));
					toast.error("Failed to create terminal");
				}
			});
		} catch (error) {
			console.log("[createTerminal Error]", error);
		} finally {
			setCreatingTerminal(false);
		}
	};

	const closeTerminal = (termId: string) => {
		const socket = getSocket();
		if (!socket) return;

		const index = terminals.findIndex((t) => t.id === termId);
		if (index === -1) return;

		socket.emit("closeTerminal", termId, () => {
			setTerminals((prev) => {
				// ✅ Dispose the current terminal
				const termToClose = prev.find((t) => t.id === termId);
				termToClose?.terminal?.dispose();

				const newTerminals = prev.filter((t) => t.id !== termId);

				// Handle active terminal selection
				if (activeTerminalId === termId) {
					if (newTerminals.length === 0) {
						setActiveTerminalId("");
					} else if (index < newTerminals.length) {
						setActiveTerminalId(newTerminals[index].id);
					} else {
						setActiveTerminalId(
							newTerminals[newTerminals.length - 1].id
						);
					}
				}

				return newTerminals;
			});
		});
	};

	useEffect(() => {
		console.log("activedId changed:", activeId);
	}, [activeId]);

	const room = useRoom();

	useEffect(() => {
		const tab = tabs.find((t) => t.id === activeId);
		const model = editorRef?.getModel();

		if (!editorRef || !tab || !model) return;

		const yDoc = new Y.Doc();
		const yText = yDoc.getText(tab.id);
		const yProvider = new LiveblocksYjsProvider(room, yDoc);

		const onSync = (isSynced: boolean) => {
			if (isSynced) {
				const text = yText.toString();
				if (text === "") {
					if (activeFile) {
						yText.insert(0, activeFile);
					} else {
						setTimeout(() => {
							yText.insert(0, editorRef.getValue());
						}, 0);
					}
				}
			}
		};

		yProvider.on("sync", onSync);

		setProvider(yProvider);

		const binding = new MonacoBinding(
			yText,
			model,
			new Set([editorRef]),
			yProvider.awareness as unknown as Awareness
		);

		return () => {
			yDoc?.destroy();
			yProvider?.destroy();
			binding?.destroy();
			if (yProvider) {
				yProvider.off("sync", onSync);
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [editorRef, room, activeFile]);

	useEffect(() => {
		if (!ai) {
			setGenerate((prev) => {
				return {
					...prev,
					show: false,
				};
			});
			return;
		}
		if (generate.show) {
			editorRef?.changeViewZones(function (changeAccessor) {
				if (!generateRef.current) return;
				const id = changeAccessor.addZone({
					afterLineNumber: cursorLine,
					heightInLines: 3,
					domNode: generateRef.current,
				});

				setGenerate((prev) => {
					return { ...prev, id, line: cursorLine };
				});
			});

			if (!generateWidgetRef.current) return;

			const widgetElement = generateWidgetRef.current;

			const contentWidget = {
				getDomNode: () => {
					return widgetElement;
				},
				getId: () => {
					return "generate.widget";
				},
				getPosition: () => {
					return {
						position: {
							lineNumber: cursorLine,
							column: 1,
						},
						preference: generate.pref,
					};
				},
			};

			setGenerate((prev) => {
				return { ...prev, widget: contentWidget };
			});

			editorRef?.addContentWidget(contentWidget);

			if (generateRef.current && generateWidgetRef.current) {
				editorRef?.applyFontInfo(generateRef.current);
				editorRef?.applyFontInfo(generateWidgetRef.current);
			}
		} else {
			editorRef?.changeViewZones(function (changeAccessor) {
				changeAccessor.removeZone(generate.id);
				setGenerate((prev) => {
					return { ...prev, id: "" };
				});
			});

			if (!generate.widget) return;
			editorRef?.removeContentWidget(generate.widget);
			setGenerate((prev) => {
				return {
					...prev,
					widget: undefined,
				};
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [generate.show]);

	useEffect(() => {
		if (decorations.options.length === 0) {
			decorations.instance?.clear();
		}

		if (!ai) return;

		if (decorations.instance) {
			decorations.instance.set(decorations.options);
		} else {
			const instance = editorRef?.createDecorationsCollection();
			instance?.set(decorations.options);

			setDecorations((prev) => {
				return {
					...prev,
					instance,
				};
			});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [decorations.options]);

	const handleRename = (
		id: string,
		newName: string,
		oldName: string,
		type: "file" | "folder"
	) => {
		if (newName === oldName) {
			return false;
		}

		if (
			newName.includes("/") ||
			newName.includes("\\") ||
			newName.includes(" ") ||
			(type === "file" && !newName.includes(".")) ||
			(type === "folder" && newName.includes("."))
		) {
			toast.error("Invalid file name");
			return false;
		}

		const socket = getSocket();
		if (!socket) return false;

		socket.emit("renameFile", id, newName);

		setTabs((prev) =>
			prev.map((tab) => (tab.id === id ? { ...tab, name: newName } : tab))
		);

		return true;
	};

	// ✅ FIXED: Save file function
	const saveFile = useCallback(() => {
		const socket = getSocket();
		if (!socket || !activeId || !editorRef) return;

		setTabs((prev) =>
			prev.map((tab) =>
				tab.id === activeId ? { ...tab, saved: true } : tab
			)
		);

		socket.emit("saveFile", activeId, editorRef.getValue());
	}, [activeId, editorRef, getSocket]);

	// ✅ FIXED: Keyboard shortcuts with proper dependencies
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "s" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				saveFile();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [saveFile]);

	const handleDeleteFile = (file: TFile) => {
		const socket = getSocket();
		if (!socket) return;

		socket.emit("deleteFile", file.id, (response: (TFolder | TFile)[]) => {
			setFiles(response);
		});
		closeTab(file.id);
	};

	const closeTabs = (ids: string[]) => {
		const numTabs = tabs.length;

		if (numTabs === 0) return;

		const allIndexes = ids.map((id) => tabs.findIndex((t) => t.id === id));

		const indexes = allIndexes.filter((index) => index !== -1);
		if (indexes.length === 0) return;

		const activeIndex = tabs.findIndex((t) => t.id === activeId);

		const newTabs = tabs.filter((t) => !ids.includes(t.id));
		setTabs(newTabs);

		if (indexes.length === numTabs) {
			setActiveId("");
		} else {
			const nextTab =
				newTabs.length > activeIndex
					? newTabs[activeIndex]
					: newTabs[newTabs.length - 1];
			if (nextTab) {
				selectFile(nextTab);
			}
		}
	};

	const handleDeleteFolder = (folder: TFolder) => {
		const socket = getSocket();
		if (!socket) return;

		setDeletingFolderId(folder.id);

		socket.emit("getFolder", folder.id, (response: string[]) =>
			closeTabs(response)
		);

		socket.emit(
			"deleteFolder",
			folder.id,
			(response: (TFolder | TFile)[]) => {
				setFiles(response);
				setDeletingFolderId("");
			}
		);

		setTimeout(() => {
			setDeletingFolderId("");
		}, 3000);
	};

	const handleEditorWillMount: BeforeMount = (monaco) => {
		monaco.editor.addKeybindingRules([
			{
				keybinding: monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyG,
				command: "null",
			},
		]);
	};

	if (disableAccess.isDisabled) {
		return (
			<>
				<DisableAccessModal
					message={disableAccess.message}
					open={disableAccess.isDisabled}
					setOpen={() => {}}
				/>
			</>
		);
	}

	return (
		<>
			<div ref={generateRef} />
			<div className="absolute z-50 p-1" ref={generateWidgetRef}>
				{generate.show && ai ? (
					<GenerateInput
						user={userData}
						socket={getSocket()!}
						data={{
							fileName:
								tabs.find((t) => t.id === activeId)?.name ?? "",
							code: editorRef?.getValue() ?? "",
							line: generate.line,
						}}
						editor={{
							language: editorLanguage!,
						}}
						cancel={() => {}}
						submit={() => {}}
						width={generate.width - 90}
						onExpand={() => {
							editorRef?.changeViewZones(function (
								changeAccessor
							) {
								changeAccessor.removeZone(generate.id);

								if (!generateRef.current) return;

								const id = changeAccessor.addZone({
									afterLineNumber: cursorLine,
									heightInLines: 12,
									domNode: generateRef.current,
								});

								setGenerate((prev) => {
									return { ...prev, id };
								});
							});
						}}
						onAccept={(code: string) => {
							const line = generate.line;
							setGenerate((prev) => {
								return {
									...prev,
									show: !prev.show,
								};
							});
							console.log("accepted:", code);
							const file = editorRef?.getValue();

							const lines = file?.split("\n") || [];
							lines.splice(line - 1, 0, code);
							const updatedFile = lines.join("\n");
							editorRef?.setValue(updatedFile);
						}}
					/>
				) : null}
			</div>

			{/* Side Menu */}
			<div className="bg-secondary h-full w-12 flex flex-col justify-start items-center gap-8 py-4 px-2 z-20">
				<div
					onClick={() => {
						setSidebarContent("explorer");
						if (sidebarOpen && sidebarContent === "explorer") {
							setSidebarOpen((prev) => !prev);
							sidebarPanelRef.current?.collapse();
						} else if (!sidebarOpen) {
							setSidebarOpen((prev) => !prev);
							sidebarPanelRef.current?.expand();
						}
					}}
				>
					<FilesIcon />
				</div>
				<div
					onClick={() => {
						setSidebarContent("video-conference");
						if (
							sidebarOpen &&
							sidebarContent === "video-conference"
						) {
							setSidebarOpen((prev) => !prev);
							sidebarPanelRef.current?.collapse();
						} else if (!sidebarOpen) {
							setSidebarOpen((prev) => !prev);
							sidebarPanelRef.current?.expand();
						}
					}}
				>
					<VideoIcon />
				</div>
			</div>

			<SidebarProvider open={sidebarOpen}>
				<ResizablePanelGroup direction="horizontal">
					<ResizablePanel
						ref={sidebarPanelRef}
						defaultSize={18} // width percentage
						minSize={18}
						collapsible
						collapsedSize={0} // when collapsed, takes no space
						onCollapse={() => setSidebarOpen(false)}
						onExpand={() => setSidebarOpen(true)}
					>
						<AppSidebar
							sidebarContent={sidebarContent}
							virtualboxData={virtualboxData}
							setFiles={setFiles}
							files={files}
							selectFile={selectFile}
							handleRename={handleRename}
							handleDeleteFile={handleDeleteFile}
							handleDeleteFolder={handleDeleteFolder}
							socket={getSocket()!}
							addNew={(name, type) => {
								if (type === "file") {
									setFiles((prev) => [
										...prev,
										{
											id: `projects/${virtualboxData.id}/${name}`,
											name,
											type: "file",
										},
									]);
								} else {
									setFiles((prev) => [
										...prev,
										{
											id: `projects/${virtualboxData.id}/${name}`,
											name,
											type: "folder",
											children: [],
										},
									]);
								}
							}}
							ai={ai}
							setAi={setAi}
							deletingFolderId={deletingFolderId}
						/>
					</ResizablePanel>

					<ResizableHandle />

					<ResizablePanel
						minSize={30}
						defaultSize={60}
						className="flex flex-col p-2 w-full grow"
					>
						<div className="h-10 w-full flex gap-2">
							{tabs.map((tab) => (
								<FileTab
									key={tab.id}
									saved={tab.saved}
									selected={activeId === tab.id}
									onClick={() => selectFile(tab)}
									onClose={() => closeTab(tab.id)}
								>
									{tab.name}
								</FileTab>
							))}
						</div>
						<div
							ref={editorContainerRef}
							className="grow w-full overflow-hidden rounded-lg relative"
						>
							{!activeId ? (
								<>
									<div className="flex items-center w-full h-full justify-center text-xl font-medium text-secondary select-none">
										<FileJson className="w-6 h-6 mr-3" />
										No File selected
									</div>
								</>
							) : clerk.loaded ? (
								<>
									{provider ? (
										<Cursors yProvider={provider} />
									) : null}
									<Editor
										width={"100%"}
										height={"100%"}
										defaultLanguage="typescript"
										theme="vs-dark"
										beforeMount={handleEditorWillMount}
										onMount={handleEditorMount}
										onChange={(value) => {
											if (value === activeFile) {
												setTabs((prev) =>
													prev.map((tab) =>
														tab.id === activeId
															? {
																	...tab,
																	saved: true,
															  }
															: tab
													)
												);
											} else {
												setTabs((prev) =>
													prev.map((tab) =>
														tab.id === activeId
															? {
																	...tab,
																	saved: false,
															  }
															: tab
													)
												);
											}
										}}
										language={editorLanguage}
										options={{
											minimap: {
												enabled: true,
											},
											padding: {
												bottom: 4,
												top: 4,
											},
											scrollBeyondLastLine: false,
											fixedOverflowWidgets: true,
											fontFamily:
												"var(--font-geist-mono)",
										}}
										value={activeFile ?? ""}
									/>
								</>
							) : null}
						</div>
					</ResizablePanel>
					<ResizableHandle />
					<ResizablePanel defaultSize={40}>
						<ResizablePanelGroup direction="vertical">
							<ResizablePanel
								ref={previewPanelRef}
								collapsedSize={4}
								defaultSize={4}
								minSize={25}
								collapsible
								onCollapse={() => setIsPreviewCollapsed(true)}
								onExpand={() => setIsPreviewCollapsed(false)}
								className="p-2 flex flex-col"
							>
								<PreviewWindow
									collapsed={isPreviewCollapsed}
									open={() => {
										previewPanelRef.current?.expand();
										setIsPreviewCollapsed(false);
									}}
								/>
							</ResizablePanel>

							<ResizableHandle />

							<ResizablePanel
								defaultSize={50}
								minSize={20}
								className="p-2 flex flex-col"
							>
								<div className="h-10 w-full flex gap-2 shrink-0 overflow-auto tab-scroll">
									{terminals.map((term) => (
										<TerminalTab
											key={term.id}
											onClick={() =>
												setActiveTerminalId(term.id)
											}
											onClose={() =>
												closeTerminal(term.id)
											} // Pass ID directly
											selected={
												activeTerminalId === term.id
											}
										>
											<SquareTerminal className="w-4 h-4 mr-2" />
											Shell
										</TerminalTab>
									))}
									<Button
										disabled={creatingTerminal}
										onClick={() => {
											if (terminals.length >= 4) {
												toast.error(
													"You reached the maximum # of terminals."
												);
												return;
											}
											createTerminal();
										}}
										size={"sm"}
										variant={"secondary"}
										className="font-normal shrink-0 select-none text-muted-foreground"
									>
										{creatingTerminal ? (
											<Loader2 className="animate-spin w-4 h-4" />
										) : (
											<Plus className="w-4 h-4" />
										)}
									</Button>
								</div>
								{getSocket() ? (
									<div className="w-full relative grow h-full overflow-hidden rounded-lg bg-secondary">
										{terminals.map((term) => (
											<EditorTerminal
												key={term.id}
												socket={getSocket()!}
												id={term.id} // FIX: Pass the correct terminal ID
												term={term.terminal}
												setTerm={(t: Terminal) => {
													setTerminals((prev) =>
														prev.map((terminal) =>
															terminal.id ===
															term.id // FIX: Match against term.id
																? {
																		...terminal,
																		terminal:
																			t,
																  }
																: terminal
														)
													);
												}}
												visible={
													activeTerminalId === term.id
												}
											/>
										))}
									</div>
								) : (
									<div className="w-full h-full flex items-center justify-center text-lg font-medium text-muted-foreground/50 select-none">
										<TerminalSquare className="w-4 h-4 mr-2" />
										No Terminals Open
									</div>
								)}
							</ResizablePanel>
						</ResizablePanelGroup>
					</ResizablePanel>
				</ResizablePanelGroup>
			</SidebarProvider>
		</>
	);
}
