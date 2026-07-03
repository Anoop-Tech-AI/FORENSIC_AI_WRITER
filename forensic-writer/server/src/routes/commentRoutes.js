const express = require('express');
const router = express.Router();
const { getComments, addComment } = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

router.route('/:caseId')
    .get(protect, getComments)
    .post(protect, addComment);

module.exports = router;
