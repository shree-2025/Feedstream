const express = require('express');
const router = express.Router();
const { listStaff, createStaff, updateStaff, deleteStaff, metaStaff, bulkUpsertStaff, staffTemplate } = require('../controllers/staffController');

router.get('/', listStaff);
router.get('/meta', metaStaff);
router.get('/template.csv', staffTemplate);
router.post('/bulk', bulkUpsertStaff);
router.post('/', createStaff);
router.put('/:id', updateStaff);
router.delete('/:id', deleteStaff);

module.exports = router;
