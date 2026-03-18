/**
 * 台灣 12 類法定過敏原關鍵字 Seed
 * 依據衛福部「食品過敏原標示規定」
 */
const allergenData = [
  {
    category: '甲殼類',
    keywords: ['蝦', '蟹', '龍蝦', '蝦仁', '蟹肉', '蝦醬', '蝦膏', '蝦粉', '甲殼類'],
  },
  {
    category: '芒果',
    keywords: ['芒果', '芒果乾', '芒果醬'],
  },
  {
    category: '花生',
    keywords: ['花生', '花生醬', '花生油', '花生粉', '落花生'],
  },
  {
    category: '牛奶/羊奶',
    keywords: ['牛奶', '羊奶', '鮮奶', '奶粉', '乳清', '酪蛋白', '乳糖', '起司', '乳酪', '奶油', '鮮奶油', '煉乳', '優格', '優酪乳', '乳製品'],
  },
  {
    category: '蛋',
    keywords: ['雞蛋', '鴨蛋', '鵪鶉蛋', '蛋黃', '蛋白', '蛋液', '蛋粉', '蛋'],
  },
  {
    category: '堅果類',
    keywords: ['杏仁', '核桃', '腰果', '開心果', '榛果', '夏威夷豆', '松子', '栗子', '胡桃', '堅果'],
  },
  {
    category: '芝麻',
    keywords: ['芝麻', '麻油', '香油', '芝麻醬', '黑芝麻', '白芝麻'],
  },
  {
    category: '含麩質穀物',
    keywords: ['小麥', '大麥', '燕麥', '黑麥', '麵粉', '麩質', '麵筋', '麵條', '麵包', '吐司', '餅乾'],
  },
  {
    category: '大豆',
    keywords: ['大豆', '黃豆', '豆漿', '豆腐', '醬油', '味噌', '豆皮', '豆干', '納豆', '毛豆', '豆瓣醬'],
  },
  {
    category: '魚類',
    keywords: ['鮭魚', '鱈魚', '鮪魚', '鯖魚', '秋刀魚', '魚露', '柴魚', '魚漿', '魚粉', '魚'],
  },
  {
    category: '使用亞硫酸鹽類',
    keywords: ['亞硫酸鈉', '亞硫酸鉀', '偏亞硫酸鈉', '二氧化硫', '亞硫酸鹽'],
  },
  {
    category: '螺旋藻',
    keywords: ['螺旋藻', '藍藻'],
  },
];

/**
 * @param { import("knex").Knex } knex
 */
exports.seed = async function (knex) {
  await knex('allergen_keywords').del();

  const rows = [];
  for (const { category, keywords } of allergenData) {
    for (const keyword of keywords) {
      rows.push({
        allergen_category: category,
        keyword,
        is_active: true,
      });
    }
  }

  await knex('allergen_keywords').insert(rows);
};
