const { importExcel } = require('../services/excelImporter');

exports.importExcel = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '請上傳 Excel 檔案' });
    }
    const result = await importExcel(req.file.path);
    res.json({ message: '匯入完成', ...result });
  } catch (err) {
    next(err);
  }
};
