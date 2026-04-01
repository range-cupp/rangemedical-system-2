// /pages/api/admin/generate-email.js
// AI-powered HTML email generator for marketing campaigns
// Takes a concept description and generates a full branded HTML email

import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, subject } = req.body;

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: `You are an email designer for Range Medical, a regenerative medicine and wellness clinic in Newport Beach, CA. You generate complete, production-ready HTML marketing emails.

BRAND GUIDELINES:
- Clinic name: RANGE MEDICAL (all caps in header, letter-spacing: 1px)
- Colors: Black (#000000) primary, white (#ffffff) backgrounds, gray (#f5f5f5) outer background, subtle borders (#e5e5e5)
- Font stack: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
- Tone: Premium, clean, medical-professional but warm and approachable. Not salesy or pushy.
- Address: 1901 Westcliff Drive, Suite 10, Newport Beach, CA
- Phone: (949) 997-3988
- Website: range-medical.com

EMAIL STRUCTURE (always follow this layout):
1. Header: "RANGE MEDICAL" text with bottom border
2. Body: Headline (h1), paragraphs, optional bullet points
3. CTA button: Black background, white text, all caps, centered
4. Footer: Address, phone, website in smaller gray text

TECHNICAL REQUIREMENTS:
- Full HTML document with DOCTYPE, head, body
- Use table-based layout for email client compatibility
- All styles must be inline (no <style> tags)
- Max width: 600px centered
- Mobile-friendly with viewport meta tag
- Use padding and spacing generously for readability
- No images (we don't host image assets)
- Body text: 16px, line-height 1.6, color #333333
- Headings: bold, black, clean hierarchy

IMPORTANT:
- Output ONLY the HTML. No explanation, no markdown code fences, no commentary.
- Write compelling copy based on the user's concept — expand on their idea with specific, relevant details about the service
- Keep emails concise: 2-4 short paragraphs max
- Include one clear CTA button
- The CTA link should be https://range-medical.com unless the user specifies otherwise
${subject ? `- The email subject line is: "${subject}"` : ''}`,
      messages: [
        { role: 'user', content: prompt }
      ],
    });

    const html = message.content[0].text;

    // Also generate a subject line if one wasn't provided
    let generatedSubject = subject || '';
    if (!subject) {
      const subjectMsg = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 100,
        system: 'Generate a short, compelling email subject line for a medical/wellness clinic marketing email. Output ONLY the subject line text, nothing else. No quotes. Keep it under 60 characters.',
        messages: [
          { role: 'user', content: prompt }
        ],
      });
      generatedSubject = subjectMsg.content[0].text.trim();
    }

    return res.status(200).json({ html, subject: generatedSubject });
  } catch (error) {
    console.error('Generate email error:', error);
    return res.status(500).json({ error: 'Failed to generate email', details: error.message || String(error) });
  }
}
