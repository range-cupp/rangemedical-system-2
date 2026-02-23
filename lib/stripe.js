import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export function getStripe(mode) {
  if (mode === 'test') {
    return new Stripe(process.env.STRIPE_SECRET_KEY_TEST);
  }
  return stripe;
}

export default stripe;
