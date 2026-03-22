import type { Context } from "hono";
import { handleInstagramCallback } from "./instagram.service.js";

const ERROR_REASON_MAP: Record<string, string> = {
  token_exchange_failed: "token_exchange_failed",
  long_lived_token_failed: "token_exchange_failed",
  profile_fetch_failed: "profile_fetch_failed",
  firebase_error: "firebase_error",
};

export async function handleInstagramOAuthCallback(c: Context) {
  const error = c.req.query("error");
  if (error) {
    return c.redirect("rumoo://auth/error?reason=instagram_denied");
  }

  const code = c.req.query("code");
  if (!code) {
    return c.redirect("rumoo://auth/error?reason=invalid_callback");
  }

  try {
    const { customToken } = await handleInstagramCallback(code);
    return c.redirect(
      `rumoo://auth/instagram/callback?customToken=${encodeURIComponent(customToken)}`
    );
  } catch (err: any) {
    const reason = ERROR_REASON_MAP[err.message] ?? "server_error";
    return c.redirect(`rumoo://auth/error?reason=${reason}`);
  }
}
