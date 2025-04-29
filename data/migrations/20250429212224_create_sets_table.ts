import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('sets', (table) => {
        table.string('id').primary(); // Use a short code like 'M21', 'XYZ' as the primary key
        table.string('name').notNullable();
        table.date('release_date');
    });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTableIfExists('sets');
}
