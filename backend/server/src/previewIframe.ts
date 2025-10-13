import type { Request, Response, NextFunction } from "express";
import { previewServers } from "./previewProxy.js";

/**
 * iframe-based preview approach
 * This serves an HTML page with an iframe that directly loads the Vite dev server
 * This avoids all the path rewriting complexity of reverse proxying
 */
export function createIframePreview() {
	return (req: Request, res: Response, next: NextFunction) => {
		const projectId = req.params.projectId;
		const userId = req.params.userId;
		const serverKey = `${projectId}_${userId}`;
		const server = previewServers.get(serverKey);

		if (!server) {
			return res
				.status(503)
				.send(generateWaitingPage(projectId!, userId!));
		}

		// Generate the iframe preview page
		const iframePreviewPage = generateIframePreview(
			server.port,
			projectId!,
			userId!
		);
		res.setHeader("Content-Type", "text/html");
		res.send(iframePreviewPage);
	};
}

function generateWaitingPage(projectId: string, userId: string): string {
	return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview Loading - Code Connect</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .container {
            text-align: center;
            background: rgba(255, 255, 255, 0.1);
            padding: 3rem;
            border-radius: 1rem;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .loading-spinner {
            display: inline-block;
            width: 32px;
            height: 32px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 1s ease-in-out infinite;
            margin-bottom: 1.5rem;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        h1 {
            margin-bottom: 1rem;
            font-size: 1.8rem;
        }
        
        p {
            margin-bottom: 1rem;
            opacity: 0.9;
        }
        
        code {
            background: rgba(0, 0, 0, 0.2);
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            display: inline-block;
            font-family: 'Monaco', 'Consolas', monospace;
        }
        
        .status {
            margin-top: 1.5rem;
            padding: 1rem;
            background: rgba(0, 0, 0, 0.1);
            border-radius: 0.5rem;
            border-left: 4px solid #ffd700;
        }
        
        .auto-refresh {
            font-size: 0.9rem;
            opacity: 0.7;
            margin-top: 1rem;
        }
    </style>
    <script>
        // Auto-refresh every 3 seconds to check if server is ready
        setTimeout(() => {
            window.location.reload();
        }, 3000);
        
        // Also check via API
        setInterval(async () => {
            try {
                const response = await fetch('/api/preview-status/${projectId}/${userId}');
                const data = await response.json();
                if (data.available) {
                    window.location.reload();
                }
            } catch (e) {
                console.log('Checking server status...');
            }
        }, 2000);
    </script>
</head>
<body>
    <div class="container">
        <div class="loading-spinner"></div>
        <h1>🚀 Starting Preview Server</h1>
        <p>Waiting for your development server to start...</p>
        <code>npm run dev</code>
        
        <div class="status">
            <strong>Status:</strong> Looking for dev server on localhost
        </div>
        
        <div class="auto-refresh">
            Page will refresh automatically when server is ready
        </div>
    </div>
</body>
</html>
	`;
}

function generateIframePreview(
	port: number,
	projectId: string,
	userId: string
): string {
	return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preview - Code Connect</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1a1a1a;
            color: white;
        }
        
        .preview-header {
            background: #2d2d2d;
            padding: 0.75rem 1rem;
            border-bottom: 1px solid #404040;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 0.9rem;
        }
        
        .preview-info {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .status-indicator {
            width: 8px;
            height: 8px;
            background: #4ade80;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .preview-url {
            font-family: 'Monaco', 'Consolas', monospace;
            background: rgba(255, 255, 255, 0.1);
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            font-size: 0.8rem;
        }
        
        .preview-actions {
            display: flex;
            gap: 0.5rem;
        }
        
        .action-btn {
            background: #4f46e5;
            color: white;
            border: none;
            padding: 0.4rem 0.8rem;
            border-radius: 0.25rem;
            font-size: 0.8rem;
            cursor: pointer;
            text-decoration: none;
            transition: background 0.2s;
        }
        
        .action-btn:hover {
            background: #4338ca;
        }
        
        .preview-frame {
            width: 100%;
            height: calc(100vh - 60px);
            border: none;
            background: white;
        }
        
        .loading-overlay {
            position: absolute;
            top: 60px;
            left: 0;
            right: 0;
            bottom: 0;
            background: #1a1a1a;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            z-index: 100;
        }
        
        .loading-spinner {
            width: 32px;
            height: 32px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 1s ease-in-out infinite;
            margin-bottom: 1rem;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .error-message {
            color: #ef4444;
            background: rgba(239, 68, 68, 0.1);
            padding: 1rem;
            border-radius: 0.5rem;
            margin: 1rem;
            border: 1px solid rgba(239, 68, 68, 0.3);
            display: none;
        }
    </style>
</head>
<body>
    <div class="preview-header">
        <div class="preview-info">
            <div class="status-indicator"></div>
            <span>Live Preview</span>
            <div class="preview-url">localhost:${port}</div>
        </div>
        <div class="preview-actions">
            <a href="http://localhost:${port}" target="_blank" class="action-btn">
                Open in New Tab
            </a>
            <button onclick="refreshPreview()" class="action-btn">
                Refresh
            </button>
        </div>
    </div>
    
    <div class="loading-overlay" id="loading">
        <div class="loading-spinner"></div>
        <div>Loading preview...</div>
    </div>
    
    <div class="error-message" id="error">
        Failed to load preview. Make sure your dev server is running on port ${port}.
    </div>
    
    <iframe 
        id="preview-frame"
        class="preview-frame"
        src="http://localhost:${port}"
        onload="onFrameLoad()"
        onerror="onFrameError()"
    ></iframe>
    
    <script>
        let retryCount = 0;
        const maxRetries = 10;
        
        function onFrameLoad() {
            console.log('Preview loaded successfully');
            document.getElementById('loading').style.display = 'none';
            document.getElementById('error').style.display = 'none';
        }
        
        function onFrameError() {
            console.log('Preview failed to load');
            document.getElementById('loading').style.display = 'none';
            document.getElementById('error').style.display = 'block';
            
            // Retry after a delay
            if (retryCount < maxRetries) {
                retryCount++;
                setTimeout(() => {
                    refreshPreview();
                }, 2000);
            }
        }
        
        function refreshPreview() {
            const frame = document.getElementById('preview-frame');
            const loading = document.getElementById('loading');
            const error = document.getElementById('error');
            
            loading.style.display = 'flex';
            error.style.display = 'none';
            
            // Add cache busting
            const url = new URL(frame.src);
            url.searchParams.set('t', Date.now());
            frame.src = url.href;
        }
        
        // Handle iframe load timeout
        setTimeout(() => {
            const loading = document.getElementById('loading');
            if (loading.style.display !== 'none') {
                onFrameError();
            }
        }, 10000); // 10 second timeout
        
        // Monitor server status
        setInterval(async () => {
            try {
                const response = await fetch('/api/preview-status/${projectId}/${userId}');
                const data = await response.json();
                if (!data.available) {
                    // Server went down, show error
                    document.getElementById('error').innerHTML = 
                        'Preview server stopped. Start your dev server again.';
                    document.getElementById('error').style.display = 'block';
                }
            } catch (e) {
                // Network error, server might be down
            }
        }, 5000);
    </script>
</body>
</html>
	`;
}
