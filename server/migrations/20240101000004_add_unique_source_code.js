/**
 * @param { import("knex").Knex } knex
 */
exports.up = function (knex) {
  return knex.schema.alterTable('food_nutrition_data', (table) => {
    table.unique('source_code');
  });
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = function (knex) {
  return knex.schema.alterTable('food_nutrition_data', (table) => {
    table.dropUnique('source_code');
  });
};
