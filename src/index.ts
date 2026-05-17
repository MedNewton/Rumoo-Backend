import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { authRoutes } from "./features/auth/auth.routes.js";
import { errorHandler } from "./shared/middleware/errorHandler.js";

const app = new Hono();

// CORS — allow the production web app + Vercel preview deploys + local dev.
// CORS_ALLOWED_ORIGINS can override with a comma-separated list.
const envOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const defaultOrigins = [
  "https://rumoo.vercel.app",
  "http://localhost:8081",
  "http://localhost:19006",
  "http://localhost:3000",
];

const allowedOrigins = envOrigins.length > 0 ? envOrigins : defaultOrigins;

app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return origin;
      if (allowedOrigins.includes(origin)) return origin;
      // Allow any Vercel preview deploy for this project.
      if (/^https:\/\/rumoo-[a-z0-9-]+\.vercel\.app$/.test(origin)) return origin;
      return null;
    },
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
    maxAge: 86400,
  }),
);

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
app.route("/auth", authRoutes);

// TODO: Phase 2 — Subscription webhook routes (Stripe / StoreKit)

const port = parseInt(process.env.PORT ?? "3000", 10);

serve({ fetch: app.fetch, port }, () => {
  console.log(`Rumoo server running on port ${port}`);
});
