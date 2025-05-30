# Dev Plan Detour 03: SQLite Database Integration

**Objective:** Transition card and deck data management from mock objects to an SQLite database in the backend.

## Tasks:

### 1. Backend SQLite Setup (Node.js / Express)
    - **Priority:** High
    - **Status:** Done
    - **Details:**
        - Choose and install an SQLite library for Node.js (e.g., `sqlite3` or `better-sqlite3`). - **Status: Done (using `better-sqlite3`)**
        - Design database schema for `cards` table (id, name, type, cost, text, attack, health, keywords, abilities, rarity, rulesText, setId, collectorNumber, imageUrl, etc.). - **Status: Done**
          ```sql
          CREATE TABLE cards (
            id TEXT PRIMARY KEY NOT NULL,      -- Unique identifier for the card definition (e.g., a UUID or a set-specific ID like "M21-001")
            name TEXT NOT NULL,                -- Card name
            mana_cost TEXT,                    -- JSON string representing ManaCost (e.g., {"R":1,"C":2})
            cmc INTEGER NOT NULL,              -- Converted mana cost
            type_line TEXT NOT NULL,           -- Full type line (e.g., "Creature - Human Warrior", "Instant")
            card_type TEXT NOT NULL,           -- Main type (Creature, Instant, Sorcery, etc.)
            subtypes TEXT,                     -- JSON array of subtypes (e.g., ["Human", "Warrior"])
            rarity TEXT NOT NULL,              -- (Common, Uncommon, Rare, Mythic)
            rules_text TEXT,                   -- Oracle text of the card
            flavor_text TEXT,
            attack INTEGER,                    -- For creatures
            health INTEGER,                    -- For creatures
            keywords TEXT,                     -- JSON array of keywords (e.g., ["Flying", "Lifelink"])
            spell_speed TEXT,                  -- (Instant, Sorcery) - if applicable
            produces_mana TEXT,                -- JSON string representing ManaCost produced
            abilities TEXT,                    -- JSON string representing an array of Ability objects
            set_id TEXT NOT NULL,              -- Set code (e.g., "M21")
            collector_number TEXT NOT NULL,    -- Collector number within the set
            image_url TEXT
          );
          ```
        - Design database schema for `decks` table (id, name, player_id, format, etc.). - **Status: Done**
          ```sql
          CREATE TABLE decks (
            id TEXT PRIMARY KEY NOT NULL,      -- Unique identifier for the deck (e.g., a UUID)
            player_id TEXT NOT NULL,           -- Identifier for the player who owns the deck
            name TEXT NOT NULL,                -- Name of the deck (e.g., "My Mono Red Aggro")
            format TEXT,                       -- Game format (e.g., "Standard", "Commander")
            description TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
          ```
        - Design database schema for `deck_cards` join table (deck_id, card_id, quantity_mainboard, quantity_sideboard). - **Status: Done**
          ```sql
          CREATE TABLE deck_cards (
            deck_id TEXT NOT NULL,
            card_id TEXT NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1, -- Number of this card in the deck (mainboard)
            is_sideboard INTEGER NOT NULL DEFAULT 0, -- Boolean (0 for false, 1 for true) indicating if the card is in the sideboard
            PRIMARY KEY (deck_id, card_id, is_sideboard),
            FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE,
            FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
          );
          ```
        - Create scripts/utility functions to initialize the database and tables. - **Status: Done (see `src/db/database.ts`)**
        - Create scripts/utility functions to populate the `cards` table with initial card data (possibly from a JSON or CSV file). - **Status: Done (see `scripts/populate-cards.ts`, fetches from MTG API)**

### 2. Card Service (`cardService.ts` - Backend)
    - **Priority:** High
    - **Status:** To Do
    - **Details:**
        - Create `src/services/cardService.ts`.
        - Implement functions to fetch card data from the SQLite `cards` table (e.g., `getCardById(cardId)`, `getAllCards()`).
        - Initially, this service might still use mock data until SQLite is fully integrated, to allow frontend/engine work to proceed.

### 3. Deck Service (`deckService.ts` - Backend Updates)
    - **Priority:** High
    - **Status:** In Progress
    - **Details:**
        - Modify existing `src/services/deckService.ts`. - **Status: In Progress (Placeholder created, full DB integration pending)**
        - Implement functions to fetch player deck data from SQLite (`decks` and `deck_cards` tables) (e.g., `getPlayerDeck(playerId, deckId)`).
        - Implement functions to save/update player decks.

### 4. Game Engine Integration
    - **Priority:** Medium
    - **Status:** To Do
    - **Details:**
        - Modify `GameEngine` to use `cardService.ts` to load card definitions instead of internal mock data.
        - Ensure `GameEngine` continues to use `deckService.ts` for fetching deck lists (which will now come from SQLite).

### 5. API Endpoints (Backend)
    - **Priority:** Medium
    - **Status:** To Do
    - **Details:**
        - Create/update API endpoints for fetching cards (e.g., `/api/cards`, `/api/cards/:id`).
        - Create/update API endpoints for fetching and managing decks (e.g., `/api/decks`, `/api/decks/:playerId`, `/api/decks/:playerId/:deckId`).

### 6. Deckbuilding UI/Client (Future - Separate Dev Plan)
    - **Priority:** Low (for this detour)
    - **Status:** To Do
    - **Details:** This will be a larger feature, but the backend database is a prerequisite. This task is a placeholder to acknowledge the dependency.

### 7. Card Display Page (Frontend/Backend)
    - **Priority:** Medium
    - **Status:** Partially Done
    - **Details:**
        - Create backend API endpoint (`/api/cards`) to fetch paginated card data from the SQLite database. - **Status: Partially Done (Endpoint exists and serves data; full DB pagination TBD)**
        - Create a simple frontend page to display cards, showing image, name, mana cost, type, and rules text. This page will fetch data from the `/api/cards` endpoint. - **Status: Done (cards.html is functional)**

## Considerations:
- Error handling for database operations.
- Asynchronous operations for database calls.
- Data validation for card and deck creation/updates.
