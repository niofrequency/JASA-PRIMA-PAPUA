import type { SCCourseFullRaw, SCLessonRaw, SCSlideRaw } from "../gemini/courseGenerator.js";

/**
 * Parses a raw SafetyCulture course export JSON — the same shape returned by
 * SafetyCulture's own web app when editing a course (confirmed against a
 * real export on 2026-08-06) — into the SCCourseFullRaw shape the Gemini
 * pipeline expects.
 *
 * IMPORTANT: this is NOT calling any SafetyCulture endpoint. The JSON is
 * pasted in by the instructor, who copies it from their own authenticated
 * browser session (DevTools -> Network tab -> the course-load request ->
 * Response). This sidesteps the fact that SafetyCulture's public REST API
 * doesn't expose slide content (see lib/safetyculture/client.ts) while
 * staying on solid ground: no scraping, no automation against an
 * undocumented endpoint, no credential reuse — just the instructor manually
 * moving their own data into their own app.
 *
 * The real export's "lessons[].slides[]" array has ~20 different slide
 * `type` values (image-slider, text-sequence, multiple-choice-game,
 * comparison, reveal, chat, drag-to-match, image-waypoints, etc.), each
 * with its own `data` shape. Rather than hand-write an extractor per type
 * (brittle, and SafetyCulture adds new slide types over time), this walks
 * the common fields defensively and falls back gracefully for shapes it
 * doesn't specifically recognize.
 */

interface RawExportQuestion {
  question?: { content?: string; category?: string };
  answers?: { content?: string; correct?: boolean }[];
}

interface RawExportSlide {
  id?: string;
  slideId?: string;
  type?: string;
  subtype?: string;
  metadata?: { questions?: RawExportQuestion[] };
  data?: Record<string, any>;
}

interface RawExportLesson {
  id: string;
  title: string;
  description?: string;
  slides?: RawExportSlide[];
}

interface RawExportCourse {
  id: string;
  title: string;
  description?: string;
  lessons?: RawExportLesson[];
}

function stripHtml(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<img[^>]*>/gi, "") // drop image tags entirely (no text value)
    .replace(/<[^>]+>/g, "") // strip remaining HTML tags, keep markdown syntax
    .replace(/\s+/g, " ")
    .trim();
}

function pushIfText(parts: string[], value: unknown) {
  const text = stripHtml(value);
  if (text) parts.push(text);
}

/**
 * Best-effort text extraction from a slide's `data` object. Handles the
 * common field patterns seen across SafetyCulture's slide templates:
 * title/subtitle/prompt/label strings, content arrays (text-sequence,
 * scrolling-media), items/images/list arrays with captions
 * (image-slider/gallery/collection), before/after pairs (comparison,
 * scratch-to-reveal), reveal cards, waypoint captions, and answer
 * explanations. Falls back to nothing extractable rather than guessing.
 */
function extractSlideText(slide: RawExportSlide): string {
  const parts: string[] = [];
  const data = slide.data || {};

  for (const key of ["title", "subtitle", "prompt", "label"]) {
    pushIfText(parts, data[key]);
  }

  // "content" can be a plain string, an array of strings (text-sequence),
  // or an array of {content, contentType} objects (scrolling-media)
  if (typeof data.content === "string") {
    pushIfText(parts, data.content);
  } else if (Array.isArray(data.content)) {
    for (const c of data.content) {
      if (typeof c === "string") pushIfText(parts, c);
      else if (c && typeof c === "object") {
        if (c.contentType && c.contentType !== "image") pushIfText(parts, c.content);
        else if (typeof c.description === "string") pushIfText(parts, `${c.title ? c.title + ": " : ""}${c.description}`); // reveal-card style {title, description}
      }
    }
  }

  // items / images / list arrays with captions (sliders, galleries, collections)
  for (const arrKey of ["items", "images", "list"]) {
    const arr = data[arrKey];
    if (!Array.isArray(arr)) continue;
    for (const item of arr) {
      if (!item || typeof item !== "object") continue;
      pushIfText(parts, item.caption);
      if (item.contentType && item.contentType !== "image") pushIfText(parts, item.content);
      if (typeof item.name === "string") pushIfText(parts, item.name); // drag-to-match style {name, image}
    }
  }

  // before/after pairs (comparison, scratch-to-reveal)
  for (const side of ["before", "after"]) {
    const s = data[side];
    if (!s || typeof s !== "object") continue;
    pushIfText(parts, s.label);
    if (s.contentType && s.contentType !== "image") pushIfText(parts, s.content);
  }

  // waypoint captions (image-waypoints)
  if (Array.isArray(data.waypoints)) {
    for (const wp of data.waypoints) pushIfText(parts, wp?.caption);
  }

  // answer explanation text — genuinely useful context, not just the raw question
  if (data.answer && typeof data.answer === "object") {
    for (const k of ["text", "takeaway"]) pushIfText(parts, data.answer[k]);
  }

  return parts.join("\n\n");
}

/** Extracts quiz question/answer text from a slide's metadata.questions[]. */
function extractQuizText(slide: RawExportSlide): string {
  const questions = slide.metadata?.questions || [];
  if (questions.length === 0) return "";

  const parts: string[] = [];
  for (const q of questions) {
    const questionText = stripHtml(q.question?.content);
    const category = stripHtml(q.question?.category);
    if (category) parts.push(category);
    if (questionText) parts.push(`Q: ${questionText}`);
    for (const a of q.answers || []) {
      const answerText = stripHtml(a.content);
      if (answerText) parts.push(`- ${answerText}${a.correct ? " (correct answer)" : ""}`);
    }
  }
  return parts.join("\n");
}

function mapSlideType(slide: RawExportSlide): string {
  const hasQuestions = (slide.metadata?.questions?.length || 0) > 0;
  if (hasQuestions) return "quiz";
  const t = `${slide.type || ""} ${slide.subtype || ""}`.toLowerCase();
  if (t.includes("video")) return "video";
  return "text";
}

function parseLesson(lesson: RawExportLesson): SCLessonRaw {
  const slides: SCSlideRaw[] = (lesson.slides || [])
    .filter((s) => s.type !== "exit") // "Nice work, you've completed this lesson" — no real content
    .map((slide, i) => {
      const bodyText = extractSlideText(slide);
      const quizText = extractQuizText(slide);
      const content = [bodyText, quizText].filter(Boolean).join("\n\n");
      return {
        id: slide.id || slide.slideId || `slide-${i}`,
        type: mapSlideType(slide),
        content,
      };
    })
    .filter((s) => s.content.trim().length > 0); // drop slides with nothing extractable

  return {
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    slides,
  };
}

/**
 * Parses a full raw SafetyCulture course export (pasted JSON) into the
 * shape the Gemini enhancement pipeline expects. Throws a descriptive error
 * if the input doesn't look like a course export at all, rather than
 * silently producing an empty course.
 */
export function parseSafetyCultureCourseExport(raw: unknown): SCCourseFullRaw {
  const course = raw as RawExportCourse;

  if (!course || typeof course !== "object" || !course.id || !course.title) {
    throw new Error(
      "This doesn't look like a SafetyCulture course export — expected an object with at least `id` and `title` fields."
    );
  }
  if (!Array.isArray(course.lessons)) {
    throw new Error("No `lessons` array found in the pasted JSON — make sure you copied the full course response, not a partial object.");
  }

  return {
    id: course.id,
    title: course.title,
    description: course.description,
    lessons: course.lessons.map(parseLesson),
  };
}
