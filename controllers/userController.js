const User = require('../models/User');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const expressAsyncHandler = require('express-async-handler');
const nodemailer = require('nodemailer');
const Invoice = require('../models/Facture');

// Créez un transporteur nodemailer
let transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // true pour le port 465, false pour les autres ports
  auth: {
    user: process.env.SMTP_MAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

exports.signupUser = expressAsyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  // Vérifier si l'utilisateur existe déjà
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400).json({ message: 'Un utilisateur existe déjà avec cet email' });
    return;
  }

  // Créer un nouvel utilisateur directement sans hacher le mot de passe ici
  const user = await User.create({
    email,
    password, // Le mot de passe sera haché par le middleware 'pre save'
    name
  });

  if (user) {
    // Envoyer un e-mail de confirmation
    const mailOptions = {
      from: process.env.SMTP_MAIL,
      to: email,
      subject: 'Confirmation d\'inscription',
      text: `Bonjour ${name}, vous êtes maintenant inscrit sur notre plateforme. Votre mot de passe temporaire est : ${password}`,
    };

    await transporter.sendMail(mailOptions);

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.status(201).json({
      _id: user._id,
      email: user.email,
      name: user.name,
      token
    });
  } else {
    res.status(400).send('Données utilisateur invalides');
  }
});

exports.signinUser = expressAsyncHandler(async (req, res) => {
  const { email, password } = req.body;
  console.log("Attempting to find user with email:", email);
  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found with email:", email);
      return res.status(401).json({ message: 'Utilisateur ou mot de passe incorrect' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log("Password does not match for user:", email);
      return res.status(401).json({ message: 'Utilisateur ou mot de passe incorrect' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({
      _id: user._id,
      email: user.email,
      name: user.name,
      adresse: user.adresse,
      siret: user.siret,
      iban: user.iban,
      token
    });
  } catch (error) {
    console.error('Error in signinUser:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});

exports.sendResetEmail = expressAsyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: 'Utilisateur non trouvé' });
  }
  const resetToken = jwt.sign({ _id: user._id }, process.env.JWT_RESET_SECRET, { expiresIn: '15m' });
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpire = Date.now() + 3 * 60 * 60 * 1000; // 3 hours
  await user.save();

  // Construisez un lien de réinitialisation qui pointe vers l'interface frontend
  const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;
  const mailOptions = {
    from: process.env.SMTP_MAIL,
    to: email,
    subject: 'Réinitialisation de votre mot de passe',
    text: `Bonjour, vous avez demandé la réinitialisation de votre mot de passe. Veuillez cliquer sur le lien suivant pour réinitialiser votre mot de passe: ${resetLink}`
  };
  await transporter.sendMail(mailOptions);
  res.json({ message: 'Un e-mail de réinitialisation a été envoyé.' });
});

// Fonction pour obtenir les informations d'un utilisateur par son ID
exports.getUser = expressAsyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404).send('Utilisateur non trouvé');
    return;
  }
  res.json({
    _id: user._id,
    email: user.email,
    name: user.name,
    adresse: user.adresse,
    siret: user.siret,
    iban: user.iban,
  });
});

exports.getUserInvoices = expressAsyncHandler(async (req, res) => {
  const userId = req.params.id;

  // Vérifiez si l'utilisateur existe
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: 'Utilisateur non trouvé' });
  }

  // Trouver toutes les factures associées à cet utilisateur
  const invoices = await Invoice.find({ userId: userId });
  if (!invoices) {
    return res.status(404).json({ message: 'Pas de factures trouvées pour cet utilisateur' });
  }

  res.json(invoices);
});

exports.updateUser = expressAsyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    Object.keys(updates).forEach(key => {
      if (!['password', 'token', '__v'].includes(key)) {
        user[key] = updates[key];
      }
    });

    console.log("Updating user with ID:", id);
    console.log("Updates to apply:", updates);

    await user.save();
    res.json({
      _id: user._id,
      email: user.email,
      name: user.name,
      adresse: user.adresse,
      siret: user.siret,
      iban: user.iban,
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la mise à jour de l'utilisateur", error: error.message });
  }
});

// Fonction pour vérifier si un utilisateur existe
exports.checkUserExists = expressAsyncHandler(async (req, res) => {
  const { email } = req.body;
  try {
    const userExists = await User.findOne({ email });
    res.status(200).json({ exists: !!userExists });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

exports.resetPassword = expressAsyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_RESET_SECRET);
    const user = await User.findById(decoded._id);

    if (!user || user.resetPasswordToken !== token || user.resetPasswordExpire < Date.now()) {
      return res.status(400).json({ message: 'Le lien de réinitialisation est invalide ou a expiré' });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    console.error('Error in resetPassword:', error);
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
});


exports.deleteUser = expressAsyncHandler(async (req, res) => {
  const { id } = req.params; // ID de l'utilisateur à supprimer
  const { password } = req.body; // Mot de passe fourni pour confirmation

  try {
    const user = await User.findById(id);

    if (!user) {
      console.log(`User with ID ${id} not found`);
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Password does not match');
      return res.status(401).json({ message: 'Mot de passe incorrect' });
    }

    // Supprimer l'utilisateur
    await user.deleteOne();
    res.status(200).json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: "Erreur lors de la suppression de l'utilisateur", error: error.message });
  }
});
