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

// Route pour mettre à jour un utilisateur
router.put('/:id', authenticate, userController.updateUser);

// Route pour supprimer un utilisateur
router.delete('/:id', authenticate, userController.deleteUser);



module.exports = router;
