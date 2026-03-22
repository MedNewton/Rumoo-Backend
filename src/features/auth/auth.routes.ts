import { Hono } from "hono";
import { handleRequestOtp, handleVerifyOtp } from "./auth.controller.js";
import { otpRateLimiter } from "../../shared/middleware/rateLimiter.js";

const authRoutes = new Hono();

authRoutes.post("/request-otp", otpRateLimiter, handleRequestOtp);
authRoutes.post("/verify-otp", handleVerifyOtp);

export { authRoutes };
