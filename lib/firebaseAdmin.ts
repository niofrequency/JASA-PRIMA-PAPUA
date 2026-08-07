import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * Server-side Firestore access via firebase-admin — separate from
 * src/services/firebase.ts, which initializes the client SDK for
 * browser-side auth and is subject to Firestore security rules.
 *
 * This admin instance authenticates with a service account and bypasses
 * security rules, which is what a trusted backend cache layer needs (the
 * frontend should never write directly to the ai_content_cache collection).
 *
 * Required env vars (get these from Firebase Console -> Project Settings
 * -> Service Accounts -> Generate new private key):
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY   (paste the full PEM key; if your host stores env
 *                           vars as single-line strings, keep the literal
 *                           "\n" sequences — they're unescaped below)
 *
 * If these aren't set, getAdminDb() returns null and callers should treat
 * caching as unavailable (fail open — always call Gemini, never crash the
 * request over a missing cache).
 */

let cachedDb: Firestore | null | undefined; // undefined = not yet attempted

function getAdminApp(): App | null {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKeyRaw) return null;

  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");

  const existing = getApps();
  if (existing.length > 0) return existing[0];

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

export function getAdminDb(): Firestore | null {
  if (cachedDb !== undefined) return cachedDb;

  const app = getAdminApp();
  cachedDb = app ? getFirestore(app) : null;
  return cachedDb;
}
