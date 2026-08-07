import { getGeminiClient, GEMINI_MODEL, generateContentWithRetry } from "./client.js";

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

  const papuaFocusText = papuaContext
    ? `Yes, incorporate mining, tropical logistics, heavy machinery, or Papua energy site standards.`
    : `General`;

  const prompt = `You are a master industrial workforce curriculum developer at "PT. JASA PRIMA PAPUA", a top-tier vocational training center in Papua, Indonesia.
Create a complete, realistic, highly structured course module package for workforce training.

Parameters:
- Course Topic: "${subject}"
- Target Audience: "${targetAudience}"
- Difficulty Level: "${difficulty}"
- Target Number of Modules: ${moduleCount}
- Papua Industrial Focus: ${papuaFocusText}

Return ONLY a valid JSON object matching this exact TypeScript structure:
{
  "title": "String title",
  "category": "String category name",
  "description": "2-3 sentences course description",
  "estimatedHours": "e.g. 16 Hours",
  "prerequisites": "Prerequisite requirements or 'Basic technical background'",
  "modules": [
    {
      "id": "mod-1",
      "title": "Module Title",
      "summary": "Module summary paragraph",
      "lessons": [
        {
          "id": "les-1",
          "title": "Lesson Title",
          "duration": "20 mins",
          "content": "Detailed instructional guide explaining technical protocols, steps, and safety guidelines.",
          "readingMaterial": "In-depth technical reading note with bullet points and standard operating guidelines.",
          "videoPlaceholderTopic": "Short topic summary for video lecture"
        }
      ],
      "quiz": {
        "id": "quiz-1",
        "title": "Module Assessment Quiz",
        "questions": [
          {
            "id": "q-1",
            "question": "Clear multiple choice question",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctIndex": 0,
            "explanation": "Why option 0 is correct"
          }
        ]
      }
    }
  ]
}`;

  const response = await generateContentWithRetry(ai, {
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  const text = response.text || "";
  const course = JSON.parse(text);
  return { course };
}
