import { ManaColor as GameStateManaColor } from './gameState';

export type CardType =
    | 'Creature'
    | 'Artifact'
    | 'Enchantment'
    | 'Planeswalker'
    | 'Land'
    | 'Instant'
    | 'Sorcery'
    | 'Resource'; // Keep Resource for now, maybe review later

export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Mythic' | 'Legendary';
export type SpellSpeed = 'Instant' | 'Sorcery';
export type Keyword =
    | 'Flying'
    | 'Lifelink'
    | 'Deathtouch'
    | 'Trample'
    | 'Haste'
    | 'Indestructible'
    | 'Protection' // Note: Need to specify what it's protected from (e.g., color, type)
    | 'Menace'
    | 'First Strike'
    | 'Double Strike'
    | 'Flash'
    | 'Reach' // Added Reach
    | 'Cannot Block'
    | 'Vigilance'
    | 'Stealth'; // Added Stealth keyword

// Represents the cost of a card (e.g., { R: 1, colorless: 2 } for 1RR)
export interface ManaCost {
  R?: number;
  U?: number;
  G?: number;
  B?: number;
  W?: number;
  C?: number; // Use 'C' for consistency with GameStateManaColor type from gameState
}

// Base Card Interface
export interface Card {
  id: string; // Unique identifier for the card definition
  name: string;
  cost: ManaCost;
  type: CardType;
  subtype?: string; // e.g., "Human Warrior", "Aura"
  rarity: Rarity;
  rulesText: string;
  flavorText?: string;
  setId: string; // FK to the Set table
  collectorNumber: string;
  imageUrl?: string;
  isTapped?: boolean; // Added for cards in play

  // Type-specific properties (optional)
  attack?: number; // For Creatures (renamed from power)
  health?: number; // For Creatures (renamed from toughness)
  keywords?: Keyword[]; // For Creatures primarily, but could apply elsewhere (Flash)
  spellSpeed?: SpellSpeed; // For Spells
  producesMana?: ManaCost; // Optional: Mana produced by the card (e.g., when tapped)
  abilities?: Ability[]; // Optional: Card abilities
  // Add more specific fields for Enchantments, Resources as needed
  text?: string; // Rules text
  colorIdentity?: string[]; // Represents the card's color identity, e.g., ['W', 'U']
}

export interface Ability {
  type: 'Activated' | 'Triggered' | 'Static';
  cost?: ManaCost;
  effectDescription: string;
}
