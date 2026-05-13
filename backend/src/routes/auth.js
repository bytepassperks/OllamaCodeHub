import bcrypt from "bcryptjs";
import prisma from "../config/database.js";
import { signToken, authenticateUser, requireAdmin } from "../middleware/auth.js";

export default async function authRoutes(fastify) {
  // Public: Login
  fastify.post("/auth/login", async (request, reply) => {
    const { email, password } = request.body || {};
    if (!email || !password) {
      return reply.code(400).send({ error: "Email and password required" });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !user.passwordHash) {
      return reply.code(401).send({ error: "Invalid email or password" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return reply.code(401).send({ error: "Invalid email or password" });
    }

    if (user.banned) {
      return reply.code(403).send({ error: "Account suspended" });
    }

    const token = signToken(user);
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  });

  // Public: Signup (creates account with USER role)
  fastify.post("/auth/signup", async (request, reply) => {
    const { email, password, name } = request.body || {};
    if (!email || !password) {
      return reply.code(400).send({ error: "Email and password required" });
    }

    if (password.length < 8) {
      return reply.code(400).send({ error: "Password must be at least 8 characters" });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return reply.code(409).send({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name: name || null,
        passwordHash,
        role: "USER",
      },
    });

    const token = signToken(user);
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  });

  // Authenticated: Get current user
  fastify.get(
    "/auth/me",
    { preHandler: [authenticateUser] },
    async (request) => {
      const user = request.user;
      return {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        queriesUsed: user.queriesUsed,
        createdAt: user.createdAt,
      };
    }
  );

  // Admin: Generate password for a user (admin creates/resets passwords)
  fastify.post(
    "/admin/users/:userId/password",
    { preHandler: [authenticateUser, requireAdmin] },
    async (request, reply) => {
      const { password } = request.body || {};
      if (!password || password.length < 8) {
        return reply.code(400).send({ error: "Password must be at least 8 characters" });
      }

      const user = await prisma.user.findUnique({ where: { id: request.params.userId } });
      if (!user) {
        return reply.code(404).send({ error: "User not found" });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });

      return { success: true, message: `Password updated for ${user.email}` };
    }
  );

  // Admin: Create a new user with a password
  fastify.post(
    "/admin/users/create",
    { preHandler: [authenticateUser, requireAdmin] },
    async (request, reply) => {
      const { email, password, role = "USER", name } = request.body || {};
      if (!email || !password) {
        return reply.code(400).send({ error: "Email and password required" });
      }

      const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (existing) {
        return reply.code(409).send({ error: "Email already registered" });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name: name || null,
          passwordHash,
          role: ["USER", "PRO", "ADMIN"].includes(role) ? role : "USER",
        },
      });

      return {
        id: user.id,
        email: user.email,
        role: user.role,
      };
    }
  );
}
