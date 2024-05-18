const express = require('express');
const router = express.Router();
const { createSubscription } = require('../controllers/aboController');

router.post('/create-subscription', createSubscription);

module.exports = router;
