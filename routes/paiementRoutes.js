const express = require('express');
const router = express.Router();
const { createStripeAccountAndInvoice, createPaymentIntent } = require('../controllers/paiementController');

router.post('/create-account-invoice', createStripeAccountAndInvoice);
router.post('/create-payment-intent', createPaymentIntent);

module.exports = router;
