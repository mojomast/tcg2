# DEVPLAN 09: UI Board Layout

**Goal**: Create the basic React component structure for the main game board UI, representing the different zones described in `3_ui_design.md`.

## Tasks

### Frontend Component Structure (React)
- [x] Create a main `GameBoard` component (`src/components/GameBoard.tsx`).
- [x] Inside `GameBoard`, create placeholder components for major areas:
    - `OpponentInfoBar`
    - `PlayerInfoBar`
    - `OpponentBattlefield`
    - `PlayerBattlefield`
    - `OpponentHandZone` (visual representation, actual cards hidden)
    - `PlayerHandZone`
    - `OpponentDeckZone`
    - `PlayerDeckZone`
    - `OpponentDiscardZone`
    - `PlayerDiscardZone`
    - `StackZone`
    - `PhaseDisplay`
    - `ActionControls`

### Basic Styling & Layout
- [x] Apply basic CSS (or styled-components/Tailwind) to arrange these components roughly according to the wireframe in `3_ui_design.md`.
- [x] Use Flexbox or Grid layout to position zones.
- [x] Add distinct background colors or borders to zones for visual separation during development.

### State Integration (Redux - Basic)
- [x] Connect `PlayerInfoBar` and `OpponentInfoBar` to the Redux store to display placeholder data (e.g., life totals, hand size) from the `GameState`.
- [x] Connect `PhaseDisplay` to show the current game phase from the Redux store.

### Placeholder Content
- [x] Populate zones with simple text labels or placeholder elements (e.g., "Opponent Creature Zone", "Player Hand Card Slot").
- [ ] Do not implement actual card rendering yet.
