/**
 * Main notepad component that provides collaborative Markdown editing.
 * Features:
 * - Real-time collaborative editing
 * - Rich text formatting tools
 * - Markdown syntax support
 * - Image and table insertion
 *
 * By Kunal Das
 */

"use client";

import { RoomServiceMsg } from "@/types/message";

import {
	AdmonitionDirectiveDescriptor,
	BlockTypeSelect,
	BoldItalicUnderlineToggles,
	CodeToggle,
	CreateLink,
	codeBlockPlugin,
	codeMirrorPlugin,
	DiffSourceToggleWrapper,
	diffSourcePlugin,
	directivesPlugin,
	headingsPlugin,
	InsertAdmonition,
	InsertCodeBlock,
	InsertImage,
	InsertTable,
	InsertThematicBreak,
	imagePlugin,
	ListsToggle,
	linkDialogPlugin,
	linkPlugin,
	listsPlugin,
	MDXEditor,
	type MDXEditorMethods,
	markdownShortcutPlugin,
	quotePlugin,
	Separator,
	StrikeThroughSupSubToggles,
	tablePlugin,
	thematicBreakPlugin,
	toolbarPlugin,
	UndoRedo,
} from "@mdxeditor/editor";
import { githubDark } from "@uiw/codemirror-theme-github";
import { useEffect, useMemo, useRef, useState } from "react";

import { getSocket } from "@/lib/socket";
import { cn } from "@/lib/utils";

import { codeBlockLanguages } from "../constants";
import { OpenNoteBtn } from "./open-note-btn";
import { SaveNoteBtn } from "./save-note-btn";

import "@mdxeditor/editor/style.css";
import "@radix-ui/colors/mauve-dark.css";

interface MarkdownEditorProps {
	markdown: string;
}

const darkModeStyles = `
  /* ── Toolbar background, border & wrapping ── */
  .dark-editor .mdxeditor-toolbar {
    background-color: #1e2023 !important;
    border-bottom: 1px solid #3a3d42 !important;
    flex-wrap: wrap !important;
    overflow: visible !important;
  
  }

  /* ── DiffSourceToggleWrapper inner div must also wrap ── */
  .dark-editor .mdxeditor-toolbar > div,
  .dark-editor .mdxeditor-toolbar [class*="toolbarRoot"],
  .dark-editor .mdxeditor-toolbar [class*="editorToolbar"] {
    flex-wrap: wrap !important;
    overflow: visible !important;
    height: auto !important;
  }

  /* ── Vertical separators shrink gracefully on wrap ── */
  .dark-editor .mdxeditor-toolbar [data-orientation="vertical"] {
    align-self: stretch !important;
    height: auto !important;
  }

  /* ── All toolbar icon buttons ── */
  .dark-editor .mdxeditor-toolbar button,
  .dark-editor .mdxeditor-toolbar [role="button"],
  .dark-editor .mdxeditor-toolbar [role="menuitem"] {
    color: #e2e4e9 !important;
    background-color: transparent !important;
  }

  /* ── Hover state on toolbar buttons ── */
  .dark-editor .mdxeditor-toolbar button:hover,
  .dark-editor .mdxeditor-toolbar [role="button"]:hover {
    background-color: #2d3035 !important;
    color: #ffffff !important;
  }

  /* ── Active / pressed toolbar buttons ── */
  .dark-editor .mdxeditor-toolbar button[data-state="on"],
  .dark-editor .mdxeditor-toolbar button[aria-pressed="true"],
  .dark-editor .mdxeditor-toolbar button[data-active="true"] {
    background-color: #3a3d42 !important;
    color: #ffffff !important;
  }

  /* ── SVG icons inside toolbar ── */
  .dark-editor .mdxeditor-toolbar svg {
    fill: currentColor !important;
    color: #e2e4e9 !important;
  }

  /* ── Separator lines in toolbar ── */
  .dark-editor .mdxeditor-toolbar [data-orientation="vertical"],
  .dark-editor .mdxeditor-toolbar hr {
    background-color: #3a3d42 !important;
    border-color: #3a3d42 !important;
  }

  /* ── BlockTypeSelect / Select dropdowns in toolbar ── */
  .dark-editor .mdxeditor-toolbar select,
  .dark-editor .mdxeditor-toolbar [role="combobox"],
  .dark-editor .mdxeditor-toolbar [data-radix-select-trigger] {
    background-color: #2d3035 !important;
    color: #e2e4e9 !important;
    border: 1px solid #3a3d42 !important;
  }

  /* ── Dropdown / popover menus ── */
  .dark-editor [role="menu"],
  .dark-editor [role="listbox"],
  .dark-editor [data-radix-popper-content-wrapper] > div,
  .dark-editor .mdxeditor-popup-container {
    background-color: #1e2023 !important;
    border: 1px solid #3a3d42 !important;
    color: #e2e4e9 !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6) !important;
  }

  .dark-editor [role="menuitem"],
  .dark-editor [role="option"] {
    color: #e2e4e9 !important;
  }

  .dark-editor [role="menuitem"]:hover,
  .dark-editor [role="option"]:hover,
  .dark-editor [role="option"][data-highlighted] {
    background-color: #2d3035 !important;
    color: #ffffff !important;
  }

  /* ── Dialog / modal (e.g. Insert Image, Insert Link) ── */
  .dark-editor [role="dialog"],
  .dark-editor .mdxeditor-dialog-overlay + div {
    background-color: #1e2023 !important;
    border: 1px solid #3a3d42 !important;
    color: #e2e4e9 !important;
  }

  .dark-editor [role="dialog"] label,
  .dark-editor [role="dialog"] p,
  .dark-editor [role="dialog"] span {
    color: #e2e4e9 !important;
  }

  .dark-editor [role="dialog"] input,
  .dark-editor [role="dialog"] textarea {
    background-color: #2d3035 !important;
    color: #e2e4e9 !important;
    border: 1px solid #4a4d52 !important;
  }

  .dark-editor [role="dialog"] input::placeholder,
  .dark-editor [role="dialog"] textarea::placeholder {
    color: #6b7280 !important;
  }

  .dark-editor [role="dialog"] button {
    color: #e2e4e9 !important;
    background-color: #2d3035 !important;
    border: 1px solid #4a4d52 !important;
  }

  .dark-editor [role="dialog"] button[type="submit"],
  .dark-editor [role="dialog"] button[data-variant="primary"] {
    background-color: #3b82f6 !important;
    border-color: #3b82f6 !important;
    color: #ffffff !important;
  }

  /* ── Source / diff view textarea ── */
  .dark-editor .cm-editor,
  .dark-editor .cm-scroller {
    background-color: #161819 !important;
    color: #e2e4e9 !important;
  }

  .dark-editor .cm-gutters {
    background-color: #1e2023 !important;
    color: #6b7280 !important;
    border-right: 1px solid #3a3d42 !important;
  }

  /* ── DiffSource "Source" plain textarea ── */
  .dark-editor textarea.mdxeditor-source-editor {
    background-color: #161819 !important;
    color: #e2e4e9 !important;
    caret-color: #e2e4e9 !important;
  }

  /* ── DiffSource toggle buttons ── */
  .dark-editor [data-toolbar-item="true"] button,
  .dark-editor .mdxeditor-diff-source-wrapper button {
    color: #e2e4e9 !important;
  }

  /* ── Admonition blocks inside editor ── */
  .dark-editor .mdxeditor-content-editable .admonition {
    border-left: 4px solid #3b82f6 !important;
    background-color: #1e2a3a !important;
    color: #e2e4e9 !important;
  }

  /* ── Table inside editor ── */
  .dark-editor .mdxeditor-content-editable table {
    border-color: #3a3d42 !important;
  }

  .dark-editor .mdxeditor-content-editable th,
  .dark-editor .mdxeditor-content-editable td {
    border-color: #3a3d42 !important;
  }

  .dark-editor .mdxeditor-content-editable th {
    background-color: #2d3035 !important;
    color: #e2e4e9 !important;
  }

  /* ── Placeholder text ── */
  .dark-editor .mdxeditor-content-editable p.is-editor-empty:first-child::before {
    color: #6b7280 !important;
  }

  /* ── Toolbar tooltip labels ── */
  .dark-editor [role="tooltip"] {
    background-color: #0f1011 !important;
    color: #e2e4e9 !important;
    border: 1px solid #3a3d42 !important;
  }

  /* ── Kill the default horizontal scrollbar on the toolbar ── */
  .dark-editor .mdxeditor-toolbar,
  .dark-editor .mdxeditor-toolbar * {
    overflow-x: visible !important;
    scrollbar-width: none !important;
  }
  .dark-editor .mdxeditor-toolbar::-webkit-scrollbar {
    display: none !important;
  }
`;

const MarkdownEditorMain = ({ markdown }: MarkdownEditorProps) => {
	const socket = getSocket();

	const [key, setKey] = useState(0);

	const markdownEditorRef = useRef<MDXEditorMethods>(null);
	const contentRef = useRef(markdown);

	// Inject dark-mode override styles once
	useEffect(() => {
		const id = "mdxeditor-dark-overrides";
		if (!document.getElementById(id)) {
			const style = document.createElement("style");
			style.id = id;
			style.textContent = darkModeStyles;
			document.head.appendChild(style);
		}
	}, []);

	const plugins = useMemo(
		() => [
			listsPlugin(),
			quotePlugin(),
			headingsPlugin(),
			linkPlugin(),
			linkDialogPlugin(),
			tablePlugin(),
			thematicBreakPlugin(),
			codeBlockPlugin({ defaultCodeBlockLanguage: "" }),
			markdownShortcutPlugin(),
			directivesPlugin({
				directiveDescriptors: [AdmonitionDirectiveDescriptor],
			}),
			diffSourcePlugin({
				diffMarkdown: markdown,
				viewMode: "rich-text",
			}),
			imagePlugin(),
			codeMirrorPlugin({
				codeMirrorExtensions: [githubDark],
				codeBlockLanguages,
				autoLoadLanguageSupport: true,
			}),
			toolbarPlugin({
				toolbarContents: () => (
					<DiffSourceToggleWrapper options={["rich-text", "source"]}>
						<OpenNoteBtn markdownEditorRef={markdownEditorRef} />
						<SaveNoteBtn markdownEditorRef={markdownEditorRef} />
						<Separator />
						<UndoRedo />
						<Separator />
						<BoldItalicUnderlineToggles />
						<CodeToggle />
						<Separator />
						<StrikeThroughSupSubToggles />
						<Separator />
						<ListsToggle />
						<Separator />
						<BlockTypeSelect />
						<Separator />
						<CreateLink />
						<InsertImage />
						<Separator />
						<InsertTable />
						<InsertThematicBreak />
						<Separator />
						<InsertCodeBlock />
						<InsertAdmonition />
						<Separator />
					</DiffSourceToggleWrapper>
				),
			}),
		],
		[markdown],
	);

	useEffect(() => {
		socket.on(RoomServiceMsg.UPDATE_MD, (value: string) => {
			contentRef.current = value;
			markdownEditorRef.current?.setMarkdown(value);
		});

		return () => {
			socket.off(RoomServiceMsg.UPDATE_MD);
		};
	}, [socket]);

	useEffect(() => {
		const editor = markdownEditorRef.current;
		if (editor) {
			contentRef.current = editor.getMarkdown();
			setKey((prev) => prev + 1);
		}
	}, []);

	const onChange = (value: string) => {
		contentRef.current = value;
		socket.emit(RoomServiceMsg.UPDATE_MD, value);
	};

	return (
		<MDXEditor
			autoFocus={false}
			className="dark-editor flex h-full w-full flex-col !dark-theme [&]:bg-[#161819] [&]:text-[#e2e4e9] overflow-y-scroll"
			contentEditableClassName={cn(
				`prose h-full max-w-none
        first:prose-headings:mt-0
        prose-h1:text-3xl prose-h1:font-extrabold prose-h1:my-2
        prose-h2:text-2xl prose-h2:my-2
        prose-h3:text-xl prose-h3:my-2
        prose-h4:text-lg prose-h4:my-0
        prose-h5:text-base prose-h5:my-0
        prose-h6:text-base prose-h6:my-0
        prose-p:leading-7 prose-p:my-1
        prose-img:rounded prose-img:my-0
        prose-blockquote:my-0 prose-blockquote:not-italic prose-blockquote:font-normal
        prose-code:text-base prose-code:font-normal before:prose-code:content-none after:prose-code:content-none
        prose-pre:rounded-lg
        prose-a:underline-offset-4
        prose-em:italic
        prose-ul:my-0
        prose-ol:my-0
        prose-li:!no-underline prose-li:!my-0
        prose-hr:my-4
        prose-table:my-0
        prose-th:!py-0
        prose-td:!py-0 prose-td:align-middle`,

				`[color:#e2e4e9]
        prose-headings:[color:#f0f2f5]
        prose-p:[color:#d1d5db]
        prose-strong:[color:#f0f2f5]
        prose-em:[color:#c9cdd4]
        prose-a:[color:#60a5fa] hover:prose-a:[color:#93c5fd]
        prose-blockquote:[color:#9ca3af] prose-blockquote:[border-left-color:#4a4d52]
        prose-code:[color:#f0f2f5] [&>span]:prose-code:[border-color:#4a4d52] [&>span]:prose-code:[background-color:#2d3035]
        prose-pre:[background-color:#0d1117]
        prose-th:[color:#f0f2f5] prose-th:[background-color:#2d3035]
        prose-td:[color:#d1d5db]
        prose-hr:[border-color:#3a3d42]
        prose-li:[color:#d1d5db]`,
			)}
			key={key}
			// eslint-disable-next-line react-hooks/refs
			markdown={contentRef.current}
			onChange={onChange}
			placeholder="All participants can edit this note..."
			plugins={plugins}
			ref={markdownEditorRef}
			trim={false}
		/>
	);
};

export { MarkdownEditorMain };
