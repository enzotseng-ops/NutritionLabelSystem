const ExcelJS = require('exceljs');
const xlsLib = require('xlsx');
const db = require('../config/db');

/**
 * 衛福部食品成分資料庫 Excel 匯入
 * 預設欄位對應（可依實際 Excel 格式調整）
 */
/**
 * 欄位對照表：支援多種名稱別名（陣列優先序，第一個 key 為主要，其餘為別名）
 * 格式：[dbField, isTrans_fat_mg, [...aliases]]
 * isTrans_fat_mg: true 代表單位是 mg，需除以 1000 轉 g
 */
const COLUMN_MAP_ALIASES = [
  // id / name / category
  ['source_code', false, ['整合編號', '樣品編號', '編號']],
  ['name',        false, ['樣品名稱', '食品名稱', '品名']],
  ['category',    false, ['食品分類', '分類']],
  [null,          false, ['俗名']], // skip

  // 八大營養素（含衛福部實際欄位名稱完整對照）
  ['calories',      false, ['熱量', '熱量(kcal)', '熱量（kcal）', '熱量(大卡)', '熱量（大卡）', '修正熱量(kcal)', '修正熱量']],
  ['protein',       false, ['粗蛋白', '粗蛋白(g)', '蛋白質', '蛋白質(g)']],
  ['total_fat',     false, ['粗脂肪', '粗脂肪(g)', '脂肪', '脂肪(g)']],
  ['saturated_fat', false, ['飽和脂肪', '飽和脂肪(g)', '飽和脂肪酸', '脂肪酸S總量(mg)']],
  ['trans_fat',     true,  ['反式脂肪(mg)', '反式脂肪（mg）']], // mg → g
  ['trans_fat',     false, ['反式脂肪(g)', '反式脂肪酸(g)', '反式脂肪']], // already g
  ['total_carbs',   false, ['碳水化合物', '碳水化合物(g)', '醣類', '醣類(g)', '總碳水化合物', '總碳水化合物(g)']],
  ['sugar',         false, ['糖質總量', '糖質總量(g)', '糖', '糖(g)']],
  ['dietary_fiber', false, ['膳食纖維', '膳食纖維(g)']],
  ['sodium',        false, ['鈉', '鈉(mg)']],
  ['cholesterol',   false, ['膽固醇', '膽固醇(mg)']],

  // 維生素（含 IU、μg、ug 不同表示法）
  ['vitamin_a',  false, ['維生素A總量', '維生素A總量(IU)', '維生素A總量(μg)', '視網醇當量', '視網醇當量(RE)(ug)', '維生素A(μg RE)']],
  ['vitamin_b1', false, ['維生素B1', '維生素B1(mg)', '硫胺素']],
  ['vitamin_b2', false, ['維生素B2', '維生素B2(mg)', '核黃素']],
  ['vitamin_b6', false, ['維生素B6', '維生素B6(mg)']],
  ['vitamin_b12',false, ['維生素B12', '維生素B12(μg)', '維生素B12(ug)']],
  ['vitamin_c',  false, ['維生素C', '維生素C(mg)', '抗壞血酸']],
  ['vitamin_d',  false, ['維生素D總量', '維生素D總量(μg)', '維生素D總量(IU)', '維生素D總量(ug)', '維生素D']],
  ['vitamin_e',  false, ['維生素E總量', '維生素E總量(mg)', 'α-維生素E當量(α-TE)(mg)', '維生素E']],

  // 礦物質
  ['calcium',    false, ['鈣', '鈣(mg)']],
  ['iron',       false, ['鐵', '鐵(mg)']],
  ['zinc',       false, ['鋅', '鋅(mg)']],
  ['potassium',  false, ['鉀', '鉀(mg)']],
  ['magnesium',  false, ['鎂', '鎂(mg)']],
  ['phosphorus', false, ['磷', '磷(mg)']],

  // 胺基酸（衛福部格式含括號）
  ['leucine',    false, ['白胺酸', '白胺酸(mg)', '白胺酸(Leu)(mg)']],
  ['isoleucine', false, ['異白胺酸', '異白胺酸(mg)', '異白胺酸(Ile)(mg)']],
  ['valine',     false, ['纈胺酸', '纈胺酸(mg)', '纈胺酸(Val)(mg)']],
];

// 建立快速查找表：normalize(alias) → { field, isMg }
const ALIAS_LOOKUP = new Map();
for (const [field, isMg, aliases] of COLUMN_MAP_ALIASES) {
  for (const alias of aliases) {
    const key = alias.replace(/[\s（(）)μΜ]/g, '').toLowerCase();
    if (!ALIAS_LOOKUP.has(key)) {
      ALIAS_LOOKUP.set(key, { field, isMg });
    }
  }
}

function normalizeHeader(text) {
  return text.replace(/[\s（(）)μΜ]/g, '').toLowerCase();
}

function parseNum(val) {
  if (val === null || val === undefined || val === '' || val === '--' || val === 'Tr') return 0;
  const n = parseFloat(String(val).replace(/,/g, ''));
  return isNaN(n) ? 0 : n;
}

async function importExcel(filePath) {
  // 自動偵測 .xls (BIFF) vs .xlsx (OOXML)，兩種都支援
  const isOldXls = (() => {
    try {
      const buf = require('fs').readFileSync(filePath);
      // BIFF magic bytes: D0 CF 11 E0
      return buf[0] === 0xD0 && buf[1] === 0xCF && buf[2] === 0x11 && buf[3] === 0xE0;
    } catch { return false; }
  })();

  // ─── 統一轉成 rows: string[][] ───────────────────────────────────────
  let rawRows = []; // array of arrays

  if (isOldXls) {
    const wb = xlsLib.readFile(filePath);
    const ws = wb.Sheets[wb.SheetNames[0]];
    rawRows = xlsLib.utils.sheet_to_json(ws, { header: 1, defval: '' });
  } else {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];
    worksheet.eachRow((row) => {
      const arr = [];
      row.eachCell({ includeEmpty: true }, (cell, colNum) => {
        arr[colNum - 1] = cell.value === null || cell.value === undefined ? '' : cell.value;
      });
      rawRows.push(arr);
    });
  }

  // ─── 自動偵測表頭列 ────────────────────────────────────────────────
  let headerRowIdx = 0;
  for (let r = 0; r < Math.min(10, rawRows.length); r++) {
    const row = rawRows[r];
    if (row.some((v) => ['樣品名稱', '整合編號', '樣品編號'].includes(String(v).trim()))) {
      headerRowIdx = r;
      break;
    }
  }

  // ─── 建立欄索引 → DB 欄位對照 ─────────────────────────────────────
  const headerRow = rawRows[headerRowIdx];
  const colMapping = {}; // colIndex → { field, isMg }
  headerRow.forEach((cell, colIdx) => {
    const headerText = String(cell || '').trim();
    const key = normalizeHeader(headerText);
    const match = ALIAS_LOOKUP.get(key);
    if (match && match.field) {
      colMapping[colIdx] = { field: match.field, isMg: match.isMg };
    }
  });

  // ─── 解析資料列 ───────────────────────────────────────────────────
  const rows = [];
  for (let r = headerRowIdx + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    const record = { source: 'official' };
    for (const [colIdx, mapping] of Object.entries(colMapping)) {
      const val = row[parseInt(colIdx)];
      if (mapping.field === 'name' || mapping.field === 'source_code' || mapping.field === 'category') {
        record[mapping.field] = String(val || '').trim();
      } else if (mapping.isMg) {
        record[mapping.field] = parseNum(val) / 1000;
      } else {
        record[mapping.field] = parseNum(val);
      }
    }
    if (record.name) rows.push(record);
  }

  // 分離有 source_code 與無 source_code 的資料
  const withCode = rows.filter((r) => r.source_code);
  const withoutCode = rows.filter((r) => !r.source_code);

  // 批次寫入（每 500 筆）
  const batchSize = 500;
  let imported = 0;

  // 有 source_code → upsert
  for (let i = 0; i < withCode.length; i += batchSize) {
    const batch = withCode.slice(i, i + batchSize);
    await db('food_nutrition_data')
      .insert(batch)
      .onConflict('source_code')
      .merge();
    imported += batch.length;
  }

  // 無 source_code → 直接 insert
  for (let i = 0; i < withoutCode.length; i += batchSize) {
    const batch = withoutCode.slice(i, i + batchSize);
    await db('food_nutrition_data').insert(batch);
    imported += batch.length;
  }

  return { total: rows.length, imported };
}

module.exports = { importExcel };
