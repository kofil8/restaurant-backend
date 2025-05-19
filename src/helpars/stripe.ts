import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY as string;

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-02-24.acacia',
});

export default stripe;
