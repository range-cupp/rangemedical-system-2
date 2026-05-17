import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const tools = [
  {
    name: 'add_to_cart',
    description: 'Add one or more items to the checkout cart. Use when staff confirms they want to ring up a product.',
    input_schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Display name of the item' },
              catalog_id: { type: 'string', description: 'The exact catalog ID from the POS service list' },
              quantity: { type: 'number', description: 'Number of units' },
              price_cents: { type: 'number', description: 'Price per unit in cents' },
            },
            required: ['name', 'catalog_id', 'quantity', 'price_cents'],
          },
        },
      },
      required: ['items'],
    },
  },
  {
    name: 'search_patient',
    description: 'Search for a patient by name, phone, or email. Use when staff needs to find a patient for booking or dispensing.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term — patient name, phone number, or email' },
      },
      required: ['query'],
    },
  },
  {
    name: 'check_slots',
    description: 'Check available appointment slots for a service on a given date. Resolve relative dates ("tomorrow", "Monday", "next week") to YYYY-MM-DD yourself using today\'s date.',
    input_schema: {
      type: 'object',
      properties: {
        service: { type: 'string', description: 'Name of the service to book' },
        date: { type: 'string', description: 'Resolved date as YYYY-MM-DD. Calculate from relative terms yourself.' },
      },
      required: ['service', 'date'],
    },
  },
  {
    name: 'book_appointment',
    description: 'Book an appointment for a patient. Use after confirming service, date, time, and patient.',
    input_schema: {
      type: 'object',
      properties: {
        service: { type: 'string', description: 'Service name' },
        service_slug: { type: 'string', description: 'Service slug for the booking system' },
        date: { type: 'string', description: 'Resolved date as YYYY-MM-DD' },
        time: { type: 'string', description: 'Time in HH:MM format' },
        start_iso: { type: 'string', description: 'Full ISO datetime for the appointment start' },
        duration_minutes: { type: 'number', description: 'Appointment duration in minutes' },
        patient_name: { type: 'string', description: 'Full name of the patient' },
        patient_id: { type: 'string', description: 'Patient UUID' },
      },
      required: ['service', 'service_slug', 'start_iso', 'duration_minutes', 'patient_name', 'patient_id'],
    },
  },
  {
    name: 'lookup_patient_records',
    description: 'Look up a patient\'s medical records — active protocols, medications, upcoming appointments, recent visits, prescriptions. Use when staff asks about a patient\'s treatment, next pickup, medication schedule, visit history, or anything clinical.',
    input_schema: {
      type: 'object',
      properties: {
        patient_id: { type: 'string', description: 'Patient UUID — use the patient currently selected in context, or from a search_patient result' },
      },
      required: ['patient_id'],
    },
  },
  {
    name: 'draft_email',
    description: 'Draft an email to send to a patient or anyone. Use when staff asks to email someone. The email will be shown as a preview for the staff to approve before sending. Always look up the patient\'s email from their records if not already known.',
    input_schema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Recipient email address' },
        to_name: { type: 'string', description: 'Recipient display name' },
        subject: { type: 'string', description: 'Email subject line' },
        body: { type: 'string', description: 'Email body text. Write naturally as if from a clinic staff member. Use plain text with line breaks.' },
      },
      required: ['to', 'subject', 'body'],
    },
  },
  {
    name: 'add_note',
    description: 'Add a note to a patient\'s chart. Use when staff dictates a note, observation, or follow-up about a patient. The note will appear on the patient\'s profile under Notes.',
    input_schema: {
      type: 'object',
      properties: {
        patient_id: { type: 'string', description: 'Patient UUID — use the patient in context or from a search result' },
        note_text: { type: 'string', description: 'The note content. Write it clearly and professionally, capturing what the staff said.' },
        note_category: { type: 'string', enum: ['clinical', 'internal'], description: 'clinical for medical observations, internal for admin/staff notes. Default: internal' },
      },
      required: ['patient_id', 'note_text'],
    },
  },
  {
    name: 'create_task',
    description: 'Create a task for a staff member. Use when staff asks to add a to-do, assign work, or set a reminder. Available staff: Chris, Damien, Evan, Damon, Lily, Brendyn, Tara.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Short task title' },
        description: { type: 'string', description: 'Detailed description of what needs to be done' },
        assigned_to_name: { type: 'string', description: 'Name of the staff member to assign to' },
        patient_name: { type: 'string', description: 'Patient name if task relates to a specific patient' },
        priority: { type: 'string', enum: ['high', 'medium', 'low'], description: 'Task priority. Default: medium' },
        due_date: { type: 'string', description: 'Resolved due date as YYYY-MM-DD. Calculate from "Friday", "next week", "end of month", etc.' },
        task_category: { type: 'string', enum: ['medical', 'clinical', 'business'], description: 'medical/clinical for patient care tasks, business for admin. Default: business' },
      },
      required: ['title', 'assigned_to_name'],
    },
  },
  {
    name: 'today_schedule',
    description: 'Get today\'s appointment schedule (or a specific date). Use when staff asks "what\'s on the schedule today?", "who\'s coming in?", "any appointments today?", or asks about a specific date\'s schedule. You know today\'s date — resolve "Monday", "tomorrow", "next week" yourself. Never ask the user for a date.',
    input_schema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'The resolved date as YYYY-MM-DD. Calculate from relative terms like "Monday", "tomorrow", "next Friday" using today\'s date. Omit for today.' },
      },
      required: [],
    },
  },
];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages, services: posServices, patientName, patientId, context } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array required' });
  }

  try {
    const catalog = buildCatalogContext(posServices || []);
    const contextBlock = buildContextBlock(context, patientName, patientId);

    const now = new Date();
    const today = now.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'America/Los_Angeles' });

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      tools,
      system: `You are a clinic assistant at Range Medical. You talk like a coworker — brief, natural, helpful. Think of how you'd respond if someone leaned over and asked you something.

TODAY: ${dayOfWeek}, ${today}

You can help with:
- CHECKOUT: Add items to the cart (services, injections, IVs, peptides, packs)
- SCHEDULING: Search patients, check available slots, book appointments
- PATIENT RECORDS: Look up a patient's protocols, medications, next pickup dates, upcoming appointments, visit history, prescriptions
- NOTES: Add notes to a patient's chart (clinical observations, follow-ups, staff notes)
- TASKS: Create tasks for staff (to-dos, reminders, follow-ups)
- EMAIL: Draft and send emails to patients
- SCHEDULE: Check today's appointments, see who's coming in, view any date's schedule
- GENERAL: Answer questions about services, pricing, protocols

DATE HANDLING: You know today's date. When someone says "today", "tomorrow", "Monday", "next week", "this Friday", etc., calculate the correct YYYY-MM-DD date yourself. Never ask the user for a date format — just figure it out. "Monday" means the upcoming Monday. "Last Tuesday" means the most recent past Tuesday.

When staff asks about a patient's meds, next pickup, treatment plan, visit history, or anything clinical — use the lookup_patient_records tool. If a patient is already selected in context, use their patient_id directly. If not, search for them first.
When staff asks to email a patient, use draft_email. Look up the patient's email first if needed. Write the email body in a warm, professional tone from the clinic. The draft will be previewed before sending — staff must approve it.
When staff asks to add a note about a patient — use add_note. Write the note clearly and professionally, capturing what the staff said. Use the patient_id from context.
When staff asks to create a task, to-do, or reminder — use create_task. If no specific assignee is mentioned, ask who to assign it to. Available staff: Chris, Damien, Evan, Damon, Lily, Brendyn, Tara.
When staff asks about today's schedule, who's coming in, or appointments for any date — use today_schedule. Summarize the schedule briefly after showing it.
When staff mentions a product, walk through the decision tree one question at a time. Once confirmed, use the add_to_cart tool.
When staff wants to book, search the patient, check slots, confirm, and book.

Keep responses to 1-3 sentences. You're voice-first — be concise. Act like a real person, not a bot. Never ask for technical formats — handle that yourself.

${contextBlock}

PRODUCT DECISION TREES:

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

HRT:
- Primary medication: Testosterone Cypionate, Enanthate, HCG, Estradiol, Progesterone
- Dose: Men 20-200mg, Women 5-100mg
- Frequency: Every 3.5 days, Weekly, Twice weekly
- Secondary meds: HCG (250-2000 IU), Gonadorelin, Anastrozole
- HCG Standalone: $50 per 1000 IU. Doses: 250-2000 IU. Frequency: 2x or 3x/week. Duration: 1-4 weeks.

HBOT:
- Single Session $185, 5-Pack $850 ($170/ea), 10-Pack $1600 ($160/ea)
- Memberships available (recurring)

RED LIGHT THERAPY:
- Single Session $85, 5-Pack $375 ($75/ea), 10-Pack $600 ($60/ea)

MATCHING RULES:
- Common abbreviations: "tirz" = Tirzepatide, "sema" = Semaglutide, "reta" = Retatrutide, "test"/"test cyp" = Testosterone Cypionate, "NAD" = NAD+ IV or injection, "BPC" = BPC-157, "TB4" = TB-500/Thymosin Beta-4, "HBOT" = Hyperbaric Oxygen, "RLT" = Red Light Therapy, "HRT" = Hormone Replacement Therapy, "GH" = Growth Hormone blend
- Use the catalog_id from the catalog listing when calling add_to_cart.
- For weight loss: match by medication name + dose. Set quantity = number of injections (usually 4).
- For peptides: match by program name + duration.
- For injections: match the specific type. If quantity >= 10, look for "Buy 10 Get 12" variant.

CATALOG:
${catalog}`,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    });

    let reply = '';
    const toolCalls = [];

    for (const block of response.content) {
      if (block.type === 'text') {
        reply += block.text;
      } else if (block.type === 'tool_use') {
        toolCalls.push({ name: block.name, input: block.input });
      }
    }

    reply = reply.trim();

    if (toolCalls.length > 0) {
      return res.status(200).json({ reply, toolCalls });
    }

    return res.status(200).json({ reply });
  } catch (err) {
    console.error('AI assistant-chat error:', err);
    return res.status(500).json({ error: 'Failed to process' });
  }
}

function buildContextBlock(context, patientName, patientId) {
  const parts = [];
  if (context) parts.push(`CURRENT MODE: ${context}`);
  if (patientName) parts.push(`PATIENT: ${patientName}`);
  if (patientId) parts.push(`PATIENT ID: ${patientId}`);
  return parts.length ? parts.join('\n') : '';
}

function buildCatalogContext(posServices) {
  const sections = [];
  sections.push('## POS Services');
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
      const extras = [];
      if (item.sub_category) extras.push(`sub: ${item.sub_category}`);
      if (item.duration_days) extras.push(`${item.duration_days}d`);
      if (item.delivery_method) extras.push(item.delivery_method);
      if (item.description) extras.push(item.description.slice(0, 80));
      const suffix = extras.length ? ` | ${extras.join(' | ')}` : '';
      sections.push(`- id:"${item.id}" | "${item.name}" | ${price}${item.recurring ? ' (recurring)' : ''}${suffix}`);
    }
  }
  return sections.join('\n');
}
