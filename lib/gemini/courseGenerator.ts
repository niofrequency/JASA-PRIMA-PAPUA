import { getGeminiClient, GEMINI_MODEL } from "./client";
import { getCachedLessonContent, setCachedLessonContent } from "../cache/geminiCache";
import type { CourseModule, QuizQuestion } from "../../src/types";

// Mirrors SCSlideRaw / SCLessonRaw / SCCourseFullRaw in
// src/services/safetyCultureService.ts. Duplicated here (rather than
// imported) so this backend module has no dependency on frontend code.
export interface SCSlideRaw {
  id: string;
  type: string;
  content: string;
}

export interface SCLessonRaw {
  id: string;
  title: string;
  description?: string;
  slides: SCSlideRaw[];
}

export interface SCCourseFullRaw {
  id: string;
  title: string;
  description?: string;
  lessons: SCLessonRaw[];
}

export interface GeneratedCourseData {
  title: string;
  category: string;
  description: string;
  estimatedHours: string;
  prerequisites: string;
  modules: CourseModule[];
}

function determineCategory(subject: string): string {
  const lower = subject.toLowerCase();
  if (lower.includes("heavy") || lower.includes("machine") || lower.includes("excavator") || lower.includes("mining")) {
    return "Heavy Machinery & Mining";
  }
  if (lower.includes("electric") || lower.includes("high voltage") || lower.includes("power") || lower.includes("plc")) {
    return "Electrical & Industrial Engineering";
  }
  if (lower.includes("safety") || lower.includes("ehs") || lower.includes("hazard") || lower.includes("compliance")) {
    return "Safety & Compliance";
  }
  if (lower.includes("solar") || lower.includes("renewable") || lower.includes("energy") || lower.includes("grid")) {
    return "Renewable Energy & Infrastructure";
  }
  return "Industrial Operations & Technical Training";
}

/**
 * Transforms raw SafetyCulture course data (course -> lessons -> slides)
 * into a full structured platform course using the Gemini API.
 *
 * Runs server-side only. Throws if the Gemini client isn't configured or if
 * a generation call fails — callers (the /api/ai/generate-from-safetyculture
 * route) are responsible for deciding what fallback behavior to return.
 */
export async function generateCourseFromSafetyCultureServer(
  scData: SCCourseFullRaw
): Promise<GeneratedCourseData> {
  const ai = getGeminiClient();
  if (!ai) {
    throw new Error("Gemini API key not configured on server.");
  }

  const modules: CourseModule[] = [];

  for (const [idx, lesson] of (scData.lessons || []).entries()) {
    const modNum = idx + 1;

    const combinedSlideContent =
      lesson.slides && lesson.slides.length > 0
        ? lesson.slides.map((s) => s.content).join("\n\n")
        : `Standard operating procedures for ${lesson.title}. Always follow PT. JASA PRIMA PAPUA safety protocols on site.`;

    let formattedContent: string;
    let quizTitle = `Assessment: ${lesson.title}`;
    let generatedQuestions: QuizQuestion[] = [];

    const cached = await getCachedLessonContent(lesson.id, combinedSlideContent);

    if (cached) {
      formattedContent = cached.formattedContent;
      quizTitle = cached.quizTitle;
      generatedQuestions = cached.quiz;
    } else {
      // Prompt 1: Reformat and Summarize Lesson Content
      const contentPrompt = `
        You are an expert instructional designer. Transform this raw training material from SafetyCulture into structured HTML or Markdown for a web learning portal.
        Include standard headers (h2, h3), bullet points, and key emphasis.
        At the end, include a clear "Key Takeaways" section with 3-4 bullet points.

        Raw Material:
        ${combinedSlideContent}
      `;

      const contentRes = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: contentPrompt,
      });
      formattedContent = contentRes.text || "";

      // Prompt 2: Generate Quiz for the Module
      const quizPrompt = `
        Based on the following content, generate a 2-question multiple-choice quiz.
        Return ONLY valid JSON matching this exact schema:
        {
          "title": "Module Quiz",
          "questions": [
            {
              "id": "q1",
              "question": "Question string",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correctIndex": 0,
              "explanation": "Why this answer is correct"
            }
          ]
        }

        Content:
        ${combinedSlideContent}
      `;

      const quizRes = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: quizPrompt,
        config: { responseMimeType: "application/json" },
      });

      try {
        const parsedQuiz = JSON.parse(quizRes.text || "{}");
        quizTitle = parsedQuiz.title || quizTitle;
        generatedQuestions = (parsedQuiz.questions || []).map((q: any, qIdx: number) => ({
          id: `sc-q-${lesson.id}-${qIdx}`,
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex !== undefined ? q.correctIndex : q.correctAnswer,
          explanation: q.explanation,
        }));
      } catch (err) {
        console.warn(`Failed to parse quiz JSON for lesson ${lesson.id}, skipping AI quiz generation.`, err);
      }

      // Fire-and-forget-ish: await it so we don't return before the write
      // lands, but a cache write failure is logged and swallowed inside
      // setCachedLessonContent rather than failing the request.
      await setCachedLessonContent(lesson.id, combinedSlideContent, {
        formattedContent,
        quizTitle,
        quiz: generatedQuestions,
      });
    }

    modules.push({
      id: `sc-mod-${lesson.id || modNum}`,
      title: `Module ${modNum}: ${lesson.title}`,
      summary: `Enhanced learning module for ${lesson.title}`,
      lessons: [
        {
          id: `sc-les-${lesson.id || modNum}-1`,
          title: `Lesson ${modNum}.1: ${lesson.title} - Main Content`,
          duration: "15 mins",
          content: formattedContent,
          readingMaterial: `**SafetyCulture Reference Data:**\n- Imported directly from verified accredited K3 training slides.\n- Follow local Papuan environmental and ESDM safety standards.`,
          videoPlaceholderTopic: `Practical Safety Demonstration: ${lesson.title}`,
        },
      ],
      quiz:
        generatedQuestions.length > 0
          ? {
              id: `sc-quiz-${lesson.id || modNum}`,
              title: quizTitle,
              passingScorePercent: 80,
              questions: generatedQuestions,
            }
          : undefined,
    });
  }

  return {
    title: scData.title || "SafetyCulture Accredited Training Program",
    category: determineCategory(scData.title || ""),
    description:
      scData.description ||
      "Imported SafetyCulture workplace safety and operational compliance module enhanced for PT. JASA PRIMA PAPUA using Gemini AI.",
    estimatedHours: `${Math.max(modules.length * 2, 2)} Hours`,
    prerequisites: "Basic Industrial K3 Awareness & Site Safety Induction",
    modules,
  };
}
