import type { VercelRequest, VercelResponse } from '@vercel/node';
import { parseSafetyCultureCourseExport } from '../../lib/safetyculture/parseExport.js';
import { generateCourseFromSafetyCultureServer } from '../../lib/gemini/courseGenerator.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const rawExport = req.body;
    const scData = parseSafetyCultureCourseExport(rawExport);

    if (scData.lessons.every((l) => l.slides.length === 0)) {
      return res.status(400).json({
        success: false,
        error:
          "Parsed the course structure, but couldn't extract any slide content from it. The export's slide format may have changed — check lib/safetyculture/parseExport.ts.",
      });
    }

    const course = await generateCourseFromSafetyCultureServer(scData);
    return res.status(200).json({ success: true, course, lessonsParsed: scData.lessons.length });
  } catch (err: any) {
    console.error('Error importing SafetyCulture export:', err);
    return res.status(400).json({ success: false, error: err.message || 'Failed to parse and import the pasted export.' });
  }
}
