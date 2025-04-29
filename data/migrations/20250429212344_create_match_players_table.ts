import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('match_players', (table) => {
        table.integer('match_id').unsigned().notNullable().references('id').inTable('matches').onDelete('CASCADE');
        table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.integer('deck_id').unsigned().notNullable().references('id').inTable('decks').onDelete('CASCADE');

        // Composite primary key ensures a user can only be in a match once
        table.primary(['match_id', 'user_id']);
    });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTableIfExists('match_players');
}
