const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Facture = require('../models/Facture'); // Ensure the path to your model is correct

const createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency, emetteur, destinataire } = req.body;
    console.log("Reçu pour le paiement :", amount, currency, emetteur, destinataire);
    // Validate and parse client and issuer data safely
    let parsedClient, parsedIssuer;
    try {
      if (!emetteur || !destinataire) {
        throw new Error('Client or issuer data is missing');
      }
      parsedClient = JSON.parse(emetteur);
      parsedIssuer = JSON.parse(destinataire);
    } catch (parseError) {
      console.error("Error parsing client or issuer data:", parseError);
      return res.status(400).send({ success: false, message: "Invalid client or issuer data" });
    }

    console.log(parsedClient,parsedIssuer)

    // Creating the Customer and PaymentMethod with the client's IBAN
    const customer = await stripe.customers.create({
      email: parsedClient.email,
      name: parsedClient.name,
    });

    const iban = parsedClient.iban

    const paymentMethod = await stripe.paymentMethods.create({
      type: 'sepa_debit',
      sepa_debit: { iban }, // Use the IBAN provided by the client
      billing_details: {
        name: parsedClient.name,
        email: parsedClient.email,
      },
    });

    // Attaching the PaymentMethod to the Customer
    await stripe.paymentMethods.attach(paymentMethod.id, { customer: customer.id });

    const ip_address = req.ip || req.headers['x-forwarded-for'] || 'IP_ADDRESS_FALLBACK';

    // Creating the PaymentIntent with the mandate data
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: currency || "eur",
      customer: customer.id,
      payment_method: paymentMethod.id,
      off_session: true,
      confirm: true,
      payment_method_types: ['sepa_debit'],
      mandate_data: {
        customer_acceptance: {
          type: 'online',
          online: {
            ip_address: ip_address,
            user_agent: req.headers['user-agent']
          }
        }
      },
      metadata: {
        client: JSON.stringify(parsedClient),
        issuer: JSON.stringify(parsedIssuer),
      },
    });

  
    res.send({
      success: true,
      message: 'PaymentIntent created and invoice saved successfully.',
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error("Error during the creation of the PaymentIntent and invoice:", error);
    res.status(500).send({ success: false, message: error.message || "Internal server error" });
  }
};

module.exports = { createPaymentIntent };

