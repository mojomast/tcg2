# DEVPLAN 10: UI Card Rendering

**Goal**: Implement the visual representation of cards within the UI, displaying basic card information in zones like the hand and battlefield.

## Tasks

### Card Component
- [ ] Create a reusable `Card` component (`src/components/Card.tsx`).
- [ ] This component should accept card data (from the `Card` interface defined in `DEVPLAN_02`) as props.
- [ ] Display basic card info: Name, Mana Cost, Type, Power/Toughness (if applicable).
- [ ] Add basic styling to resemble a card (border, background).
- [ ] Implement visual indication for tapped state (e.g., slight rotation).

### Hand Zone Integration
- [ ] Modify the `PlayerHandZone` component (`DEVPLAN_09`).
- [ ] Connect `PlayerHandZone` to the Redux store to get the player's `hand` array from `GameState`.
- [ ] Render a `Card` component for each card object in the player's hand.
- [ ] Implement basic layout for cards in hand (e.g., horizontal row).

### Battlefield Zone Integration
- [ ] Modify the `PlayerBattlefield` and `OpponentBattlefield` components (`DEVPLAN_09`).
- [ ] Connect these components to the Redux store to get creature/resource/enchantment arrays from the relevant player's `battlefield` state.
- [ ] Render `Card` components for each card object on the battlefield.
- [ ] Arrange cards in rows based on type (Resources, Creatures) as per `3_ui_design.md`.
- [ ] Ensure the `Card` component reflects the tapped state based on data from `GameState`.

### Placeholder Data
- [ ] Ensure the Redux store can be populated with sample `GameState` including cards in hand and on the battlefield for testing rendering.
