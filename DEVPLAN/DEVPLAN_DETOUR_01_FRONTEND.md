# DEVPLAN_DETOUR_01_FRONTEND: Early Frontend Integration Plan

## 1. Objective

- **Primary Goal**: To integrate key existing backend functionalities into a basic frontend UI to enable early testing and gather feedback on core game mechanics and user interactions.
- **Secondary Goals**:
    - Validate backend API/data contracts with frontend consumers.
    - Identify and address integration challenges early in the development cycle.
    - Provide a tangible prototype for stakeholder demonstrations.

## 2. Scope

### In Scope:

- **Backend Elements (Specify)**:
    - Player state data (life, energy, hand representation - e.g., card count or basic card info).
    - Display of individual Card data (name, cost, type, text) for cards in hand or on battlefield.
    - Current game state information: turn number, active player, current phase, priority holder.
    - Invocation of `GameEngine.startGame()`.
    - Invocation of `GameEngine.passPriority()`.
    - (Stretch Goal) Invocation of `GameEngine.playCard()` for a simple, non-targeted card.
- **Frontend Elements (Specify)**:
    - Basic Player HUD to display life, energy (Implemented in `PlayerHUD.tsx`, integrated into `App.tsx`).
    - Area to display cards in a player's hand (e.g., as clickable names or basic card mockups) (Implemented in `HandDisplay.tsx`, integrated into `App.tsx`).
    - Game Information panel showing turn, phase, active player, and priority status (Implemented in `GameBoardInfo.tsx`, integrated into `App.tsx`).
    - "Start Game" button (Implemented in `ActionControls.tsx`, connected to mock service via `App.tsx`).
    - "Pass Priority" button (Implemented in `ActionControls.tsx`).
    - (Stretch Goal) A button or mechanism to trigger playing a predefined test card.

### Out of Scope:

- Advanced UI features (e.g., animations, complex visual effects).
- Comprehensive error handling and edge case management in the UI.
- Full implementation of all game rules or card effects.
- `[User to add other items not covered in this phase]`

## 3. Backend Elements for Integration

*List the specific backend components that will be surfaced or connected to the frontend.*

1.  **Module/Function 1**: `GameState` object (defined in `src/interfaces/gameState.ts`)
    -   **Data Expected by Frontend**: JSON object typically including `gameId`, `turnNumber`, `activePlayerId`, `currentPhase`, `priorityHolderId`, `player1_state` (with `life`, `energy`, `hand` (array of card objects/IDs), `battlefield`), `player2_state` (similarly).
2.  **Module/Function 2**: `Card` data (interface `src/interfaces/card.ts`, data from `cards` DB table)
    -   **Data Expected by Frontend**: JSON object for individual cards, e.g., `{ id, name, cost, type, text, power, toughness }`.
3.  **Module/Function 3**: `GameEngine.startGame()` (method in `src/engine/gameEngine.ts`)
    -   **Data Expected by Frontend**: The initial `GameState` object after game setup (hands drawn, etc.).
4.  **Module/Function 4**: `GameEngine.passPriority(playerId: string)` (method in `src/engine/gameEngine.ts`)
    -   **Data Expected by Frontend**: The updated `GameState` reflecting the change in priority, and potentially phase/turn progression.
5.  **Module/Function 5 (Stretch Goal)**: `GameEngine.playCard(playerId: string, cardId: string, targets?: string[])` (method in `src/engine/gameEngine.ts`)
    -   **Data Expected by Frontend**: The updated `GameState` after the card is played (or attempted), or an error/status message.

## 4. Frontend Implementation Strategy

### Key UI Views/Components:

1.  **View/Component 1**: `PlayerHUD.tsx` (Created and integrated)
    -   **Purpose**: Display current player's vital stats (life, energy) and opponent's public stats.
    -   **Backend Interaction**: Consumes data from the `GameState` object managed in `App.tsx`.
2.  **View/Component 2**: `HandDisplay.tsx` (Created and integrated)
    -   **Purpose**: Show cards in the current player's hand. Initially, could be card names or simple placeholders. Allow selection for playing a card.
    -   **Backend Interaction**: Consumes `hand` data from `GameState`, potentially fetches full card details if only IDs are provided.
3.  **View/Component 3**: `GameBoardInfo.tsx` (Created and integrated)
    -   **Purpose**: Display current turn number, phase, active player, and priority status.
    -   **Backend Interaction**: Consumes relevant fields from `GameState` managed in `App.tsx`.
4.  **View/Component 4**: `ActionControls.tsx` (Initial version created, integrated with `App.tsx` for `startGame`)
    -   **Purpose**: Provide buttons for "Start Game", "Pass Priority", and (stretch goal) "Play Test Card".
    -   **Backend Interaction**: Will trigger API calls to corresponding backend actions (`startGame`, `passPriority`, `playCard`), `startGame` is now handled by `App.tsx`.

### Data Display & Mocking:

- **Real Data Integration**: Prioritize fetching and displaying actual `GameState` and `Card` data from the backend.
- **Mock Data/Services**:
    - If direct card data loading into the DB (`DEVPLAN_02`) is delayed, a small set of mock card objects might be used by the frontend for display testing.
    - Complex card effects or targeting for `playCard` will likely be out of scope initially; focus on playing a simple, non-targeted creature or resource card.

## 5. API Design (if applicable)

*If direct function calls are not used, define the API endpoints. These are illustrative and assume a RESTful or RPC-style approach over HTTP/WebSockets.*

1.  **Endpoint 1**: `POST /api/game/create` (or `/api/game/start`)
    -   **Purpose**: To initiate a new game via `GameEngine.startGame()`.
    -   **Request**: Potentially player IDs, deck selections (simplified for now).
    -   **Response**: Initial `GameState` JSON object.
2.  **Endpoint 2**: `GET /api/game/{game_id}/state`
    -   **Purpose**: To fetch the current `GameState` for a given game.
    -   **Request**: `game_id` as path parameter.
    -   **Response**: Current `GameState` JSON object.
3.  **Endpoint 3**: `POST /api/game/{game_id}/action/pass-priority`
    -   **Purpose**: To allow a player to pass priority via `GameEngine.passPriority()`.
    -   **Request**: `game_id`, `{ playerId: string }` in body.
    -   **Response**: Updated `GameState` JSON object or success/failure status.
4.  **Endpoint 4 (Stretch Goal)**: `POST /api/game/{game_id}/action/play-card`
    -   **Purpose**: To allow a player to play a card via `GameEngine.playCard()`.
    -   **Request**: `game_id`, `{ playerId: string, cardId: string, targets?: string[] }` in body.
    -   **Response**: Updated `GameState` JSON object or success/failure status including error messages.
5.  **Endpoint 5 (Supporting)**: `GET /api/cards/{card_id}` or `GET /api/cards?ids=id1,id2`
    -   **Purpose**: To fetch detailed data for one or more cards.
    -   **Request**: `card_id` or list of IDs.
    -   **Response**: Card data JSON object(s).

## 6. Testing Approach

- **UI Component Tests**: Test individual frontend components with mock data.
    - *Tooling: `[e.g., Jest, Vue Test Utils]`*
- **Integration Tests**: Test the communication flow between frontend and backend (once connected).
    - *Focus: API request/response validation, data transformation.*
- **Manual/Exploratory Testing**: Perform user scenarios on the integrated UI.
    - *Focus: Core gameplay loops, basic interactions.*

## 7. Assumptions & Dependencies

- **Assumptions**:
    - Basic backend infrastructure (e.g., server, database) is operational.
    - Core backend logic for selected features is stable enough for integration.
    - `[User to add more]`
- **Dependencies**:
    - Availability of backend developers for API clarification/troubleshooting.
    - `[User to add more]`

## 8. Potential Risks & Mitigation

1.  **Risk**: Backend API instability or frequent changes.
    -   **Mitigation**: Establish clear API contracts early. Use API versioning if possible. Implement an adapter layer in the frontend to decouple from direct API changes.
2.  **Risk**: Discrepancies between frontend expectations and backend data structures.
    -   **Mitigation**: Regular communication between frontend and backend teams. Shared documentation for data models.
3.  **Risk**: Time underestimation for UI development or integration.
    -   **Mitigation**: Prioritize core features. Use UI libraries/frameworks to speed up development. Break down tasks into smaller, manageable chunks.
4.  `[User to add more]`

## 9. Timeline/Phases (High-Level)

- **Phase 1 (Week X-Y)**: Setup basic frontend project, implement `ActionControls` UI, connect "Start Game" to backend (mock service via `App.tsx`). (COMPLETED)
- **Phase 2 (Week Y-Z)**: Develop `PlayerHUD` and `GameBoardInfo` views, display mock/real game state from `startGame` response. (COMPLETED - Components created and displaying mock data)
- **Phase 3 (Week Z-A)**: Integrate `passPriority` action. Develop `HandDisplay` component. Display card data in `HandDisplay`. (COMPLETED - HandDisplay created, passPriority integrated with mock service.)
- **Phase 3.5: UI/UX Polish (Detour)** (COMPLETED)
    - Visual feedback for player priority on `PlayerHUD` (highlighting, text).
    - `ActionControls`: "Pass Priority" button disabled if not current player's priority.
    - `HandDisplay`: Cards are clickable, selected card is highlighted, details logged.
- **Phase 3.6: Further UI/UX Enhancements (Detour)** (COMPLETED)
    - **Centralized Type Definitions**: Moved `Card`, `PlayerState`, `GameState` interfaces to `src/types/gameState.ts`.
    - **Visual Loading Indicator**: Added Unicode spinner to action buttons in `ActionControls` during loading states.
    - **Opponent's Hand Placeholder**: Displayed opponent's hand card count in the UI.
    - **Energy Cost Feedback**: `HandDisplay` visually indicates (e.g., red highlight) if a selected card is too expensive for current energy.
    - **Clearer Current Phase Display**: Enhanced visibility of the current game phase in `GameBoardInfo`.
- **Phase 3.7: TypeScript Error Resolution & Server Stabilization (COMPLETED)**
    - Resolved all 7 outstanding TypeScript compilation errors in the backend codebase.
    - The server (`npm run dev`) now compiles and starts successfully without errors.
    - Confirmed `cards.html` is served correctly (HTTP 200 OK) by the running server.
    - Addressed issues related to `GameEngine` event callback handling, `ActionManager` mana spending, missing `CARD_PLAYED` event, and `GameEngine.generateGameObjectId`.
    - Created a placeholder `deckService.ts` to satisfy import dependencies and allow server to run.
- **Phase 4 (Week A-B)**: (Stretch Goal) Implement basic `playCard` action and feedback.
- `[User to adjust and detail the timeline]`

---
*This plan is a living document and should be updated as the project progresses and more information becomes available.*
