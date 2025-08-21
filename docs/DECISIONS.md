# Technology Stack Decisions

## Date: 2025-08-21

### Frontend Framework
**Choice:** Next.js with TypeScript
**Rationale:** 
- Full-stack capabilities with API routes
- Built-in optimizations and performance features
- Excellent TypeScript support
- SSR/SSG capabilities for better initial load
- Large ecosystem and community support

### Backend/API
**Choice:** Next.js API Routes
**Rationale:**
- Simplified architecture (single deployment)
- Serverless functions scale automatically
- No need for separate backend service
- Reduced complexity in development and deployment

### Real-time Communication
**Choice:** Socket.io
**Rationale:**
- Battle-tested with automatic reconnection
- Built-in room management perfect for sessions
- Fallback mechanisms for unreliable connections
- Client/server library compatibility
- Handles our 16-user per session requirement easily

### Session Management
**Choice:** Simple in-memory sessions
**Rationale:**
- Aligns with PRD requirement (no persistent database)
- Session data stored in server memory
- Browser local storage for user preferences
- GUID-based session identification
- Simple and efficient for our use case

### Testing Framework
**Choice:** Jest + React Testing Library
**Rationale:**
- Standard Next.js testing setup
- Good for unit and integration testing
- Component testing capabilities
- Well-documented and widely adopted
- Can mock Socket.io connections for testing

## Architecture Overview
- **Frontend:** Next.js pages/components with TypeScript
- **API:** Next.js API routes for REST endpoints
- **WebSocket Server:** Socket.io server integrated with Next.js custom server
- **State Management:** React Context + Socket.io for real-time state
- **Styling:** Tailwind CSS for responsive design
- **Session Storage:** In-memory Map/Object with TTL management
- **User Preferences:** Browser localStorage