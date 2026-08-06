import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateFreshCourse } from '../../lib/gemini/generateCourse';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const result = await generateFreshCourse(req.body || {});
    if ('fallback' in result) {
      return res.status(200).json(result);
    }
    return res.status(200).json({ success: true, course: result.course });
  } catch (err: any) {
    console.error('Error generating course with Gemini API:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to generate course' });
  }
}
