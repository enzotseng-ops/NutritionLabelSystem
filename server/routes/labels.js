const router = require('express').Router();
const ctrl = require('../controllers/labelsController');

router.get('/', ctrl.list);
router.post('/preview', ctrl.preview);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
