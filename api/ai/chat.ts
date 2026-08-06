import type { VercelRequest, VercelResponse } from '@vercel/node';
import { answerCourseChatQuestion, type ChatTurn } from '../../lib/gemini/chat';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { lessonTitle, lessonContent, question, history } = (req.body || {}) as {
      lessonTitle?: string;
      lessonContent?: string;
      question?: string;
      history?: ChatTurn[];
    };

    if (!question || !question.trim()) {
      return res.status(400).json({ success: false, error: 'question is required' });
    }

    const answer = await answerCourseChatQuestion(
      lessonTitle || 'This lesson',
      lessonContent || '',
      question,
      history || []
    );
    return res.status(200).json({ success: true, answer });
  } catch (err: any) {
    console.error('Error answering chat question with Gemini API:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to get an answer from the AI tutor',
    });
  }
}
