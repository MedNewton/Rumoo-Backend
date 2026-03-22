import type { Context } from "hono";
import { RequestOtpSchema, VerifyOtpSchema } from "./auth.types.js";
import * as authService from "./auth.service.js";

export async function handleRequestOtp(c: Context) {
  const body = await c.req.json();
  const result = RequestOtpSchema.safeParse(body);

  if (!result.success) {
    return c.json({ error: "Invalid email address" }, 422);
  }

  await authService.requestOtp(result.data.email);
  return c.json({ message: "OTP sent" }, 200);
}

export async function handleVerifyOtp(c: Context) {
  const body = await c.req.json();
  const result = VerifyOtpSchema.safeParse(body);

  if (!result.success) {
    return c.json({ error: "Invalid input. Email and 6-digit OTP required." }, 422);
  }

  const { customToken } = await authService.verifyOtp(
    result.data.email,
    result.data.otp
  );
  return c.json({ customToken }, 200);
}
