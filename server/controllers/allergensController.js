const db = require('../config/db');

exports.list = async (req, res, next) => {
  try {
    const keywords = await db('allergen_keywords').orderBy(['allergen_category', 'keyword']);
    const grouped = {};
    for (const kw of keywords) {
      if (!grouped[kw.allergen_category]) {
        grouped[kw.allergen_category] = [];
      }
      grouped[kw.allergen_category].push(kw);
    }
    res.json(grouped);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { allergen_category, keyword } = req.body;
    if (!allergen_category || !keyword) {
      return res.status(400).json({ error: '需提供 allergen_category 和 keyword' });
    }
    const [created] = await db('allergen_keywords')
      .insert({ allergen_category, keyword })
      .returning('*');
    res.status(201).json(created);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: '此關鍵字已存在' });
    }
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const [updated] = await db('allergen_keywords')
      .where('id', req.params.id)
      .update({ ...req.body, updated_at: db.fn.now() })
      .returning('*');
    if (!updated) return res.status(404).json({ error: '找不到該關鍵字' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const deleted = await db('allergen_keywords').where('id', req.params.id).del();
    if (!deleted) return res.status(404).json({ error: '找不到該關鍵字' });
    res.json({ message: '已刪除' });
  } catch (err) {
    next(err);
  }
};
