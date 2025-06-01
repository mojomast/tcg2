# Trading Card Game (TCG) Project

## Project Overview

This project is a web-based, two-player Trading Card Game (TCG) inspired by mechanics found in popular games like Magic: The Gathering. It aims to deliver a rich gameplay experience with a comprehensive card database, deckbuilding capabilities, and real-time multiplayer interaction.

## Technology Stack

The project leverages a modern technology stack for both its backend and frontend components:

*   **Backend:**
    *   Runtime: Node.js
    *   Language: TypeScript
    *   Framework: Express.js
    *   Database: SQLite
    *   ORM/Query Builder: Knex.js (for migrations and schema management)
    *   Real-time Communication: Socket.IO
*   **Frontend:**
    *   Framework: React
    *   Build Tool: Vite
    *   Language: TypeScript
    *   State Management: Redux
    *   Real-time Communication: Socket.IO Client
*   **Testing:**
    *   Framework: Jest

## Key Features

The game incorporates a wide array of features, meticulously planned and tracked through a detailed devplan system.

### Core Game Mechanics
*   **Game Loop Engine:** Manages the overall game flow, including turns, phases (Begin, Main, Combat, End), and steps within each phase (Untap, Upkeep, Draw, etc.).
*   **Resource System:**
    *   **Mana:** Primary resource for playing cards, with systems for generation, tracking in a mana pool, and spending. The mana pool typically clears between phases/turns.
    *   **Energy:** A planned secondary resource system, intended to be persistent and used for specific card abilities.
*   **Player Actions:** Core actions include playing cards (resources, spells) from hand. Activated abilities are also planned.
*   **Combat System:** A detailed combat phase allowing players to:
    *   Declare attackers.
    *   Declare blockers.
    *   Resolve combat damage, including handling for keywords like First Strike, Double Strike, and Trample.
    *   State-Based Actions (SBAs) are checked after damage to handle lethal damage, player life totals, etc.
*   **Stack Implementation:** A Last-In, First-Out (LIFO) stack manages the resolution of spells and abilities, with a priority system dictating when players can act.
*   **Card Keywords:** Implemented keywords include:
    *   Haste
    *   Flying
    *   Vigilance
    *   Reach
    *   Cannot Block
    *   First Strike
    *   Double Strike
    *   Trample
    *   (Additional keywords like Deathtouch and Lifelink are planned).
*   **Win/Loss Conditions:** Games can be won or lost based on:
    *   Life Depletion: A player's life total reaching 0 or less.
    *   Deck Depletion: A player attempting to draw a card from an empty library.

### Data Management & Persistence
*   **Core Data Models:** Well-defined TypeScript interfaces for `Card`, `PlayerState`, `GameState`, `StackItem`, and other critical game entities.
*   **Database (SQLite):**
    *   Stores data for `cards` (definitions, stats, abilities), `users`, `sets`, `decks` (player-created decklists), and `deck_cards` (join table for deck contents).
    *   Knex.js is used for database migrations and schema management.
*   **Card Service:** A backend service responsible for fetching card definitions from the database.
*   **Deck Service:** A backend service for managing player decks, including loading and saving.
*   **Deckbuilding System:**
    *   Features an algorithm for automatic deck generation based on parameters like colors, card type ratios, mana curve, and automatic mana balancing.
    *   Includes deck validation rules (e.g., minimum deck size, maximum copies of a card).

### Networking & Real-time Gameplay
*   **WebSockets (Socket.IO):** Enables real-time, two-way communication between the server and clients.
*   **State Synchronization:** The server emits `game_state_update` events to keep all connected clients synchronized with the canonical game state.
*   **Room Logic:** Basic room management allows players to join specific game instances.

### User Interface (Frontend)
*   **Game Board Layout:** The main game interface is structured with dedicated zones:
    *   Player and Opponent Information (life, hand size, etc.)
    *   Player and Opponent Battlefield (for creatures, resources, etc.)
    *   Player and Opponent Hand, Deck, and Discard Pile zones.
    *   Stack Zone (to visualize spells/abilities awaiting resolution).
    *   Phase Display and Action Controls.
*   **Card Rendering:** A reusable `Card` component displays essential card information (name, mana cost, type, power/toughness) and visual states (e.g., tapped).
*   **State Management (Redux):** The frontend uses Redux to manage the local copy of the game state and UI state.
*   **Deckbuilder UI:** Planned and partially implemented UI for players to create, view, and manage their decks.

### Development & Project Management
*   **Devplan System:** The project utilizes an extensive system of Markdown-based "devplan" files. These documents serve as the single source of truth for feature specifications, task breakdowns, progress tracking, design decisions, and technical documentation.
*   **Code Refactoring:** Ongoing efforts to maintain a clean and modular codebase, such as the refactoring of the main `GameEngine` into specialized manager classes (`TurnManager`, `CombatManager`, `ActionManager`, `ResourceManager`, `GameInitializer`, `StateManager`).

## Project Status

This project is under active development. Many core features for gameplay, data management, and networking have been implemented. Ongoing work includes refining existing features, extensive testing, UI enhancements, and implementing further card abilities and game mechanics. Please refer to the `/DEVPLAN` directory for detailed progress on specific features and tasks.

## Getting Started

To get the project running locally, follow these steps:

1.  **Prerequisites:**
    *   Node.js (latest LTS version recommended)
    *   npm or yarn
2.  **Clone the Repository:**
    ```bash
    git clone https://github.com/mojomast/tcg2
    cd <project-directory>
    ```
3.  **Install Dependencies:**
    *   **Backend:** Navigate to the backend directory (if separate) and run:
        ```bash
        npm install
        # or
        yarn install
        ```
    *   **Frontend:** Navigate to the frontend directory (if separate) and run:
        ```bash
        npm install
        # or
        yarn install
        ```
4.  **Database Setup (Backend):**
    *   Initialize the SQLite database and run migrations:
        ```bash
        npx knex migrate:latest --knexfile ./src/db/knexfile.ts
        ```
    *   Populate the `cards` table with initial data (a script is often provided):
        ```bash
        npm run populate-cards # (Or the equivalent script in your project)
        ```
5.  **Running the Application:**
    *   To run both the backend and frontend concurrently:
        ```bash
        npm run dev:fullstack
        ```
    The application should then be accessible in your browser, typically at `http://localhost:5173` (for Vite) or another specified port.

## Development Process

Development follows a structured approach guided by the devplan system. All new features, changes, and bug fixes are typically documented within these plans. Contributions should align with the established architecture and coding standards.

## Acknowledgements

Card data and inspiration for some mechanics are sourced from the [Magic: The Gathering API](https://magicthegathering.io/) (MTGJSON). We are grateful for this excellent resource.

## Future Plans

While the current focus is on solidifying the core TCG experience, potential future enhancements include:
*   Expanded set of cards and keywords.
*   Advanced UI/UX features and animations.
*   AI opponent for single-player mode.
*   Tournament and draft modes.
*   More sophisticated deckbuilding tools and analytics.

---

This README provides a snapshot of the project. For the most detailed and up-to-date information, please consult the documents within the `/DEVPLAN` directory.
