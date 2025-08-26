const express = require('express');
const router = express.Router();
const {
  listQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  bulkUpsertQuestions,
  questionsTemplate,
} = require('../controllers/questionController');

router.get('/', listQuestions);
router.get('/template.csv', questionsTemplate);
router.post('/bulk', bulkUpsertQuestions);
router.post('/', createQuestion);
router.put('/:id', updateQuestion);
router.delete('/:id', deleteQuestion);

module.exports = router;
