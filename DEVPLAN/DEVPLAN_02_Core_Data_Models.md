# DEVPLAN 02: Core Data Models

**Goal**: Define and implement the fundamental data structures for cards, players, and the overall game state, including the database schema.

## Tasks

### Data Interfaces (TypeScript)
- [X] Define `Card` interface (`src/interfaces/card.ts`) based on `4_technical.md` and `2_deck_building.md`.
    - Include properties like id, name, cost, type, subtype, rarity, text, power/toughness, abilities, set info, etc.
- [X] Define `Player` state structure within `GameState` (`src/interfaces/gameState.ts`).
    - Include life, energy, poison, hand, battlefield zones (creatures, resources, etc.), graveyard, exile, deck count.
- [X] Define `GameState` interface (`src/interfaces/gameState.ts`).
    - Include game ID, turn number, active player, phase, player states, stack, priority holder, game log.
- [X] Define `StackItem` interface (`src/interfaces/gameState.ts`).

### Database Schema (SQLite / Knex)
- [X] Create Knex migration file for the `users` table.
- [X] Create Knex migration file for the `sets` table.
- [X] Create Knex migration file for the `cards` table (referencing `sets`).
- [X] Create Knex migration file for the `decks` table (referencing `users`).
- [X] Create Knex migration file for the `deck_cards` join table (referencing `decks` and `cards`).
- [X] Create Knex migration file for the `matches` table.
- [X] Create Knex migration file for the `match_players` join table (referencing `matches`, `users`, `decks`).
- [X] Run initial migrations.

### Initial Data Loading
- [ ] Create a script or utility to load basic card data (from JSON/CSV) into the database (Optional, for testing).
