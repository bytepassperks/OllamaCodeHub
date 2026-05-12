import Stripe from "stripe";
import { config } from "../config/env.js";

const stripe = config.stripeSecretKey
  ? new Stripe(config.stripeSecretKey)
  : null;

export async function createCheckoutSession(userId, email) {
  if (!stripe) throw new Error("Stripe not configured");

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: email,
    line_items: [{ price: config.stripeProPriceId, quantity: 1 }],
    success_url: `${config.frontendUrl}/dashboard?upgraded=true`,
    cancel_url: `${config.frontendUrl}/dashboard?canceled=true`,
    metadata: { userId },
  });

  return session;
}

export async function createPortalSession(customerId) {
  if (!stripe) throw new Error("Stripe not configured");

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${config.frontendUrl}/dashboard`,
  });

  return session;
}

export async function cancelSubscription(subscriptionId) {
  if (!stripe) throw new Error("Stripe not configured");
  return stripe.subscriptions.cancel(subscriptionId);
}

export async function refundSubscription(paymentIntentId) {
  if (!stripe) throw new Error("Stripe not configured");
  return stripe.refunds.create({ payment_intent: paymentIntentId });
}

export { stripe };
