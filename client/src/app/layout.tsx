/**
 * Root layout component that wraps all pages.
 * Provides global configuration and providers including:
 * - Fonts (Geist Sans and Mono)
 * - Metadata and SEO settings
 * - Theme provider
 * - Toast notifications
 * - Analytics
 *
 * By Kunal Das
 */

import { JetBrains_Mono, Orbitron, Outfit } from "next/font/google";
import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
	BASE_CLIENT_URL,
	NAME,
	PORTFOLIO_URL,
	SITE_DESCRIPTION,
	SITE_NAME,
} from "@/lib/constants";

import "./globals.css";

const outfit = Outfit({
	variable: "--font-outfit",
	subsets: ["latin"],
});

const orbitron = Orbitron({
	variable: "--font-orbitron",
	subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
	variable: "--font-jetbrains-mono",
	subsets: ["latin"],
});

// export const runtime = 'edge';

export const metadata: Metadata = {
	title: {
		default: SITE_NAME,
		template: `%s | ${SITE_NAME}`,
	},
	description: SITE_DESCRIPTION,
	applicationName: SITE_NAME,
	referrer: "origin-when-cross-origin",
	keywords:
		"codeconnect, code collaboration, real-time coding, pair programming, remote collaboration, live coding, code sharing, collaborative editor, monaco editor, cursor sharing, live preview, video chat, collaborative terminal, shared terminal, code execution, GitHub integration, web IDE, online IDE, collaborative development, coding platform, programming tools",
	creator: NAME,
	publisher: NAME,
	authors: {
		name: NAME,
		url: PORTFOLIO_URL,
	},
	metadataBase: BASE_CLIENT_URL ? new URL(BASE_CLIENT_URL) : undefined,
	formatDetection: {
		telephone: false,
	},
	appleWebApp: {
		capable: true,
		statusBarStyle: "default",
	},
	openGraph: {
		type: "website",
		siteName: SITE_NAME,
		locale: "en_US",
		url: BASE_CLIENT_URL,
	},
	twitter: {
		card: "summary_large_image",
		creator: "@kunaldasx",
	},
	alternates: {
		canonical: BASE_CLIENT_URL,
	},
};

export const viewport: Viewport = {
	themeColor: "#0a0a0a",
	width: "device-width",
	initialScale: 1,
	userScalable: false,
	maximumScale: 1,
	viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
	return (
		<html
			className={`${outfit.variable} ${orbitron.variable} ${jetBrainsMono.variable}`}
			lang="en"
			suppressHydrationWarning
		>
			<head>
				<meta name="darkreader-lock" />
			</head>
			<body className="h-full text-pretty antialiased">
				<ThemeProvider attribute="class" disableTransitionOnChange>
					<TooltipProvider>{children}</TooltipProvider>
					<Toaster
						className="whitespace-pre-line"
						containerAriaLabel="Toast Notifications"
						richColors
					/>
				</ThemeProvider>
			</body>
		</html>
	);
}
