"use client";

import { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "./xterm.css";

export default function EditorTerminal({
	visible,
	id,
	socket,
	term,
	setTerm,
}: {
	visible: boolean;
	id: string;
	socket: Socket;
	term: Terminal | null;
	setTerm: (term: Terminal) => void;
}) {
	const terminalRef = useRef<HTMLDivElement>(null);
	const fitAddonRef = useRef<FitAddon | null>(null);

	useEffect(() => {
		if (!terminalRef.current || term) return;

		const terminal = new Terminal({
			cursorBlink: true,
			theme: {
				background: "#262626",
			},
			fontSize: 14,
			fontFamily: "var(--font-geist-mono)",
			lineHeight: 1.5,
			letterSpacing: 0,
		});

		setTerm(terminal);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id]);

	useEffect(() => {
		if (!term || !terminalRef.current) return;

		const fitAddon = new FitAddon();
		fitAddonRef.current = fitAddon;

		// ✅ only open the terminal once per container
		if (
			terminalRef.current &&
			terminalRef.current.childNodes.length === 0
		) {
			term.loadAddon(fitAddon);
			term.open(terminalRef.current);
			fitAddon.fit();
		}

		// Terminal data handler
		const disposableOnData = term.onData((data) => {
			socket.emit("terminalData", id, data);
		});

		// Terminal resize handler
		const disposableOnResize = term.onResize((dimensions) => {
			fitAddon.fit();
			socket.emit("terminalResize", id, dimensions); // Include terminal ID
		});

		// Socket response handler for this specific terminal
		const handleTerminalResponse = (response: {
			id: string;
			data: string;
		}) => {
			if (response.id === id && term) {
				term.write(response.data);
			}
		};

		socket.on("terminalResponse", handleTerminalResponse);

		// Initial resize observer
		const resizeObserver = new ResizeObserver(() => {
			if (fitAddonRef.current && term) {
				fitAddonRef.current.fit();

				// ✅ Sync backend PTY on manual resize
				socket.emit("terminalResize", id, {
					cols: term.cols,
					rows: term.rows,
				});
			}
		});

		if (terminalRef.current) {
			resizeObserver.observe(terminalRef.current);
		}

		return () => {
			disposableOnData.dispose();
			disposableOnResize.dispose();
			socket.off("terminalResponse", handleTerminalResponse);
			resizeObserver.disconnect();
		};
	}, [term, id, socket]);

	// Handle visibility changes
	useEffect(() => {
		if (visible && fitAddonRef.current) {
			// Refit when terminal becomes visible
			setTimeout(() => {
				fitAddonRef.current?.fit();

				if (term) {
					socket.emit("terminalResize", id, {
						cols: term.cols,
						rows: term.rows,
					});
				}
			}, 0);
		}
	}, [visible, term, id, socket]);

	return (
		<div
			ref={terminalRef}
			style={{
				visibility: visible ? "visible" : "hidden",
				position: visible ? "relative" : "absolute",
				height: "100%",
				width: "100%",
			}}
			className="w-full h-full text-left"
		/>
	);
}
