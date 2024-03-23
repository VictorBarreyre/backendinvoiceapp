const express = require('express');
const expressAsyncHandler = require("express-async-handler");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const multer = require('multer');
const Facture = require('../models/Facture'); // Assurez-vous que le chemin vers votre modèle est correct
const { v4: uuidv4 } = require('uuid');

dotenv.config();

// Configuration de Nodemailer
let transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // Utilisez `true` pour le port 465, `false` pour d'autres ports
  auth: {
    user: process.env.SMTP_MAIL, // Votre adresse email
    pass: process.env.SMTP_PASSWORD, // Votre mot de passe email
  },
});

// Configuration de Multer pour le stockage en mémoire
const upload = multer({ storage: multer.memoryStorage() });

// Fonction d'envoi d'email
const sendEmail = expressAsyncHandler(async (req, res) => {
  const { email, subject, message, montant, emetteur, destinataire } = req.body; // Assurez-vous que les données de la facture sont incluses dans la requête
  const file = req.file; // Accède au fichier envoyé

  // Générez un ID unique pour la facture
  const factureId = uuidv4();

  // Créez et sauvegardez une nouvelle facture dans votre base de données
  try {
    const nouvelleFacture = new Facture({
      factureId,
      montant,
      status: 'en attente', // ou tout autre statut initial
      emetteur, // Assurez-vous que ces objets correspondent à la structure de votre modèle
      destinataire,
    });

    await nouvelleFacture.save();
    console.log("Facture créée avec succès:", nouvelleFacture);

    if (!file) {
      return res.status(400).send("Aucun fichier fourni.");
    }

    const mailOptions = {
      from: process.env.SMTP_MAIL, // Expéditeur
      to: email, // Destinataire
      subject: subject, // Sujet
      text: message, // Corps du texte
      attachments: [
        {
          filename: file.originalname,
          content: file.buffer, // Utilise `buffer` car Multer stocke le fichier en mémoire
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    res.send({
      message: "Email envoyé avec succès à " + email,
      factureId:factureId,});
  } catch (error) {
    console.error("Erreur lors de la création de la facture ou de l'envoi de l'email:", error);
    res.status(500).send("Erreur lors de la création de la facture ou de l'envoi de l'email: " + error.message);
  }
});

// Exportation de la fonction avec le middleware Multer appliqué
module.exports = { sendEmail: [upload.single('file'), sendEmail] };