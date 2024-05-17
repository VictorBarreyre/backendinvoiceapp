const express = require('express');
const router = express.Router();
const { createCheckoutSession, createPaymentIntent } = require('../controllers/paiementController');

// Endpoint to create a checkout session
router.post('/create-checkout-session', createCheckoutSession);

// Endpoint to create a payment intent
router.post('/create-payment-intent', createPaymentIntent);

module.exports = router;
