import Anthropic from '@anthropic-ai/sdk';
import { VIAL_CATALOG } from '../../../lib/vial-catalog';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { input, services: posServices } = req.body;
  if (!input || typeof input !== 'string') {
    return res.status(400).json({ error: 'input required' });
  }

  try {
    const catalog = buildCatalogContext(posServices || []);

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: `You are a checkout assistant for Range Medical clinic. Parse staff input into cart items.

CATALOG:
${catalog}

RULES:
- Match input to catalog items by name, abbreviation, or description
- Common abbreviations: "tirz" = Tirzepatide, "sema" = Semaglutide, "reta" = Retatrutide, "test" or "test cyp" = Testosterone Cypionate, "myers" = Myers Cocktail, "NAD" = NAD+ IV or injection, "BPC" = BPC-157, "TB4" or "TB-4" = TB-500/Thymosin Beta-4, "HBOT" = Hyperbaric Oxygen, "RLT" = Red Light Therapy, "HRT" = Hormone Replacement Therapy, "GH" = Growth Hormone blend
- IMPORTANT: When staff mention a duration like "10-day", "20-day", "30-day", "supply", "program", "injections", or "sessions", ALWAYS prefer POS services (injection programs) over vials. Vials are only for take-home self-injection purchases — staff will say "vial" explicitly when they mean a vial.
- POS services are the default match target. Only match to vials when the input explicitly says "vial".
- If quantity specified (e.g. "x3", "3 sessions", "three"), set quantity accordingly
- If you can't match an item, include it with matched=false and your best guess
- Return ONLY valid JSON, no markdown fencing`,
      messages: [{
        role: 'user',
        content: `Parse this checkout input into cart items: "${input}"

Return JSON array:
[{
  "matched": true/false,
  "catalog_id": "exact id from catalog or null",
  "catalog_type": "pos_service" or "vial",
  "name": "display name",
  "quantity": number,
  "reason": "why you matched this (brief)"
}]`
      }]
    });

    const text = response.content[0]?.text || '[]';
    let parsed;
    try {
      const cleaned = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return res.status(200).json({ items: [], raw: text, error: 'Could not parse AI response' });
    }

    const resolved = parsed.map(item => {
      if (!item.matched) return { ...item, resolved: null };

      if (item.catalog_type === 'vial') {
        const vial = VIAL_CATALOG.find(v => v.id === item.catalog_id);
        if (vial) {
          return {
            ...item,
            resolved: {
              id: vial.id,
              name: vial.name,
              category: 'vials',
              price: vial.clinicPriceCents,
              quantity: item.quantity || 1,
              source: 'vial_catalog',
            }
          };
        }
      }

      if (item.catalog_type === 'pos_service') {
        const svc = (posServices || []).find(s => String(s.id) === String(item.catalog_id));
        if (svc) {
          return {
            ...item,
            resolved: {
              id: svc.id,
              name: svc.name,
              category: svc.category,
              price: svc.price_cents || svc.price || 0,
              quantity: item.quantity || 1,
              recurring: svc.recurring || false,
              source: 'pos_service',
            }
          };
        }
      }

      const fuzzyMatch = fuzzyFind(item.name, posServices || []);
      if (fuzzyMatch) {
        return {
          ...item,
          resolved: {
            id: fuzzyMatch.id,
            name: fuzzyMatch.name,
            category: fuzzyMatch.category,
            price: fuzzyMatch.price_cents || fuzzyMatch.price || 0,
            quantity: item.quantity || 1,
            recurring: fuzzyMatch.recurring || false,
            source: 'pos_service',
            fuzzy: true,
          }
        };
      }

      return { ...item, resolved: null };
    });

    return res.status(200).json({ items: resolved });
  } catch (err) {
    console.error('AI parse-checkout error:', err);
    return res.status(500).json({ error: 'Failed to parse input' });
  }
}

function buildCatalogContext(posServices) {
  const sections = [];

  sections.push('## POS Services (catalog_type: "pos_service")');
  const grouped = {};
  for (const s of posServices) {
    if (!grouped[s.category]) grouped[s.category] = [];
    grouped[s.category].push(s);
  }
  for (const [cat, items] of Object.entries(grouped)) {
    sections.push(`\n### ${cat}`);
    for (const item of items) {
      const cents = item.price_cents || item.price || 0;
      const price = cents ? `$${(cents / 100).toFixed(0)}` : 'varies';
      sections.push(`- id:"${item.id}" | "${item.name}" | ${price}${item.recurring ? ' (recurring)' : ''}`);
    }
  }

  sections.push('\n## Vials (catalog_type: "vial")');
  for (const v of VIAL_CATALOG) {
    if (v.isAddOn) continue;
    const price = `$${(v.clinicPriceCents / 100).toFixed(0)}`;
    sections.push(`- id:"${v.id}" | "${v.name}" | ${price} | category: ${v.category}`);
  }

  return sections.join('\n');
}

function fuzzyFind(name, services) {
  if (!name) return null;
  const lower = name.toLowerCase();
  return services.find(s => s.name.toLowerCase().includes(lower)) ||
    services.find(s => lower.includes(s.name.toLowerCase())) ||
    null;
}
