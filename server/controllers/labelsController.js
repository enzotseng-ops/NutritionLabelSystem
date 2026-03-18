const db = require('../config/db');
const { computeLabel, detectAllergens } = require('../services/calculationEngine');

exports.list = async (req, res, next) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const total = await db('nutrition_labels').count('id as count').first();
    const labels = await db('nutrition_labels')
      .orderBy('updated_at', 'desc')
      .limit(limit)
      .offset(offset);
    res.json({ data: labels, total: parseInt(total.count) });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const label = await db('nutrition_labels').where('id', req.params.id).first();
    if (!label) return res.status(404).json({ error: '找不到該標示' });

    const items = await db('nutrition_label_items')
      .where('label_id', label.id)
      .orderBy('sort_order');

    res.json({ ...label, items });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, serving_size, serving_unit, servings_per_package, total_weight, notes, items } = req.body;

    if (!name || !serving_size || !items || !items.length) {
      return res.status(400).json({ error: '需提供 name, serving_size, items' });
    }

    const { perServing, totalWeight } = await computeLabel(items, serving_size, total_weight);
    const allergens = await detectAllergens(items);

    const [label] = await db('nutrition_labels').insert({
      name,
      serving_size,
      serving_unit: serving_unit || 'g',
      servings_per_package: servings_per_package || 1,
      total_weight: totalWeight,
      calc_calories: perServing.calories,
      calc_protein: perServing.protein,
      calc_total_fat: perServing.total_fat,
      calc_saturated_fat: perServing.saturated_fat,
      calc_trans_fat: perServing.trans_fat,
      calc_total_carbs: perServing.total_carbs,
      calc_sugar: perServing.sugar,
      calc_dietary_fiber: perServing.dietary_fiber,
      calc_sodium: perServing.sodium,
      calc_cholesterol: perServing.cholesterol,
      detected_allergens: JSON.stringify(allergens),
      allergen_statement: allergens.length > 0 ? `本產品含有${allergens.join('、')}` : null,
      notes,
    }).returning('*');

    const labelItems = items.map((item, idx) => ({
      label_id: label.id,
      food_id: item.food_id,
      food_name: item.food_name,
      weight_g: item.weight_g,
      sort_order: idx,
    }));
    await db('nutrition_label_items').insert(labelItems);

    const savedItems = await db('nutrition_label_items').where('label_id', label.id).orderBy('sort_order');
    res.status(201).json({ ...label, items: savedItems });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { name, serving_size, serving_unit, servings_per_package, total_weight, notes, items } = req.body;

    const existing = await db('nutrition_labels').where('id', req.params.id).first();
    if (!existing) return res.status(404).json({ error: '找不到該標示' });

    let updateData = { name, serving_size, serving_unit, servings_per_package, notes, updated_at: db.fn.now() };

    if (items && items.length) {
      const { perServing, totalWeight } = await computeLabel(items, serving_size || existing.serving_size, total_weight);
      const allergens = await detectAllergens(items);

      updateData = {
        ...updateData,
        total_weight: totalWeight,
        calc_calories: perServing.calories,
        calc_protein: perServing.protein,
        calc_total_fat: perServing.total_fat,
        calc_saturated_fat: perServing.saturated_fat,
        calc_trans_fat: perServing.trans_fat,
        calc_total_carbs: perServing.total_carbs,
        calc_sugar: perServing.sugar,
        calc_dietary_fiber: perServing.dietary_fiber,
        calc_sodium: perServing.sodium,
        calc_cholesterol: perServing.cholesterol,
        detected_allergens: JSON.stringify(allergens),
        allergen_statement: allergens.length > 0 ? `本產品含有${allergens.join('、')}` : null,
      };

      await db('nutrition_label_items').where('label_id', req.params.id).del();
      const labelItems = items.map((item, idx) => ({
        label_id: parseInt(req.params.id),
        food_id: item.food_id,
        food_name: item.food_name,
        weight_g: item.weight_g,
        sort_order: idx,
      }));
      await db('nutrition_label_items').insert(labelItems);
    }

    const [updated] = await db('nutrition_labels')
      .where('id', req.params.id)
      .update(updateData)
      .returning('*');

    const savedItems = await db('nutrition_label_items').where('label_id', updated.id).orderBy('sort_order');
    res.json({ ...updated, items: savedItems });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const deleted = await db('nutrition_labels').where('id', req.params.id).del();
    if (!deleted) return res.status(404).json({ error: '找不到該標示' });
    res.json({ message: '已刪除' });
  } catch (err) {
    next(err);
  }
};

exports.preview = async (req, res, next) => {
  try {
    const { items, serving_size, total_weight } = req.body;
    if (!items || !serving_size) {
      return res.status(400).json({ error: '需提供 items 和 serving_size' });
    }
    const { perServing, totalWeight } = await computeLabel(items, serving_size, total_weight);
    const allergens = await detectAllergens(items);
    res.json({
      perServing,
      totalWeight,
      allergens,
      allergenStatement: allergens.length > 0 ? `本產品含有${allergens.join('、')}` : null,
    });
  } catch (err) {
    next(err);
  }
};
