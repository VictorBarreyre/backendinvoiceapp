const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const expressAsyncHandler = require('express-async-handler');

// Fonction pour inscrire un nouvel utilisateur
exports.signupUser = expressAsyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  // Vérifier si l'utilisateur existe déjà
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400).json({ message: 'Un utilisateur existe déjà avec cet email' });
    return;
  }

  // Hasher le mot de passe avant de sauvegarder l'utilisateur
  const hashedPassword = await bcrypt.hash(password, 12);

  // Créer un nouvel utilisateur
  const user = await User.create({
    email,
    password: hashedPassword,
    name
  });

  if (user) {
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

  // Trouver l'utilisateur par email
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
  }

  // Comparer le mot de passe haché avec le mot de passe fourni
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
  }

  // Créer un token si la connexion est réussie
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