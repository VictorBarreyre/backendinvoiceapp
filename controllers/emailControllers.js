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

// Générer un ID de facture unique
const generateFactureId = expressAsyncHandler(async (req, res) => {
  const factureId = uuidv4(); // Générer un ID unique pour la facture
  res.send({ factureId: factureId }); // Retourner l'ID au client
});

// Fonction d'envoi d'email et de création de facture
const createFactureAndSendEmail = expressAsyncHandler(async (req, res) => {
  const { email, subject, message, montant, factureId } = req.body; // factureId doit être fourni par le client
  const emetteur = JSON.parse(req.body.emetteur);
  const destinataire = JSON.parse(req.body.destinataire);
  const file = req.file;
  

  try {
    // Créer et sauvegarder une nouvelle facture dans la base de données
    const nouvelleFacture = new Facture({
      factureId,
      urlImage: 'URL_de_votre_miniature',
      montant,
      status: 'en attente',
      emetteur,
      destinataire,
    });

    await nouvelleFacture.save();
    console.log("Facture créée avec succès:", nouvelleFacture);
    

    if (!file) {
      return res.status(400).send("Aucun fichier fourni.");
    }

    // Configurer les options d'e-mail
    const mailOptions = {
      from: process.env.SMTP_MAIL,
      to: email,
      subject: subject,
      text: message,
      attachments: [
        {
          filename: file.originalname,
          content: file.buffer,
        },
      ],
    };

    // Envoyer l'email
    await transporter.sendMail(mailOptions);
    res.send({
      message: "Email envoyé avec succès à " + email,
      factureId: factureId,
    });
  } catch (error) {
    console.error("Erreur lors de la création de la facture ou de l'envoi de l'email:", error);
    res.status(500).send("Erreur lors de la création de la facture ou de l'envoi de l'email: " + error.message);
  }
});


const getFactureDetails = expressAsyncHandler(async (req, res) => {
  const { factureId } = req.params; // Récupérer l'ID de la facture depuis les paramètres d'URL
  const facture = await Facture.findOne({ factureId: factureId });
  
  if (facture) {
    // Envoyer les détails de la facture au client
    res.json({
      factureId: facture.factureId,
      urlImage: facture.urlImage,
      montant: facture.montant,
      emetteur: facture.emetteur,
      destinataire: facture.destinataire,
      status: facture.status,
    });

  } else {
    res.status(404).send("Facture non trouvée");
  }
});





module.exports = { generateFactureId, createFactureAndSendEmail, getFactureDetails };
