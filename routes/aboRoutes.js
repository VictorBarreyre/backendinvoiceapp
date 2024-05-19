const express = require('express');
const router = express.Router();
const { createSubscription, getProductsAndPrices } = require('../controllers/aboController');

router.post('/create-subscription', createSubscription);

router.get('/products-and-prices', getProductsAndPrices);


module.exports = router;
