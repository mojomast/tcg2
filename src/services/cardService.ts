import { Card, ManaCost, Keyword, Ability, Rarity, CardType, SpellSpeed } from '../interfaces/card';
import { db } from '../db/database.js';

// Helper function to safely parse JSON strings from the database
function parseJsonField<T>(jsonString: string | null | undefined, defaultValue: T): T {
  if (jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      // If the string was "null", JSON.parse results in null.
      // Return defaultValue if parsed is null AND defaultValue itself is not null.
      // This ensures that if defaultValue is explicitly null, a "null" string doesn't incorrectly revert to a non-null defaultValue.
      return parsed === null && defaultValue !== null ? defaultValue : parsed;
    } catch (error) {
      console.error('Failed to parse JSON field:', error, '\nJSON string:', jsonString);
      return defaultValue;
    }
  }
  return defaultValue;
}

// Define valid rarities based on the Rarity type in card.ts
const validRarities: Rarity[] = ['Common', 'Uncommon', 'Rare', 'Mythic', 'Legendary'];

// Helper function to map a database row to a Card object
function mapRowToCard(row: any): Card {
  let mappedRarity: Rarity;
  if (row.rarity && validRarities.includes(row.rarity as Rarity)) {
    mappedRarity = row.rarity as Rarity;
  } else {
    // console.warn(`Invalid or missing rarity "${row.rarity}" for card ${row.name}. Defaulting to Common.`);
    mappedRarity = 'Common'; // Default if DB value is not a valid Rarity type member
  }

  const parsedKeywords = parseJsonField<Keyword[] | null>(row.keywords, null); // Default to null for later conversion to undefined
  const keywords = parsedKeywords === null ? undefined : parsedKeywords;

  const parsedAbilities = parseJsonField<Ability[] | null>(row.abilities, null); // Default to null for later conversion to undefined
  const abilities = parsedAbilities === null ? undefined : parsedAbilities;

  const parsedProducesMana = parseJsonField<ManaCost | null>(row.produces_mana, null);
  const parsedColorIdentity = parseJsonField<string[] | null>(row.color_identity, null);

  return {
    id: row.id,
    name: row.name,
    cost: parseJsonField<ManaCost>(row.mana_cost, {} as ManaCost), // DB has mana_cost, Card interface has cost
    type: row.card_type as CardType, // DB has card_type, Card interface has type
    // Card.subtype is optional string. DB 'subtypes' is array. Take first, or undefined.
    subtype: row.subtypes ? (parseJsonField<string[] | null>(row.subtypes, []) || [])[0] : undefined,
    rarity: mappedRarity,
    rulesText: row.rules_text || '', // Ensure rulesText is always a string
    flavorText: row.flavor_text || undefined,
    setId: row.set_id,
    collectorNumber: row.collector_number,
    imageUrl: row.image_url || undefined,
    // isTapped: undefined, // isTapped is context-dependent (e.g., in play), not usually part of card definition
    attack: row.attack === null ? undefined : row.attack, // Ensure null from DB becomes undefined
    health: row.health === null ? undefined : row.health, // Ensure null from DB becomes undefined
    keywords: keywords,
    spellSpeed: row.spell_speed ? row.spell_speed as SpellSpeed : undefined,
    producesMana: parsedProducesMana === null ? undefined : parsedProducesMana,
    abilities: abilities,
    text: row.rules_text || undefined, // Card interface also has 'text', often same as rulesText
    colorIdentity: parsedColorIdentity === null ? undefined : parsedColorIdentity, // Added colorIdentity
  };
}

export interface PaginatedCardsResponse {
  cards: Card[];
  totalCards: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CardQueryCriteria {
  colors?: string[];      // e.g., ['R', 'G'] - cards must include ALL these colors
  cardTypes?: string[];   // e.g., ['Creature', 'Instant'] - cards must be one of these types
  excludeCardTypes?: string[]; // e.g., ['Land'] - cards must NOT be any of these types
  maxCMC?: number;
  minCMC?: number;
  // Add other potential criteria: keywords, set, rarity, etc.
}

export interface CardSearchParams {
  page?: number;
  pageSize?: number;
  search?: string;          // Name/text search
  manaType?: string[];      // Color filter: ["R", "G"]
  cardType?: string;        // "Creature", "Instant", etc.
  cmc?: number;            // Converted mana cost
  rarity?: string;         // "Common", "Rare", etc.
}

const calculateCMC = (cost: ManaCost | undefined): number => {
    if (!cost) return 0;
    return Object.values(cost).reduce((sum, val) => sum + (val || 0), 0);
};

const constructTypeLine = (type: CardType, subtype?: string): string => {
    if (subtype) {
        return `${type} - ${subtype}`;
    }
    return type;
};

class CardService {
  constructor() {
    // No in-memory database initialization needed anymore
  }

  public getCardById(cardId: string): Card | undefined {
    try {
      const stmt = db.prepare('SELECT * FROM cards WHERE id = ?');
      const row = stmt.get(cardId) as any; 
      if (row) {
        return mapRowToCard(row);
      }
      return undefined;
    } catch (error) {
      console.error(`Error fetching card by ID ${cardId}:`, error);
      return undefined;
    }
  }

  public getAllCards(): Card[] {
    try {
      const stmt = db.prepare('SELECT * FROM cards ORDER BY name ASC');
      const rows = stmt.all() as any[]; 
      return rows.map(mapRowToCard);
    } catch (error) {
      console.error('Error fetching all cards:', error);
      return [];
    }
  }

  public getCards(page: number = 1, pageSize: number = 20): PaginatedCardsResponse {
    try {
      const offset = (page - 1) * pageSize;
      
      const cardsStmt = db.prepare('SELECT * FROM cards ORDER BY name ASC LIMIT ? OFFSET ?');
      const cardRows = cardsStmt.all(pageSize, offset) as any[];
      const cards = cardRows.map(mapRowToCard);

      const countStmt = db.prepare('SELECT COUNT(*) as total FROM cards');
      const { total } = countStmt.get() as { total: number };

      return {
        cards,
        totalCards: total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    } catch (error) {
      console.error(`Error fetching paginated cards (page ${page}, pageSize ${pageSize}):`, error);
      return {
        cards: [],
        totalCards: 0,
        page,
        pageSize,
        totalPages: 0,
      };
    }
  }

  public getCardsWithSearch(searchParams: CardSearchParams): PaginatedCardsResponse {
    try {
      const { page = 1, pageSize = 20, search, manaType, cardType, cmc, rarity } = searchParams;
      const offset = (page - 1) * pageSize;
      
      let query = 'SELECT * FROM cards WHERE 1=1';
      let countQuery = 'SELECT COUNT(*) as total FROM cards WHERE 1=1';
      const params: (string | number)[] = [];
      
      // Text search in name and rules_text
      if (search && search.trim() !== '') {
        query += ' AND (name LIKE ? OR rules_text LIKE ?)';
        countQuery += ' AND (name LIKE ? OR rules_text LIKE ?)';
        const searchPattern = `%${search.trim()}%`;
        params.push(searchPattern, searchPattern);
      }
      
      // Mana type/color filter
      if (manaType && manaType.length > 0) {
        // Filter cards that contain at least one of the specified colors
        const colorConditions = manaType.map(() => 'INSTR(color_identity, ?) > 0').join(' OR ');
        query += ` AND (${colorConditions})`;
        countQuery += ` AND (${colorConditions})`;
        manaType.forEach(color => {
          params.push(`"${color}"`);
        });
      }
      
      // Card type filter
      if (cardType && cardType.trim() !== '') {
        query += ' AND card_type = ?';
        countQuery += ' AND card_type = ?';
        params.push(cardType.trim());
      }
      
      // CMC filter (exact match)
      if (cmc !== undefined && cmc >= 0) {
        query += ' AND cmc = ?';
        countQuery += ' AND cmc = ?';
        params.push(cmc);
      }
      
      // Rarity filter
      if (rarity && rarity.trim() !== '') {
        query += ' AND rarity = ?';
        countQuery += ' AND rarity = ?';
        params.push(rarity.trim());
      }
      
      // Add ordering and pagination to main query
      query += ' ORDER BY name ASC LIMIT ? OFFSET ?';
      const finalParams = [...params, pageSize, offset];
      
      // Execute queries
      const cardsStmt = db.prepare(query);
      const cardRows = cardsStmt.all(...finalParams) as any[];
      const cards = cardRows.map(mapRowToCard);

      const countStmt = db.prepare(countQuery);
      const { total } = countStmt.get(...params) as { total: number };

      return {
        cards,
        totalCards: total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    } catch (error) {
      console.error('Error in getCardsWithSearch:', error);
      console.error('Search params:', searchParams);
      return {
        cards: [],
        totalCards: 0,
        page: searchParams.page || 1,
        pageSize: searchParams.pageSize || 20,
        totalPages: 0,
      };
    }
  }

  public getCardsByCriteria(criteria: CardQueryCriteria): Card[] {
    let query = 'SELECT * FROM cards WHERE 1=1';
    const params: (string | number)[] = [];

    if (criteria.colors && criteria.colors.length > 0) {
      const allGameColors = ['W', 'U', 'B', 'R', 'G']; // Assuming these are all possible color codes
      const allowedColors = criteria.colors;
      const forbiddenColors = allGameColors.filter(gameColor => !allowedColors.includes(gameColor));

      // Only apply color filtering if the allowed colors are a strict subset of all game colors.
      // (i.e., not a 5-color deck where all colors are allowed, and not a request for specifically colorless cards if allowedColors is empty)
      if (allowedColors.length > 0 && allowedColors.length < allGameColors.length) {
        forbiddenColors.forEach(forbiddenColor => {
          // A card is valid if its color_identity is NULL (colorless), or an empty array '[]' (colorless),
          // or it does NOT contain the current forbiddenColor.
          query += ` AND (color_identity IS NULL OR color_identity = '[]' OR INSTR(color_identity, ?) = 0)`;
          params.push(`"${forbiddenColor}"`); // e.g., INSTR(color_identity, '"W"') = 0. Search for '"W"', not '\"W\"'.
        });
      }
      // If criteria.colors is empty, or includes all game colors, this specific filtering logic is skipped,
      // meaning no cards are excluded based on containing forbidden colors (as there are none or all are allowed).
    }

    if (criteria.cardTypes && criteria.cardTypes.length > 0) {
      query += ` AND card_type IN (${criteria.cardTypes.map(() => '?').join(',')})`;
      params.push(...criteria.cardTypes);
    }

    if (criteria.excludeCardTypes && criteria.excludeCardTypes.length > 0) {
      query += ` AND card_type NOT IN (${criteria.excludeCardTypes.map(() => '?').join(',')})`;
      params.push(...criteria.excludeCardTypes);
    }

    if (criteria.maxCMC !== undefined) {
      query += ' AND cmc <= ?';
      params.push(criteria.maxCMC);
    }

    if (criteria.minCMC !== undefined) {
      query += ' AND cmc >= ?';
      params.push(criteria.minCMC);
    }

    query += ' ORDER BY name ASC'; // Default ordering

    try {
      const stmt = db.prepare(query);
      const rows = stmt.all(...params) as any[];
      return rows.map(mapRowToCard);
    } catch (error) {
      console.error('Error fetching cards by criteria:', criteria, error);
      console.error('Executed Query:', query, 'with params:', params);
      return [];
    }
  }

  public createCard(card: Card): void {
    const cmc = calculateCMC(card.cost);
    const type_line = constructTypeLine(card.type, card.subtype);
    const mana_cost_json = card.cost ? JSON.stringify(card.cost) : null;
    // The Card interface has subtype: string, DB stores subtypes: string[]
    const subtypes_json = card.subtype ? JSON.stringify([card.subtype]) : null;
    const keywords_json = card.keywords ? JSON.stringify(card.keywords) : null;
    const abilities_json = card.abilities ? JSON.stringify(card.abilities) : null;
    const produces_mana_json = card.producesMana ? JSON.stringify(card.producesMana) : null;

    const stmt = db.prepare(`
        INSERT INTO cards (
            id, name, mana_cost, cmc, type_line, card_type, subtypes, rarity,
            rules_text, flavor_text, attack, health, keywords, spell_speed,
            produces_mana, abilities, set_id, collector_number, image_url
        ) VALUES (
            @id, @name, @mana_cost, @cmc, @type_line, @card_type, @subtypes, @rarity,
            @rules_text, @flavor_text, @attack, @health, @keywords, @spell_speed,
            @produces_mana, @abilities, @set_id, @collector_number, @image_url
        )
        ON CONFLICT(id) DO NOTHING; -- Or DO UPDATE SET ... if you want to update existing
    `);

    try {
        const info = stmt.run({
            id: card.id,
            name: card.name,
            mana_cost: mana_cost_json,
            cmc: cmc,
            type_line: type_line,
            card_type: card.type,
            subtypes: subtypes_json,
            rarity: card.rarity,
            rules_text: card.rulesText ?? null,
            flavor_text: card.flavorText ?? null,
            attack: card.attack ?? null,
            health: card.health ?? null,
            keywords: keywords_json,
            spell_speed: card.spellSpeed ?? null,
            produces_mana: produces_mana_json,
            abilities: abilities_json,
            set_id: card.setId,
            collector_number: card.collectorNumber,
            image_url: card.imageUrl ?? null
        });
        if (info.changes > 0) {
            console.log(`[CardService] Card created/updated: ${card.name} (ID: ${card.id})`);
        } else {
            console.log(`[CardService] Card already exists or no change: ${card.name} (ID: ${card.id})`);
        }
    } catch (error) {
        console.error(`[CardService] Error creating card ${card.name} (ID: ${card.id}):`, error);
        throw error; // Re-throw to allow caller to handle
    }
  }
}

const cardService = new CardService();
export default cardService;
