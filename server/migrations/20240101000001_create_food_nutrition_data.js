/**
 * @param { import("knex").Knex } knex
 */
exports.up = function (knex) {
  return knex.schema.createTable('food_nutrition_data', (table) => {
    table.increments('id').primary();
    table.string('source_code', 20).comment('衛福部食品編號');
    table.string('name').notNullable().comment('食品名稱');
    table.string('category', 100).comment('食品分類');
    table.enum('source', ['official', 'custom']).defaultTo('custom').comment('來源: official=衛福部, custom=自訂');

    // 八大營養素 (per 100g)
    table.decimal('calories', 10, 2).defaultTo(0).comment('熱量 kcal');
    table.decimal('protein', 10, 2).defaultTo(0).comment('蛋白質 g');
    table.decimal('total_fat', 10, 2).defaultTo(0).comment('脂肪 g');
    table.decimal('saturated_fat', 10, 2).defaultTo(0).comment('飽和脂肪 g');
    table.decimal('trans_fat', 10, 4).defaultTo(0).comment('反式脂肪 g');
    table.decimal('total_carbs', 10, 2).defaultTo(0).comment('碳水化合物 g');
    table.decimal('sugar', 10, 2).defaultTo(0).comment('糖 g');
    table.decimal('dietary_fiber', 10, 2).defaultTo(0).comment('膳食纖維 g');
    table.decimal('sodium', 10, 2).defaultTo(0).comment('鈉 mg');
    table.decimal('cholesterol', 10, 2).defaultTo(0).comment('膽固醇 mg');

    // 維生素
    table.decimal('vitamin_a', 10, 2).defaultTo(0).comment('維生素A μg RE');
    table.decimal('vitamin_b1', 10, 4).defaultTo(0).comment('維生素B1 mg');
    table.decimal('vitamin_b2', 10, 4).defaultTo(0).comment('維生素B2 mg');
    table.decimal('vitamin_b6', 10, 4).defaultTo(0).comment('維生素B6 mg');
    table.decimal('vitamin_b12', 10, 4).defaultTo(0).comment('維生素B12 μg');
    table.decimal('vitamin_c', 10, 2).defaultTo(0).comment('維生素C mg');
    table.decimal('vitamin_d', 10, 4).defaultTo(0).comment('維生素D μg');
    table.decimal('vitamin_e', 10, 4).defaultTo(0).comment('維生素E mg');

    // 礦物質
    table.decimal('calcium', 10, 2).defaultTo(0).comment('鈣 mg');
    table.decimal('iron', 10, 4).defaultTo(0).comment('鐵 mg');
    table.decimal('zinc', 10, 4).defaultTo(0).comment('鋅 mg');
    table.decimal('potassium', 10, 2).defaultTo(0).comment('鉀 mg');
    table.decimal('magnesium', 10, 2).defaultTo(0).comment('鎂 mg');
    table.decimal('phosphorus', 10, 2).defaultTo(0).comment('磷 mg');

    // BCAA
    table.decimal('leucine', 10, 2).defaultTo(0).comment('白胺酸 mg');
    table.decimal('isoleucine', 10, 2).defaultTo(0).comment('異白胺酸 mg');
    table.decimal('valine', 10, 2).defaultTo(0).comment('纈胺酸 mg');

    // 成分描述（用於過敏原偵測）
    table.text('ingredients_text').comment('成分列表文字');

    table.timestamps(true, true);
    table.index(['name']);
    table.index(['source']);
    table.index(['category']);
  });
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('food_nutrition_data');
};
