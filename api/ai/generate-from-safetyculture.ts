import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateCourseFromSafetyCultureServer, type SCCourseFullRaw } from '../../lib/gemini/courseGenerator.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const scData = req.body as SCCourseFullRaw;

    if (!scData || !Array.isArray(scData.lessons)) {
      return res.status(400).json({ success: false, error: 'Request body must be a SafetyCulture course object with a lessons[] array.' });
    }

    const course = await generateCourseFromSafetyCultureServer(scData);
    return res.status(200).json({ success: true, course });
  } catch (err: any) {
    console.error('Error generating course from SafetyCulture with Gemini API:', err);
    // 200 + fallback:true (not 500) so the frontend's fallback path
    // (simulateSafetyCultureTransformation) takes over cleanly.
    return res.status(200).json({
      success: false,
      fallback: true,
      error: err.message || 'Failed to generate course from SafetyCulture content',
    });
  }
}
