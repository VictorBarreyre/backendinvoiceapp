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
        const customer = await stripe.customers.create({ email: email });
        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: priceId }],
            payment_behavior: 'default_incomplete',
            expand: ['latest_invoice.payment_intent'],
        });

        console.log('Subscription created:', subscription.id);

        res.send({
            subscriptionId: subscription.id,
            clientSecret: subscription.latest_invoice.payment_intent.client_secret,
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
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{ price: 'price_1PHtU500KPylCGutp2WuDoFY', quantity: 1 }], // Replace with actual price ID or dynamic logic
            mode: 'subscription',
            success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin}/cancel`,
        });

        res.send({ clientSecret: session.client_secret });
    } catch (error) {
        console.error('Error creating checkout session:', error.message);
        res.status(400).send({ error: { message: error.message } });
    }
};
