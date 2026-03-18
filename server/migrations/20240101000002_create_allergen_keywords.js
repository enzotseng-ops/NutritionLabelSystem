/**
 * @param { import("knex").Knex } knex
 */
exports.up = function (knex) {
  return knex.schema.createTable('allergen_keywords', (table) => {
    table.increments('id').primary();
    table.string('allergen_category', 50).notNullable().comment('過敏原分類名稱');
    table.string('keyword', 100).notNullable().comment('比對關鍵字');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    table.unique(['allergen_category', 'keyword']);
  });
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('allergen_keywords');
};
