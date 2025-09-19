"use client";

import { User, Virtualbox } from "@/lib/types";
import dynamic from "next/dynamic";
import { JSX } from "react";

const CodeEditor = dynamic(() => import("@/components/editor/index"), {
	ssr: false,
});

export default function CodeEditorWrapper(
	props: JSX.IntrinsicAttributes & {
		isSharedUser: boolean;
		userData: User;
		virtualboxData: Virtualbox;
	}
) {
	return <CodeEditor {...props} />;
}
