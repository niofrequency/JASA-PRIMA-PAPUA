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
