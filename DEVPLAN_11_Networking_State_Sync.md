# DEVPLAN 11: Networking & State Synchronization

**Goal**: Establish real-time communication between the server and client using WebSockets (Socket.IO) and implement basic game state synchronization.

## Tasks

### Server-Side (Backend)
- [ ] Install `socket.io` library (`npm install socket.io`).
- [ ] Integrate Socket.IO with the existing Express server.
- [ ] Set up a basic connection listener (`io.on('connection', ...)`).
- [ ] Implement logic to emit `game_state_update` events to connected clients whenever the `GameEngine` modifies the canonical `GameState`.
    - Pass the relevant portion or the entire updated `GameState` as payload.
- [ ] Set up basic room logic (e.g., joining a game room upon connection - placeholder).
- [ ] Modify `GameEngine` or action handlers to trigger state broadcasts after validation and mutation.

### Client-Side (Frontend)
- [ ] Ensure `socket.io-client` is installed.
- [ ] Create a WebSocket service/utility (`src/services/socketService.ts`) to manage the connection.
- [ ] Establish connection to the Socket.IO server when the app loads.
- [ ] Implement listeners for server-sent events, specifically `game_state_update`.
- [ ] When `game_state_update` is received, dispatch a Redux action to update the relevant slice of the local `GameState` in the Redux store.
- [ ] Implement basic event emission from client to server (e.g., placeholder `join_game` event).

### Integration & Testing
- [ ] Verify that changes made by server-side logic (e.g., phase changes from `DEVPLAN_03`) are reflected in the client UI via WebSocket updates and Redux store changes.
- [ ] Test basic connection stability and event flow.
- [ ] Add logging for WebSocket connections, disconnections, and received/sent events on both client and server.
