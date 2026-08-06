import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { generateFreshCourse } from "./lib/gemini/generateCourse.js";
import { generateCourseFromSafetyCultureServer, type SCCourseFullRaw } from "./lib/gemini/courseGenerator.js";
import { answerCourseChatQuestion, type ChatTurn } from "./lib/gemini/chat.js";
import { parseSafetyCultureCourseExport } from "./lib/safetyculture/parseExport.js";
import {
  listCourses as scListCourses,
  getFullCourse as scGetFullCourse,
  FALLBACK_COURSES,
  SafetyCultureConfigError,
  SafetyCultureApiError,
} from "./lib/safetyculture/client.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Default express.json() limit is 100kb — real SafetyCulture course
  // exports (pasted via the "Import SafetyCulture Export" feature) can run
  // into several hundred KB, mostly from duplicated per-lesson custom CSS.
  app.use(express.json({ limit: "15mb" }));

  // API Route for AI Course Generation
  app.post("/api/ai/generate-course", async (req, res) => {
    try {
      const result = await generateFreshCourse(req.body);
      if ("fallback" in result) {
        return res.status(200).json(result);
      }
      res.json({ success: true, course: result.course });
    } catch (err: any) {
      console.error("Error generating course with Gemini API:", err);
      res.status(500).json({ success: false, error: err.message || "Failed to generate course" });
    }
  });

  // API Route for importing a manually-pasted SafetyCulture course export
  // (see lib/safetyculture/parseExport.ts for why this exists instead of
  // an automated call to SafetyCulture)
  app.post("/api/ai/import-safetyculture-export", async (req, res) => {
    try {
      const scData = parseSafetyCultureCourseExport(req.body);
      if (scData.lessons.every((l) => l.slides.length === 0)) {
        return res.status(400).json({
          success: false,
          error: "Parsed the course structure, but couldn't extract any slide content from it.",
        });
      }
      const course = await generateCourseFromSafetyCultureServer(scData);
      res.json({ success: true, course, lessonsParsed: scData.lessons.length });
    } catch (err: any) {
      console.error("Error importing SafetyCulture export:", err);
      res.status(400).json({ success: false, error: err.message || "Failed to parse and import the pasted export." });
    }
  });

  // API Route for AI Course Generation FROM SafetyCulture content
  // (formerly done client-side in src/services/aiService.ts, which exposed
  // GEMINI_API_KEY to the browser via VITE_GEMINI_API_KEY — moved here so
  // the key never leaves the server)
  app.post("/api/ai/generate-from-safetyculture", async (req, res) => {
    try {
      const scData = req.body as SCCourseFullRaw;

      if (!scData || !Array.isArray(scData.lessons)) {
        return res.status(400).json({ success: false, error: "Request body must be a SafetyCulture course object with a lessons[] array." });
      }

      const course = await generateCourseFromSafetyCultureServer(scData);
      res.json({ success: true, course });
    } catch (err: any) {
      console.error("Error generating course from SafetyCulture with Gemini API:", err);
      // 200 + fallback:true (not 500) so the frontend's existing fallback
      // path (simulateSafetyCultureTransformation) can take over cleanly,
      // matching the pattern already used by /api/ai/generate-course.
      res.status(200).json({
        success: false,
        fallback: true,
        error: err.message || "Failed to generate course from SafetyCulture content",
      });
    }
  });

  // API Route for the in-course AI chatbot
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { lessonTitle, lessonContent, question, history } = req.body as {
        lessonTitle?: string;
        lessonContent?: string;
        question?: string;
        history?: ChatTurn[];
      };

      if (!question || !question.trim()) {
        return res.status(400).json({ success: false, error: "question is required" });
      }

      const answer = await answerCourseChatQuestion(
        lessonTitle || "This lesson",
        lessonContent || "",
        question,
        history || []
      );
      res.json({ success: true, answer });
    } catch (err: any) {
      console.error("Error answering chat question with Gemini API:", err);
      res.status(500).json({
        success: false,
        error: err.message || "Failed to get an answer from the AI tutor",
      });
    }
  });

  // SafetyCulture API Proxy Routes (backed by the shared client in
  // api/safetyculture/client.ts — see that file for base URL / endpoint
  // path notes and the SAFETYCULTURE_API_TOKEN env var)
  app.get("/api/safetyculture/courses", async (req, res) => {
    try {
      const courses = await scListCourses({ pageSize: 50 });
      res.json({ courses });
    } catch (err: any) {
      if (err instanceof SafetyCultureConfigError) {
        console.warn("[SafetyCulture] Token not configured. Serving fallback catalog.");
        return res.status(200).json({ courses: FALLBACK_COURSES, source: "fallback_missing_token" });
      }
      console.error("SafetyCulture API Error:", err);
      res.status(200).json({ courses: FALLBACK_COURSES, source: "fallback_upstream_error", error: err.message });
    }
  });

  // Full course -> lessons -> slides hierarchy, used to feed the Gemini
  // enhancement pipeline. Previously missing entirely — the frontend
  // (fetchFullSafetyCultureCourse) has always called this URL and 404'd.
  app.get("/api/safetyculture/courses/:id/full", async (req, res) => {
    try {
      const fullCourse = await scGetFullCourse(req.params.id);
      res.json(fullCourse);
    } catch (err: any) {
      if (err instanceof SafetyCultureConfigError) {
        return res.status(503).json({ error: "SafetyCulture API token not configured on server." });
      }
      console.error(`SafetyCulture full-course fetch error for ${req.params.id}:`, err);
      const status = err instanceof SafetyCultureApiError ? err.status : 500;
      res.status(status).json({ error: err.message || "Failed to fetch full course detail from SafetyCulture" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PT. JASA PRIMA PAPUA server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
