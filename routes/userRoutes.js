const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController'); // Importez le contrôleur utilisateur
const authenticate = require('../middleware/authentificate'); 

// Route pour l'inscription des utilisateurs
router.post('/signup', userController.signupUser);

// Route pour la connexion des utilisateurs
router.post('/signin', userController.signinUser);

// Route pour obtenir les informations d'un utilisateur spécifique par son ID
router.get('/:id', userController.getUser);

// Route pour supprimer un utilisateur
router.delete('/:id', authenticate, userController.deleteUser);

// Route pour envoyer l'e-mail de réinitialisation de mot de passe
router.post('/forgot-password', userController.sendResetEmail);

// Route pour réinitialiser le mot de passe
router.post('/reset-password', userController.resetPassword);


module.exports = router;
