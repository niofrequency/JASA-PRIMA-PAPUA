import { getGeminiClient, GEMINI_MODEL } from "./client";

export interface ChatTurn {
  role: "user" | "ai";
  text: string;
}

/**
 * Answers a learner's question about the current lesson, grounded strictly
 * in the lesson content passed in (no outside knowledge for safety-critical
 * claims — see prompt below). Runs server-side only; the frontend never
 * calls Gemini directly.
 */
export async function answerCourseChatQuestion(
  lessonTitle: string,
  lessonContent: string,
  question: string,
  history: ChatTurn[]
): Promise<string> {
  const ai = getGeminiClient();
  if (!ai) {
    throw new Error("Gemini API key not configured on server.");
  }

  // Keep only the last few turns — the frontend also caps this, but cap
  // again here defensively so a long-running session doesn't balloon the
  // prompt token count on every message.
  const recentHistory = history.slice(-8);
  const historyText = recentHistory
    .map((turn) => `${turn.role === "user" ? "Learner" : "Assistant"}: ${turn.text}`)
    .join("\n");

  const prompt = `You are a helpful training assistant embedded in a workplace safety course at PT. JASA PRIMA PAPUA.
Answer the learner's question using ONLY the LESSON CONTENT provided below.

Rules:
- If the answer isn't in the lesson content, say so clearly and suggest they ask their supervisor or check the full course material — do not guess or use outside knowledge for safety-critical claims.
- Keep answers concise (2-4 sentences) unless the learner asks for more detail.
- Be encouraging and plain-spoken; this is workplace training, not an exam.
- Never contradict the lesson content.

LESSON: ${lessonTitle}

LESSON CONTENT:
${lessonContent}

CONVERSATION HISTORY:
${historyText || "(none yet)"}

LEARNER QUESTION:
${question}`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
  });

  return (response.text || "").trim() || "Sorry, I wasn't able to come up with an answer to that — could you try rephrasing your question?";
}
