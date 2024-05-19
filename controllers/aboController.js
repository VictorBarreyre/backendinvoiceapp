const Stripe = require('stripe');
require('dotenv').config();

const stripe = Stripe(process.env.STRIPE_SECRET_TOKEN);

exports.getProductsAndPrices = async (req, res) => {
    try {
      // Récupérer les produits actifs
      const products = await stripe.products.list({ active: true });
  
      // Récupérer les prix associés aux produits
      const prices = await stripe.prices.list({ active: true });
  
      // Associer les prix aux produits
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
  const { email, payment_method } = req.body;

  try {
    // Créer un client Stripe
    const customer = await stripe.customers.create({
      email: email,
      payment_method: payment_method,
      invoice_settings: {
        default_payment_method: payment_method,
      },
    });

    // Créer un abonnement
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ plan: 'plan_id' }], // Remplacez 'plan_id' par l'ID de votre plan
      expand: ['latest_invoice.payment_intent'],
    });

    res.send({
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
    });
  } catch (error) {
    res.status(400).send({ error: { message: error.message } });
  }
};
