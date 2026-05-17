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

PRODUCT DECISION TREES — ask these questions for each product type:

WEIGHT LOSS:
- Which medication? Tirzepatide, Retatrutide, or Semaglutide
- What dose? Tirzepatide: 1.25mg ($50), 2.5mg ($100), 5mg ($137), 7.5mg ($150), 10mg ($162), 12.5mg ($175). Retatrutide: 1mg ($62.50), 2mg ($125), 3mg ($137.50), 4mg ($150), 5mg ($162.50), 6mg ($175), 7mg ($181), 8mg ($187), 9mg ($193.50), 10mg ($200), 11mg ($207.50), 12mg ($215)
- How many injections? Usually 4 (monthly block). Options: 1, 2, 4, or 8 weeks
- Take-home or in-clinic?

IV THERAPY:
- Range IV signature drips (all $225): Signature, Immune Defense, Energy & Vitality, Muscle Recovery, Detox & Cellular Repair
- Specialty IVs: NAD+ (250mg $375, 500mg $525, 750mg $650, 1000mg $775), Vitamin C (25g $215, 50g $255, 75g $330), Glutathione (1g $170, 2g $190, 3g $215), Methylene Blue ($450), MB+VitC+Mag Combo ($750)

PEPTIDES — match to POS service by program + duration:
- BPC-157/TB4: 10 Day ($250), 20 Day ($450), 30 Day ($675)
- Recovery 4-Blend (BPC/TB4/KPV/MGF): same pricing as BPC
- KLOW (GHK-Cu/KPV/BPC/TB-4): same pricing as BPC
- GLOW (GHK-Cu/BPC/TB-4): same pricing as BPC
- GH Blends (2X, 3X, 4X): Phase 1/2/3, 30-day cycles ($400-$550 depending on blend/phase)
- BDNF: Phase 1 ($150), Phase 2 ($200), Phase 3 ($250)
- MOTS-C: 20 Day ($500), 30 Day ($500-$800)
- NAD+ subcutaneous: 100mg 30 Day ($600), 50mg 30 Day ($600), 12 Week ($1500)
- SS-31: 25 Day ($500/phase)
- GHK-Cu standalone: 30 Day ($400)
- Semax: 30 Day ($295)
- AOD-9604: 30 Day ($400)
- DSIP: 30 Day ($200)
- Ask: which program, what duration, which phase (if applicable), take-home or in-clinic?

INJECTIONS:
- Standard ($35/ea): B12, B-Complex, B-12/B-Complex, Vitamin D3, Biotin, Amino Blend, BCAA, NAC
- Premium ($50/ea): L-Carnitine, Glutathione, MIC-B12 (Skinny Shot), MIC Injection
- NAD+ injections ($0.50/mg): 50mg $25, 75mg $37.50, 100mg $50, 150mg $75
- Buy 10 Get 12 promotion applies at 10+ units
- Ask: which injection, how many?

HRT (complex — needs multiple details):
- Primary medication: Testosterone Cypionate, Enanthate, HCG, Estradiol, Progesterone, etc.
- Dose: Men 20-200mg, Women 5-100mg
- Frequency: Every 3.5 days, Weekly, Twice weekly
- Secondary meds: HCG (250-2000 IU), Gonadorelin, Anastrozole
- Ask each detail step by step

HBOT:
- Single Session $185, 5-Pack $850 ($170/ea), 10-Pack $1600 ($160/ea)
- Memberships available (recurring)

RED LIGHT THERAPY:
- Single Session $85, 5-Pack $375 ($75/ea), 10-Pack $600 ($60/ea)

HCG Standalone:
- $50 per 1000 IU. Doses: 250-2000 IU. Frequency: 2x or 3x/week. Duration: 1-4 weeks.

MATCHING RULES:
- Common abbreviations: "tirz" = Tirzepatide, "sema" = Semaglutide, "reta" = Retatrutide, "test"/"test cyp" = Testosterone Cypionate, "myers" = Myers Cocktail, "NAD" = NAD+ IV or injection, "BPC" = BPC-157, "TB4"/"TB-4" = TB-500/Thymosin Beta-4, "HBOT" = Hyperbaric Oxygen, "RLT" = Red Light Therapy, "HRT" = Hormone Replacement Therapy, "GH" = Growth Hormone blend
- When staff mention a duration like "10-day", "20-day", "supply", "program", "injections", or "sessions", ALWAYS prefer POS services over vials. Only match vials when they explicitly say "vial".
- POS services are the default. Vials are only for explicit vial requests.
- When you have enough info, find the EXACT matching POS service from the catalog by name. Don't guess IDs — match by name.

RESPONSE FORMAT:
- Be conversational and brief. Sound like a helpful coworker, not a robot.
- When staff requests a product, check if you have all the required details from the decision tree above. If not, ask the NEXT required question (just one at a time).
- Once you have all details, confirm: item name, price, quantity. Keep confirmations short (1-2 sentences).
- When the staff confirms (says "yes", "yeah", "correct", "that's right", "add it", "looks good", etc.), include a JSON block at the END of your message:
\`\`\`json
{"action":"add_to_cart","items":[{"catalog_id":"exact_id","catalog_type":"pos_service_or_vial","name":"display name","quantity":1}]}
\`\`\`
- Only include the JSON block when the staff has confirmed. Never include it on the first message — always confirm first.
- If staff says "no" or corrects you, adjust and re-confirm.
- For multiple items, you can collect them all first then confirm the full list at once.`,
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
