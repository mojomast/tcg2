# DEVPLAN_DETOUR_04_UI: Enhanced User Interface and Deckbuilding

## 1. Overall UI Enhancements & Navigation

*   **Objective:** Transition from the basic player selection prompt to a more comprehensive and user-friendly interface.
*   **Tasks:**
    *   **1.1. Main Menu/Dashboard:**
        *   Design and implement a main landing page or dashboard.
        *   Options to navigate to:
            *   Play Game (potentially with player/deck selection here)
            *   Deckbuilder
            *   Settings (future)
        *   **Status (2025-05-28):**
            *   `MainMenu.tsx` component created with navigation buttons.
            *   `App.tsx` created to manage views (MainMenu, GameBoard, DeckbuilderPlaceholder, SettingsPlaceholder) and WebSocket connections.
            *   `index.tsx` updated to render `App.tsx`.
            *   Basic navigation between these views is implemented.
            *   The initial player prompt is effectively replaced by the MainMenu.
    *   **1.2. Remove Initial Player Prompt:** The current "Select Player 1 or Player 2" should be integrated into a "Play Game" flow, perhaps after deck selection.

## 2. Deckbuilding Module

*   **Objective:** Create a dedicated, feature-rich interface for creating, managing, and generating decks.
*   **Tasks:**
    *   **2.1. Deck Management Core:**
        *   **Load Deck:** UI to browse and load previously saved decks (from the database).
        *   **Save Deck:** UI to save the currently constructed deck (to the database).
            *   Allow naming/renaming decks.
        *   **Edit Deck:**
            *   Manually add cards from the database to the current deck.
            *   Remove cards from the current deck.
            *   Adjust card quantities.
    *   **2.2. Automatic Deck Generation:**
        *   Integrate the backend deck generation service.
        *   **UI for Generation Parameters:**
            *   Allow users to select desired deck colors (e.g., checkboxes for W, U, B, R, G).
            *   (Optional) Sliders or inputs for ratios (land, creature, spell) if desired for advanced users, otherwise use sensible defaults.
        *   Button to trigger deck generation.
        *   Display the generated deck in the editor for further modification or saving.
    *   **2.3. Card Database Interaction:**
        *   **Card Search:**
            *   Input field for searching cards by name (and potentially rules text).
        *   **Filtering:**
            *   Filters for card types (Creature, Instant, Sorcery, Land, etc.).
            *   Filters for colors.
            *   Filters for Mana Cost (CMC).
            *   (Optional) Filters for set, rarity.
        *   **Card Display Area:** A scrollable list/grid to display search/filter results.
    *   **2.4. Deck Information Display:**
        *   **Card Type Counts:** Dynamically update and display counts of:
            *   Total cards in deck.
            *   Number of Creatures.
            *   Number of Spells (Instants, Sorceries, etc.).
            *   Number of Lands.
        *   **Mana Curve Display:** (Optional) A visual representation of the deck's mana curve.
        *   **Color Breakdown:** (Optional) Visual indication of the deck's color composition.

## 3. Consistent Card Representation (Deckbuilder & Game)

*   **Objective:** Ensure cards are visually represented in a consistent and intuitive manner across all parts of the application.
*   **Tasks:**
    *   **3.1. Mana Symbols with Emojis:**
        *   Define a mapping for mana symbols (W, U, B, R, G, C, X, Phyrexian, etc.) to appropriate emojis.
        *   Update card rendering components to display these emojis for:
            *   Mana costs.
            *   Mana produced (for lands/mana abilities).
            *   Activated ability costs in rules text.
    *   **3.2. Card Background by Color Identity:**
        *   Modify card components to dynamically set their background color based on the card's color(s) or color identity.
            *   Consider how to represent colorless cards.
            *   Consider how to represent multi-color cards (e.g., gradients, split backgrounds).
    *   **3.3. Unified Card Component:**
        *   Refactor or create a single, reusable card component (e.g., React component) that encapsulates the standard visual representation.
        *   This component will be used in:
            *   Deckbuilder (card search results, deck list).
            *   Main game interface (hand, battlefield, graveyard, exile).

## 4. Technology Considerations (Frontend)

*   Review current frontend stack (e.g., React, Redux, CSS solution).
*   Plan for state management for the deckbuilder (current deck, search filters, etc.).
*   Consider UI libraries or component frameworks if not already in use to speed up development.

## 5. API Endpoints (Backend Support)

*   While this plan focuses on UI, ensure backend provides necessary API endpoints for:
    *   Saving/loading decks.
    *   Searching/filtering cards from the database.
    *   Triggering automatic deck generation with parameters.
    *   (Many of these should already exist or be in progress from `DEV_DECKBUILDING.MD`).
