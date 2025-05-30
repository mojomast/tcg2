// scripts/populate-cards.ts
import axios, { AxiosResponseHeaders } from 'axios'; 
import { db, closeDatabase, initializeDatabase } from '../src/db/database.js';
import { ManaCost, Keyword, Ability, SpellSpeed, CardType, Rarity } from '../src/interfaces/card';

// Interface for the card structure we expect from our internal logic/database prep
interface JsonCard {
  id: string; 
  name: string;
  mana_cost: ManaCost | null;
  cmc: number;
  type_line: string; 
  card_type: CardType | string; 
  subtypes: string[] | null; 
  rarity: Rarity | string; 
  rules_text: string | null; 
  flavor_text: string | null; 
  attack: number | null; 
  health: number | null; 
  loyalty?: number | null; 
  keywords: Keyword[] | null;
  spell_speed: SpellSpeed | null;
  produces_mana: ManaCost | null;
  abilities: Ability[] | null;
  set_id: string; 
  collector_number: string; 
  image_url: string | null; 
  color_identity: string[] | null; // Added for deckbuilding
}

// Interface for the card structure from MTG API
interface MtgApiCard {
  id: string;
  name: string;
  manaCost?: string; 
  cmc: number;
  type: string; 
  types: string[]; 
  subtypes?: string[];
  rarity: string;
  text?: string;
  flavor?: string;
  power?: string; 
  toughness?: string; 
  loyalty?: string; 
  set: string; 
  number: string; 
  imageUrl?: string;
  colorIdentity?: string[]; // Added from MTG API
  language?: string; 
  foreignNames?: { language: string; name: string; text: string; type: string; multiverseid?: number }[];
}

function parseManaCost(apiManaCost?: string): ManaCost | null {
  if (!apiManaCost) return null;
  const cost: ManaCost = {};
  const symbols = apiManaCost.match(/\{([^}]+)\}/g);
  if (!symbols) return null;

  symbols.forEach(symbol => {
    const s = symbol.substring(1, symbol.length - 1);
    if (!isNaN(parseInt(s))) { 
      cost['C'] = (cost['C'] || 0) + parseInt(s);
    } else if (s.toUpperCase() === 'X') {
      cost['X'] = (cost['X'] || 0) + 1;
    } else { 
      const color = s.toUpperCase();
      cost[color] = (cost[color] || 0) + 1;
    }
  });
  return Object.keys(cost).length > 0 ? cost : null;
}

function parsePowerToughness(value?: string): number | null {
  if (value === undefined || value === null) return null;
  const num = parseInt(value, 10);
  return isNaN(num) ? null : num; 
}

const API_BASE_URL = 'https://api.magicthegathering.io/v1/cards';
const PAGE_SIZE = 100;
const REQUEST_DELAY_MS = 300; 

function getNextPageUrl(headers: AxiosResponseHeaders): string | null {
  const linkHeader = headers && (headers['link'] || headers['Link']);
  if (typeof linkHeader !== 'string') {
    return null;
  }
  const links = linkHeader.split(',');
  const nextLink = links.find(link => link.includes('rel="next"'));
  if (nextLink) {
    const match = nextLink.match(/<([^>]+)>/);
    return match ? match[1] : null;
  }
  return null;
}

async function fetchAllMtgEnglishCards(maxPages: number = Infinity): Promise<MtgApiCard[]> {
  let allCards: MtgApiCard[] = [];
  let nextPageUrl: string | null = `${API_BASE_URL}?pageSize=${PAGE_SIZE}&language=english`;
  let pageNum = 1;
  let totalCount = 0;

  console.log(`Starting to fetch English cards from MTG API (up to ${maxPages === Infinity ? 'all' : maxPages} pages)...`);

  while (nextPageUrl && pageNum <= maxPages) {
    try {
      console.log(`Fetching page ${pageNum} from: ${nextPageUrl}`);
      const response = await axios.get<{ cards: MtgApiCard[] }>(nextPageUrl);
      
      if (!totalCount && response.headers['total-count']) {
        totalCount = parseInt(response.headers['total-count'], 10);
        console.log(`API reports a total of approximately ${totalCount} English cards.`);
      }

      // Simplified and stricter filter based on API documentation for language=english queries
      const englishCards = response.data.cards.filter(card => {
        if (!card.id) return false; // Must have an ID
        // Accept if language is 'English' or if language field is not present (English-only cards)
        return card.language === 'English' || card.language === undefined;
      });
      
      allCards.push(...englishCards);
      console.log(`  Fetched ${englishCards.length} English cards from this page. Total fetched so far: ${allCards.length}`);

      nextPageUrl = getNextPageUrl(response.headers as AxiosResponseHeaders);
      pageNum++;

      if (nextPageUrl) {
        await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY_MS)); 
      }
    } catch (error) {
      console.error(`Error fetching page ${pageNum} from MTG API:`, error);
      nextPageUrl = null; 
    }
  }
  console.log(`Finished fetching. Total English cards collected: ${allCards.length}`);
  return allCards;
}

function mapApiCardToDbCard(apiCard: MtgApiCard): JsonCard {
  const cardType = apiCard.types && apiCard.types.length > 0 ? apiCard.types[0] : 'Unknown';
  let spellSpeed: SpellSpeed | null = null;
  if (cardType.toLowerCase() === 'instant') {
    spellSpeed = 'Instant';
  } else if (cardType.toLowerCase() === 'sorcery') {
    spellSpeed = 'Sorcery';
  }

  return {
    id: apiCard.id, 
    name: apiCard.name,
    mana_cost: parseManaCost(apiCard.manaCost),
    cmc: apiCard.cmc || 0,
    type_line: apiCard.type,
    card_type: cardType as CardType, 
    subtypes: apiCard.subtypes || null,
    rarity: apiCard.rarity as Rarity, 
    rules_text: apiCard.text || null,
    flavor_text: apiCard.flavor || null,
    attack: parsePowerToughness(apiCard.power),
    health: parsePowerToughness(apiCard.toughness),
    loyalty: parsePowerToughness(apiCard.loyalty),
    keywords: [], 
    spell_speed: spellSpeed,
    produces_mana: null, 
    abilities: [], 
    set_id: apiCard.set,
    collector_number: apiCard.number,
    image_url: apiCard.imageUrl || null,
    color_identity: apiCard.colorIdentity || null, // Map color_identity
  };
}

function emptyCardsTable() {
  console.log('Emptying "cards" table...');
  try {
    db.exec('DELETE FROM cards;');
    console.log('"cards" table emptied successfully.');
  } catch (error) {
    console.error('Error emptying "cards" table:', error);
    throw error; 
  }
}

async function populateCardsTable() {
  try {
    emptyCardsTable(); // Step 1: Empty the table
  } catch (error) {
    console.error('Halting script due to error during table emptying.');
    closeDatabase();
    return;
  }
  
  console.log('Starting to populate the "cards" table with ALL English cards from MTG API...');

  const apiCards = await fetchAllMtgEnglishCards(); // Step 2: Fetch all available English cards

  if (!apiCards || apiCards.length === 0) {
    console.log('No cards fetched from API. Nothing to populate.');
    closeDatabase();
    return;
  }

  console.log(`Fetched a total of ${apiCards.length} English cards from the API.`);

  const dbCards: JsonCard[] = apiCards.map(mapApiCardToDbCard).filter(card => card.id); 

  if (dbCards.length === 0) {
    console.log('No cards to insert after mapping. Check mapping logic or API data.');
    closeDatabase();
    return;
  }
  
  console.log(`Attempting to insert ${dbCards.length} mapped cards into the database.`);

  const finalInsertStmt = db.prepare(`
    INSERT OR REPLACE INTO cards (
      id, name, mana_cost, cmc, type_line, card_type, subtypes, rarity, 
      rules_text, flavor_text, attack, health, /*loyalty,*/ keywords, spell_speed, 
      produces_mana, abilities, set_id, collector_number, image_url, color_identity
    ) VALUES (
      @id, @name, @mana_cost, @cmc, @type_line, @card_type, @subtypes, @rarity, 
      @rules_text, @flavor_text, @attack, @health, /*@loyalty,*/ @keywords, @spell_speed, 
      @produces_mana, @abilities, @set_id, @collector_number, @image_url, @color_identity
    )
  `);

  const insertMany = db.transaction((cards: JsonCard[]) => {
    let insertedCount = 0;
    let processedCount = 0;
    const batchSize = 500; 

    for (const card of cards) {
      try {
        const { loyalty, ...cardForDb } = card; 
        const result = finalInsertStmt.run({
          ...cardForDb,
          mana_cost: card.mana_cost ? JSON.stringify(card.mana_cost) : null,
          subtypes: card.subtypes ? JSON.stringify(card.subtypes) : null,
          keywords: card.keywords ? JSON.stringify(card.keywords) : null,
          produces_mana: card.produces_mana ? JSON.stringify(card.produces_mana) : null,
          abilities: card.abilities ? JSON.stringify(card.abilities) : null,
          color_identity: card.color_identity ? JSON.stringify(card.color_identity) : null, // Stringify color_identity for DB
        });
        if (result.changes > 0) {
          insertedCount++;
        }
      } catch (err) {
        console.error(`Failed to insert/replace card ${card.id} (${card.name}):`, err);
      }
      processedCount++;
      if (processedCount % batchSize === 0) {
        console.log(`  Processed ${processedCount}/${cards.length} cards for insertion...`);
      }
    }
    console.log(`  Finished processing all ${cards.length} cards for insertion.`);
    return insertedCount;
  });

  try {
    console.log(`Starting database transaction for ${dbCards.length} cards...`);
    const count = insertMany(dbCards);
    console.log(`Successfully inserted/replaced ${count} cards out of ${dbCards.length} total processed cards.`);
  } catch (error) {
    console.error('Error during bulk card insertion:', error);
  }
}

// Main execution
(async () => {
  try {
    console.log('Ensuring database is initialized...');
    await initializeDatabase(); // Initialize DB and tables first
    console.log('Database initialized.');
    await populateCardsTable();
  } catch (error) {
    console.error('An unexpected error occurred during script execution:', error);
  } finally {
    closeDatabase();
    console.log('Card population script finished.');
  }
})();
