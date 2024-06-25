const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticate = require('../middleware/authentificate');

// Routes spécifiques
router.post('/signup', userController.signupUser);
router.post('/signin', userController.signinUser);
router.post('/send-reset-email', userController.sendResetEmail);
router.post('/reset-password', userController.resetPassword);
router.post('/check', userController.checkUserExists);
router.post('/verify-password', userController.verifyPassword);
router.post('/change-password', authenticate, userController.changePassword);
router.get('/download-data', authenticate, userController.downloadUserData);

// Routes dynamiques
router.get('/:id', authenticate, userController.getUser);
router.put('/:id', authenticate, userController.updateUser);
router.get('/:id/invoices', authenticate, userController.getUserInvoices);
router.delete('/:id', authenticate, userController.deleteUser);

// Route pour supprimer les factures
router.post('/delete-invoices', authenticate, userController.deleteInvoices);

module.exports = router;
