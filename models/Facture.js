const mongoose = require('mongoose');

const factureSchema = new mongoose.Schema({
  factureId: {
    type: String,
    required: true,
    unique: true,
  },
  userId: { // Champ pour relier la facture à l'utilisateur
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  urlImage: {
    type: String,
    required: false, 
  },
  montant: {
    type: Number,
    required: true,
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
    iban: String,
  },
  // Vous pouvez ajouter d'autres champs selon vos besoins
});

module.exports = mongoose.model('Facture', factureSchema);
