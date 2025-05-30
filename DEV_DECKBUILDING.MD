Deck Generation Algorithm
1. Define Deck Parameters
typescript
interface DeckConfig {
  colors: string[];       // e.g., ['R', 'G'] for Red-Green
  totalCards: number;     // Typically 60 (main deck)
  landRatio: number;      // Default 0.4 (24/60)
  creatureRatio: number;  // Default 0.35 (21/60)
  spellRatio: number;     // Default 0.25 (15/60)
  curve: number[];        // Mana curve distribution [1,2,3,4,5+]
}
2. Fetch Eligible Cards
Use SQL queries to filter cards by:

Color identity (via color_identity column)

Format legality (if stored in cards table)

Card type (creature, spell, land)

Example Query:

sql
-- Get non-land cards in selected colors
SELECT * FROM cards 
WHERE card_type != 'Land'
AND json_array_length(color_identity) > 0
AND EXISTS (
  SELECT 1 FROM json_each(color_identity) 
  WHERE value IN ('R','G') -- Dynamic colors
);
3. Card Selection Workflow
Diagram
Code
graph TD
  A[Start] --> B[Get Creatures]
  B --> C[Get Spells]
  C --> D[Get Lands]
  D --> E[Balance Mana]
  E --> F[Output Deck]
Steps:

Select Creatures (20-25 cards):

Prioritize low-cost (1-3 CMC) for aggro decks.

Include 2-4 high-impact creatures (4+ CMC).

Enforce 4-copy maximum per card.

Select Spells (10-15 cards):

Split between instants/sorceries (60%) and other non-creatures (40%).

Include removal/card draw (e.g., 4x "Lightning Bolt" in Red).

Select Lands (24 cards):

Basic Lands: Allocate based on mana requirements.

python
# Example: Red/Green deck with 60% red symbols
mountains = total_lands * (red_symbols / total_symbols)
forests = total_lands * (green_symbols / total_symbols)
Non-Basic Lands: Add 4-8 dual/fetch lands (e.g., "Stomping Ground").

Mana Balancing System
1. Calculate Mana Requirements
Parse mana_cost from non-land cards:

typescript
// Sum all colored mana symbols in the deck
const colorWeights = { 'R': 0, 'G': 0 };
nonLandCards.forEach(card => {
  const cost = JSON.parse(card.mana_cost);
  Object.keys(cost).forEach(color => {
    if (color !== 'C') colorWeights[color] += cost[color];
  });
});
2. Distribute Lands
Land Type	Calculation	Example (R/G Deck)
Basic Mountains	(redWeight / totalWeight) * 0.7 * totalLands	10 Mountains
Basic Forests	(greenWeight / totalWeight) * 0.7 * totalLands	8 Forests
Non-Basic Lands	30% of land slots	6 Dual Lands
Synergy & Viability Rules
Mana Curve Rules:

javascript
// Target distribution for non-land cards
const curveRules = {
  1: { min: 4, max: 8 }, // Low-cost
  2: { min: 5, max: 10 },
  3: { min: 4, max: 8 },
  4: { min: 3, max: 6 },
  5: { min: 1, max: 4 }  // High-impact
};
Synergy Scoring:

Keyword Matching: Boost cards sharing keywords (e.g., "Vampire" tribe).

Combo Detection:

sql
-- Find cards that reference others in rules_text
SELECT * FROM cards 
WHERE rules_text LIKE '%draw a card%'
  AND rules_text LIKE '%discard%';
Deck Viability Checks:

Minimum 22 playable cards by turn 3.

At least 6 card draw/selection spells.

4-8 removal spells.

**Prerequisite: Comprehensive Card Database**

For the deck generation logic to function optimally, especially for fetching appropriate lands (including basic lands like "Forest", "Mountain", etc.) and a wide variety of other cards, the `cards` table in the database must be comprehensively populated. This is achieved by running the `scripts/populate-cards.ts` script, which fetches card data from an external API (e.g., Magic: The Gathering API).

Ensure this script has been run successfully to populate the database with a full set of English cards before expecting accurate deck generation results.

Database Integration
Populate Deck Tables
Insert into decks:

sql
INSERT INTO decks (id, player_id, name, format) 
VALUES ('d1', 'p1', 'Red-Green Aggro', 'Standard');
Insert into deck_cards:

sql
-- Mainboard (quantity=4, is_sideboard=0)
INSERT INTO deck_cards (deck_id, card_id, quantity, is_sideboard)
VALUES 
  ('d1', 'M21-134', 4, 0), -- 4x Shock
  ('d1', 'M21-245', 3, 0); -- 3x Cultivate
Update Script for New Sets
Run populate-cards.ts periodically:

bash
node scripts/populate-cards.ts --set=MOM # March of the Machine
Example Output Deck
Red-Green Aggro (Standard)

Card Type	Count	Examples
Creatures	22	4x "Llanowar Elves", 4x "Bonecrusher Giant"
Spells	14	4x "Lightning Bolt", 3x "Collected Company"
Lands	24	10x Mountain, 8x Forest, 6x "Stomping Ground"
Mana Curve:

json
{ "1": 8, "2": 10, "3": 7, "4": 3, "5+": 2 }
## Backend Development Status & Milestones

As of May 28, 2025, the core backend functionality for deck generation and database management has been significantly advanced:

*   **Comprehensive Card Database:** The `cards` table in `tcg.db` has been successfully populated with a full set of English MTG cards (approx. 93,000+ entries) using `scripts/populate-cards.ts`.
*   **Enhanced Deck Generation Logic:**
    *   The `deckGenerationService.ts` now correctly fetches and utilizes cards from the fully populated database.
    *   The logic for including basic lands (e.g., "Forest", "Mountain") based on deck color identity and mana requirements has been implemented and verified.
*   **Test Environment Setup:**
    *   A dedicated database initialization function, `initializeTestEnvironment` (in `src/db/database.ts`), has been created.
    *   This function ensures the `cards` table remains intact during test runs, allowing for consistent testing against the full card catalog.
    *   It also manages test-specific data by (optionally, as per recent changes) preserving or clearing previously generated decks in the `decks` and `deck_cards` tables.
*   **Successful End-to-End Testing:** The `scripts/test-deck-generation.ts` script has been used to confirm that the deck generation process works as expected with the complete dataset, producing valid, color-balanced decks.
*   **Database Backup:** A backup of the populated card database has been created.

These milestones ensure a robust backend foundation for the deckbuilding features planned for the UI.

Key Improvements
Dynamic Ratios:

Adjust land/spell ratios based on average CMC.

Sideboard Generator:

Include 15 sideboard cards countering meta threats.

API Caching:

Store frequently used card data in-memory for faster queries.

This approach ensures decks are playable, color-balanced, and synergized. Use the provided code snippets to integrate with your Node.js/SQLite backend.