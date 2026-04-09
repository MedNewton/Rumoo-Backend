import { Hono } from "hono";
import { handleRequestOtp, handleVerifyOtp } from "./auth.controller.js";
import { handleInstagramOAuthCallback } from "./instagram.controller.js";
import { otpRateLimiter } from "../../shared/middleware/rateLimiter.js";

const authRoutes = new Hono();

authRoutes.post("/request-otp", otpRateLimiter, handleRequestOtp);
authRoutes.post("/verify-otp", handleVerifyOtp);
authRoutes.post("/otp/request", otpRateLimiter, handleRequestOtp);
authRoutes.post("/otp/verify", handleVerifyOtp);
authRoutes.get("/instagram/callback", handleInstagramOAuthCallback);

export { authRoutes };
