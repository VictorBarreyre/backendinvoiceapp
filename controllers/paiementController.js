const stripe = require('stripe')(process.env.STRIPE_SECRET_TOKEN);

exports.createCheckoutSession = async (req, res) => {
  try {
    const { amount, currency, emetteur } = req.body;
    console.log("Creating checkout session with amount:", amount, "currency:", currency, "issuer:", emetteur);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: 'Facture',
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/payment-error`,
      automatic_tax: { enabled: true },
    });

    console.log("Checkout Session created successfully", session.id);
    res.send({ sessionId: session.id });
  } catch (error) {
    console.error("Failed to create checkout session:", error);
    res.status(500).send({ error: error.message });
  }
};

exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount } = req.body;
    console.log("Creating payment intent with amount:", amount);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'eur', // Devise
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log("Payment Intent created successfully", paymentIntent.id);
    res.send({
      clientSecret: paymentIntent.client_secret, // Envoyer le client secret pour finaliser le paiement côté client
    });
  } catch (error) {
    console.error("Failed to create payment intent:", error);
    res.status(500).send({ error: error.message });
  }
};
