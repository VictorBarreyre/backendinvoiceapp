const express = require('express');
const router = express.Router();
const { createSubscription, getProductsAndPrices, createCheckoutSession } = require('../controllers/aboController');

router.post('/create-subscription', createSubscription);
router.get('/products-and-prices', getProductsAndPrices);
router.post('/create-checkout-session', createCheckoutSession);

module.exports = router;
