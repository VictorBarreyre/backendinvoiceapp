const express = require('express');
const expressAsyncHandler = require("express-async-handler");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const multer = require('multer');
const Facture = require('../models/Facture');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');

dotenv.config();

let transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_MAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

const upload = multer({ storage: multer.memoryStorage() });

const imagesDir = path.join(__dirname, '../public/images');

const saveBufferToFile = (buffer, originalName) => {
  return new Promise((resolve, reject) => {
    const tempPath = path.join(os.tmpdir(), `${uuidv4()}-${originalName}`);
    fs.writeFile(tempPath, buffer, (err) => {
      if (err) reject(err);
      else resolve(tempPath);
    });
  });
};

const generateFactureId = expressAsyncHandler(async (req, res) => {
  const factureId = uuidv4();
  res.send({ factureId: factureId });
});

const convertPdfToPng = (pdfPath) => {
  return new Promise((resolve, reject) => {
    const outputBase = path.basename(pdfPath, path.extname(pdfPath));
    const outputPath = path.join(imagesDir, outputBase + ".png");


    console.log("Chemin du PDF source:", pdfPath);
    console.log("Chemin de destination prévu pour le PNG:", outputPath);


    // Notez qu'aucun échappement supplémentaire pour les espaces n'est fait ici
    const command = `pdftoppm -png -f 1 -singlefile "${pdfPath}" "${outputPath.replace('.png', '')}"`;

    console.log("Commande exécutée:", command);

    exec(command, (err) => {
      if (err) {
        console.log("Erreur lors de l'exécution de la commande:", err);
        reject(err);
      } else {
        console.log("Conversion réussie, fichier PNG:", outputPath);
        resolve(outputPath);
      }
    });
  });
};


const createFactureAndSendEmail = expressAsyncHandler(async (req, res) => {
  console.log("User in request:", req.userData); // Ajoutez ce log pour vérifier l'utilisateur
  const { number, email, subject, montant, factureId, devise } = req.body;
  const emetteur = JSON.parse(req.body.emetteur);
  const destinataire = JSON.parse(req.body.destinataire);

  try {
    if (!req.file) {
      return res.status(400).send("Aucun fichier fourni.");
    }

    const filePath = await saveBufferToFile(req.file.buffer, req.file.originalname);
    const imagePath = await convertPdfToPng(filePath);
    const imageName = path.relative(imagesDir, imagePath);
    const urlImage = `http://localhost:8000/images/${imageName}`;

    const nouvelleFacture = new Facture({
      number,
      factureId,
      urlImage,
      montant,
      devise,
      status: 'en attente',
      emetteur,
      destinataire,
      userId: req.userData ? req.userData.id : null, // Gérer le cas des utilisateurs non connectés
    });

    await nouvelleFacture.save();

    const confirmationLink = `http://localhost:5173/confirmation?facture=${factureId}&montant=${montant}`;
    const messageEmail = `Cher ${destinataire.name},\n\nVeuillez trouver ci-joint votre facture n° ${number}.\n\nPour confirmer votre accord et signer électroniquement le contrat, veuillez cliquer sur le lien ci-dessous :\n\n${confirmationLink}\n\nNous vous remercions pour votre confiance et restons à votre disposition pour toute information complémentaire.\n\nCordialement,\n${emetteur.name}`;

    const mailOptions = {
      from: process.env.SMTP_MAIL,
      to: email,
      subject: subject,
      text: messageEmail, // Utiliser le message email généré
      attachments: [
        {
          filename: req.file.originalname,
          path: filePath,
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    res.send({
      message: "Email envoyé avec succès à " + email,
      factureId: factureId,
      urlImage: urlImage,
    });
  } catch (error) {
    console.error("Erreur lors de la création de la facture ou de l'envoi de l'email:", error);
    res.status(500).send("Erreur lors de la création de la facture ou de l'envoi de l'email: " + error.message);
  }
});




const getFactureDetails = expressAsyncHandler(async (req, res) => {
  const { factureId } = req.params;
  const facture = await Facture.findOne({ factureId: factureId });

  if (facture) {
    res.json({
      number:facture.number,
      factureId: facture.factureId,
      urlImage: facture.urlImage,
      montant: facture.montant,
      devise: facture.devise,
      emetteur: facture.emetteur,
      destinataire: facture.destinataire,
      status: facture.status,
    });
  } else {
    res.status(404).send("Facture non trouvée");
  }
});

module.exports = { generateFactureId, createFactureAndSendEmail, getFactureDetails };
