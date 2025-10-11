import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define which routes should be protected
const isProtectedRoute = createRouteMatcher(["/dashboard(.*)", "/code(.*)"]);

export default clerkMiddleware((auth, req) => {
	if (isProtectedRoute(req)) {
		auth.protect();
	}
});

export const config = {
	matcher: [
		// Skip Next.js internals and static files
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		// Run on API routes too
		"/(api|trpc)(.*)",
	],
};
