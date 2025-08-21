# MagnaPP - Planning Poker Application

A real-time collaborative Planning Poker application for distributed agile teams.

## Features

- 🎯 Real-time Planning Poker sessions with up to 16 participants
- 🎮 Virtual boardroom with oval table visualization
- 🔄 Automatic reconnection and session recovery
- 📊 Instant voting statistics and consensus detection
- 👑 Scrum Master controls for session management
- 📱 Responsive design for desktop, tablet, and mobile

## Tech Stack

- **Frontend**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS
- **Real-time**: Socket.io
- **Testing**: Jest + React Testing Library
- **Session Storage**: In-memory (no database required)

## Prerequisites

- Node.js 18+ 
- npm 9+

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd planning-poker-magnapp
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the sample environment file and adjust as needed:

```bash
cp .env.sample .env.local
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Available Scripts

- `npm run dev` - Start development server with hot-reload
- `npm run build` - Build production application
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report

## Project Structure

```
planning-poker-magnapp/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── session/           # Session pages
│   └── layout.tsx         # Root layout
├── components/            # React components
├── lib/                   # Utility functions and core logic
│   ├── socket/           # Socket.io configuration
│   ├── session/          # Session management
│   └── types/            # TypeScript types
├── public/               # Static assets
├── docs/                 # Documentation
└── plans/                # Task planning
```

## Configuration

See `.env.sample` for all available configuration options:

- `SESSION_TIMEOUT_MINUTES`: Session inactivity timeout (default: 10)
- `MAX_CONCURRENT_SESSIONS`: Maximum concurrent sessions (default: 3)
- `MAX_USERS_PER_SESSION`: Maximum users per session (default: 16)
- `SCRUM_MASTER_GRACE_PERIOD_MINUTES`: Grace period for Scrum Master reconnection (default: 5)

## Development

### Code Style

This project uses ESLint and Prettier for code formatting. Run `npm run format` before committing.

### Testing

Write tests for new features in the `__tests__` directories. Run `npm test` to execute the test suite.

### Commit Convention

Use conventional commits:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test additions/changes
- `chore:` Build process or auxiliary tool changes

## License

[License Type] - See LICENSE file for details

## Support

For issues and feature requests, please use the GitHub issue tracker.
