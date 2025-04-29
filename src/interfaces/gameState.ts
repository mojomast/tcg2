import { Card, ManaColor } from './card';

export type GamePhase = 'BEGIN' | 'MAIN' | 'COMBAT' | 'END';
export type GameStep = 
  | 'UNTAP' 
  | 'UPKEEP' 
  | 'DRAW' 
  | 'MAIN_PRE' // First Main Phase
  | 'COMBAT_BEGIN' 
  | 'DECLARE_ATTACKERS' 
  | 'DECLARE_BLOCKERS' 
  | 'COMBAT_DAMAGE_FIRST' // First Strike Damage
  | 'COMBAT_DAMAGE_NORMAL' // Normal Damage
  | 'COMBAT_END'
  | 'MAIN_POST' // Second Main Phase
  | 'END_STEP' 
  | 'CLEANUP';

export type PlayerId = string; // Assuming string IDs for players
export type GameObjectId = string; // Unique ID for an instance of a card in play/hand/etc.

// Represents a counter on a card (e.g., +1/+1, loyalty, energy)
export interface Counter {
  type: string; // e.g., '+1/+1', 'energy', 'poison'
  amount: number;
}

// Represents a card instance on the battlefield
export interface BattlefieldCard {
  objectId: GameObjectId; // Unique ID for this instance on the battlefield
  cardId: string; // Reference to the base Card definition
  controllerId: PlayerId;
  ownerId: PlayerId;
  isTapped: boolean;
  summoningSickness: boolean;
  counters: Counter[];
  attachments: GameObjectId[]; // IDs of attached Auras/Equipment
  damageMarked: number; // Damage marked on this creature during the current combat damage step
  // Add more state as needed 
}

// Represents an item on the stack (Spell or Ability)
export interface StackItem {
  stackId: string; // Unique ID for this item on the stack
  type: 'Spell' | 'Ability';
  sourceObjectId?: GameObjectId; // Which object on battlefield generated the ability (if ability)
  cardId: string; // The card definition being cast or whose ability is used
  controllerId: PlayerId;
  targets: (GameObjectId | PlayerId)[]; // IDs of targeted objects or players
  // Include cost paid if relevant?
}

// Represents the state of a single player
export interface PlayerState {
  playerId: PlayerId;
  life: number;
  energy: number;
  poisonCounters: number;
  manaPool: { [key in ManaColor | 'colorless']?: number };
  hand: GameObjectId[]; // IDs of card instances in hand
  library: GameObjectId[]; // IDs of card instances in library
  graveyard: GameObjectId[]; // IDs of card instances in graveyard
  exile: GameObjectId[]; // IDs of card instances in exile
  battlefield: {
    creatures: BattlefieldCard[];
    resources: BattlefieldCard[];
    enchantments: BattlefieldCard[];
    // Potentially add others like Planeswalkers, Artifacts if needed
  };
  hasPlayedResourceThisTurn: boolean;
  maxHandSize: number;
}

// Represents the overall game state
export interface GameState {
  gameId: string;
  turnNumber: number;
  activePlayerId: PlayerId;
  priorityPlayerId: PlayerId;
  currentPhase: GamePhase;
  currentStep: GameStep;
  players: [PlayerState, PlayerState]; // Assuming two players
  stack: StackItem[];
  gameObjects: { [id: GameObjectId]: Card & { ownerId: PlayerId } }; // Map instance IDs to card data + owner
  attackers: { [attackerId: GameObjectId]: PlayerId }; // Map attacker ID to target Player ID
  blockers: { [blockerId: GameObjectId]: GameObjectId }; // Map blocker ID to attacker ID it's blocking
  gameLog: string[]; // Simple log for now
  winner?: PlayerId; // Set when a player wins the game
}

// Represents the state of a single player
export interface PlayerState {
  playerId: PlayerId;
  life: number;
  energy: number;
  poisonCounters: number;
  manaPool: { [key in ManaColor | 'colorless']?: number };
  hand: GameObjectId[]; // IDs of card instances in hand
  library: GameObjectId[]; // IDs of card instances in library
  graveyard: GameObjectId[]; // IDs of card instances in graveyard
  exile: GameObjectId[]; // IDs of card instances in exile
  battlefield: {
    creatures: BattlefieldCard[];
    resources: BattlefieldCard[];
    enchantments: BattlefieldCard[];
    // Potentially add others like Planeswalkers, Artifacts if needed
  };
  hasPlayedResourceThisTurn: boolean;
  maxHandSize: number;
}
