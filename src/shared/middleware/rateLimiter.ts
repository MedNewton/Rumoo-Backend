import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { firestore } from "../../config/firebase.js";
import {
  OTP_COLLECTION,
  RATE_LIMIT_MAX_REQUESTS,
  RATE_LIMIT_WINDOW_MINUTES,
} from "../constants.js";

export const otpRateLimiter = createMiddleware(async (c, next) => {
  const body = await c.req.json();
  const email = (body.email as string)?.toLowerCase?.();

  if (!email) {
    return next();
  }

  const windowStart = new Date(
    Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000
  );

  const snapshot = await firestore
    .collection(OTP_COLLECTION)
    .where("email", "==", email)
    .where("createdAt", ">", windowStart)
    .count()
    .get();

  const count = snapshot.data().count;

  if (count >= RATE_LIMIT_MAX_REQUESTS) {
    throw new HTTPException(429, {
      message: "Too many OTP requests. Please wait before trying again.",
    });
  }

  await next();
});
