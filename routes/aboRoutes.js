const express = require('express');
const router = express.Router();
const { getProductsAndPrices, createCheckoutSession , checkActiveSubscription } = require('../controllers/aboController');

router.get('/products-and-prices', getProductsAndPrices);
router.post('/create-checkout-session', createCheckoutSession);
router.post('/check-active-subscription', checkActiveSubscription);

module.exports = router;
