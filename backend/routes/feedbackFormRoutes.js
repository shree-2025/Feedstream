const express = require('express');
const router = express.Router();
const { createFeedbackForm, getFeedbackForm, submitResponse, listForms, updateFeedbackForm, listResponses, exportResponsesCSV, deleteFeedbackForm } = require('../controllers/feedbackFormController');

// Create new feedback form
router.post('/', createFeedbackForm);

// List feedback forms
router.get('/', listForms);

// Update feedback form by id
router.put('/:id', updateFeedbackForm);

// Delete feedback form by id
router.delete('/:id', deleteFeedbackForm);

// Get feedback form by slug
router.get('/:slug', getFeedbackForm);

// Submit a response for a form slug
router.post('/:slug/responses', submitResponse);

// List responses for a form slug (paginated)
router.get('/:slug/responses', listResponses);

// Export responses as CSV for a form slug
router.get('/:slug/responses.csv', exportResponsesCSV);

module.exports = router;
