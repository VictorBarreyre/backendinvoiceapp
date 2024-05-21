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
      // Create a new customer
      const customer = await stripe.customers.create({ email: email });
      console.log('Customer created:', customer.id);

      // Create the subscription
      const subscription = await stripe.subscriptions.create({
          customer: customer.id,
          items: [{ price: priceId }],
          payment_behavior: 'default_incomplete',
          expand: ['latest_invoice.payment_intent'],
      });

      console.log('Subscription created:', subscription.id);

      // Check if payment intent is available
      const paymentIntent = subscription.latest_invoice.payment_intent;
      if (!paymentIntent) {
          throw new Error('Failed to create payment intent');
      }

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

  if (!email || !name) {
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

    // Check if a setup intent already exists for the customer
    const existingSetupIntents = await stripe.setupIntents.list({
      customer: customer.id,
      limit: 1,
    });

    let setupIntent;
    if (existingSetupIntents.data.length > 0) {
      setupIntent = existingSetupIntents.data[0];
      console.log('Using existing setup intent:', setupIntent.id);
    } else {
      setupIntent = await stripe.setupIntents.create({
        customer: customer.id,
        payment_method_types: ['card'],
      });
      console.log('New setup intent created:', setupIntent.id);
    }

    // Create the Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: 'price_1PHtU500KPylCGutp2WuDoFY', quantity: 1 }], // Remplacez par l'ID de prix réel
      mode: 'subscription',
      customer: customer.id,
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/cancel`,
    });

    console.log('Checkout session created:', session);

    res.send({ clientSecret: setupIntent.client_secret });
  } catch (error) {
    console.error('Error creating checkout session:', error.message);
    res.status(400).send({ error: { message: error.message } });
  }
};

