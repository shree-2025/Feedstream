const express = require('express');
const router = express.Router();
const {
  listSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  metaSubjects,
} = require('../controllers/subjectController');

router.get('/', listSubjects);
router.get('/meta', metaSubjects);
router.post('/', createSubject);
router.put('/:id', updateSubject);
router.delete('/:id', deleteSubject);

module.exports = router;
