import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('cards', (table) => {
        table.uuid('id').primary(); // Use UUID for card definitions (App needs to generate this)
        table.string('name').notNullable();
        table.jsonb('cost').notNullable(); // Store ManaCost as JSON { R: 1, colorless: 2 }
        table.string('type').notNullable(); // 'Creature', 'Spell', 'Enchantment', 'Resource'
        table.string('subtype');
        table.string('rarity').notNullable(); // 'Common', 'Uncommon', 'Rare', 'Mythic', 'Legendary'
        table.text('rules_text');
        table.text('flavor_text');
        table.integer('power'); // For Creatures
        table.integer('toughness'); // For Creatures
        table.jsonb('keywords'); // Store keywords as JSON array ['Flying', 'Haste']
        table.string('spell_speed'); // 'Instant', 'Sorcery' (for Spells)
        table.string('image_url');

        // Foreign Key to Sets table
        table.string('set_id').notNullable().references('id').inTable('sets').onDelete('CASCADE');
        table.string('collector_number').notNullable(); // e.g., '123/250'

        table.unique(['set_id', 'collector_number']); // Ensure unique card within a set
    });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTableIfExists('cards');
}
