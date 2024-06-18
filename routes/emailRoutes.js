const express = require("express");
const router = express.Router();
const multer = require('multer');
const authenticate = require('../middleware/authentificate');

// Assurez-vous que le chemin vers votre module est correct
const { createFactureAndSendEmail, generateFactureId, getFactureDetails } = require("../controllers/emailControllers");

// Configuration de Multer pour le stockage en mémoire
const upload = multer({ storage: multer.memoryStorage() });

// Utilisation de GET pour la génération de factureId
router.get("/generateFactureId", generateFactureId);

// Utilisez la fonction correcte pour la route d'envoi d'email et incluez Multer pour le fichier
router.post("/sendEmail",authenticate, upload.single('file'), createFactureAndSendEmail);

router.get('/details/:factureId', getFactureDetails);

module.exports = router;