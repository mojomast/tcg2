// src/types/gameState.ts

// Represents a single card in hand or on battlefield
export interface Card {
  id: string;
  name: string;
  type: string;
  cost: number;
  // Future properties: description, attack, health, abilities, etc.
}

// Represents the state of a single player
export interface PlayerState {
  id: string;
  life: number;
  energy: number;
  hand: Card[];
  battlefield: Card[]; // Assuming cards on battlefield also use the Card interface for now
  deckCount: number;
  handCount?: number; // Add optional handCount
  // Potentially graveyard, exile, etc.
}

// Represents an item on the game stack (e.g., a spell or ability waiting to resolve)
export interface StackItem {
  id: string; // Unique ID for this stack item
  type: 'spell' | 'ability'; // Type of item on the stack
  sourceCardId: string; // ID of the card that created this item (e.g., the spell card played)
  controllerId: string; // ID of the player who controls this spell/ability
  effectDetails?: any; // Specifics of the effect (can be structured later)
  targets?: string[]; // Array of IDs for any targets
}

// Represents the overall state of the game
export interface GameState {
  gameId: string;
  turnNumber: number;
  activePlayerId: string | null; // ID of the player whose turn it is
  priorityHolderId: string | null; // ID of the player who currently has priority to act
  currentPhase: string | null; // e.g., 'Upkeep', 'Main1', 'Combat', 'Main2', 'End'
  player1_state: PlayerState;
  player2_state: PlayerState;
  stack: StackItem[]; // The game stack, LIFO
  // Potentially game log, etc.
}
