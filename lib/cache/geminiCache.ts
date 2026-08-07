import { createHash } from "crypto";
import { getAdminDb } from "../firebaseAdmin.js";

const COLLECTION = "ai_content_cache";

/**
 * Content-hash-keyed cache: the cache key is derived from the lessonId PLUS
 * a hash of the raw slide content that was fed to Gemini. If a course
 * author edits a slide in SafetyCulture, the hash changes, the old cache
 * entry is simply never looked up again, and a fresh Gemini call happens
 * once for the new content. Old entries are harmless leftovers (Firestore
 * storage is cheap) — no invalidation logic needed.
 */
export function contentHash(input: string): string {
  return createHash("sha256").update(input).digest("hex").slice(0, 24);
}

export interface CachedLessonContent {
  formattedContent: string;
  quizTitle: string;
  quiz: Array<{ id: string; question: string; options: string[]; correctIndex: number; explanation: string }>;
  cachedAt: string;
}

/**
 * Returns the cached entry, or null if there's no cache configured
 * (FIREBASE_* env vars missing) or no entry for this key. Never throws —
 * caching is a pure optimization, so failures here should fall through to
 * calling Gemini rather than breaking the request.
 */
export async function getCachedLessonContent(lessonId: string, rawContent: string): Promise<CachedLessonContent | null> {
  const db = getAdminDb();
  if (!db) return null;

  try {
    const key = `${lessonId}:${contentHash(rawContent)}`;
    const doc = await db.collection(COLLECTION).doc(key).get();
    if (!doc.exists) return null;
    return doc.data() as CachedLessonContent;
  } catch (err) {
    console.warn(`[geminiCache] Read failed for lesson ${lessonId}, falling back to live generation.`, err);
    return null;
  }
}

export async function setCachedLessonContent(
  lessonId: string,
  rawContent: string,
  value: Omit<CachedLessonContent, "cachedAt">
): Promise<void> {
  const db = getAdminDb();
  if (!db) return;

  try {
    const key = `${lessonId}:${contentHash(rawContent)}`;
    await db
      .collection(COLLECTION)
      .doc(key)
      .set({ ...value, cachedAt: new Date().toISOString() });
  } catch (err) {
    console.warn(`[geminiCache] Write failed for lesson ${lessonId}. Continuing without caching this entry.`, err);
  }
}
