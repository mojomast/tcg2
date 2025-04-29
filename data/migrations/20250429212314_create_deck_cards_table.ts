import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('deck_cards', (table) => {
        table.integer('deck_id').unsigned().notNullable().references('id').inTable('decks').onDelete('CASCADE');
        table.uuid('card_id').notNullable().references('id').inTable('cards').onDelete('CASCADE');
        table.integer('quantity').unsigned().notNullable().defaultTo(1);

        // Composite primary key
        table.primary(['deck_id', 'card_id']);
    });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTableIfExists('deck_cards');
}
