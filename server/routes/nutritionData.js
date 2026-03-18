const router = require('express').Router();
const ctrl = require('../controllers/nutritionDataController');

router.get('/search', ctrl.search);
router.get('/meta/categories', ctrl.getCategories);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
