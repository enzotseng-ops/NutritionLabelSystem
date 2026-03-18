/**
 * @param { import("knex").Knex } knex
 */
exports.up = function (knex) {
  return knex.schema
    .createTable('nutrition_labels', (table) => {
      table.increments('id').primary();
      table.string('name').notNullable().comment('標示名稱/產品名稱');
      table.decimal('serving_size', 10, 2).notNullable().comment('每份量 g/ml');
      table.string('serving_unit', 20).defaultTo('g').comment('份量單位');
      table.integer('servings_per_package').defaultTo(1).comment('每包裝含幾份');
      table.decimal('total_weight', 10, 2).comment('總重量 g');

      // 計算後的每份營養素
      table.decimal('calc_calories', 10, 2).defaultTo(0);
      table.decimal('calc_protein', 10, 2).defaultTo(0);
      table.decimal('calc_total_fat', 10, 2).defaultTo(0);
      table.decimal('calc_saturated_fat', 10, 2).defaultTo(0);
      table.decimal('calc_trans_fat', 10, 4).defaultTo(0);
      table.decimal('calc_total_carbs', 10, 2).defaultTo(0);
      table.decimal('calc_sugar', 10, 2).defaultTo(0);
      table.decimal('calc_dietary_fiber', 10, 2).defaultTo(0);
      table.decimal('calc_sodium', 10, 2).defaultTo(0);
      table.decimal('calc_cholesterol', 10, 2).defaultTo(0);

      // 過敏原
      table.jsonb('detected_allergens').defaultTo('[]').comment('自動偵測到的過敏原');
      table.text('allergen_statement').comment('過敏原聲明文字');

      table.text('notes').comment('備註');
      table.timestamps(true, true);
    })
    .createTable('nutrition_label_items', (table) => {
      table.increments('id').primary();
      table.integer('label_id').unsigned().notNullable()
        .references('id').inTable('nutrition_labels').onDelete('CASCADE');
      table.integer('food_id').unsigned()
        .references('id').inTable('food_nutrition_data').onDelete('SET NULL');
      table.string('food_name').notNullable().comment('食材名稱（快照）');
      table.decimal('weight_g', 10, 2).notNullable().comment('實際使用克數');
      table.integer('sort_order').defaultTo(0);
      table.timestamps(true, true);
      table.index(['label_id']);
    });
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('nutrition_label_items')
    .dropTableIfExists('nutrition_labels');
};
