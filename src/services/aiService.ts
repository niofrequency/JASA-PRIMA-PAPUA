// src/services/aiService.ts
import { AICourseGenerationInput, CourseModule, QuizQuestion } from '../types';
import { SCCourseFullRaw } from './safetyCultureService';

export interface GeneratedCourseData {
  title: string;
  category: string;
  description: string;
  estimatedHours: string;
  prerequisites: string;
  modules: CourseModule[];
}

// NOTE: Gemini is never called directly from the browser. There is
// deliberately no Gemini SDK import and no VITE_GEMINI_API_KEY read in this
// file — any Gemini call must go through a `/api/ai/*` backend route (see
// server.ts + api/gemini/*), which holds GEMINI_API_KEY server-side only.
// If you're adding a new AI feature, add a backend route first and call it
// with fetch() the way generateCourseFromSafetyCulture does below.

/**
 * Transforms raw SafetyCulture course data (course -> lessons -> slides)
 * into a full structured platform course by calling the backend, which runs
 * the Gemini prompts server-side. Falls back to a local, deterministic
 * transformation if the backend is unreachable or returns an error, so the
 * instructor UI still produces a usable course.
 */
export async function generateCourseFromSafetyCulture(
  scData: SCCourseFullRaw
): Promise<GeneratedCourseData> {
  try {
    const response = await fetch('/api/ai/generate-from-safetyculture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scData),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.course) {
        return result.course;
      }
      // result.fallback === true means the server itself decided to defer
      // to the fallback (e.g. Gemini key not configured, or a generation
      // error) — fall through to the local simulator below.
    }
  } catch (err) {
    console.warn(
      'Backend Gemini API endpoint unreachable or erroring. Utilizing local fallback simulation engine.',
      err
    );
  }

  // Client-side Fallback Transformation Engine (no secrets involved — pure
  // local logic, safe to run in the browser)
  return simulateSafetyCultureTransformation(scData);
}

/**
 * Imports a course from a manually-pasted SafetyCulture course export JSON
 * (the instructor copies this from their own authenticated browser session
 * — see lib/safetyculture/parseExport.ts for why this exists instead of an
 * automated API call). Parses the real slide content server-side and runs
 * it through the same Gemini enhancement pipeline as the catalog import.
 */
export async function importSafetyCultureExport(rawExportJson: string): Promise<GeneratedCourseData> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawExportJson);
  } catch {
    throw new Error('That doesn\'t look like valid JSON — make sure you copied the full response body, including the surrounding { }.');
  }

  const response = await fetch('/api/ai/import-safetyculture-export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parsed),
  });

  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error || `Import failed with status ${response.status}`);
  }
  return result.course;
}

/**
 * Asks the in-course AI chatbot a question, grounded in the current
 * lesson's content. Calls the backend (server-side Gemini) — see
 * server.ts POST /api/ai/chat + api/gemini/chat.ts.
 */
export async function askCourseChatbot(
  lessonTitle: string,
  lessonContent: string,
  question: string,
  history: { role: 'ai' | 'user'; text: string }[]
): Promise<string> {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // Only send recent history to keep the request small — the backend
    // also caps this, but no reason to ship the whole conversation.
    body: JSON.stringify({ lessonTitle, lessonContent, question, history: history.slice(-8) }),
  });

  if (!response.ok) {
    throw new Error(`Chat request failed with status ${response.status}`);
  }

  const result = await response.json();
  if (!result.success || !result.answer) {
    throw new Error(result.error || 'Chat request did not return an answer');
  }
  return result.answer as string;
}

/**
 * Generates a brand-new course based on user prompt inputs using Gemini AI.
 */
export async function generateCourseWithAI(
  input: AICourseGenerationInput
): Promise<GeneratedCourseData> {
  try {
    const response = await fetch('/api/ai/generate-course', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success && result.course) {
        return result.course;
      }
    }
  } catch (err) {
    console.warn(
      'Backend Gemini API endpoint unreachable or erroring. Utilizing local fallback simulation engine.',
      err
    );
  }

  // Robust Client-Side Fallback Generator
  return simulateCourseGeneration(input);
}

/**
 * Fallback transformer: Converts raw SafetyCulture lessons/slides into structured modules
 * when Gemini API is unavailable.
 */
function simulateSafetyCultureTransformation(scData: SCCourseFullRaw): GeneratedCourseData {
  const modules: CourseModule[] = scData.lessons.map((lesson, idx) => {
    const modNum = idx + 1;
    const combinedSlideContent = lesson.slides && lesson.slides.length > 0
      ? lesson.slides.map((s, i) => `### Slide ${i + 1}: ${s.type.toUpperCase()}\n${s.content}`).join('\n\n')
      : `Standard operating procedures for ${lesson.title}. Always follow PT. JASA PRIMA PAPUA safety protocols on site.`;

    const summaryText = `Key takeaways for ${lesson.title}: Ensure strict adherence to PPE rules, verify equipment logs daily, and follow emergency stop procedures.`;

    const questions: QuizQuestion[] = [
      {
        id: `sc-q-${lesson.id}-1`,
        question: `According to ${lesson.title}, what is the essential initial safety verification step?`,
        options: [
          'Perform a 3-point inspection and check PPE status',
          'Begin operation immediately without tags',
          'Skip supervisor sign-off if behind schedule',
          'Operate at maximum load capacity for test run'
        ],
        correctIndex: 0,
        explanation: 'Pre-work inspection and verified PPE form the mandatory safety baseline before starting any machinery.',
      },
      {
        id: `sc-q-${lesson.id}-2`,
        question: `How should abnormal readings or equipment faults be reported under PT. JASA PRIMA PAPUA K3 guidelines?`,
        options: [
          'Ignore if minor and notify next shift verbally',
          'Immediately tag out equipment and document in the maintenance portal',
          'Attempt unauthorized bypass of safety locks',
          'Wait until weekly maintenance check'
        ],
        correctIndex: 1,
        explanation: 'Immediate Tag-Out (LOTO) and logging prevent site accidents and catastrophic mechanical failures.',
      }
    ];

    return {
      id: `sc-mod-${lesson.id || modNum}`,
      title: `Module ${modNum}: ${lesson.title}`,
      summary: summaryText,
      lessons: [
        {
          id: `sc-les-${lesson.id || modNum}-1`,
          title: `Lesson ${modNum}.1: ${lesson.title} - Main Content`,
          duration: '20 mins',
          content: combinedSlideContent,
          readingMaterial: `**SafetyCulture Reference Data:**\n- Imported directly from verified accredited K3 training slides.\n- Follow local Papuan environmental and ESDM safety standards.`,
          videoPlaceholderTopic: `Practical Safety Demonstration: ${lesson.title}`,
        }
      ],
      quiz: {
        id: `sc-quiz-${lesson.id || modNum}`,
        title: `Assessment: ${lesson.title}`,
        passingScorePercent: 80,
        questions,
      }
    };
  });

  return {
    title: scData.title || 'SafetyCulture Accredited Training Program',
    category: determineCategory(scData.title || ''),
    description: scData.description || 'Imported SafetyCulture workplace safety and operational compliance module enhanced for PT. JASA PRIMA PAPUA.',
    estimatedHours: `${Math.max(modules.length * 2, 2)} Hours`,
    prerequisites: 'Basic Industrial K3 Awareness & Site Safety Induction',
    modules,
  };
}

/**
 * Fallback generator for brand new AI prompt courses.
 */
function simulateCourseGeneration(input: AICourseGenerationInput): GeneratedCourseData {
  const subjectClean = input.subject.trim() || 'Industrial Operations & Technical Protocol';
  const papuaSuffix = input.papuaContext ? ' (Papua Industrial & ESDM Standard)' : '';

  const modulesCount = Math.min(Math.max(input.moduleCount || 3, 2), 6);
  const modules: CourseModule[] = [];

  for (let i = 1; i <= modulesCount; i++) {
    const modId = `gen-mod-${i}-${Date.now()}`;
    let modTitle = '';
    let modSummary = '';

    if (i === 1) {
      modTitle = `Module 1: Fundamental Safety & Operational Standards for ${subjectClean}`;
      modSummary = `Introduction to core principles, PPE compliance, and risk mitigation strategies in high-risk site environments.`;
    } else if (i === 2) {
      modTitle = `Module 2: Technical Execution & Equipment Control Systems`;
      modSummary = `Hands-on operational procedures, system calibration, and troubleshooting mechanical/electrical anomalies.`;
    } else if (i === 3) {
      modTitle = `Module 3: Advanced Site Diagnostics & Emergency Response`;
      modSummary = `Handling site emergencies, environmental containment, and multi-team field communications.`;
    } else {
      modTitle = `Module ${i}: Optimization & Field Maintenance Protocols`;
      modSummary = `Long-term maintenance scheduling, quality assurance audits, and technical compliance reporting.`;
    }

    const questions: QuizQuestion[] = [
      {
        id: `q-${i}-1`,
        question: `What is the primary safety priority when executing ${subjectClean} in high-elevation or tropical field conditions?`,
        options: [
          'Completing tasks before checking equipment tags',
          'Conducting pre-work risk assessments & 3-point inspection',
          'Bypassing automatic shutoff switches during peak hours',
          'Relying solely on verbal instructions without written SOG'
        ],
        correctIndex: 1,
        explanation: 'Pre-work risk assessments and thorough equipment verification prevent catastrophic failures and site casualties.',
      },
      {
        id: `q-${i}-2`,
        question: `In accordance with PT. JASA PRIMA PAPUA guidelines, how often should equipment safety logs be verified?`,
        options: ['Weekly', 'At the start of every shift', 'Once a month', 'Only after an incident'],
        correctIndex: 1,
        explanation: 'Shift-start log verification ensures equipment readiness and tracks wear or micro-fractures in high-abrasion environments.',
      },
      {
        id: `q-${i}-3`,
        question: `Which personal protective equipment (PPE) standard applies when dealing with industrial hazards in Module ${i}?`,
        options: [
          'Standard cloth gloves only',
          'Certified Class-A/B Helmet, Steel-Toe Boots & Rated Eye Protection',
          'No PPE required indoors',
          'Dust mask without ear plugs'
        ],
        correctIndex: 1,
        explanation: 'Class-A/B certified headwear, impact footwear, and eye protection form the baseline required safety envelope.',
      }
    ];

    modules.push({
      id: modId,
      title: modTitle,
      summary: modSummary,
      lessons: [
        {
          id: `les-${i}-1`,
          title: `Lesson ${i}.1: Core Operational Guidelines & Safety Envelopes`,
          duration: '25 mins',
          content: `This lesson covers standard operating procedures (SOP) for ${subjectClean} targeted at ${input.targetAudience} level (${input.difficulty}).\n\n1. Safety Boundaries: Always establish a 10-meter perimeter barrier prior to activating high-voltage or heavy mechanical units.\n2. Environmental Protocols: Observe soil erosion indicators, high moisture levels, and high-altitude weather changes typical in Papua industrial zones.\n3. Communication Channels: Use two-way radio callouts with strict repeat-back verification before moving or energizing systems.`,
          readingMaterial: `**Standard Reference Guide (PT JPP - Tech standard 2026):**\n- Always cross-reference equipment manual specifications with temperature and humidity compensation factors.\n- Verify calibration dates on test instruments prior to taking field measurements.`,
          videoPlaceholderTopic: `Practical Video Demonstration: Field Walkthrough for ${subjectClean}`,
        },
        {
          id: `les-${i}-2`,
          title: `Lesson ${i}.2: Troubleshooting & Quality Assurance Checklist`,
          duration: '30 mins',
          content: `Detailed step-by-step diagnostic sequence for resolving typical field anomalies:\n- Step 1: Isolate power or hydraulic pressure before initiating diagnostic probes.\n- Step 2: Record baseline operating metrics (voltage drop, hydraulic PSI, thermal camera readings).\n- Step 3: Compare field readings against factory tolerance curves.\n- Step 4: Document corrective actions in the PT. JASA PRIMA PAPUA maintenance database.`,
          readingMaterial: `**Quality Inspection Standard:**\n- Ensure all replacement seals and fasteners are OEM-certified.\n- Perform 15-minute load testing after repairs before returning equipment to active shift rotation.`,
          videoPlaceholderTopic: `Diagnostic Case Study & Field Verification Sequence`,
        }
      ],
      quiz: {
        id: `quiz-${modId}`,
        title: `Module ${i} Knowledge Assessment`,
        passingScorePercent: 75,
        questions,
      }
    });
  }

  return {
    title: `${subjectClean}${papuaSuffix}`,
    category: determineCategory(subjectClean),
    description: `A specialized ${input.difficulty.toLowerCase()}-level training program designed for ${input.targetAudience}, focusing on practical application, regulatory compliance, and safety standards at PT. JASA PRIMA PAPUA.`,
    estimatedHours: `${modulesCount * 6} Hours`,
    prerequisites:
      input.difficulty === 'Advanced'
        ? 'Relevant Technical Certification or 2+ Years Field Experience'
        : 'Basic Technical & Industry Orientation',
    modules,
  };
}

function determineCategory(subject: string): string {
  const lower = subject.toLowerCase();
  if (
    lower.includes('heavy') ||
    lower.includes('machine') ||
    lower.includes('excavator') ||
    lower.includes('mining')
  ) {
    return 'Heavy Machinery & Mining';
  }
  if (
    lower.includes('electric') ||
    lower.includes('high voltage') ||
    lower.includes('power') ||
    lower.includes('plc')
  ) {
    return 'Electrical & Industrial Engineering';
  }
  if (
    lower.includes('safety') ||
    lower.includes('ehs') ||
    lower.includes('hazard') ||
    lower.includes('compliance')
  ) {
    return 'Safety & Compliance';
  }
  if (
    lower.includes('solar') ||
    lower.includes('renewable') ||
    lower.includes('energy') ||
    lower.includes('grid')
  ) {
    return 'Renewable Energy & Infrastructure';
  }
  return 'Industrial Operations & Technical Training';
}
