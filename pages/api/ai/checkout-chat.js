import Anthropic from '@anthropic-ai/sdk';
import { VIAL_CATALOG } from '../../../lib/vial-catalog';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages, services: posServices, patientName } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  try {
    const catalog = buildCatalogContext(posServices || []);

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: `You are a checkout assistant at Range Medical clinic. You help staff ring up patients quickly and accurately.

PATIENT: ${patientName || 'Unknown'}

CATALOG:
${catalog}

YOUR JOB:
1. Listen to what the staff member says they need to check out
2. Match items to the catalog and confirm back what you found in plain English
3. If something is ambiguous, ask a clarifying question (e.g. "Did you mean the 10-pack injection program or a vial?")
4. Once staff confirms, output a JSON block so the system can add items to cart

MATCHING RULES:
- Common abbreviations: "tirz" = Tirzepatide, "sema" = Semaglutide, "reta" = Retatrutide, "test"/"test cyp" = Testosterone Cypionate, "myers" = Myers Cocktail, "NAD" = NAD+ IV or injection, "BPC" = BPC-157, "TB4"/"TB-4" = TB-500/Thymosin Beta-4, "HBOT" = Hyperbaric Oxygen, "RLT" = Red Light Therapy, "HRT" = Hormone Replacement Therapy, "GH" = Growth Hormone blend
- When staff mention a duration like "10-day", "20-day", "supply", "program", "injections", or "sessions", ALWAYS prefer POS services over vials. Only match vials when they explicitly say "vial".
- POS services are the default. Vials are only for explicit vial requests.

RESPONSE FORMAT:
- Be conversational and brief (1-3 sentences max)
- Always confirm what you matched: item name, price, quantity
- If anything is unclear, ask ONE short question
- When the staff confirms (says "yes", "yeah", "correct", "that's right", "add it", "looks good", etc.), include a JSON block at the END of your message:
\`\`\`json
{"action":"add_to_cart","items":[{"catalog_id":"exact_id","catalog_type":"pos_service_or_vial","name":"display name","quantity":1}]}
\`\`\`
- Only include the JSON block when the staff has confirmed. Never include it on the first message — always confirm first.
- If staff says "no" or corrects you, adjust and re-confirm.
- Keep it natural — you're a coworker helping at the register, not a robot.`,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    });

    const text = response.content[0]?.text || '';

    let cartAction = null;
    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1].trim());
        if (parsed.action === 'add_to_cart' && parsed.items) {
          cartAction = {
            items: parsed.items.map(item => {
              if (item.catalog_type === 'vial') {
                const vial = VIAL_CATALOG.find(v => v.id === item.catalog_id);
                if (vial) {
                  return {
                    id: vial.id,
                    name: vial.name,
                    category: 'vials',
                    price: vial.clinicPriceCents,
                    quantity: item.quantity || 1,
                    source: 'vial_catalog',
                  };
                }
              }
              const svc = (posServices || []).find(s => String(s.id) === String(item.catalog_id));
              if (svc) {
                return {
                  id: svc.id,
                  name: svc.name,
                  category: svc.category,
                  price: svc.price_cents || svc.price || 0,
                  quantity: item.quantity || 1,
                  recurring: svc.recurring || false,
                  source: 'pos_service',
                };
              }
              const fuzzy = fuzzyFind(item.name, posServices || []);
              if (fuzzy) {
                return {
                  id: fuzzy.id,
                  name: fuzzy.name,
                  category: fuzzy.category,
                  price: fuzzy.price_cents || fuzzy.price || 0,
                  quantity: item.quantity || 1,
                  source: 'pos_service',
                  fuzzy: true,
                };
              }
              return null;
            }).filter(Boolean),
          };
        }
      } catch {}
    }

    const displayText = text.replace(/```json[\s\S]*?```/g, '').trim();

    return res.status(200).json({ reply: displayText, cartAction });
  } catch (err) {
    console.error('AI checkout-chat error:', err);
    return res.status(500).json({ error: 'Failed to process' });
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

  sections.push('\n## Vials — only match when staff explicitly says "vial" (catalog_type: "vial")');
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
