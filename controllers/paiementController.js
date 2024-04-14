const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Facture = require('../models/Facture'); // Assurez-vous que le chemin vers votre modèle est correct

const createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency, emetteur, destinataire } = req.body;
    console.log("Reçu pour le paiement :", amount, currency, emetteur, destinataire);

    // Parse JSON objects from strings
    const parsedEmetteur = JSON.parse(emetteur);
    const parsedDestinataire = JSON.parse(destinataire);

    // Créer un Customer sur Stripe
    const customer = await stripe.customers.create({
      email: parsedEmetteur.email,
      name: parsedEmetteur.name,
      description: `Customer for ${parsedEmetteur.name}`,
    });

    // Créer un PaymentMethod de type SEPA Debit
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'sepa_debit',
      sepa_debit: { iban: parsedEmetteur.iban },
      billing_details: {
        name: parsedEmetteur.name,
        email: parsedEmetteur.email,
      },
    });

    // Attacher le PaymentMethod au Customer
    await stripe.paymentMethods.attach(paymentMethod.id, {
      customer: customer.id,
    });

    // Créer un PaymentIntent avec le PaymentMethod
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency || "eur",
      customer: customer.id,
      payment_method: paymentMethod.id,
      off_session: true,
      confirm: true,
      metadata: {
        emetteur: JSON.stringify(parsedEmetteur),
        destinataire: JSON.stringify(parsedDestinataire),
      },
    });

    // Renvoyer le clientSecret et l'ID de la facture au client pour permettre le paiement
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
