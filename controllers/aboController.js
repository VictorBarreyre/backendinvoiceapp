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

exports.createCheckoutSession = async (req, res) => {
  const { email, name, priceId } = req.body;
  console.log('Received request to create checkout session for email:', email, 'name:', name, 'priceId:', priceId);

  if (!email || !name || !priceId) {
    console.log('Email, Name or Price ID is missing in the request.');
    return res.status(400).send({ error: { message: 'Email, Name and Price ID are required.' } });
  }

  try {
    // Check for existing customer
    const existingCustomers = await stripe.customers.list({ email });
    let customer;

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
      console.log('Using existing customer:', customer.id);

      // Check for active subscription
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'active',
        limit: 1
      });

      if (subscriptions.data.length > 0) {
        console.log('Customer already has an active subscription:', subscriptions.data[0].id);
        return res.status(400).send({ error: { message: 'You already have an active subscription.' } });
      }
    } else {
      customer = await stripe.customers.create({ email, name });
      console.log('New customer created:', customer.id);
    }

    // Create subscription
    console.log('Creating subscription with price ID:', priceId);
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });

    console.log('Subscription created with ID:', subscription.id);
    
    const paymentIntent = subscription.latest_invoice.payment_intent;
    console.log('PaymentIntent retrieved with ID:', paymentIntent.id);

    if (paymentIntent) {
      console.log('Sending clientSecret:', paymentIntent.client_secret);
      res.send({
        sessionId: null,  // Not used in this flow
        clientSecret: paymentIntent.client_secret,
      });
    } else {
      console.log('No PaymentIntent found');
      throw new Error('Failed to retrieve payment intent');
    }
  } catch (error) {
    console.error('Error creating subscription:', error.message);
    res.status(500).send({ error: { message: 'Failed to create payment session', details: error.message } });
  }
};

exports.checkActiveSubscription = async (req, res) => {
  const { email } = req.body;

  if (!email) {
      console.error('Email is required.');
      return res.status(400).send({ error: { message: 'Email is required.' } });
  }

  try {
      const existingCustomers = await stripe.customers.list({ email });
      let customer;

      if (existingCustomers.data.length > 0) {
          customer = existingCustomers.data[0];
          console.log('Using existing customer:', customer.id);

          const subscriptions = await stripe.subscriptions.list({
              customer: customer.id,
              status: 'active',
              limit: 1
          });

          if (subscriptions.data.length > 0) {
              console.log('Customer already has an active subscription:', subscriptions.data[0].id);
              return res.send({ hasActiveSubscription: true });
          }
      }

      res.send({ hasActiveSubscription: false });
  } catch (error) {
      console.error('Error checking subscription:', error.message);
      res.status(400).send({ error: { message: error.message } });
  }
};
