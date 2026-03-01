// /pages/api/admin/capitalize-names.js
// Capitalize all patient first_name, last_name, and name fields
// Also fixes assessment_leads names
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Capitalize a name properly: "john" → "John", "o'brien" → "O'Brien", "mary-jane" → "Mary-Jane"
export function capitalizeName(name) {
  if (!name) return name;
  return name
    .trim()
    .split(/\s+/)
    .map(word => {
      if (!word) return word;
      // Handle apostrophes: O'Brien, D'Angelo
      if (word.includes("'")) {
        return word.split("'").map(part =>
          part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        ).join("'");
      }
      // Handle hyphens: Mary-Jane
      if (word.includes('-')) {
        return word.split('-').map(part =>
          part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
        ).join('-');
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Preview mode — show what would change
    const { data: patients, error } = await supabase
      .from('patients')
      .select('id, first_name, last_name, name')
      .order('created_at', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    const changes = [];
    for (const p of patients) {
      const newFirst = capitalizeName(p.first_name);
      const newLast = capitalizeName(p.last_name);
      const newName = capitalizeName(p.name);

      if (newFirst !== p.first_name || newLast !== p.last_name || newName !== p.name) {
        changes.push({
          id: p.id,
          before: { first_name: p.first_name, last_name: p.last_name, name: p.name },
          after: { first_name: newFirst, last_name: newLast, name: newName }
        });
      }
    }

    return res.status(200).json({
      total_patients: patients.length,
      names_to_fix: changes.length,
      preview: changes.slice(0, 50),
      message: 'POST to this endpoint to apply changes'
    });
  }

  if (req.method === 'POST') {
    const { data: patients, error } = await supabase
      .from('patients')
      .select('id, first_name, last_name, name');

    if (error) return res.status(500).json({ error: error.message });

    let fixed = 0;
    let errors = [];

    for (const p of patients) {
      const newFirst = capitalizeName(p.first_name);
      const newLast = capitalizeName(p.last_name);
      const newName = capitalizeName(p.name);

      if (newFirst !== p.first_name || newLast !== p.last_name || newName !== p.name) {
        const updateData = {};
        if (newFirst !== p.first_name) updateData.first_name = newFirst;
        if (newLast !== p.last_name) updateData.last_name = newLast;
        if (newName !== p.name) updateData.name = newName;

        const { error: updateError } = await supabase
          .from('patients')
          .update(updateData)
          .eq('id', p.id);

        if (updateError) {
          errors.push({ id: p.id, name: p.name, error: updateError.message });
        } else {
          fixed++;
        }
      }
    }

    // Also fix assessment_leads
    const { data: leads } = await supabase
      .from('assessment_leads')
      .select('id, first_name, last_name');

    let leadsFixed = 0;
    if (leads) {
      for (const lead of leads) {
        const newFirst = capitalizeName(lead.first_name);
        const newLast = capitalizeName(lead.last_name);

        if (newFirst !== lead.first_name || newLast !== lead.last_name) {
          const updateData = {};
          if (newFirst !== lead.first_name) updateData.first_name = newFirst;
          if (newLast !== lead.last_name) updateData.last_name = newLast;

          await supabase
            .from('assessment_leads')
            .update(updateData)
            .eq('id', lead.id);

          leadsFixed++;
        }
      }
    }

    return res.status(200).json({
      success: true,
      patients_fixed: fixed,
      leads_fixed: leadsFixed,
      errors: errors.length > 0 ? errors : undefined
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
