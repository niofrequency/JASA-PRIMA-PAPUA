import { getGeminiClient, GEMINI_MODEL } from "./client.js";

export interface GenerateCourseParams {
  subject: string;
  targetAudience: string;
  difficulty: string;
  moduleCount?: number;
  papuaContext?: boolean;
}

export interface GenerateCourseResult {
  fallback: true;
  message: string;
}

/**
 * Generates a brand-new course package from scratch (no SafetyCulture
 * input) via Gemini. Returns either the parsed course JSON, or a
 * `{fallback: true, ...}` marker if Gemini isn't configured — callers
 * decide what to do with the fallback case.
 */
export async function generateFreshCourse(
  params: GenerateCourseParams
): Promise<{ course: any } | GenerateCourseResult> {
  const { subject, targetAudience, difficulty, moduleCount = 3, papuaContext = true } = params;
  const ai = getGeminiClient();

  if (!ai) {
    return {
      fallback: true,
      message: "Gemini API key not configured on server. Fallback generator active.",
    };
  }

  const prompt = `You are a master industrial workforce curriculum developer at "PT. JASA PRIMA PAPUA", a top-tier vocational training center in Papua, Indonesia.
Create a complete, realistic, highly structured course module package for workforce training.

Parameters:
- Course Topic: "${subject}"
- Target Audience: "${targetAudience}"
- Difficulty Level: "${difficulty}"
- Target Number of Modules: ${moduleCount}
- Papua Industrial Focus: ${papuaContext ? "Yes, incorporate mining, tropical logistics, heavy machinery, or Papua
