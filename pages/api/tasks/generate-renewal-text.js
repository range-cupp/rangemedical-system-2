// /pages/api/tasks/generate-renewal-text.js
// AI-generated follow-up text message for any task type
// Generates a personalized SMS snippet that staff can review and send
// Range Medical System

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { patient_name, task_title, task_description } = req.body;

  if (!patient_name) {
    return res.status(400).json({ error: 'patient_name is required' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  try {
    const firstName = patient_name.split(' ')[0];

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      system: `You write friendly, professional text messages for Range Medical, a regenerative medicine clinic in Newport Beach, CA.

Rules:
- Address the patient by first name
- Keep it warm, casual, and brief (2-3 sentences max)
- Match the tone and intent to the task context — could be a renewal follow-up, check-in, appointment reminder, lab results notification, onboarding step, or general outreach
- If the task mentions a protocol or medication, reference it naturally
- Include "Range Medical" at the end so they know who it's from
- Do NOT use markdown, emojis, or formatting — plain SMS text only
- Do NOT include any links or URLs
- Do NOT mention pricing`,
      messages: [
        {
          role: 'user',
          content: `Generate a text message for this patient based on the task:
Patient: ${patient_name}
Task: ${task_title || ''}
Details: ${task_description || ''}`,
        },
      ],
    });

    const message = msg.content[0].text;
    return res.status(200).json({ message });
  } catch (error) {
    console.error('Generate renewal text error:', error);
    return res.status(500).json({ error: 'Failed to generate message' });
  }
}
