import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getFirebaseEnv } from "./env.js";

const firebaseEnv = getFirebaseEnv();

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: firebaseEnv.projectId,
      clientEmail: firebaseEnv.clientEmail,
      privateKey: firebaseEnv.privateKey,
    }),
  });
}

export const auth = getAuth();
export const firestore = getFirestore();
