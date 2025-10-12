# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Overview

Code Connect is a real-time collaborative code editor built with the MERN stack. It enables multiple developers to code together simultaneously with live synchronization, video/audio chat, and integrated development tools.

## Architecture

### High-Level Structure
```
code-connect/
├── frontend/           # Next.js 15 client application
├── backend/
│   ├── server/        # Node.js/Express WebSocket server  
│   ├── database/      # Cloudflare D1 database worker
│   └── storage/       # Cloudflare R2 storage worker
```

### Core Technologies
- **Frontend**: Next.js 15, React 19, TypeScript, TailwindCSS
- **Backend**: Node.js, Express, Socket.IO for real-time communication
- **Database**: Cloudflare D1 (SQLite) with Drizzle ORM
- **Storage**: Cloudflare R2 for file storage
- **Real-time Collaboration**: Liveblocks + Y.js for operational transforms
- **Authentication**: Clerk
- **Code Editor**: Monaco Editor with syntax highlighting
- **Video/Audio**: WebRTC with Simple Peer

### Database Schema
The application uses three main entities:
- **Users**: Authentication and generation tracking
- **Virtualboxes**: Collaborative coding sessions (React/Node.js projects)  
- **Shared Access**: Many-to-many relationship for project collaboration

## Development Commands

### Frontend Development
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

### Backend Server Development
```bash
# Navigate to backend server
cd backend/server

# Install dependencies
npm install

# Start development server (with hot reload)
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start
```

### Database Development (Cloudflare D1)
```bash
# Navigate to database worker
cd backend/database

# Install dependencies
npm install

# Deploy to Cloudflare Workers
npm run deploy

# Start local development
npm run dev

# Generate new migration
npm run generate

# Apply migrations
npm run migrate

# Push schema changes
npm run push

# Open Drizzle Studio (local DB)
npm run db:studio

# Run tests
npm run test

# Generate TypeScript definitions
npm run cf-typegen
```

### Storage Development (Cloudflare R2)
```bash
# Navigate to storage worker
cd backend/storage

# Install dependencies
npm install

# Deploy to Cloudflare Workers
npm run deploy

# Start local development
npm run dev

# Run tests
npm run test

# Generate TypeScript definitions
npm run cf-typegen
```

## Full Application Setup

### Prerequisites
- Node.js 18+
- Cloudflare account with Workers, D1, and R2 enabled
- Clerk account for authentication
- Liveblocks account for real-time collaboration

### Environment Configuration

**Frontend (.env)**:
```env
NEXT_PUBLIC_API_INITIAL_URL=http://localhost:4000
NEXT_PUBLIC_PREVIEW_INITIAL_URL=http://localhost:5173

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=
CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=
CLERK_SIGN_OUT_FALLBACK_REDIRECT_URL=

DATABASE_INITIAL_URL=
LIVEBLOCKS_PUBLIC_KEY=
LIVEBLOCKS_SECRET_KEY=
```

**Backend Server (.env)**:
```env
PORT=4000
WORKERS_AI_API_URI=
WORKERS_AI_API_TOKEN=
DATABASE_INITIAL_URL=
STORAGE_INITIAL_URL=
```

### Development Workflow
1. **Database Setup** (First time):
   ```bash
   cd backend/database
   npm install
   npx wrangler login
   npx wrangler d1 execute codeconnect-db --local --file=./drizzle/0000_lumpy_nekra.sql
   npm run deploy
   ```

2. **Storage Setup** (First time):
   ```bash
   cd backend/storage  
   npm install
   npx wrangler login
   npm run deploy
   ```

3. **Development Servers** (Daily workflow):
   ```bash
   # Terminal 1: Frontend
   cd frontend && npm run dev
   
   # Terminal 2: Backend Server  
   cd backend/server && npm run dev
   ```

## Real-Time Architecture

### WebSocket Communication
The backend uses Socket.IO for real-time features:
- **File Operations**: Create, save, delete, rename files/folders
- **Terminal Sessions**: Integrated terminal with PTY support
- **Preview Servers**: Auto-detection of Vite/development servers
- **User Presence**: Track connected users and owners

### Collaborative Editing
- **Liveblocks**: Manages room-based collaboration state
- **Y.js Integration**: Operational transforms for conflict-free editing
- **Monaco Editor**: VS Code-like editing experience with multi-cursor support

### Live Preview System
The server automatically detects development servers (Vite, React dev server) and proxies them through `/preview/:projectId/:userId/` for real-time preview sharing.

## Project Types

Code Connect supports two main project types:
- **React**: Frontend applications with Vite development server
- **Node.js**: Backend applications with Node.js runtime

The system automatically detects server types from terminal output and sets up appropriate proxy configurations.

## Key Features Implementation

### Multi-User File System
- In-memory file state synchronized with Cloudflare D1
- Real-time broadcast of file structure changes
- Hierarchical file tree with drag-and-drop support

### Integrated Terminal
- Platform-aware shell spawning (PowerShell on Windows, Bash on Unix)
- Automatic server detection and preview proxy setup  
- Terminal sharing among collaboration participants

### Video Conferencing
- WebRTC-based audio/video calls
- Simple Peer for connection management
- Room-based communication via Liveblocks events

## Development Best Practices

### Rate Limiting
The application implements comprehensive rate limiting:
- File operations: Create, save, delete, rename limits per user
- Project size limits (200MB max)
- Connection attempt throttling

### WebSocket Management
- Heartbeat system for connection health monitoring
- Owner-based access control (shared users require owner presence)
- Graceful cleanup on disconnection

### Error Handling
- Comprehensive error boundaries in React components
- Socket.IO error events with user-friendly messages
- Automatic retry logic for failed operations

## Testing

### Running Tests
```bash
# Database worker tests
cd backend/database && npm run test

# Storage worker tests  
cd backend/storage && npm run test

# Frontend tests (when available)
cd frontend && npm run test
```

### Local Development Database
Use `npm run db:studio` in the database directory to inspect local SQLite database with Drizzle Studio.

## Deployment

### Cloudflare Workers
Both database and storage services deploy to Cloudflare Workers:
```bash
# Deploy database worker
cd backend/database && npm run deploy

# Deploy storage worker
cd backend/storage && npm run deploy
```

### Frontend Deployment
The Next.js application can be deployed to Vercel, Cloudflare Pages, or similar platforms supporting Node.js.

### Backend Server
The Express server can be deployed to platforms supporting WebSocket connections like Railway, Render, or cloud VMs.

## Troubleshooting

### Common Issues
1. **Preview not working**: Check if development server is detected in terminal output
2. **Real-time sync issues**: Verify Liveblocks configuration and room permissions
3. **Database connection errors**: Confirm Cloudflare D1 worker is deployed and accessible
4. **Terminal spawn failures**: Ensure proper shell configuration for target platform

### Debug Endpoints
- `GET /health` - Server health and active preview servers
- `GET /debug/connections` - Connected users and owner status
- `GET /api/preview-status/:projectId/:userId` - Preview server availability

## Security Considerations

- Authentication handled by Clerk with secure token validation
- Rate limiting prevents abuse of file operations and API calls  
- Owner-based permission model for virtualbox access
- Environment variables for sensitive configuration
- Input validation using Zod schemas throughout the application