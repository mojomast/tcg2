# DEVPLAN 02: Core Data Models

**Goal**: Define and implement the fundamental data structures for cards, players, and the overall game state, including the database schema.

## Tasks

### Data Interfaces (TypeScript)
- [ ] Define `Card` interface (`src/interfaces/card.ts`) based on `4_technical.md` and `2_deck_building.md`.
    - Include properties like id, name, cost, type, subtype, rarity, text, power/toughness, abilities, set info, etc.
- [ ] Define `Player` state structure within `GameState` (`src/interfaces/gameState.ts`).
    - Include life, energy, poison, hand, battlefield zones (creatures, resources, etc.), graveyard, exile, deck count.
- [ ] Define `GameState` interface (`src/interfaces/gameState.ts`).
    - Include game ID, turn number, active player, phase, player states, stack, priority holder, game log.
- [ ] Define `StackItem` interface (`src/interfaces/gameState.ts`).

### Database Schema (SQLite / Knex)
- [ ] Create Knex migration file for the `users` table.
- [ ] Create Knex migration file for the `sets` table.
- [ ] Create Knex migration file for the `cards` table (referencing `sets`).
- [ ] Create Knex migration file for the `decks` table (referencing `users`).
- [ ] Create Knex migration file for the `deck_cards` join table (referencing `decks` and `cards`).
- [ ] Create Knex migration file for the `matches` table.
- [ ] Create Knex migration file for the `match_players` join table (referencing `matches`, `users`, `decks`).
- [ ] Run initial migrations.

### Initial Data Loading
- [ ] Create a script or utility to load basic card data (from JSON/CSV) into the database (Optional, for testing).
