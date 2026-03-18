const db = require('../config/db');

// 營養素欄位清單
const NUTRIENT_FIELDS = [
  'protein', 'total_fat', 'saturated_fat', 'trans_fat',
  'total_carbs', 'sugar', 'dietary_fiber', 'sodium', 'cholesterol',
  'vitamin_a', 'vitamin_b1', 'vitamin_b2', 'vitamin_b6', 'vitamin_b12',
  'vitamin_c', 'vitamin_d', 'vitamin_e',
  'calcium', 'iron', 'zinc', 'potassium', 'magnesium', 'phosphorus',
  'leucine', 'isoleucine', 'valine',
];

/**
 * 加權計算單一食材的營養素貢獻
 * 公式: (實際克數 / 100) * 每100g營養素值
 */
function weightedNutrients(foodData, weightG) {
  const ratio = weightG / 100;
  const result = {};
  for (const field of NUTRIENT_FIELDS) {
    result[field] = (parseFloat(foodData[field]) || 0) * ratio;
  }
  return result;
}

/**
 * 計算熱量
 * 公式: 蛋白質*4 + 脂肪*9 + 碳水*4 + 膳食纖維*2
 * (膳食纖維另計 2 kcal/g，碳水已含纖維則需扣除後再加回)
 */
function calculateCalories(nutrients) {
  const protein = nutrients.protein || 0;
  const fat = nutrients.total_fat || 0;
  const carbs = nutrients.total_carbs || 0;
  const fiber = nutrients.dietary_fiber || 0;

  // 碳水 4 kcal/g (含纖維部分)，纖維額外以 2 kcal/g 計算
  // 實務上: (碳水 - 纖維) * 4 + 纖維 * 2 + 蛋白質 * 4 + 脂肪 * 9
  return protein * 4 + fat * 9 + (carbs - fiber) * 4 + fiber * 2;
}

/**
 * 彙算配方所有食材的每份營養素
 * @param {Array} items - [{ food_id, weight_g }]
 * @param {number} servingSize - 每份量(g)
 * @param {number} totalWeight - 配方總重(g)，若無則自動加總
 */
async function computeLabel(items, servingSize, totalWeight) {
  const foodIds = items.map((i) => i.food_id).filter(Boolean);
  const foods = await db('food_nutrition_data').whereIn('id', foodIds);
  const foodMap = Object.fromEntries(foods.map((f) => [f.id, f]));

  // 加總所有食材的營養素 (per 配方總量)
  const totals = {};
  for (const field of NUTRIENT_FIELDS) totals[field] = 0;

  let autoTotalWeight = 0;
  for (const item of items) {
    const food = foodMap[item.food_id];
    if (!food) continue;
    const w = parseFloat(item.weight_g) || 0;
    autoTotalWeight += w;
    const contrib = weightedNutrients(food, w);
    for (const field of NUTRIENT_FIELDS) {
      totals[field] += contrib[field];
    }
  }

  const effectiveTotal = totalWeight || autoTotalWeight;
  if (effectiveTotal <= 0) {
    return { perServing: totals, totalWeight: 0 };
  }

  // 換算到每份
  const servingRatio = servingSize / effectiveTotal;
  const perServing = {};
  for (const field of NUTRIENT_FIELDS) {
    perServing[field] = parseFloat((totals[field] * servingRatio).toFixed(4));
  }
  perServing.calories = parseFloat(calculateCalories(perServing).toFixed(2));

  return { perServing, totalWeight: effectiveTotal };
}

/**
 * 過敏原自動偵測
 * 比對每個食材的名稱與 ingredients_text 中是否包含過敏原關鍵字
 */
async function detectAllergens(items) {
  const foodIds = items.map((i) => i.food_id).filter(Boolean);
  const foods = await db('food_nutrition_data').whereIn('id', foodIds);
  const keywords = await db('allergen_keywords').where('is_active', true);

  const detected = new Set();

  for (const food of foods) {
    const searchText = `${food.name} ${food.ingredients_text || ''}`;
    for (const kw of keywords) {
      if (searchText.includes(kw.keyword)) {
        detected.add(kw.allergen_category);
      }
    }
  }

  return Array.from(detected).sort();
}

module.exports = {
  NUTRIENT_FIELDS,
  weightedNutrients,
  calculateCalories,
  computeLabel,
  detectAllergens,
};
