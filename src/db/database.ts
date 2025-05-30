import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import cardService from '../services/cardService.js'; // Adjusted import path
import deckService from '../services/deckService.js'; // Adjusted import path
import { Card, CardType, Rarity } from '../interfaces/card.js'; // Adjusted import path
import { TEST_PLAYER_1_ID, TEST_PLAYER_2_ID } from '../config/constants.js';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'tcg.db');

// Ensure the database directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initialize and export the database connection
// The verbose option logs executed statements to the console, useful for debugging.
export const db = new Database(DB_PATH, { verbose: console.log });

export interface DeckBasicInfo {
  id: string;
  name: string;
  player_id: string; 
  format?: string;
  description?: string;
  created_at: string; 
  updated_at: string; 
}

const cardTableSchema = `
CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY NOT NULL,      -- Unique identifier for the card definition
  name TEXT NOT NULL,                -- Card name
  mana_cost TEXT,                    -- JSON string representing ManaCost (e.g., {"R":1,"C":2})
  color_identity TEXT,               -- JSON array of color codes (e.g., ["W", "U"])
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
`;

const deckTableSchema = `
CREATE TABLE IF NOT EXISTS decks (
  id TEXT PRIMARY KEY NOT NULL,      -- Unique identifier for the deck
  player_id TEXT NOT NULL,           -- Identifier for the player who owns the deck
  name TEXT NOT NULL,                -- Name of the deck
  format TEXT,                       -- Game format (e.g., "Standard", "Commander")
  description TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`;

const deckCardsTableSchema = `
CREATE TABLE IF NOT EXISTS deck_cards (
  deck_id TEXT NOT NULL,
  card_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  is_sideboard INTEGER NOT NULL DEFAULT 0, -- Boolean (0 for false, 1 for true)
  PRIMARY KEY (deck_id, card_id, is_sideboard),
  FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE,
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);
`;

/**
 * Initializes the database schema by creating tables if they don't exist.
 */
export async function initializeDatabase(): Promise<void> {
  console.log('Initializing database schema...');
  db.exec(cardTableSchema);
  db.exec(deckTableSchema);
  db.exec(deckCardsTableSchema);
  console.log('Database schema initialized (or already exists).');

  // Enable foreign key support if not enabled by default (good practice for SQLite)
  db.pragma('foreign_keys = ON');

  // await seedInitialData();
}

async function seedInitialData(): Promise<void> {
  console.log('[DB Seeding] Starting initial data seeding...');

  const placeholderCards: Card[] = [
    {
      id: 'placeholder_card_001',
      name: 'Goblin Raider',
      cost: { R: 1 },
      type: 'Creature',
      subtype: 'Goblin Warrior',
      rarity: 'Common',
      rulesText: 'A basic goblin warrior.',
      attack: 1,
      health: 1,
      setId: 'PLC',
      collectorNumber: '001',
    },
    {
      id: 'placeholder_card_002',
      name: 'Forest Bear',
      cost: { G: 1, C: 1 },
      type: 'Creature',
      subtype: 'Bear',
      rarity: 'Common',
      rulesText: 'A sturdy bear from the deep woods.',
      attack: 2,
      health: 2,
      setId: 'PLC',
      collectorNumber: '002',
    },
    {
      id: 'placeholder_card_003',
      name: 'Healing Salve',
      cost: { W: 1 },
      type: 'Instant',
      rarity: 'Common',
      rulesText: 'Target creature or player gains 3 life.',
      setId: 'PLC',
      collectorNumber: '003',
    },
    {
      id: 'placeholder_card_004',
      name: 'Shock',
      cost: { R: 1 },
      type: 'Instant',
      rarity: 'Common',
      rulesText: 'Shock deals 2 damage to any target.',
      setId: 'PLC',
      collectorNumber: '004',
    }
  ];

  console.log('[DB Seeding] Seeding cards...');
  placeholderCards.forEach(card => {
    try {
      cardService.createCard(card);
    } catch (error) {
      console.error(`[DB Seeding] Error seeding card ${card.id}:`, error);
    }
  });
  console.log('[DB Seeding] Cards seeded.');

  const defaultDeckP1Cards = [
    { cardId: 'placeholder_card_001', quantity: 4 },
    { cardId: 'placeholder_card_004', quantity: 4 },
  ];

  const defaultDeckP2Cards = [
    { cardId: 'placeholder_card_002', quantity: 4 },
    { cardId: 'placeholder_card_003', quantity: 4 },
  ];

  console.log('[DB Seeding] Seeding default decks...');
  try {
    // Using .then().catch() for async operations if createDeck is async
    // If createDeck is synchronous, this structure is fine.
    // Assuming createDeck is async as per previous definition
    await deckService.createDeck('defaultDeckP1', TEST_PLAYER_1_ID, 'Player 1 Default Deck', defaultDeckP1Cards);
    console.log('[DB Seeding] defaultDeckP1 seeded.');
    await deckService.createDeck('defaultDeckP2', TEST_PLAYER_2_ID, 'Player 2 Default Deck', defaultDeckP2Cards);
    console.log('[DB Seeding] defaultDeckP2 seeded.');
  } catch (error) {
    // This catch block might not be effective for promises if not awaited.
    // The .catch() on each promise is more reliable here.
    console.error('[DB Seeding] Error during deck seeding process:', error);
  }
  console.log('[DB Seeding] Default deck seeding process initiated.');
}

export function getAllDecks(): DeckBasicInfo[] {
  console.log('[DB] Fetching all decks...');
  try {
    const stmt = db.prepare('SELECT id, name, player_id, format, description, created_at, updated_at FROM decks ORDER BY updated_at DESC');
    // Type assertion is used here; ensure the query returns columns matching DeckBasicInfo
    const decks = stmt.all() as DeckBasicInfo[];
    console.log(`[DB] Found ${decks.length} decks.`);
    return decks;
  } catch (error) {
    console.error('[DB] Error fetching all decks:', error);
    throw error; // Re-throw to allow API endpoint to handle HTTP response
  }
}

/**
 * Initializes the database for a test environment.
 * Ensures table schemas are created and clears out test-specific data (decks and deck_cards),
 * but leaves the 'cards' table intact to allow testing against a pre-populated card catalog.
 */
export async function initializeTestEnvironment(): Promise<void> {
  console.log('Initializing database for test environment...');
  db.exec(cardTableSchema);
  db.exec(deckTableSchema);
  db.exec(deckCardsTableSchema);
  console.log('Database schema initialized (or already exists).');

  // Enable foreign key support
  db.pragma('foreign_keys = ON');

  // console.log('[Test Env] Clearing deck and deck_cards tables was previously done here.');
  // console.log('[Test Env] Decks and deck_cards will now be preserved across test runs.');
  // DO NOT seed initial card data here, to preserve the existing card catalog for tests.
}

// Initialization will be called from server.ts

// Optional: A function to close the database connection if needed elsewhere.
export function closeDatabase(): void {
  if (db && db.open) {
    db.close();
    console.log('Database connection closed.');
  }
}

// Graceful shutdown: close the database connection on SIGINT/SIGTERM.
// Temporarily disabled to prevent premature process exit during development
// process.on('SIGINT', () => {
//   closeDatabase();
//   process.exit(0);
// });
// process.on('SIGTERM', () => {
//   closeDatabase();
//   process.exit(0);
// });
