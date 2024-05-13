const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Facture = require('../models/Facture');

// Assurez-vous que le chemin vers votre modèle Facture est correct
// Ajoutez des fonctions pour créer des comptes Stripe Express et gérer les paiements

exports.createStripeAccountAndInvoice = async (req, res) => {
  try {
    // Vérifiez si l'utilisateur a déjà un compte Stripe
    let accountId = req.user.stripeAccountId;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'FR',
        email: req.user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      accountId = account.id;
      // Enregistrer le nouvel accountId dans votre base de données
    }

    // Créer une facture dans votre système et stocker le lien vers le compte Stripe
    const newInvoice = new Facture({
      userId: req.user._id,
      amount: req.body.total,
      stripeAccountId: accountId,
      // autres détails de la facture
    });
    await newInvoice.save();

    res.json({ success: true, message: "Compte et facture créés avec succès.", accountId });
  } catch (error) {
    console.error("Erreur lors de la création du compte ou de la facture:", error);
    res.status(500).send("Erreur interne du serveur.");
  }
};

exports.createPaymentIntent = async (req, res) => {
  const { amount, stripeAccountId } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // montant en centimes
      currency: 'eur',
      payment_method_types: ['card'],
      transfer_data: {
        destination: stripeAccountId,
      },
    });

    res.json({ success: true, clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Erreur lors de la création du PaymentIntent:", error);
    res.status(500).send({ success: false, message: error.message });
  }
};
