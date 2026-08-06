import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getFullCourse, SafetyCultureConfigError, SafetyCultureApiError } from '../../../../lib/safetyculture/client';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const id = req.query.id;
  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing course id' });
  }

  try {
    const fullCourse = await getFullCourse(id);
    return res.status(200).json(fullCourse);
  } catch (err: any) {
    if (err instanceof SafetyCultureConfigError) {
      return res.status(503).json({ error: 'SafetyCulture API token not configured on server.' });
    }
    console.error(`[SafetyCulture API Proxy] full-course fetch error for ${id}:`, err);
    const status = err instanceof SafetyCultureApiError ? err.status : 500;
    return res.status(status).json({ error: err.message || 'Failed to fetch full course detail from SafetyCulture' });
  }
}
