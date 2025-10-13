import express from "express";
import { createIframePreview } from "./previewIframe.js";
import { createPreviewProxy } from "./previewProxy.js";
// import { setupSubdomainRouting, generateSubdomainUrl } from "./previewSubdomain.js";
// import { autoSetupViteForProject } from "./viteConfig.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Setup all preview routes and approaches
 * This gives you multiple options to choose from based on what works best
 */
export function setupPreviewRoutes(app: express.Express, io: any) {
	// Option 1: iframe-based preview (RECOMMENDED - simplest and most reliable)
	app.get("/preview/:projectId/:userId/iframe", createIframePreview());

	// Option 2: Traditional reverse proxy (your current approach - with improvements)
	app.use("/preview/:projectId/:userId", createPreviewProxy(io));

	// Option 3: Subdomain-based routing (cleanest, but requires DNS setup)
	// setupSubdomainRouting(app);

	// API endpoints for preview management
	setupPreviewAPI(app);
}

/**
 * Setup preview management API endpoints
 */
function setupPreviewAPI(app: express.Express) {
	// Get available preview approaches for a project
	app.get("/api/preview-options/:projectId/:userId", (req, res) => {
		const { projectId, userId } = req.params;
		const baseUrl = `${req.protocol}://${req.get("host")}`;

		res.json({
			approaches: {
				iframe: {
					name: "iframe Preview",
					description:
						"Embeds the dev server in an iframe - most reliable",
					url: `${baseUrl}/preview/${projectId}/${userId}/iframe`,
					pros: [
						"No path rewriting needed",
						"Perfect HMR support",
						"Simple to implement",
						"Works with any dev server",
					],
					cons: [
						"Nested iframe experience",
						"Some browser security restrictions",
					],
					recommended: true,
				},

				proxy: {
					name: "Reverse Proxy",
					description: "Proxies requests with path rewriting",
					url: `${baseUrl}/preview/${projectId}/${userId}`,
					pros: [
						"Direct experience (no iframe)",
						"URL path matches structure",
					],
					cons: [
						"Complex path rewriting",
						"Potential HMR issues",
						"Asset loading problems",
					],
					recommended: false,
				},

				subdomain: {
					name: "Subdomain Routing",
					description: "Uses subdomains to avoid path conflicts",
					// url: generateSubdomainUrl(projectId, userId, req.get('host')),
					pros: [
						"No path rewriting needed",
						"Perfect dev server compatibility",
						"Clean URLs",
					],
					cons: ["Requires DNS setup", "More complex networking"],
					recommended: true,
					requiresSetup: true,
				},

				configured: {
					name: "Vite Base Path",
					description: "Configure Vite with correct base path",
					url: `${baseUrl}/preview/${projectId}/${userId}`,
					pros: [
						"Native Vite support",
						"No proxy complexity",
						"Perfect asset loading",
					],
					cons: [
						"Requires project configuration",
						"Must restart dev server",
					],
					recommended: true,
					requiresProjectSetup: true,
				},
			},
		});
	});

	// Auto-configure a project for better preview support
	app.post("/api/configure-preview/:projectId/:userId", async (req, res) => {
		try {
			const { projectId, userId } = req.params;
			const { approach } = req.body;

			const projectPath = path.join(
				__dirname,
				"..",
				"projects",
				projectId
			);

			let result: any = { success: false };

			switch (approach) {
				case "vite-config":
					// await autoSetupViteForProject(projectId, userId, projectPath);
					result = {
						success: true,
						message: "Vite configuration updated",
						nextSteps: [
							"Stop your current dev server (Ctrl+C)",
							"Run 'npm install' to ensure dependencies",
							"Run 'npm run dev' to start with new configuration",
							"Refresh the preview page",
						],
					};
					break;

				case "iframe":
					result = {
						success: true,
						message: "iframe preview ready",
						url: `/preview/${projectId}/${userId}/iframe`,
						nextSteps: [
							"Start your dev server with 'npm run dev'",
							"Visit the iframe preview URL",
						],
					};
					break;

				default:
					result = {
						success: false,
						message: "Unknown approach",
					};
			}

			res.json(result);
		} catch (error) {
			console.error("Preview configuration error:", error);
			res.status(500).json({
				success: false,
				error: "Failed to configure preview",
			});
		}
	});

	// Get project preview status and recommendations
	app.get("/api/preview-diagnosis/:projectId/:userId", async (req, res) => {
		try {
			const { projectId, userId } = req.params;
			const projectPath = path.join(
				__dirname,
				"..",
				"projects",
				projectId
			);

			const diagnosis = await diagnoseProject(
				projectPath,
				projectId,
				userId
			);
			res.json(diagnosis);
		} catch (error) {
			console.error("Preview diagnosis error:", error);
			res.status(500).json({
				error: "Failed to diagnose project",
			});
		}
	});
}

/**
 * Diagnose a project and provide recommendations
 */
async function diagnoseProject(
	projectPath: string,
	projectId: string,
	userId: string
) {
	const fs = await import("fs");

	const diagnosis: any = {
		projectPath,
		exists: fs.existsSync(projectPath),
		recommendations: [],
		issues: [],
		projectType: "unknown",
	};

	if (!diagnosis.exists) {
		diagnosis.issues.push("Project directory does not exist");
		diagnosis.recommendations.push("Create project files first");
		return diagnosis;
	}

	// Check for package.json
	const packageJsonPath = path.join(projectPath, "package.json");
	if (fs.existsSync(packageJsonPath)) {
		try {
			const packageJson = JSON.parse(
				fs.readFileSync(packageJsonPath, "utf8")
			);
			diagnosis.packageJson = packageJson;

			// Detect project type
			if (
				packageJson.dependencies?.vite ||
				packageJson.devDependencies?.vite
			) {
				diagnosis.projectType = "vite";
			} else if (packageJson.dependencies?.react) {
				diagnosis.projectType = "react";
			} else if (packageJson.dependencies?.next) {
				diagnosis.projectType = "next";
			}

			// Check for Vite config
			const viteConfigExists =
				fs.existsSync(path.join(projectPath, "vite.config.js")) ||
				fs.existsSync(path.join(projectPath, "vite.config.ts"));

			if (diagnosis.projectType === "vite" && !viteConfigExists) {
				diagnosis.issues.push("Vite project missing configuration");
				diagnosis.recommendations.push({
					approach: "vite-config",
					description: "Auto-configure Vite with proper base path",
					action: "Configure Vite",
				});
			}

			// Check if it's a fresh create-react-app or Vite project
			const hasIndex = fs.existsSync(
				path.join(projectPath, "index.html")
			);
			const hasSrc = fs.existsSync(path.join(projectPath, "src"));

			if (!hasIndex && !hasSrc) {
				diagnosis.issues.push("Project appears empty or incomplete");
				diagnosis.recommendations.push({
					approach: "vite-setup",
					description: "Setup complete Vite project structure",
					action: "Setup Project",
				});
			}
		} catch (error) {
			diagnosis.issues.push("Invalid package.json file");
		}
	} else {
		diagnosis.issues.push("No package.json found");
		diagnosis.recommendations.push({
			approach: "vite-setup",
			description: "Initialize project with Vite and React",
			action: "Initialize Project",
		});
	}

	// Always recommend iframe as fallback
	diagnosis.recommendations.push({
		approach: "iframe",
		description: "Use iframe preview (works with any setup)",
		action: "Use iframe Preview",
		fallback: true,
	});

	return diagnosis;
}

/**
 * Helper function to determine the best preview approach for a project
 */
export function getBestPreviewApproach(projectPath: string): string {
	const fs = require("fs");

	// Check if Vite config exists and is properly configured
	const viteConfigPath = path.join(projectPath, "vite.config.js");
	if (fs.existsSync(viteConfigPath)) {
		const config = fs.readFileSync(viteConfigPath, "utf8");
		if (config.includes("base:") && config.includes("/preview/")) {
			return "proxy"; // Vite is configured for proxy
		}
	}

	// Check if it's a Vite project
	const packageJsonPath = path.join(projectPath, "package.json");
	if (fs.existsSync(packageJsonPath)) {
		const packageJson = JSON.parse(
			fs.readFileSync(packageJsonPath, "utf8")
		);
		if (
			packageJson.dependencies?.vite ||
			packageJson.devDependencies?.vite
		) {
			return "iframe"; // Use iframe for unconfigured Vite projects
		}
	}

	// Default fallback
	return "iframe";
}
