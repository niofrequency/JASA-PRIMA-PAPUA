import { GoogleGenAI } from "@google/genai";

/**
 * Server-only Gemini client factory.
 *
 * IMPORTANT: This file must never be imported from anything under `src/`
 * (the Vite-bundled frontend). It reads GEMINI_API_KEY from process.env,
 * which is only available server-side. If this ever gets imported into a
 * client bundle, Vite will fail to resolve `process.env.GEMINI_API_KEY`
 * (good — that's a build-time signal something's wrong) rather than silently
 * leaking the key the way `import.meta.env.VITE_*` does.
 */
export const GEMINI_MODEL = "gemini-3.6-flash";

export function getGeminiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

/**
 * Extracts the server-suggested retry delay (in ms) from a Gemini 429
 * error, e.g. `{"retryDelay":"22s"}` inside the error's details array.
 * Falls back to null if not present/parseable.
 */
function extractRetryDelayMs(err: any): number | null {
  try {
    const details = err?.error?.details || err?.details;
    const retryInfo = Array.isArray(details)
      ? details.find((d: any) => typeof d?.retryDelay === "string")
      : null;
    if (!retryInfo) return null;
    const match = /^(\d+(?:\.\d+)?)s$/.exec(retryInfo.retryDelay);
    return match ? Math.ceil(parseFloat(match[1]) * 1000) : null;
  } catch {
    return null;
  }
}

/**
 * Calls `ai.models.generateContent` with retry/backoff on 429 (rate limit)
 * errors. Gemini's free tier is heavily rate-limited (5 requests/minute per
 * model as of this writing) — a single course import can need 2 Gemini
 * calls per lesson (content + quiz), so a 5+ lesson course routinely hits
 * this on the free tier. Respects the API's own `retryDelay` hint when
 * present; otherwise backs off exponentially. Gives up after `maxAttempts`
 * and rethrows the last error.
 */
export async function generateContentWithRetry(
  ai: GoogleGenAI,
  params: Parameters<GoogleGenAI["models"]["generateContent"]>[0],
  maxAttempts = 5
): Promise<Awaited<ReturnType<GoogleGenAI["models"]["generateContent"]>>> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await ai.models.generateContent(params);
    } catch (err: any) {
      const status = err?.status ?? err?.error?.code;
      const isRateLimit = status === 429;
      if (!isRateLimit || attempt === maxAttempts - 1) throw err;

      lastErr = err;
      const suggested = extractRetryDelayMs(err);
      const waitMs = suggested ?? 1000 * 2 ** attempt; // fall back to exponential backoff
      console.warn(`[gemini] Rate limited (attempt ${attempt + 1}/${maxAttempts}), waiting ${waitMs}ms before retry.`);
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
  throw lastErr;
}
