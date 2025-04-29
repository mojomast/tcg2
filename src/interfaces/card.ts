export type ManaColor = 'R' | 'U' | 'G' | 'B' | 'W';
export type CardType = 'Creature' | 'Spell' | 'Enchantment' | 'Resource';
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
    | 'Reach'
    | 'Cannot Block'
    | 'Vigilance';

// Represents the cost of a card (e.g., { R: 1, colorless: 2 } for 1RR)
export interface ManaCost {
  R?: number;
  U?: number;
  G?: number;
  B?: number;
  W?: number;
  colorless?: number;
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

  // Type-specific properties (optional)
  power?: number; // For Creatures
  toughness?: number; // For Creatures
  keywords?: Keyword[]; // For Creatures primarily, but could apply elsewhere (Flash)
  spellSpeed?: SpellSpeed; // For Spells
  // Add more specific fields for Enchantments, Resources as needed
  text?: string; // Rules text
}
