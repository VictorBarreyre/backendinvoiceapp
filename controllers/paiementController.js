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

exports.createSubscription = async (req, res) => {
  try {
    const { email, payment_method, priceId } = req.body;
    console.log("Creating subscription with email:", email, "priceId:", priceId);

    // Créer un client Stripe
    const customer = await stripe.customers.create({
      email: email,
      payment_method: payment_method,
      invoice_settings: {
        default_payment_method: payment_method,
      },
    });

    // Créer un abonnement avec une période d'essai de 30 jours
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      trial_period_days: 30, // Période d'essai de 30 jours
      expand: ['latest_invoice.payment_intent'],
    });

    res.send({
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
    });
  } catch (error) {
    console.error("Failed to create subscription:", error);
    res.status(500).send({ error: error.message });
  }
};
