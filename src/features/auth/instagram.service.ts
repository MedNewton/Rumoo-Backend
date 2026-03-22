import { Timestamp } from "firebase-admin/firestore";
import { auth, firestore } from "../../config/firebase.js";
import { encrypt } from "../../shared/utils/encryption.js";
import type {
  InstagramShortLivedTokenResponse,
  InstagramLongLivedTokenResponse,
  InstagramProfile,
  InstagramOAuthResult,
} from "./instagram.types.js";

const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID!;
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET!;
const INSTAGRAM_REDIRECT_URI =
  process.env.INSTAGRAM_REDIRECT_URI ??
  "https://rumo-backend-production.up.railway.app/auth/instagram/callback";

export async function handleInstagramCallback(
  code: string
): Promise<InstagramOAuthResult> {
  // Step 1 — Exchange code for short-lived token
  const tokenBody = new URLSearchParams({
    client_id: INSTAGRAM_APP_ID,
    client_secret: INSTAGRAM_APP_SECRET,
    grant_type: "authorization_code",
    redirect_uri: INSTAGRAM_REDIRECT_URI,
    code,
  });

  const shortRes = await fetch("https://api.instagram.com/oauth/access_token", {
    method: "POST",
    body: tokenBody,
  });

  if (!shortRes.ok) {
    throw new Error("token_exchange_failed");
  }

  const shortData = (await shortRes.json()) as InstagramShortLivedTokenResponse;

  // Step 2 — Exchange for long-lived token
  const longUrl = new URL("https://graph.instagram.com/access_token");
  longUrl.searchParams.set("grant_type", "ig_exchange_token");
  longUrl.searchParams.set("client_secret", INSTAGRAM_APP_SECRET);
  longUrl.searchParams.set("access_token", shortData.access_token);

  const longRes = await fetch(longUrl.toString());

  if (!longRes.ok) {
    throw new Error("long_lived_token_failed");
  }

  const longData = (await longRes.json()) as InstagramLongLivedTokenResponse;

  // Step 3 — Fetch Instagram profile
  const profileUrl = new URL("https://graph.instagram.com/me");
  profileUrl.searchParams.set(
    "fields",
    "id,username,account_type,media_count"
  );
  profileUrl.searchParams.set("access_token", longData.access_token);

  const profileRes = await fetch(profileUrl.toString());

  if (!profileRes.ok) {
    throw new Error("profile_fetch_failed");
  }

  const profile = (await profileRes.json()) as InstagramProfile;

  // Step 4 — Firebase Auth: get or create user
  const uid = `instagram:${profile.id}`;

  try {
    await auth.getUser(uid);
  } catch (err: any) {
    if (err.code === "auth/user-not-found") {
      await auth.createUser({
        uid,
        displayName: profile.username,
      });
    } else {
      throw new Error("firebase_error");
    }
  }

  // Step 5 — Write to Firestore profiles/{uid}
  await firestore
    .collection("profiles")
    .doc(uid)
    .set(
      {
        uid,
        instagram_id: profile.id,
        instagram_handle: encrypt(profile.username),
        account_type: profile.account_type,
        media_count: profile.media_count,
        role: "influencer",
        instagram_token: encrypt(longData.access_token),
        instagram_token_expires_at: Timestamp.fromMillis(
          Date.now() + longData.expires_in * 1000
        ),
        subscription_expiry: null,
        updatedAt: Timestamp.now(),
        createdAt: Timestamp.now(),
      },
      { merge: true }
    );

  // Step 6 — Mint Firebase Custom Token
  const customToken = await auth.createCustomToken(uid);

  return { customToken, uid };
}
