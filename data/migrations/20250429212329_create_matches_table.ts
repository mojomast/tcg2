import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('matches', (table) => {
        table.increments('id').primary();
        table.string('status').notNullable().defaultTo('pending'); // e.g., 'pending', 'in_progress', 'completed', 'abandoned'
        table.integer('winner_user_id').unsigned().references('id').inTable('users').onDelete('SET NULL'); // Nullable, set null if winner user is deleted
        table.timestamp('started_at').defaultTo(knex.fn.now());
        table.timestamp('ended_at');
        table.jsonb('game_state_json'); // Could store the final state or checkpoints
    });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTableIfExists('matches');
}
