const router = require('express').Router();
const ctrl = require('../controllers/exportController');

router.get('/excel/:id', ctrl.exportExcel);

module.exports = router;
