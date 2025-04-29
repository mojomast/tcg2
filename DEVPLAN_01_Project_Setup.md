# DEVPLAN 01: Project Setup

**Goal**: Establish the foundational project structure, install core dependencies, and set up a basic running server.

## Tasks

### Backend Setup (Node.js/Express/TypeScript)
- [ ] Initialize Node.js project (`npm init`).
- [ ] Install TypeScript and types (`typescript`, `@types/node`, `@types/express`).
- [ ] Configure `tsconfig.json` for compilation.
- [ ] Install Express (`express`).
- [ ] Install Nodemon (`nodemon`) for development auto-restart.
- [ ] Create basic Express server structure (`src/server.ts`).
- [ ] Add basic start scripts to `package.json` (e.g., `dev`, `build`, `start`).
- [ ] Set up basic project folders (`src`, `dist`, `data`).

### Frontend Setup (React/TypeScript/Redux)
- [ ] Create React app using Vite or Create React App with TypeScript template (`npx create-vite frontend --template react-ts`).
- [ ] Install Redux Toolkit (`@reduxjs/toolkit`, `react-redux`).
- [ ] Set up basic Redux store structure (`src/store`, `src/features`).
- [ ] Install Socket.io client (`socket.io-client`).
- [ ] Configure basic frontend build/dev scripts.

### Database Setup (SQLite)
- [ ] Install SQLite driver (`sqlite3`).
- [ ] Install Knex.js or similar ORM/Query Builder (`knex`) (Optional but recommended).
- [ ] Create initial database file (`data/tcg.sqlite`).

### Version Control
- [ ] Initialize Git repository (`git init`).
- [ ] Create `.gitignore` file (include `node_modules`, `dist`, `.env`, etc.).
- [ ] Make initial commit.
