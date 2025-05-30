# DEVPLAN 01: Project Setup

**Goal**: Establish the foundational project structure, install core dependencies, and set up a basic running server.

## Tasks

### Backend Setup (Node.js/Express/TypeScript)
- [X] Initialize Node.js project (`npm init`).
- [X] Install TypeScript and types (`typescript`, `@types/node`, `@types/express`).
- [X] Configure `tsconfig.json` for compilation.
- [X] Install Express (`express`).
- [X] Install Nodemon (`nodemon`) for development auto-restart.
- [X] Create basic Express server structure (`src/server.ts`).
- [X] Add basic start scripts to `package.json` (e.g., `dev`, `build`, `start`).
- [X] Set up basic project folders (`src`, `dist`, `data`).

### Frontend Setup (React/TypeScript/Redux)
- [X] Create React app using Vite or Create React App with TypeScript template (`npx create-vite frontend --template react-ts`).
- [X] Install Redux Toolkit (`@reduxjs/toolkit`, `react-redux`).
- [X] Set up basic Redux store structure (`src/store`, `src/features`).
- [X] Install Socket.io client (`socket.io-client`).
- [X] Configure basic frontend build/dev scripts.

### Database Setup (SQLite)
- [X] Install SQLite driver (`sqlite3`).
- [X] Install Knex.js or similar ORM/Query Builder (`knex`) (Optional but recommended).
- [ ] Create initial database file (`data/tcg.sqlite`) (Will be created via Knex migrations in DEVPLAN_02).

### Version Control
- [X] Initialize Git repository (`git init`).
- [X] Create `.gitignore` file (include `node_modules`, `dist`, `.env`, etc.).
- [ ] Make initial commit.
