const ExcelJS = require('exceljs');
const db = require('../config/db');

exports.exportExcel = async (req, res, next) => {
  try {
    const label = await db('nutrition_labels').where('id', req.params.id).first();
    if (!label) return res.status(404).json({ error: '找不到該標示' });

    const items = await db('nutrition_label_items')
      .where('label_id', label.id)
      .orderBy('sort_order');

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('營養標示');

    sheet.mergeCells('A1:B1');
    sheet.getCell('A1').value = '營養標示';
    sheet.getCell('A1').font = { bold: true, size: 14 };

    const info = [
      ['產品名稱', label.name],
      ['每份量', `${label.serving_size} ${label.serving_unit}`],
      ['每包裝含', `${label.servings_per_package} 份`],
    ];

    let row = 3;
    for (const [key, val] of info) {
      sheet.getCell(`A${row}`).value = key;
      sheet.getCell(`B${row}`).value = val;
      row++;
    }

    row++;
    sheet.getCell(`A${row}`).value = '營養素';
    sheet.getCell(`B${row}`).value = '每份';
    sheet.getRow(row).font = { bold: true };
    row++;

    const nutrients = [
      ['熱量', `${label.calc_calories} kcal`],
      ['蛋白質', `${label.calc_protein} g`],
      ['脂肪', `${label.calc_total_fat} g`],
      ['　飽和脂肪', `${label.calc_saturated_fat} g`],
      ['　反式脂肪', `${label.calc_trans_fat} g`],
      ['碳水化合物', `${label.calc_total_carbs} g`],
      ['　糖', `${label.calc_sugar} g`],
      ['　膳食纖維', `${label.calc_dietary_fiber} g`],
      ['鈉', `${label.calc_sodium} mg`],
    ];

    for (const [name, val] of nutrients) {
      sheet.getCell(`A${row}`).value = name;
      sheet.getCell(`B${row}`).value = val;
      row++;
    }

    if (label.allergen_statement) {
      row++;
      sheet.getCell(`A${row}`).value = '過敏原資訊';
      sheet.getCell(`B${row}`).value = label.allergen_statement;
    }

    row += 2;
    sheet.getCell(`A${row}`).value = '配方明細';
    sheet.getRow(row).font = { bold: true };
    row++;
    sheet.getCell(`A${row}`).value = '食材名稱';
    sheet.getCell(`B${row}`).value = '用量(g)';
    row++;

    for (const item of items) {
      sheet.getCell(`A${row}`).value = item.food_name;
      sheet.getCell(`B${row}`).value = parseFloat(item.weight_g);
      row++;
    }

    sheet.getColumn('A').width = 20;
    sheet.getColumn('B').width = 20;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(label.name)}_nutrition_label.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};
