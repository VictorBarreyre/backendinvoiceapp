// routes/userRoutes.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController'); // Assurez-vous que le chemin est correct

// Route pour l'inscription des utilisateurs
router.post('/signup', userController.signupUser);

// Route pour la connexion des utilisateurs
router.post('/signin', userController.signinUser);

// Route pour obtenir les informations d'un utilisateur spécifique par son ID
router.get('/:id', userController.getUser);

module.exports = router;
