const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticate = require('../middleware/authentificate');

// Route pour l'inscription des utilisateurs
router.post('/signup', userController.signupUser);

// Route pour la connexion des utilisateurs
router.post('/signin', userController.signinUser);

// Route pour l'envoi du lien de réinitialisation de mot de passe
router.post('/send-reset-email', userController.sendResetEmail);

// Route pour la réinitialisation du mot de passe
router.post('/reset-password', userController.resetPassword);

// Route pour obtenir les informations d'un utilisateur spécifique par son ID
router.get('/:id', userController.getUser);

// Route pour mettre à jour un utilisateur
router.put('/:id', authenticate, userController.updateUser);

// Route pour récupérer les factures de l'utilisateur connecté
router.get('/:id/invoices', authenticate, userController.getUserInvoices);

// Route pour supprimer un utilisateur
router.delete('/:id', authenticate, userController.deleteUser);

// Route pour vérifier si un utilisateur existe
router.post('/check', userController.checkUserExists);

// Route pour vérifier le mot de passe
router.post('/verify-password', userController.verifyPassword);

// Route pour la deuxième fonction de réinitialisation de mot de passe
router.post('/change-password', authenticate, userController.changePassword);

router.get('/download-data', authenticate, userController.downloadUserData); 

module.exports = router;
