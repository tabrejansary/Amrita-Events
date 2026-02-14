const express = require('express');
const router = express.Router();
const {
    createForm,
    getTemplates,
    getFormById,
    updateForm,
    deleteForm
} = require('../controllers/formController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
    .post(createForm);

router.route('/templates')
    .get(getTemplates);

router.route('/:id')
    .get(getFormById)
    .put(updateForm)
    .delete(deleteForm);

module.exports = router;
