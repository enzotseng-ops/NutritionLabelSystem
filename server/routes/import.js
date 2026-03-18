const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const ctrl = require('../controllers/importController');

const upload = multer({
  dest: path.resolve(__dirname, '../uploads'),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.xlsx', '.xls'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('僅支援 .xlsx 或 .xls 格式'));
    }
  },
});

router.post('/excel', upload.single('file'), ctrl.importExcel);

module.exports = router;
