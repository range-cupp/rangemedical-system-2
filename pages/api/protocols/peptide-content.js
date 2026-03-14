// /pages/api/protocols/peptide-content.js
// GET: Fetch cached peptide content, auto-generate missing ones via Claude
// PUT: Manual content edits (sets generated_by = 'manual' to prevent overwrite)

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SYSTEM_PROMPT = `You are a medical content writer for Range Medical, a regenerative medicine clinic in Newport Beach, CA.
Write patient-facing educational content about peptide and weight loss protocols.

Important guidelines:
- Write at an accessible reading level — clear and professional
- NEVER mention vials, reconstitution, mixing, needles, or bacteriostatic water — patients receive pre-filled syringes from our clinical team
- Focus on mechanism of action, benefits, timeline, and side effects
- Descriptions should be thorough (2-3 paragraphs explaining what the compound is and how it works)
- Side effects should include the bold name and a brief explanation of what to do
- Timeline entries should show specific timeframes and what patients typically notice

Return ONLY valid JSON with this exact structure:
{
  "description": "2-3 paragraph description of what this compound is and how it works (the 'What It Is' section)",
  "administration": "1-2 sentence description of how it's administered (subcutaneous injection, timing, schedule rationale). Never mention needles or mixing — just say 'pre-filled syringe' or 'oral'.",
  "expected_benefits": [
    "Benefit 1 — clear, specific benefit statement",
    "Benefit 2 — another specific benefit",
    "Benefit 3 — etc (aim for 5-8 benefits)"
  ],
  "timeline": [
    {"period": "Weeks 1-2", "description": "What patients typically notice first"},
    {"period": "Weeks 3-4", "description": "Changes at this stage"},
    {"period": "Month 2+", "description": "Longer-term effects"},
    {"period": "Month 3+", "description": "Full protocol effects"}
  ],
  "side_effects": [
    {"name": "Side effect name", "description": "Brief explanation and what to do about it"},
    {"name": "Another side effect", "description": "Explanation and guidance"}
  ],
  "phase_goals": [],
  "what_to_expect": [],
  "storage_instructions": "Brief storage instructions for this specific compound"
}

Aim for 5-8 expected benefits, 3-4 timeline entries, and 4-8 side effects. Be medically accurate but patient-friendly.`;

async function generatePeptideContent(peptideName) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Write patient-facing content for the peptide: ${peptideName}.
This is used in a treatment protocol PDF that patients receive.
Remember: patients get pre-filled syringes — never mention mixing, vials, or reconstitution.`,
      },
    ],
  });

  const responseText = message.content[0].text.trim();

  // Parse JSON — handle possible markdown code blocks
  let parsed;
  try {
    const jsonStr = responseText.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    parsed = JSON.parse(jsonStr);
  } catch (err) {
    console.error('Failed to parse AI content for', peptideName, ':', responseText);
    throw new Error(`Failed to parse AI-generated content for ${peptideName}`);
  }

  return parsed;
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // GET /api/protocols/peptide-content?peptides=BPC-157,TB500
    const { peptides } = req.query;
    if (!peptides) {
      return res.status(400).json({ error: 'peptides query parameter required (comma-separated)' });
    }

    const peptideNames = peptides.split(',').map(p => p.trim()).filter(Boolean);
    if (peptideNames.length === 0) {
      return res.status(400).json({ error: 'No valid peptide names provided' });
    }

    // 1. Fetch existing cached content
    const { data: existing, error: fetchError } = await supabase
      .from('peptide_content')
      .select('*')
      .in('peptide_name', peptideNames);

    if (fetchError) {
      console.error('DB fetch error:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch cached content' });
    }

    const cachedMap = {};
    for (const row of (existing || [])) {
      cachedMap[row.peptide_name] = row;
    }

    // 2. Generate missing content
    const missing = peptideNames.filter(name => !cachedMap[name]);
    const generated = {};

    for (const name of missing) {
      try {
        const content = await generatePeptideContent(name);

        // Cache in database
        const { data: inserted, error: insertError } = await supabase
          .from('peptide_content')
          .insert({
            peptide_name: name,
            description: content.description || '',
            administration: content.administration || '',
            expected_benefits: content.expected_benefits || [],
            timeline: content.timeline || [],
            side_effects: content.side_effects || [],
            phase_goals: content.phase_goals || [],
            what_to_expect: content.what_to_expect || [],
            storage_instructions: content.storage_instructions || '',
            generated_by: 'claude',
            model_used: 'claude-haiku-4-5-20251001',
          })
          .select()
          .single();

        if (insertError) {
          console.error(`DB insert failed for ${name}:`, insertError);
          // Still return the generated content even if cache fails
          generated[name] = content;
        } else {
          cachedMap[name] = inserted;
        }
      } catch (genError) {
        console.error(`Failed to generate content for ${name}:`, genError.message);
        // Return a fallback so the PDF can still generate
        generated[name] = {
          description: `${name} is a peptide used in regenerative medicine protocols at Range Medical.`,
          phase_goals: [],
          what_to_expect: [],
          storage_instructions: 'Refrigerate pre-filled syringes between 36-46 degrees F. Do not freeze.',
        };
      }
    }

    // 3. Build response — merge cached + newly generated
    const result = {};
    for (const name of peptideNames) {
      if (cachedMap[name]) {
        result[name] = {
          description: cachedMap[name].description,
          administration: cachedMap[name].administration || '',
          expected_benefits: cachedMap[name].expected_benefits || [],
          timeline: cachedMap[name].timeline || [],
          side_effects: cachedMap[name].side_effects || [],
          phase_goals: cachedMap[name].phase_goals,
          what_to_expect: cachedMap[name].what_to_expect,
          storage_instructions: cachedMap[name].storage_instructions,
          generated_by: cachedMap[name].generated_by,
          cached: true,
        };
      } else if (generated[name]) {
        result[name] = { ...generated[name], cached: false };
      }
    }

    return res.status(200).json({ content: result });

  } else if (req.method === 'PUT') {
    // PUT — Manual content edit
    const { peptide_name, description, phase_goals, what_to_expect, storage_instructions } = req.body;

    if (!peptide_name) {
      return res.status(400).json({ error: 'peptide_name is required' });
    }

    const updateData = { updated_at: new Date().toISOString(), generated_by: 'manual' };
    if (description !== undefined) updateData.description = description;
    if (phase_goals !== undefined) updateData.phase_goals = phase_goals;
    if (what_to_expect !== undefined) updateData.what_to_expect = what_to_expect;
    if (storage_instructions !== undefined) updateData.storage_instructions = storage_instructions;

    // Upsert — update existing or insert new
    const { data, error } = await supabase
      .from('peptide_content')
      .upsert({
        peptide_name,
        description: description || '',
        ...updateData,
      }, { onConflict: 'peptide_name' })
      .select()
      .single();

    if (error) {
      console.error('Upsert error:', error);
      return res.status(500).json({ error: 'Failed to save content' });
    }

    return res.status(200).json({ success: true, content: data });

  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
