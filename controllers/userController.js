const User = require('../models/User');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const expressAsyncHandler = require('express-async-handler');
const nodemailer = require('nodemailer');

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

// Fonction pour inscrire un nouvel utilisateur
exports.signupUser = expressAsyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  console.log("Password before hashing:", password);

  // Vérifier si l'utilisateur existe déjà
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400).json({ message: 'Un utilisateur existe déjà avec cet email' });
    return;
  }

  // Hasher le mot de passe avant de sauvegarder l'utilisateur
  const hashedPassword = await argon2.hash(password);
  console.log("Hashed password with Argon2:", hashedPassword);

  // Créer un nouvel utilisateur
  const user = await User.create({
    email,
    password: hashedPassword,
    name
  });

  if (user) {
    // Envoyer un e-mail de confirmation
    const mailOptions = {
      from: process.env.SMTP_MAIL,
      to: email,
      subject: 'Confirmation d\'inscription',
      text: `Bonjour ${name}, vous êtes maintenant inscrit sur notre plateforme.`,
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

// Fonction pour connecter un utilisateur existant
exports.signinUser = expressAsyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  console.log('Attempting to find user:', email); // Log l'email pour confirmer la tentative de recherche
  const user = await User.findOne({ email });
  if (!user) {
    console.log('No user found with that email'); // Si aucun utilisateur n'est trouvé
    return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
  }

  console.log("Submitted password for verification:", password);  // Affiche le mot de passe soumis pour vérification
  console.log("Stored hashed password for verification:", user.password); // Affiche le mot de passe haché enregistré pour la vérification

  const isMatch = await argon2.verify(user.password, password);
  if (!isMatch) {
    console.log('Password does not match'); // Confirmation que les mots de passe ne correspondent pas
    return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
  }

  console.log('Password matches, signing token...'); // Confirmation de la correspondance des mots de passe
  const token = jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({
    _id: user._id,
    email: user.email,
    name: user.name,
    token
  });
});


// Les autres fonctions restent inchangées puisqu'elles ne manipulent pas les mots de passe directement.



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
    name: user.name
  });
});

exports.sendResetEmail = expressAsyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: 'Utilisateur non trouvé' });
  }
  const resetToken = jwt.sign({ _id: user._id }, process.env.JWT_RESET_SECRET, { expiresIn: '15m' });
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes
  await user.save();

  // Construisez un lien de réinitialisation qui pointe vers l'interface frontend
  const resetLink = `http://yourfrontenddomain.com/reset-password?token=${resetToken}`;
  const mailOptions = {
    from: process.env.SMTP_MAIL,
    to: email,
    subject: 'Réinitialisation de votre mot de passe',
    text: `Bonjour, vous avez demandé la réinitialisation de votre mot de passe. Veuillez cliquer sur le lien suivant pour réinitialiser votre mot de passe: ${resetLink}`
  };
  await transporter.sendMail(mailOptions);
  res.json({ message: 'Un e-mail de réinitialisation a été envoyé.' });
});


exports.resetPassword = expressAsyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  const decoded = jwt.verify(token, process.env.JWT_RESET_SECRET);
  
  const user = await User.findOne({ _id: decoded._id, resetPasswordToken: token, resetPasswordExpire: { $gt: Date.now() } });
  if (!user) {
    return res.status(400).json({ message: 'Token invalide ou expiré' });
  }

  // Hasher le nouveau mot de passe avant de le sauvegarder
  user.password = await bcrypt.hash(newPassword, 12);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.json({ message: 'Mot de passe réinitialisé avec succès.' });
});





// Fonction pour supprimer un utilisateur
exports.deleteUser = expressAsyncHandler(async (req, res) => {
  const { id } = req.params; // ID de l'utilisateur à supprimer

  try {
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Supprimer l'utilisateur
    await user.remove();
    res.status(200).json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: "Erreur lors de la suppression de l'utilisateur", error: error.message });
  }
});