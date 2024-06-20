const mongoose = require('mongoose');

const factureSchema = new mongoose.Schema({
  number: {
    type: String,
    required:true,
  },
  factureId: {
    type: String,
    required: true,
    unique: true,
  },
  urlImage: {
    type: String,
    required: false, 
  },
  montant: {
    type: Number,
    required: true,
  },
  devise: {
    type: String,
    required:true,
  },
  status: {
    type: String,
    required: true,
    default: 'en attente',
  },
  dateCreation: {
    type: Date,
    default: Date.now,
  },
  emetteur: {
    name: String,
    adresse: String,
    siret: String,
    email: String,
    iban: String,
  },
  destinataire: {
    name: String,
    adresse: String,
    siret: String,
    email: String,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Rendre optionnel pour les utilisateurs non connectés
  }
});

module.exports = mongoose.model('Facture', factureSchema);
