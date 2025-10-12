const startercode = {
	node: [
		{ name: 'index.js', body: `console.log("Hello World!")` },
		{
			name: 'package.json',
			body: `{
        "name": "nodejs",
        "version": "1.0.0",
        "description": "",
        "main": "index.js",
        "keywords": [],
        "author": "",
        "license": "ISC",
        "dependencies": {
          "@types/node": "^18.0.6"
        }
      }`,
		},
	],
	react: [
		{
			name: 'package.json',
			body: `{
        "name": "react",
        "private": true,
        "version": "0.0.0",
        "type": "module",
        "scripts": {
          "dev": "vite",
          "build": "vite build",
          "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",
          "preview": "vite preview"
        },
        "dependencies": {
          "react": "^18.2.0",
          "react-dom": "^18.2.0"
        },
        "devDependencies": {
          "@types/react": "^18.2.66",
          "@types/react-dom": "^18.2.22",
          "@vitejs/plugin-react": "^4.2.1",
          "eslint": "^8.57.0",
          "eslint-plugin-react": "^7.34.1",
          "eslint-plugin-react-hooks": "^4.6.0",
          "eslint-plugin-react-refresh": "^0.4.6",
          "vite": "^5.2.0"
        }
      }`,
		},
		{
			name: 'vite.config.js',
			body: `
        import { defineConfig } from 'vite';
        import react from '@vitejs/plugin-react';
            
        export default defineConfig({
          plugins: [react()],

          // Base path configuration
          base: '/', 
          
          // Server configuration for development
          server: {
            port: 5173,
            host: '0.0.0.0', // Listen on all network interfaces
            strictPort: true,
            
            // HMR configuration
            hmr: {
              // Use WebSocket protocol
              protocol: 'ws',
              // Use the same port as the dev server
              port: 5173,
              // Allow connections from any host
              host: 'localhost',
            },
            
            // Allow connections from the proxy
            cors: {
              origin: '*',
              credentials: true
            },
            
            // Watch options for better file watching
            watch: {
              usePolling: true, // Use polling for file changes (better for containers/remote)
              interval: 100, // Check for changes every 100ms
            },
            
            // Configure allowed hosts
            fs: {
              strict: false,
              allow: ['..'] // Allow serving files from parent directory
            }
          },
            
          // Build configuration
          build: {
            // Generate with absolute paths in build output
            outDir: 'dist',
            assetsDir: 'assets',
            
            // Source maps for debugging
            sourcemap: true,
            
            // Ensure proper module resolution
            rollupOptions: {
              output: {
                // Use consistent naming for assets
                assetFileNames: 'assets/[name]-[hash][extname]',
                chunkFileNames: 'assets/[name]-[hash].js',
                entryFileNames: 'assets/[name]-[hash].js',
              }
            }
          },
            
          // Resolve configuration
          resolve: {
            alias: {
              '@': '/src',
            }
          },
            
          // Optimize dependencies
          optimizeDeps: {
            include: ['react', 'react-dom'],
            exclude: [],
            // Force pre-bundling of dependencies
            force: true
          },
            
          // Explicitly handle preview path rewriting
          preview: {
            port: 5173,
            strictPort: true,
            host: '0.0.0.0',
            cors: true
          }
        });
      `,
		},
		{
			name: 'index.html',
			body: `<!doctype html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <link rel="icon" type="image/svg+xml" href="/vite.svg" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>React Starter Code</title>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" src="/src/main.jsx"></script>
        </body>
      </html>`,
		},
		{
			name: 'src/App.css',
			body: `div {
        width: 100%;
        height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;

        font-family: sans-serif;
      }

      h1 {
        color: #000;
        margin: 0;
      }

      p {
        color: #777;
        margin: 0;
      }

      button {
        padding: 8px 16px;
        margin-top: 16px;
      }`,
		},
		{
			name: 'src/App.jsx',
			body: `import './App.css'
      import { useState } from 'react'
          
      function App() {
          
        const [count, setCount] = useState(0)
          
        return (
          <div>
            <h1>React Starter Code</h1>
            <p>
              Edit App.jsx to get started.
            </p>
            <button onClick={() => setCount(count => count + 1)}>
              Clicked {count} times
            </button>
          </div>
        )
      }
          
      export default App`,
		},
		{
			name: 'src/main.jsx',
			body: `import React from 'react'
      import ReactDOM from 'react-dom/client'
      import App from './App.jsx'
      
      ReactDOM.createRoot(document.getElementById('root')).render(
        <React.StrictMode>
          <App />
        </React.StrictMode>,
      )`,
		},
	],
};

export default startercode;
