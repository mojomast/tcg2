# DEVPLAN 10: UI Card Rendering

**Goal**: Implement the visual representation of cards within the UI, displaying basic card information in zones like the hand and battlefield.

## Tasks

### Card Component
- [x] Create a reusable `Card` component (`src/components/Card.tsx`).
- [x] This component should accept card data (from the `Card` interface defined in `DEVPLAN_02`) as props.
- [x] Display basic card info: Name, Mana Cost, Type, Power/Toughness (if applicable).
- [x] Add basic styling to resemble a card (border, background).
- [x] Implement visual indication for tapped state (e.g., slight rotation).

### Hand Zone Integration
- [x] Modify the `PlayerHandZone` component (`DEVPLAN_09`).
- [x] Connect `PlayerHandZone` to the Redux store to get the player's `hand` array from `GameState`.
- [x] Render a `Card` component for each card object in the player's hand. (Backend now correctly provides initial hand data).
- [x] Implement basic layout for cards in hand (e.g., horizontal row).
  - [x] Repositioned Player Hand Zone to a dedicated full-width row beneath the player's battlefield and above the player info bar for improved layout and space utilization.

### Battlefield Zone Integration
- [x] Modify the `PlayerBattlefield` and `OpponentBattlefield` components (`DEVPLAN_09`). (PlayerBattlefield done, OpponentBattlefield done)
- [x] Connect `PlayerBattlefield` and `OpponentBattlefield` to the Redux store to get creature/resource/enchantment arrays from the relevant player's `battlefield` state.
- [x] Render `Card` components for each card object on the `PlayerBattlefield` and `OpponentBattlefield`.
- [ ] Arrange cards in rows based on type (Resources, Creatures) as per `3_ui_design.md`. (Deferred - Current implementation uses a single row)
- [x] Ensure the `Card` component reflects the tapped state based on data from `GameState` for `PlayerBattlefield` and `OpponentBattlefield`.

### Placeholder Data
- [x] Ensure the Redux store can be populated with sample `GameState` including cards in hand and on the battlefield for testing rendering.

**Note (2025-05-28):** Successfully debugged issues related to initial hand data synchronization. The backend (`GameEngine`) now correctly deals starting hands, and the frontend (`gameSlice.ts`, `PlayerHandZone.tsx`) processes and displays this data. Socket connection stability was also improved by forcing WebSocket transport.
