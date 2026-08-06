/**
 * Shared server-only SafetyCulture API client.
 *
 * Used by BOTH:
 *  - server.ts (Express routes, for local dev / self-hosted Node deploys)
 *  - api/safetyculture/*.ts (Vercel serverless functions, if this repo is
 *    deployed on Vercel and those files are picked up as functions)
 *
 * Having one client means both deployment paths hit the same base URL,
 * same auth header, same endpoint paths, and the same fallback behavior —
 * previously these had drifted (different hosts, different env var names).
 *
 * ENDPOINT PATHS: confirmed against developer.safetyculture.com/reference
 * as of this writing:
 *   GET  /training/courses/v1                    (list courses)
 *   GET  /training/courses/v1/{courseId}/lessons  (list lesson metadata for a course)
 *   GET  /training/lessons/v1/{lessonId}          (full lesson detail, incl. slides)
 * on host https://api.safetyculture.io
 *
 * NOTE ON REGION/BASE URL: the SafetyCulture docs for the Training API
 * resolve to api.safetyculture.io (not a per-region api.au.safetyculture.com
 * host). If your account is actually provisioned against a region-specific
 * host, override it with SAFETYCULTURE_BASE_URL — everything below reads
 * the base URL from one place.
 *
 * NOTE ON SLIDE SCHEMA: the exact JSON shape of a slide inside the "Get
 * lesson by ID" response wasn't something I could pull from the docs site
 * in this session (the response schema panel is client-rendered). The
 * mapping in `normalizeSlide()` below tries several plausible field-name
 * variants defensively, but you should confirm the real shape by hitting
 * the endpoint once (e.g. via the docs' "Try It" panel, or a manual curl)
 * and adjust `normalizeSlide` / `normalizeLesson` if the field names differ.
 */

const DEFAULT_BASE_URL = "https://api.safetyculture.io";

function getBaseUrl(): string {
  return (process.env.SAFETYCULTURE_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");
}

function getAuthHeaders(): Record<string, string> | null {
  const token = process.env.SAFETYCULTURE_API_TOKEN;
  if (!token) return null;
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export class SafetyCultureConfigError extends Error {}
export class SafetyCultureApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function scFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = getAuthHeaders();
  if (!headers) {
    throw new SafetyCultureConfigError("SAFETYCULTURE_API_TOKEN is not configured on the server.");
  }

  // Simple retry with backoff on 429 (SafetyCulture rate limits range from
  // 20-800 req/min depending on endpoint) — 3 attempts, exponential delay.
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(`${getBaseUrl()}${path}`, {
      ...init,
      headers: { ...headers, ...(init?.headers || {}) },
    });

    if (response.status === 429) {
      lastErr = new SafetyCultureApiError("Rate limited by SafetyCulture API", 429);
      await new Promise((r) => setTimeout(r, 500 * 2 ** attempt));
      continue;
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new SafetyCultureApiError(
        `SafetyCulture API returned ${response.status}: ${response.statusText}${body ? ` — ${body.slice(0, 300)}` : ""}`,
        response.status
      );
    }

    return (await response.json()) as T;
  }
  throw lastErr instanceof Error ? lastErr : new Error("SafetyCulture API request failed after retries.");
}

// --- Raw response shapes (best-effort — see NOTE ON SLIDE SCHEMA above) ---

interface RawCourse {
  id: string;
  title: string;
  description?: string;
  language?: string;
  category?: string;
  thumbnail_url?: string;
  lesson_count?: number;
  duration_minutes?: number;
  created_at?: string;
}

interface RawLessonSummary {
  id: string;
  title: string;
  description?: string;
  slide_count?: number;
}

interface RawSlide {
  id?: string;
  slide_id?: string;
  index?: number;
  type?: string;
  slide_type?: string;
  content?: string;
  markdown?: string;
  body?: string;
  content_json?: unknown;
}

interface RawLessonFull {
  id: string;
  title: string;
  description?: string;
  slides?: RawSlide[];
}

// --- Normalized shapes (match SCCourseFullRaw in api/gemini/courseGenerator.ts) ---

export interface SCSlideNormalized {
  id: string;
  type: string;
  content: string;
}

export interface SCLessonNormalized {
  id: string;
  title: string;
  description?: string;
  slides: SCSlideNormalized[];
}

export interface SCCourseFullNormalized {
  id: string;
  title: string;
  description?: string;
  lessons: SCLessonNormalized[];
}

function normalizeSlide(raw: RawSlide, fallbackIndex: number): SCSlideNormalized {
  const content =
    raw.content ??
    raw.markdown ??
    raw.body ??
    (raw.content_json !== undefined ? JSON.stringify(raw.content_json) : "");
  return {
    id: raw.id || raw.slide_id || `slide-${fallbackIndex}`,
    type: raw.type || raw.slide_type || "text",
    content: content || "",
  };
}

function normalizeLesson(raw: RawLessonFull): SCLessonNormalized {
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    slides: (raw.slides || []).map((s, i) => normalizeSlide(s, i)),
  };
}

// --- Public API ---

export const FALLBACK_COURSES: RawCourse[] = [
  {
    id: "sc-course-01",
    title: "Global K3 Industrial Risk Assessment",
    description: "Accredited safety protocol for industrial sites, container logistics, and heavy equipment.",
    category: "K3 Safety",
    duration_minutes: 45,
  },
  {
    id: "sc-course-02",
    title: "Electrical Safety & Lockout/Tagout (LOTO)",
    description: "Essential electrical isolation procedures and safety controls for field technicians.",
    category: "Electrical Safety",
    duration_minutes: 60,
  },
];

/** GET /training/courses/v1 — list courses (catalog view). */
export async function listCourses(params?: { pageSize?: number; page?: number; courseIds?: string[] }): Promise<RawCourse[]> {
  const qs = new URLSearchParams();
  if (params?.pageSize) qs.set("page_size", String(params.pageSize));
  if (params?.page) qs.set("page", String(params.page));
  for (const id of params?.courseIds || []) qs.append("course_ids", id);
  const query = qs.toString() ? `?${qs.toString()}` : "";
  const data = await scFetch<{ courses?: RawCourse[]; data?: RawCourse[] }>(`/training/courses/v1${query}`);
  return data.courses || data.data || [];
}

/** GET /training/courses/v1/{courseId}/lessons — lesson metadata only (no slide content). */
export async function getLessonsByCourseId(courseId: string): Promise<RawLessonSummary[]> {
  const data = await scFetch<{ lessons?: RawLessonSummary[] }>(`/training/courses/v1/${courseId}/lessons`);
  return data.lessons || [];
}

/** GET /training/lessons/v1/{lessonId} — full lesson detail including slide content. */
export async function getLessonById(lessonId: string): Promise<RawLessonFull> {
  return scFetch<RawLessonFull>(`/training/lessons/v1/${lessonId}`);
}

/**
 * Aggregates course -> lessons -> slides into the shape the Gemini course
 * generator expects (SCCourseFullRaw). This is the endpoint that was
 * missing entirely: the frontend (fetchFullSafetyCultureCourse) has always
 * called GET /api/safetyculture/courses/:id/full, but no backend route
 * implemented it.
 *
 * Fetches lesson detail (with slides) for each lesson with a small
 * concurrency cap, since a course can have many lessons and SafetyCulture
 * rate-limits per endpoint.
 */
export async function getFullCourse(courseId: string): Promise<SCCourseFullNormalized> {
  const [courses, lessonSummaries] = await Promise.all([
    listCourses({ courseIds: [courseId] }).catch(() => [] as RawCourse[]), // best-effort title/description
    getLessonsByCourseId(courseId),
  ]);

  const courseMeta = courses[0];

  const CONCURRENCY = 4;
  const fullLessons: SCLessonNormalized[] = new Array(lessonSummaries.length);
  let cursor = 0;

  async function worker() {
    while (cursor < lessonSummaries.length) {
      const i = cursor++;
      const summary = lessonSummaries[i];
      const full = await getLessonById(summary.id);
      fullLessons[i] = normalizeLesson(full);
    }
  }

  await Promise.all(new Array(Math.min(CONCURRENCY, lessonSummaries.length || 1)).fill(0).map(worker));

  return {
    id: courseId,
    title: courseMeta?.title || "SafetyCulture Course",
    description: courseMeta?.description,
    lessons: fullLessons.filter(Boolean),
  };
}
