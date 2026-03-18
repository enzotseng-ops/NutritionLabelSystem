const db = require('../config/db');

exports.search = async (req, res, next) => {
  try {
    const { q, source, category, limit = 20, offset = 0 } = req.query;
    let query = db('food_nutrition_data');

    if (q) query = query.where('name', 'ilike', `%${q}%`);
    if (source) query = query.where('source', source);
    if (category) query = query.where('category', 'ilike', `%${category}%`);

    const total = await query.clone().count('id as count').first();
    const data = await query.orderBy('name').limit(limit).offset(offset);

    res.json({ data, total: parseInt(total.count), limit: parseInt(limit), offset: parseInt(offset) });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const item = await db('food_nutrition_data').where('id', req.params.id).first();
    if (!item) return res.status(404).json({ error: '找不到該食材' });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const data = { ...req.body, source: 'custom' };
    const [created] = await db('food_nutrition_data').insert(data).returning('*');
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const [updated] = await db('food_nutrition_data')
      .where('id', req.params.id)
      .update({ ...req.body, updated_at: db.fn.now() })
      .returning('*');
    if (!updated) return res.status(404).json({ error: '找不到該食材' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const deleted = await db('food_nutrition_data').where('id', req.params.id).del();
    if (!deleted) return res.status(404).json({ error: '找不到該食材' });
    res.json({ message: '已刪除' });
  } catch (err) {
    next(err);
  }
};

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await db('food_nutrition_data')
      .distinct('category')
      .whereNotNull('category')
      .orderBy('category');
    res.json(categories.map((c) => c.category));
  } catch (err) {
    next(err);
  }
};
