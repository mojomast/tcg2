import { Card, Keyword as CardKeyword } from './card.js'; // Restore Card import
export type Keyword = CardKeyword; // Use the Keyword type from card.ts

export type ManaColor = 'W' | 'U' | 'B' | 'R' | 'G' | 'C'; // White, Blue, Black, Red, Green, Colorless
export type ManaPool = { [key in ManaColor | 'colorless']?: number }; // Restore ManaPool definition

export type GamePhase = 'BEGIN' | 'MAIN' | 'COMBAT' | 'END';
export type GameStep = 
  | 'UNTAP' 
  | 'UPKEEP' 
  | 'DRAW' 
  | 'MAIN_PRE' // First Main Phase
  | 'COMBAT_BEGIN' 
  | 'DECLARE_ATTACKERS' 
  | 'DECLARE_BLOCKERS' 
  | 'FIRST_STRIKE_DAMAGE' 
  | 'COMBAT_DAMAGE' 
  | 'COMBAT_END'
  | 'MAIN_POST' // Second Main Phase
  | 'END_STEP' 
  | 'CLEANUP';

export type PlayerId = string; // Assuming string IDs for players
export type GameObjectId = string; // Unique ID for any card instance in the game

/**
 * Represents a card instance currently in the game, potentially on the battlefield,
 * including its current state.
 */
export interface BattlefieldCard extends Card { // Ensure Card is available for extension
  instanceId: GameObjectId; // The unique ID for this specific instance
  cardId: string; // ID linking to the base Card definition (e.g., 'MOUNTAIN_BASIC')
  currentZone: Zone; // Track the current zone of this instance
  ownerId: PlayerId; // The player who owns the card
  controllerId: PlayerId; // The player currently controlling the card (usually owner)
  tapped: boolean;
  summoningSickness: boolean; // Typically true for creatures the turn they enter
  damageMarked: number; // Damage marked on creatures
  counters: { [type: string]: number }; // Any counters on the permanent
  attachments: GameObjectId[]; // IDs of attached Auras/Equipment
  // etc.
}

// Represents an item on the stack (Spell or Ability)
export interface StackItem {
  stackId: string; // Unique ID for this stack item
  type: 'Spell' | 'Ability'; // Type of item on the stack
  sourceCardId: string; // The base definition ID of the source card
  sourceInstanceId: GameObjectId; // The instance ID of the card (in hand/battlefield) that generated this item
  controllerId: PlayerId; // Player who controls this item
  targets?: (GameObjectId | PlayerId)[]; // Optional targets for the spell/ability
  // Include cost paid if relevant?
}

export type Zone = 'hand' | 'library' | 'graveyard' | 'battlefield' | 'exile' | 'stack'; // Add more if needed

// Represents the state of a single player
export interface PlayerState {
  playerId: PlayerId;
  life: number;
  energy: number;
  poisonCounters: number;
  manaPool: ManaPool; // Ensure ManaPool is available
  landPlayedThisTurn: boolean; // Added to track land plays
  hand: GameObjectId[]; // IDs of card instances in hand
  library: GameObjectId[]; // IDs of card instances in library
  deck_count: number; // Number of cards remaining in the library
  graveyard: GameObjectId[]; // IDs of card instances in graveyard
  exile: GameObjectId[]; // IDs of card instances in exile
  battlefield: {
    creatures: BattlefieldCard[];
    resources: BattlefieldCard[];
    enchantments: BattlefieldCard[];
    artifacts: BattlefieldCard[];
    planeswalkers: BattlefieldCard[]; // Added for Planeswalkers
    other: BattlefieldCard[]; // Added for other permanent types
    // Potentially add others like Planeswalkers if needed
  };
  hasPlayedResourceThisTurn: boolean;
  maxHandSize: number;
  hasLost: boolean; // Flag indicating if the player has lost the game
}

// Represents the overall game state
export interface GameState {
  gameId: string;
  turnNumber: number;
  activePlayerId: PlayerId;
  priorityPlayerId: PlayerId | null; // The player who has priority to act, or null during transitions
  consecutivePriorityPasses: number; // Tracks consecutive passes to advance steps/phases
  startingPlayerId: PlayerId | null; // Player who took the first turn
  currentPhase: GamePhase;
  currentStep: GameStep;
  players: [PlayerState, PlayerState]; // Assuming two players
  stack: StackItem[]; // The game stack
  gameObjects: { [id: GameObjectId]: BattlefieldCard }; // All card instances in the game
  attackers: { [attackerId: GameObjectId]: PlayerId }; // Map attacker ID to target Player ID
  blockers: { [blockerId: GameObjectId]: GameObjectId }; // Map blocker ID to attacker ID it's blocking
  gameLog: string[]; // Simple log for now
  winner?: PlayerId; // Set when a player wins the game
  // Optional fields for tracking effects during resolution
  pendingDamage?: { [objectId: GameObjectId]: { damage: number; sourceId: GameObjectId; isCombat: boolean; deathtouch?: boolean } };
  pendingLifeGain?: { [playerId: PlayerId]: number };
  losers?: PlayerId[]; // Players who have lost during state-based action checks
}

// Card Types (align with Card interface in card.ts if possible, but GameEngine expects it here)
export type CardType = 
  | 'Creature'
  | 'Instant'
  | 'Sorcery'
  | 'Enchantment'
  | 'Artifact'
  | 'Planeswalker'
  | 'Land'
  | 'Resource'; // Assuming Resource is a type like Land

// Action Types for Player Actions
export enum ActionType {
  PLAY_CARD = 'PLAY_CARD',
  ACTIVATE_ABILITY = 'ACTIVATE_ABILITY',
  PASS_PRIORITY = 'PASS_PRIORITY',
  DECLARE_ATTACKER = 'DECLARE_ATTACKER',
  DECLARE_BLOCKER = 'DECLARE_BLOCKER',
  // Add more game actions
}

// Interface for Player Actions
export interface PlayerAction {
  type: ActionType;
  playerId: PlayerId;
  payload?: any; // Specific data for the action, e.g., cardId, targets
}

// Basic Event Types
export enum EventType {
  ZONE_CHANGE = 'ZONE_CHANGE',
  ACTION_INVALID = 'ACTION_INVALID',
  SPELL_CAST = 'SPELL_CAST', // Added for when a spell is successfully put on the stack
  CARD_PLAYED = 'CARD_PLAYED', // Event for when a card is played (could be a spell or resource)
  ABILITY_ACTIVATED = 'ABILITY_ACTIVATED', // Added for when an ability is successfully put on the stack
  STACK_ITEM_RESOLVED = 'STACK_ITEM_RESOLVED', // Added for when a stack item resolves
  RESOURCE_PLAYED = 'RESOURCE_PLAYED', // Added for when a resource is played directly to battlefield
  PLAYER_ATTEMPTED_DRAW_FROM_EMPTY_LIBRARY = 'PLAYER_ATTEMPTED_DRAW_FROM_EMPTY_LIBRARY',
  CARD_DRAWN = 'CARD_DRAWN',
  GAME_OVER = 'GAME_OVER',
  PRIORITY_CHANGED = 'PRIORITY_CHANGED',
  TURN_PHASE_CHANGED = 'TURN_PHASE_CHANGED',
  STEP_CHANGED = 'STEP_CHANGED',
  MANA_POOL_UPDATED = 'MANA_POOL_UPDATED',
  LIFE_TOTAL_CHANGED = 'LIFE_TOTAL_CHANGED',
  ERROR = 'ERROR', // For general errors
  GAME_READY = 'GAME_READY', // When the game engine is fully initialized
  GAME_STATE_UPDATE = 'game_state_update', // When the overall game state is updated
  CARD_DISCARDED = 'CARD_DISCARDED', // When a card is discarded
  TURN_PASSED = 'TURN_PASSED', // When a player passes their turn
  // Add more event types as needed (e.g., PLAYER_PRIORITY_CHANGED, TURN_CHANGED, COMBAT_DECLARED)
}

// Interface for Game Events
export interface GameEvent {
  type: EventType;
  payload: any; // Specific data for the event
  timestamp?: number;
}
