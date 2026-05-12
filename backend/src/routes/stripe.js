import { authenticateUser } from "../middleware/auth.js";
import { createCheckoutSession, createPortalSession, stripe } from "../services/stripe.js";
import { config } from "../config/env.js";
import prisma from "../config/database.js";

export default async function stripeRoutes(fastify) {
  fastify.post(
    "/stripe/checkout",
    { preHandler: [authenticateUser] },
    async (request) => {
      const user = request.user;
      const session = await createCheckoutSession(user.id, user.email);
      return { url: session.url };
    }
  );

  fastify.post(
    "/stripe/portal",
    { preHandler: [authenticateUser] },
    async (request, reply) => {
      const sub = await prisma.subscription.findUnique({
        where: { userId: request.user.id },
      });
      if (!sub?.stripeCustomerId) {
        return reply.code(400).send({ error: "No active subscription" });
      }
      const session = await createPortalSession(sub.stripeCustomerId);
      return { url: session.url };
    }
  );

  fastify.post("/stripe/webhook", {
    config: { rawBody: true },
    handler: async (request, reply) => {
      if (!stripe) return reply.code(500).send({ error: "Stripe not configured" });

      const sig = request.headers["stripe-signature"];
      let event;

      try {
        event = stripe.webhooks.constructEvent(
          request.rawBody || request.body,
          sig,
          config.stripeWebhookSecret
        );
      } catch (err) {
        return reply.code(400).send({ error: `Webhook error: ${err.message}` });
      }

      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object;
          const userId = session.metadata.userId;
          if (userId) {
            await prisma.subscription.upsert({
              where: { userId },
              create: {
                userId,
                stripeCustomerId: session.customer,
                stripeSubId: session.subscription,
                status: "ACTIVE",
                plan: "pro",
              },
              update: {
                stripeCustomerId: session.customer,
                stripeSubId: session.subscription,
                status: "ACTIVE",
                plan: "pro",
              },
            });
            await prisma.user.update({
              where: { id: userId },
              data: { role: "PRO" },
            });
          }
          break;
        }

        case "customer.subscription.updated": {
          const sub = event.data.object;
          const dbSub = await prisma.subscription.findFirst({
            where: { stripeSubId: sub.id },
          });
          if (dbSub) {
            await prisma.subscription.update({
              where: { id: dbSub.id },
              data: {
                status: sub.status === "active" ? "ACTIVE" : "PAST_DUE",
                currentPeriodEnd: new Date(sub.current_period_end * 1000),
              },
            });
          }
          break;
        }

        case "customer.subscription.deleted": {
          const sub = event.data.object;
          const dbSub = await prisma.subscription.findFirst({
            where: { stripeSubId: sub.id },
          });
          if (dbSub) {
            await prisma.subscription.update({
              where: { id: dbSub.id },
              data: { status: "CANCELED", plan: "free" },
            });
            await prisma.user.update({
              where: { id: dbSub.userId },
              data: { role: "USER" },
            });
          }
          break;
        }
      }

      return { received: true };
    },
  });
}
