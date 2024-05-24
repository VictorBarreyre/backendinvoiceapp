const Stripe = require('stripe');
require('dotenv').config();

const stripe = Stripe(process.env.STRIPE_SECRET_TOKEN);

exports.getProductsAndPrices = async (req, res) => {
    try {
        const products = await stripe.products.list({ active: true });
        const prices = await stripe.prices.list({ active: true });
        const productsWithPrices = products.data.map(product => {
            const productPrices = prices.data.filter(price => price.product === product.id);
            return { ...product, prices: productPrices };
        });
        res.send(productsWithPrices);
    } catch (error) {
        res.status(400).send({ error: { message: error.message } });
    }
};
exports.createSubscription = async (req, res) => {
  const { email, priceId } = req.body;

  console.log('Received createSubscription request with:', req.body);

  if (!email || !priceId) {
      console.error('Email and Price ID are required.');
      return res.status(400).send({ error: { message: 'Email and Price ID are required.' } });
  }

  try {
      // Vérifiez si le client existe déjà
      const existingCustomers = await stripe.customers.list({ email });
      let customer;

      if (existingCustomers.data.length > 0) {
          customer = existingCustomers.data[0];
          console.log('Using existing customer:', customer.id);

          // Vérifiez si le client a déjà un abonnement actif
          const subscriptions = await stripe.subscriptions.list({
              customer: customer.id,
              status: 'active',
              limit: 1
          });

          if (subscriptions.data.length > 0) {
              console.log('Customer already has an active subscription:', subscriptions.data[0].id);
              return res.status(400).send({ error: { message: 'Customer already has an active subscription.' } });
          }
      } else {
          // Créez un nouveau client si aucun n'existe
          customer = await stripe.customers.create({ email: email });
          console.log('New customer created:', customer.id);
      }

      // Créez l'abonnement
      const subscription = await stripe.subscriptions.create({
          customer: customer.id,
          items: [{ price: priceId }],
          payment_behavior: 'default_incomplete',
          expand: ['latest_invoice.payment_intent'],
      });

      console.log('Subscription created:', subscription.id);

      // Vérifiez si le payment intent est disponible
      const paymentIntent = subscription.latest_invoice.payment_intent;
      if (!paymentIntent) {
          throw new Error('Failed to create payment intent');
      }

      console.log('Client Secret:', paymentIntent.client_secret);

      res.send({
          subscriptionId: subscription.id,
          clientSecret: paymentIntent.client_secret,
      });
  } catch (error) {
      console.error('Error creating subscription:', error.message);
      res.status(400).send({ error: { message: error.message } });
  }
};


exports.createCheckoutSession = async (req, res) => {
  const { email, name } = req.body;

  console.log('Received request to create checkout session for email:', email, 'name:', name);

  if (!email || !name) {
    console.log('Email or Name is missing in the request.');
    return res.status(400).send({ error: { message: 'Email and Name are required.' } });
  }

  try {
    // Check if the customer already exists
    const existingCustomers = await stripe.customers.list({ email });
    let customer;

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
      console.log('Using existing customer:', customer.id);
    } else {
      customer = await stripe.customers.create({ email: email, name: name });
      console.log('New customer created:', customer.id);
    }

    // Create a Setup Intent
    const setupIntent = await stripe.setupIntents.create({
      customer: customer.id,
      payment_method_types: ['card'],
    });
    console.log('Setup intent created:', setupIntent.id);

    // Create the Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: 'price_1PHtU500KPylCGutp2WuDoFY', quantity: 1 }], // Replace with your actual price ID
      mode: 'subscription',
      customer: customer.id,
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/cancel`,
    });

    console.log('Checkout session created:', session.id);

    res.send({ clientSecret: setupIntent.client_secret, sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error.message);
    res.status(400).send({ error: { message: error.message } });
  }
};


