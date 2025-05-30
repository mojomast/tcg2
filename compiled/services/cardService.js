import { db } from '../db/database.js';
// Helper function to safely parse JSON strings from the database
function parseJsonField(jsonString, defaultValue) {
    if (jsonString) {
        try {
            const parsed = JSON.parse(jsonString);
            // If the string was "null", JSON.parse results in null.
            // Return defaultValue if parsed is null AND defaultValue itself is not null.
            // This ensures that if defaultValue is explicitly null, a "null" string doesn't incorrectly revert to a non-null defaultValue.
            return parsed === null && defaultValue !== null ? defaultValue : parsed;
        }
        catch (error) {
            console.error('Failed to parse JSON field:', error, '\nJSON string:', jsonString);
            return defaultValue;
        }
    }
    return defaultValue;
}
// Define valid rarities based on the Rarity type in card.ts
const validRarities = ['Common', 'Uncommon', 'Rare', 'Mythic', 'Legendary'];
// Helper function to map a database row to a Card object
function mapRowToCard(row) {
    let mappedRarity;
    if (row.rarity && validRarities.includes(row.rarity)) {
        mappedRarity = row.rarity;
    }
    else {
        // console.warn(`Invalid or missing rarity "${row.rarity}" for card ${row.name}. Defaulting to Common.`);
        mappedRarity = 'Common'; // Default if DB value is not a valid Rarity type member
    }
    const parsedKeywords = parseJsonField(row.keywords, null); // Default to null for later conversion to undefined
    const keywords = parsedKeywords === null ? undefined : parsedKeywords;
    const parsedAbilities = parseJsonField(row.abilities, null); // Default to null for later conversion to undefined
    const abilities = parsedAbilities === null ? undefined : parsedAbilities;
    const parsedProducesMana = parseJsonField(row.produces_mana, null);
    const parsedColorIdentity = parseJsonField(row.color_identity, null);
    return {
        id: row.id,
        name: row.name,
        cost: parseJsonField(row.mana_cost, {}), // DB has mana_cost, Card interface has cost
        type: row.card_type, // DB has card_type, Card interface has type
        // Card.subtype is optional string. DB 'subtypes' is array. Take first, or undefined.
        subtype: row.subtypes ? (parseJsonField(row.subtypes, []) || [])[0] : undefined,
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
        spellSpeed: row.spell_speed ? row.spell_speed : undefined,
        producesMana: parsedProducesMana === null ? undefined : parsedProducesMana,
        abilities: abilities,
        text: row.rules_text || undefined, // Card interface also has 'text', often same as rulesText
        colorIdentity: parsedColorIdentity === null ? undefined : parsedColorIdentity, // Added colorIdentity
    };
}
const calculateCMC = (cost) => {
    if (!cost)
        return 0;
    return Object.values(cost).reduce((sum, val) => sum + (val || 0), 0);
};
const constructTypeLine = (type, subtype) => {
    if (subtype) {
        return `${type} - ${subtype}`;
    }
    return type;
};
class CardService {
    constructor() {
        // No in-memory database initialization needed anymore
    }
    getCardById(cardId) {
        try {
            const stmt = db.prepare('SELECT * FROM cards WHERE id = ?');
            const row = stmt.get(cardId);
            if (row) {
                return mapRowToCard(row);
            }
            return undefined;
        }
        catch (error) {
            console.error(`Error fetching card by ID ${cardId}:`, error);
            return undefined;
        }
    }
    getAllCards() {
        try {
            const stmt = db.prepare('SELECT * FROM cards ORDER BY name ASC');
            const rows = stmt.all();
            return rows.map(mapRowToCard);
        }
        catch (error) {
            console.error('Error fetching all cards:', error);
            return [];
        }
    }
    getCards(page = 1, pageSize = 20) {
        try {
            const offset = (page - 1) * pageSize;
            const cardsStmt = db.prepare('SELECT * FROM cards ORDER BY name ASC LIMIT ? OFFSET ?');
            const cardRows = cardsStmt.all(pageSize, offset);
            const cards = cardRows.map(mapRowToCard);
            const countStmt = db.prepare('SELECT COUNT(*) as total FROM cards');
            const { total } = countStmt.get();
            return {
                cards,
                totalCards: total,
                page,
                pageSize,
                totalPages: Math.ceil(total / pageSize),
            };
        }
        catch (error) {
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
    getCardsByCriteria(criteria) {
        let query = 'SELECT * FROM cards WHERE 1=1';
        const params = [];
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
            const rows = stmt.all(...params);
            return rows.map(mapRowToCard);
        }
        catch (error) {
            console.error('Error fetching cards by criteria:', criteria, error);
            console.error('Executed Query:', query, 'with params:', params);
            return [];
        }
    }
    createCard(card) {
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
            }
            else {
                console.log(`[CardService] Card already exists or no change: ${card.name} (ID: ${card.id})`);
            }
        }
        catch (error) {
            console.error(`[CardService] Error creating card ${card.name} (ID: ${card.id}):`, error);
            throw error; // Re-throw to allow caller to handle
        }
    }
}
const cardService = new CardService();
export default cardService;
