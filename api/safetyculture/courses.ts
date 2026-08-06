import type { VercelRequest, VercelResponse } from '@vercel/node';
import { listCourses, FALLBACK_COURSES, SafetyCultureConfigError } from '../../lib/safetyculture/client.js';

// NOTE: this file is a Vercel serverless function, picked up automatically
// if this repo is deployed on Vercel using its zero-config /api convention.
// It now shares logic with the Express route of the same path in
// server.ts via api/safetyculture/client.ts, so both deployment paths
// (standalone Node server vs Vercel functions) behave identically —
// previously they used different upstream URLs and different env var
// names and had drifted out of sync.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const courses = await listCourses({ pageSize: 50 });
    return res.status(200).json({ courses });
  } catch (err: any) {
    if (err instanceof SafetyCultureConfigError) {
      console.warn('[SafetyCulture API Proxy] SAFETYCULTURE_API_TOKEN is missing. Serving fallback catalog.');
      return res.status(200).json({ courses: FALLBACK_COURSES, source: 'fallback_missing_token' });
    }
    console.error('[SafetyCulture API Proxy] Exception occurred:', err);
    return res.status(200).json({ courses: FALLBACK_COURSES, source: 'fallback_upstream_error', error: err.message });
  }
}
