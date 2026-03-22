import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { authRoutes } from "./features/auth/auth.routes.js";
import { errorHandler } from "./shared/middleware/errorHandler.js";

const app = new Hono();

// Global security headers
app.use("*", async (c, next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
});

// Global error handler
app.onError(errorHandler);

// Health check
app.get("/api/v1/health", (c) => c.json({ status: "ok" }));

// Auth routes
app.route("/api/v1/auth", authRoutes);

// TODO: Phase 2 — Subscription webhook routes (Stripe / StoreKit)

const port = parseInt(process.env.PORT ?? "3000", 10);

serve({ fetch: app.fetch, port }, () => {
  console.log(`Rumoo server running on port ${port}`);
});
