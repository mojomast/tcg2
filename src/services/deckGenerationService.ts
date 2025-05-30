// src/services/deckGenerationService.ts
import cardService, { CardQueryCriteria } from '../services/cardService.js';
import { Card } from '../interfaces/card.js';
import DeckService from './deckService.js';
import crypto from 'crypto';

/**
 * Configuration for generating a deck.
 */
export interface DeckConfig {
  colors: string[];       // e.g., ['R', 'G'] for Red-Green
  totalCards: number;     // Typically 60 for the main deck
  landRatio: number;      // e.g., 0.4 (24/60)
  creatureRatio: number;  // e.g., 0.35 (21/60)
  spellRatio: number;     // e.g., 0.25 (15/60)
  manaCurveTargets?: number[]; // Optional: Target mana curve distribution [1,2,3,4,5+]
  playerId?: string; // Optional: ID of the player for whom the deck is generated
  // TODO: Add other parameters as needed, e.g., format
}

/**
 * Represents a card in a generated deck.
 */
export interface DeckEntry {
  cardId: string; 
  quantity: number;
}

// Represents a selected card with its full data and quantity for internal processing
interface SelectedCardEntry {
  card: Card;
  quantity: number;
}

/**
 * Output structure for a generated deck.
 */
export interface GeneratedDeck {
  mainBoard: DeckEntry[];
  sideBoard?: DeckEntry[]; // Optional, based on future enhancements
  deckName: string;
  // TODO: Add other relevant deck properties, e.g., format
}

/**
 * Generates a deck based on the provided configuration.
 * This function will orchestrate the steps outlined in DEV_DECKBUILDING.MD:
 * 1. Fetch eligible cards from the database.
 * 2. Select creatures, spells, and lands based on ratios and rules.
 * 3. Balance mana requirements.
 * 4. Apply synergy and viability checks (optional initial implementation).
 * 5. Format the output and potentially save to the database.
 *
 * @param config The configuration for deck generation.
 * @returns A promise that resolves to the generated deck.
 */
/**
 * Fetches eligible cards from the database based on the deck configuration.
 * Initially focuses on fetching non-land cards matching the specified colors.
 */
async function fetchEligibleCards(config: DeckConfig): Promise<Card[]> {
  const criteria: CardQueryCriteria = {
    colors: config.colors,
    excludeCardTypes: ['Land'], // Fetch non-land cards first as per DEV_DECKBUILDING.MD
    // We might add more criteria here later, e.g., format legality if available
  };
  console.log('Fetching eligible non-land cards with criteria:', criteria);
  const cards = await cardService.getCardsByCriteria(criteria);
  console.log(`Fetched ${cards.length} eligible non-land cards.`);
  return cards;
}

/**
 * Selects creature cards from a list of eligible cards based on the deck configuration.
 */
function selectCreatures(eligibleCards: Card[], config: DeckConfig): SelectedCardEntry[] {
  const targetCreatureCount = Math.floor(config.totalCards * config.creatureRatio);
  const selectedCreatures: DeckEntry[] = [];
  let currentCreatureCount = 0;

  const creaturePool = eligibleCards.filter(card => card.type === 'Creature');
  console.log(`[selectCreatures] Target: ${targetCreatureCount} creatures. Pool size: ${creaturePool.length} unique creature cards.`);
  // Simple shuffle for variety - for a more robust solution, consider a library or better algorithm
  creaturePool.sort(() => 0.5 - Math.random());

  const finalSelectedCreatures: SelectedCardEntry[] = [];
  const cardCountMap: Map<string, number> = new Map(); // cardId -> quantity

  for (const card of creaturePool) {
    if (currentCreatureCount >= targetCreatureCount) break;

    const existingQuantity = cardCountMap.get(card.id) || 0;
    if (existingQuantity < 4) {
      cardCountMap.set(card.id, existingQuantity + 1);
      currentCreatureCount++;
    }
  }

  // Convert the map to DeckEntry array
  // Re-associate Card object with quantity
  const creatureMap = new Map(eligibleCards.map(c => [c.id, c]));
  cardCountMap.forEach((quantity, cardId) => {
    const card = creatureMap.get(cardId);
    if (card) {
      finalSelectedCreatures.push({ card, quantity });
    }
  });

  console.log(`[selectCreatures] Selected ${currentCreatureCount} total creature copies (target: ${targetCreatureCount}). Unique creatures selected: ${finalSelectedCreatures.length}.`);
  console.log('[selectCreatures] Detailed selection:', finalSelectedCreatures.map(e => `${e.quantity}x ${e.card.name}`));
  return finalSelectedCreatures;
}

/**
 * Selects spell cards (non-creature, non-land) from a list of eligible cards.
 */
function selectSpells(eligibleCards: Card[], config: DeckConfig): SelectedCardEntry[] {
  const targetSpellCount = Math.floor(config.totalCards * config.spellRatio);
  const selectedSpells: SelectedCardEntry[] = [];
  let currentSpellCount = 0;

  const spellPool = eligibleCards.filter(card => 
    card.type !== 'Creature' && card.type !== 'Land'
  );
  console.log(`[selectSpells] Target: ${targetSpellCount} spells. Pool size: ${spellPool.length} unique spell cards.`);
  spellPool.sort(() => 0.5 - Math.random()); // Shuffle for variety

  const cardCountMap: Map<string, number> = new Map(); // cardId -> quantity

  for (const card of spellPool) {
    if (currentSpellCount >= targetSpellCount) break;

    const existingQuantity = cardCountMap.get(card.id) || 0;
    if (existingQuantity < 4) { // Max 4 copies of a card
      cardCountMap.set(card.id, existingQuantity + 1);
      currentSpellCount++;
    }
  }

  // Re-associate Card object with quantity
  const spellMap = new Map(eligibleCards.map(s => [s.id, s]));
  cardCountMap.forEach((quantity, cardId) => {
    const card = spellMap.get(cardId);
    if (card) {
      selectedSpells.push({ card, quantity });
    }
  });

  console.log(`[selectSpells] Selected ${currentSpellCount} total spell copies (target: ${targetSpellCount}). Unique spells selected: ${selectedSpells.length}.`);
  console.log('[selectSpells] Detailed selection:', selectedSpells.map(e => `${e.quantity}x ${e.card.name}`));
  return selectedSpells;
}

/**
 * Fetches eligible land cards from the database based on the deck configuration.
 */
async function fetchEligibleLandCards(config: DeckConfig): Promise<Card[]> {
  const criteria: CardQueryCriteria = {
    colors: config.colors, // For dual lands etc. Basic lands are typically colorless but have color identity.
    cardTypes: ['Land', 'Basic Land'], // Include 'Basic Land' to fetch Mountains, Forests, etc.
  };
  console.log('Fetching eligible land cards with criteria:', criteria);
  const cards = await cardService.getCardsByCriteria(criteria);
  console.log(`Fetched ${cards.length} eligible land cards.`);
  return cards;
}

/**
 * Balances mana requirements by selecting appropriate lands.
 * @param nonLandCards - Array of selected non-land cards (creatures and spells).
 * @param availableLandCards - Pool of all land cards matching deck's color identity.
 * @param targetLandCount - The total number of lands the deck should have.
 * @param deckColors - The primary colors of the deck.
 * @returns An array of SelectedCardEntry for the chosen lands.
 */
function balanceMana(
  nonLandCards: SelectedCardEntry[],
  availableLandCards: Card[],
  targetLandCount: number,
  deckColors: string[]
): SelectedCardEntry[] {
  console.log(`[balanceMana] Target lands: ${targetLandCount}. Available unique land cards: ${availableLandCards.length}. Deck colors: ${deckColors.join(', ')}.`);
  console.log(`[balanceMana] Non-land card entries for mana calculation: ${nonLandCards.length}`);

  const manaSymbolCounts: { [color: string]: number } = { W: 0, U: 0, B: 0, R: 0, G: 0 };
  let totalColoredSymbols = 0;

  nonLandCards.forEach(entry => {
    const cost = entry.card.cost; // ManaCost object
    for (let i = 0; i < entry.quantity; i++) {
      if (cost.W) { manaSymbolCounts.W += cost.W; totalColoredSymbols += cost.W; }
      if (cost.U) { manaSymbolCounts.U += cost.U; totalColoredSymbols += cost.U; }
      if (cost.B) { manaSymbolCounts.B += cost.B; totalColoredSymbols += cost.B; }
      if (cost.R) { manaSymbolCounts.R += cost.R; totalColoredSymbols += cost.R; }
      if (cost.G) { manaSymbolCounts.G += cost.G; totalColoredSymbols += cost.G; }
    }
  });
  console.log('Mana symbol counts:', manaSymbolCounts, 'Total colored symbols:', totalColoredSymbols);

  const balancedLandSelection: SelectedCardEntry[] = [];
  const landCountMap: Map<string, number> = new Map(); // card.id -> quantity
  let currentTotalLandsAdded = 0;

  const basicLandNames: { [name: string]: string } = {
    'Plains': 'W',
    'Island': 'U',
    'Swamp': 'B',
    'Mountain': 'R',
    'Forest': 'G',
  };
  const basicLandCards = availableLandCards.filter(card => basicLandNames[card.name] && card.type === 'Land');
  console.log(`[balanceMana] Identified ${basicLandCards.length} unique basic land types from available pool.`);

  // 1. Add basic lands based on proportions (if there are colored symbols)
  if (totalColoredSymbols > 0 && currentTotalLandsAdded < targetLandCount) {
    for (const color of deckColors) {
      if (manaSymbolCounts[color] > 0) {
        const proportion = manaSymbolCounts[color] / totalColoredSymbols;
        let numLandsOfColor = Math.round(proportion * targetLandCount); // Initial target for this color
        
        const basicLandForColor = basicLandCards.find(b => basicLandNames[b.name] === color);
        if (basicLandForColor) {
          // Ensure we don't overshoot total targetLandCount with just one color
          numLandsOfColor = Math.min(numLandsOfColor, targetLandCount - currentTotalLandsAdded);
          if (numLandsOfColor > 0) {
            landCountMap.set(basicLandForColor.id, (landCountMap.get(basicLandForColor.id) || 0) + numLandsOfColor);
            currentTotalLandsAdded += numLandsOfColor;
            console.log(`Added ${numLandsOfColor} ${basicLandForColor.name} for color ${color}`);
          }
        }
      }
      if (currentTotalLandsAdded >= targetLandCount) break;
    }
  }
  
  // 2. Fill remaining land slots with other available lands (non-basics, or basics if still needed)
  // Shuffle available lands to get variety for non-basics
  const remainingAvailableLands = availableLandCards
    .filter(land => !basicLandNames[land.name] || !deckColors.includes(basicLandNames[land.name])) // Exclude basics already potentially added by color proportion
    .sort(() => 0.5 - Math.random());

  for (const landCard of [...basicLandCards, ...remainingAvailableLands]) { // Prioritize basics if still under target
    if (currentTotalLandsAdded >= targetLandCount) break;

    const existingQuantity = landCountMap.get(landCard.id) || 0;
    const isBasic = !!basicLandNames[landCard.name];
    const limit = isBasic ? Infinity : 4; // Basic lands don't have a 4-copy limit in a deck

    if (existingQuantity < limit) {
      landCountMap.set(landCard.id, existingQuantity + 1);
      currentTotalLandsAdded++;
    }
  }
  
  // Ensure total lands don't exceed targetLandCount due to rounding or minimums
  // This part needs refinement: if currentTotalLandsAdded > targetLandCount, we need to remove some.
  // For now, the logic tries to add up to targetLandCount.
  // A more robust approach would be to fill proportionally then top up/trim.

  // Convert map to SelectedCardEntry array
  landCountMap.forEach((quantity, cardId) => {
    const card = availableLandCards.find(lc => lc.id === cardId);
    if (card && quantity > 0) {
      balancedLandSelection.push({ card, quantity });
    }
  });

  console.log(`[balanceMana] Final balanced land selection: ${currentTotalLandsAdded} total land copies (target: ${targetLandCount}). Unique lands selected: ${balancedLandSelection.length}.`);
  // console.log('[balanceMana] Detailed selection:', balancedLandSelection.map(e => `${e.quantity}x ${e.card.name}`));
  return balancedLandSelection;
}

/**
 * Saves the generated deck to the database.
 * @param generatedDeck The deck to save.
 * @param playerId The ID of the player who owns the deck.
 */
async function saveDeckToDatabase(generatedDeck: GeneratedDeck, playerId: string): Promise<string> {
  const deckId = crypto.randomUUID();
  console.log(`Attempting to save deck: ${generatedDeck.deckName} with new ID: ${deckId} for player: ${playerId}`);
  try {
    await DeckService.createDeck(deckId, playerId, generatedDeck.deckName, generatedDeck.mainBoard);
    console.log(`Deck ${generatedDeck.deckName} (ID: ${deckId}) saved successfully for player ${playerId}.`);
    return deckId;
  } catch (error) {
    console.error(`Error saving deck ${generatedDeck.deckName} (ID: ${deckId}) to database:`, error);
    throw error; // Re-throw to allow caller to handle or be aware
  }
}

export async function generateDeck(config: DeckConfig): Promise<GeneratedDeck> {
  console.log('Generating deck with config:', config);

  const allEligibleNonLandCards = await fetchEligibleCards(config);
  const selectedCreatures = selectCreatures(allEligibleNonLandCards, config); // Returns SelectedCardEntry[]
  const selectedSpells = selectSpells(allEligibleNonLandCards, config);     // Returns SelectedCardEntry[]

  const allEligibleLandCards = await fetchEligibleLandCards(config); // Returns Card[]
  
  const targetLandCount = Math.floor(config.totalCards * config.landRatio);
  const combinedNonLandCards: SelectedCardEntry[] = [...selectedCreatures, ...selectedSpells];
  
  const balancedLands = balanceMana(combinedNonLandCards, allEligibleLandCards, targetLandCount, config.colors); // Returns SelectedCardEntry[]

  // Placeholder for card selection logic

  // Assemble the deck
  const allSelectedCardEntries: SelectedCardEntry[] = [
    ...selectedCreatures,
    ...selectedSpells,
    ...balancedLands,
  ];

  // Convert SelectedCardEntry[] to DeckEntry[] for the final output
  const mainBoard: DeckEntry[] = allSelectedCardEntries.map(entry => ({
    cardId: entry.card.id,
    quantity: entry.quantity,
  }));

  const finalGeneratedDeck: GeneratedDeck = {
    deckName: `${config.colors.join('/')} Auto-Generated Deck - ${new Date().toISOString()}`,
    mainBoard: mainBoard,
    // sideBoard could be added later if needed
  };

  console.log('Final generated deck:', finalGeneratedDeck);

  // Save the deck to the database
  // For now, using a placeholder playerId. This should come from user context in a real app.
  const playerId = config.playerId || 'player1'; 
  try {
    const savedDeckId = await saveDeckToDatabase(finalGeneratedDeck, playerId);
    console.log(`Deck saved with ID: ${savedDeckId}`);
    // Optionally, add savedDeckId to the returned GeneratedDeck object if useful for the caller
    // finalGeneratedDeck.id = savedDeckId; 
  } catch (error) {
    console.error('Failed to save the generated deck:', error);
    // Decide how to handle save failure: return deck anyway, or throw?
    // For now, we'll log and return the deck object without an ID.
  }

  return finalGeneratedDeck;
}

// TODO: Implement remaining helper functions:
// - (Detailed logic within balanceMana)
// - (Synergy/Viability checks)
// - saveDeckToDatabase(deck: GeneratedDeck, playerId: string, format: string): Promise<void>

