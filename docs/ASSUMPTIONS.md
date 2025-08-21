# Project Assumptions

## Technical Assumptions
- Node.js version 18+ available
- Modern browser support only (no IE11)
- WebSocket support in target browsers
- Single server deployment (no clustering initially)
- Memory sufficient for 3 sessions × 16 users
- No SSL/TLS required for development

## Business Assumptions
- Maximum limits (3 sessions, 16 users) are acceptable
- No data persistence between server restarts is acceptable
- 10-minute session timeout is sufficient
- No user authentication/authorization required
- Session discovery shows all active sessions (no privacy)
- English language only

## User Behavior Assumptions
- Users have stable internet connections
- Users will complete sessions (not abandon frequently)
- Scrum Masters understand Planning Poker process
- Teams are 3-16 members as specified
- Users will save their name/avatar preferences locally

## Development Assumptions
- Development on local environment first
- No CI/CD pipeline required initially
- Manual deployment acceptable for MVP
- No monitoring/analytics required initially
- Error logging to console sufficient for MVP