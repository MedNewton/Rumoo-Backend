import { Timestamp } from "firebase-admin/firestore";
import { auth, firestore } from "../../config/firebase.js";
import { OTP_COLLECTION, OTP_EXPIRY_MINUTES, OTP_MAX_ATTEMPTS } from "../../shared/constants.js";
import { generateOtp, hashOtp } from "../../shared/utils/otp.js";
import { sendOtpEmail } from "../../shared/utils/email.js";
import type { OtpDocument } from "./auth.types.js";

export async function requestOtp(email: string): Promise<void> {
  const normalizedEmail = email.toLowerCase();
  const otp = generateOtp();
  const hashedOtp = hashOtp(otp);

  const docRef = firestore.collection(OTP_COLLECTION).doc(normalizedEmail);
  await docRef.set({
    email: normalizedEmail,
    otp: hashedOtp,
    expiresAt: Timestamp.fromDate(
      new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)
    ),
    attempts: 0,
    createdAt: Timestamp.now(),
  });

  await sendOtpEmail(normalizedEmail, otp, OTP_EXPIRY_MINUTES);
}

export async function verifyOtp(
  email: string,
  otp: string
): Promise<{ customToken: string; isNewUser: boolean }> {
  const normalizedEmail = email.toLowerCase();
  const docRef = firestore.collection(OTP_COLLECTION).doc(normalizedEmail);
  const doc = await docRef.get();

  if (!doc.exists) {
    const error = new Error("No OTP requested for this email");
    (error as any).status = 404;
    throw error;
  }

  const data = doc.data() as OtpDocument;

  if (data.expiresAt.toDate() < new Date()) {
    await docRef.delete();
    const error = new Error("OTP expired");
    (error as any).status = 410;
    throw error;
  }

  if (data.attempts >= OTP_MAX_ATTEMPTS) {
    await docRef.delete();
    const error = new Error("Too many attempts");
    (error as any).status = 429;
    throw error;
  }

  const hashedInput = hashOtp(otp);

  if (hashedInput !== data.otp) {
    await docRef.update({ attempts: data.attempts + 1 });
    const error = new Error("Invalid OTP");
    (error as any).status = 401;
    throw error;
  }

  await docRef.delete();

  let uid: string;
  try {
    const user = await auth.getUserByEmail(normalizedEmail);
    uid = user.uid;
  } catch {
    const user = await auth.createUser({ email: normalizedEmail });
    uid = user.uid;
  }

  // Check/create profile document and determine isNewUser
  const profileRef = firestore.collection("profiles").doc(uid);
  const profileSnap = await profileRef.get();

  let isNewUser: boolean;
  if (!profileSnap.exists) {
    await profileRef.set({
      email: normalizedEmail,
      role: null,
      createdAt: new Date().toISOString(),
    });
    isNewUser = true;
  } else {
    const profileData = profileSnap.data();
    isNewUser = profileData?.role == null;
  }

  const customToken = await auth.createCustomToken(uid);
  return { customToken, isNewUser };
}
