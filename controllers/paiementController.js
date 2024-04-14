const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Facture = require('../models/Facture'); // Assurez-vous que le chemin vers votre modèle est correct


const createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency, emetteur, destinataire } = req.body;
    console.log("Reçu pour le paiement :", amount, currency, emetteur, destinataire);

  
    // Créez un PaymentIntent avec Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency || "eur",
      metadata: {
        emetteur: JSON.stringify(emetteur),  // Assurez-vous de convertir en chaîne si nécessaire
        destinataire: JSON.stringify(destinataire),
      },
     // Stockez l'ID de la facture dans les métadonnées pour référence
    });



    // Renvoyez le clientSecret et l'ID de la facture au client pour permettre le paiement
    res.send({
      success: true,
      message: 'PaymentIntent créé et facture sauvegardée avec succès.',
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Erreur lors de la création du PaymentIntent et de la facture:", error);
    res.status(500).send({ success: false, message: error.message });
  }
};

if (stripe) {
  console.log("Accès à la clé secrète Stripe réussi !");
} else {
  console.log("Échec de l'accès à la clé secrète Stripe. Veuillez vérifier votre configuration.");
}

console.log("PORT:", process.env.PORT);

module.exports = { createPaymentIntent };
