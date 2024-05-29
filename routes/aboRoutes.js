const express = require('express');
const router = express.Router();
const { createSubscription, getProductsAndPrices, createCheckoutSession , checkActiveSubscription } = require('../controllers/aboController');

router.post('/create-subscription', createSubscription);
router.get('/products-and-prices', getProductsAndPrices);
router.post('/create-checkout-session', createCheckoutSession);
router.post('/check-active-subscription', checkActiveSubscription);

module.exports = router;
