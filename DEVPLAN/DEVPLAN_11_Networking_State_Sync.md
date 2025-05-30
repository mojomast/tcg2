# DEVPLAN 11: Networking & State Synchronization

**Goal**: Establish real-time communication between the server and client using WebSockets (Socket.IO) and implement basic game state synchronization.

## Tasks

### Server-Side (Backend)
- [x] Install `socket.io` library (`npm install socket.io`).
- [x] Integrate Socket.IO with the existing Express server.
- [x] Set up a basic connection listener (`io.on('connection', ...)`).
- [x] Implement logic to emit `game_state_update` events to connected clients whenever the `GameEngine` modifies the canonical `GameState`. (Done - broadcast function added, called in handlers, GameEngine instantiation fixed)
    - Pass the relevant portion or the entire updated `GameState` as payload.
- [x] Set up basic room logic (e.g., joining a game room upon connection - placeholder). (Done - joining default room, broadcasting to room, initial state sent)
- [x] Modify `GameEngine` or action handlers to trigger state broadcasts after validation and mutation. (Done - server.ts handlers trigger broadcast on GameEngine method success)
- [x] Handle `join_game` event (assign player to room, initialize game if needed).
- [x] Map `socket.id` to `PlayerId` upon join/authentication.

### Client-Side (Frontend)
- [x] Ensure `socket.io-client` is installed. (Installed)
- [x] Create a WebSocket service/utility (`src/services/socketService.ts`) to manage the connection. (Done - forced WebSocket transport to resolve connection stability issues).
- [x] Establish connection to the Socket.IO server when the app loads. (Done - connecting in index.tsx)
- [x] Implement listeners for server-sent events, specifically `game_state_update`. (Done - listener in index.tsx)
- [x] When `game_state_update` is received, dispatch a Redux action to update the relevant slice of the local `GameState` in the Redux store. (Done - dispatching in index.tsx)
- [x] Implement basic event emission from client to server (e.g., placeholder `join_game` event).

### Integration & Testing
- [ ] Verify that changes made by server-side logic (e.g., phase changes from `DEVPLAN_03`) are reflected in the client UI via WebSocket updates and Redux store changes.
- [x] Test basic connection stability and event flow. (Initial connection issues resolved; GAME_READY event syncs initial state correctly).
- [ ] Add logging for WebSocket connections, disconnections, and received/sent events on both client and server.
- [ ] Test basic game actions (e.g., playing a card, passing priority) to ensure client-server communication and state updates are working.
  - See `devplan_detour_02_actions.md` for detailed planning of game actions.
- [x] Test with two clients connecting to the same game instance (if feasible with current setup).
  - [x] Implemented UI for selecting Player 1 or Player 2 on client-side to facilitate two-player testing.
- [ ] Address any discrepancies or bugs found during testing.
  - [x] Resolved client-side `process.env` issue by migrating to Vite's `import.meta.env`.
  - [x] Updated `tsconfig.json` for Vite compatibility (module, target, types) to fix `import.meta.env` errors.
  - [x] Resolved issue where initial player hands were empty due to backend not dealing cards before `GAME_READY`. (`GameEngine.ts` modified to draw starting hands).
  - [ ] Backend: `CARD_DRAWN` events (emitted during initial hand draw and potentially later) are not broadcast to clients due to missing `gameId` in the event payload from `GameEngine`. This does not affect initial hand display via `GAME_READY` but will affect real-time updates for individual draw actions if not addressed.
- [x] Ensure `localPlayerId` is correctly identified and UI reflects the perspective of the local player. (Core mechanism implemented; `gameSlice.ts` refactored for robust `localPlayerId` handling and dynamic player name display - 'You' vs 'Opponent').

## Open Questions & Blockers
