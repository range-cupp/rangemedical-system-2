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
  {
    name: 'lookup_comms_history',
    description: 'Look up recent communications with a patient — emails, texts, and messages. Use when staff asks "when did we last contact them?", "what did we email them?", "any messages from this patient?", or anything about communication history.',
    input_schema: {
      type: 'object',
      properties: {
        patient_id: { type: 'string', description: 'Patient UUID' },
        channel: { type: 'string', enum: ['sms', 'email'], description: 'Filter by channel. Omit for all.' },
      },
      required: ['patient_id'],
    },
  },
  {
    name: 'cancel_appointment',
    description: 'Cancel a patient\'s appointment. Use when staff says "cancel their appointment", "cancel the 2pm", etc. Always confirm with staff before cancelling. Show the appointment details and ask for confirmation first.',
    input_schema: {
      type: 'object',
      properties: {
        appointment_id: { type: 'string', description: 'Appointment UUID to cancel' },
        reason: { type: 'string', description: 'Cancellation reason' },
      },
      required: ['appointment_id'],
    },
  },
  {
    name: 'lookup_lab_results',
    description: 'Look up a patient\'s lab results and bloodwork. Use when staff asks "are their labs back?", "what were their levels?", "when is their next lab?", or anything about labs or bloodwork.',
    input_schema: {
      type: 'object',
      properties: {
        patient_id: { type: 'string', description: 'Patient UUID' },
      },
      required: ['patient_id'],
    },
  },
  {
    name: 'lookup_membership',
    description: 'Check a patient\'s membership/subscription status. Use when staff asks "are they on a membership?", "when does it renew?", "is their membership active?", or anything about subscriptions.',
    input_schema: {
      type: 'object',
      properties: {
        patient_id: { type: 'string', description: 'Patient UUID' },
      },
      required: ['patient_id'],
    },
  },
  {
    name: 'lookup_consent_forms',
    description: 'Check a patient\'s consent form status — which forms they\'ve signed, which are missing, and health screening answers from each consent. Use when staff asks "have they signed their forms?", "are their consents complete?", "do they need to sign anything?", or health screening questions specific to a treatment consent (e.g. "did they flag anything on the HBOT consent?").',
    input_schema: {
      type: 'object',
      properties: {
        patient_id: { type: 'string', description: 'Patient UUID' },
      },
      required: ['patient_id'],
    },
  },
  {
    name: 'lookup_intake_data',
    description: 'Look up a patient\'s medical intake form data — allergies, current medications, medical conditions, HRT status, health history, PCP info, symptoms, and notes. Use when staff asks "does this patient have allergies?", "what medications are they on?", "any medical conditions?", "do they have a PCP?", "what did they put on their intake?", or any question about patient health history.',
    input_schema: {
      type: 'object',
      properties: {
        patient_id: { type: 'string', description: 'Patient UUID' },
      },
      required: ['patient_id'],
    },
  },
  {
    name: 'lookup_payments',
    description: 'Look up a patient\'s payment history, balance, and invoices. Use when staff asks "does she owe anything?", "when was their last payment?", "how much have they spent?", "any outstanding invoices?", or anything about payments and billing.',
    input_schema: {
      type: 'object',
      properties: {
        patient_id: { type: 'string', description: 'Patient UUID' },
      },
      required: ['patient_id'],
    },
  },
  {
    name: 'program_due_list',
    description: 'Get a list of patients who are due for their next payment round on a program. Use when staff asks "who needs their next weight loss payment?", "which WL patients are due?", "who needs to renew HRT?", "HBOT patients running low?", or any question about which patients on a program need their next round/block/pack.',
    input_schema: {
      type: 'object',
      properties: {
        program: { type: 'string', enum: ['weight_loss', 'hrt', 'peptide', 'iv', 'hbot', 'rlt', 'injection'], description: 'Program category to check. E.g. "weight_loss" for WL patients due for their next 4-pack.' },
      },
      required: ['program'],
    },
  },
  {
    name: 'send_consent_forms',
    description: 'Send missing consent forms to a single patient via email. Use when staff says "send them their forms", "email the HBOT consent", "send missing forms to [patient]", "send forms for their appointment", etc. This checks which forms the patient has already signed and only sends the ones they\'re missing for the given service. For sending to MULTIPLE patients at once, use batch_send_forms instead.',
    input_schema: {
      type: 'object',
      properties: {
        patient_id: { type: 'string', description: 'Patient UUID' },
        service_category: { type: 'string', enum: ['general', 'hrt', 'weight_loss', 'iv', 'peptide', 'hbot', 'rlt', 'prp', 'injection'], description: 'Service category to determine which forms are required. E.g. "hbot" sends HBOT consent + intake + HIPAA if missing. Default: general (intake + HIPAA only).' },
      },
      required: ['patient_id'],
    },
  },
  {
    name: 'request_protocol_change',
    description: 'Request a protocol or medication change that requires provider approval. Use when staff wants to change a dose, frequency, delivery method, medication, or any clinical detail on a patient\'s protocol. This does NOT make the change — it sends a request to the provider (Damien or Evan) for review. Use for things like "change his testosterone to daily sub-Q", "increase her tirz to 5mg", "switch frequency to weekly", etc.',
    input_schema: {
      type: 'object',
      properties: {
        patient_id: { type: 'string', description: 'Patient UUID' },
        change_description: { type: 'string', description: 'Clear description of the requested change. Include current values and proposed new values when known. E.g. "Change testosterone cypionate from 0.35ml every 3.5 days IM to daily sub-Q injection"' },
      },
      required: ['patient_id', 'change_description'],
    },
  },
  {
    name: 'batch_send_forms',
    description: 'Send missing consent forms to ALL patients with appointments on a given date, in one batch. Use when staff says "send forms to all Monday HBOT patients", "send intake forms to everyone scheduled tomorrow", "send HBOT forms to all patients on Monday who haven\'t done them", "blast out forms for Friday\'s appointments", or any request to send forms to multiple patients at once based on a schedule date. This checks each patient\'s signed forms and only sends what\'s missing. Always previews first — staff confirms before sending.',
    input_schema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'The date to check appointments for, as YYYY-MM-DD. Calculate from "Monday", "tomorrow", "next Friday", etc.' },
        service_category: { type: 'string', enum: ['hrt', 'weight_loss', 'iv', 'peptide', 'hbot', 'rlt', 'prp', 'injection'], description: 'Filter to appointments in this service category. E.g. "hbot" for HBOT appointments only. Omit to include ALL appointments on that date.' },
      },
      required: ['date'],
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
TIMEZONE: All times are Pacific Time (PT). When you see appointment times, they are already in Pacific. Always communicate times in Pacific. Never convert or assume UTC.
${contextBlock ? `\n${contextBlock}\nIMPORTANT: A patient is selected. When staff says "him", "her", "them", "this patient", "their", or asks to do something without naming a patient — they mean the selected patient above. Use their patient_id directly. Do NOT ask which patient unless the request explicitly names a DIFFERENT person.\n` : ''}
You can help with:
- CHECKOUT: Add items to the cart (services, injections, IVs, peptides, packs)
- SCHEDULING: Search patients, check available slots, book appointments, cancel appointments
- PATIENT RECORDS: Look up protocols, medications, next pickup dates, visit history, prescriptions
- NOTES: Add notes to a patient's chart (clinical observations, follow-ups, staff notes)
- TASKS: Create tasks for staff (to-dos, reminders, follow-ups)
- EMAIL: Draft and send emails to patients
- SCHEDULE: Check today's appointments, see who's coming in, view any date's schedule
- COMMS: Look up recent emails and texts with a patient
- PAYMENTS: Check payment history, balances, outstanding invoices, spending
- LABS: Check lab results, pending bloodwork, next lab date
- MEMBERSHIPS: Check active subscriptions, renewal dates, membership status
- CONSENTS: Check which consent forms are signed or missing, view health screening answers from each consent
- INTAKE DATA: Look up patient allergies, medications, medical conditions, health history from their intake form
- SEND FORMS: Send missing consent forms to a single patient via email
- BATCH SEND FORMS: Send missing forms to ALL patients on a date at once (e.g. "send HBOT forms to everyone on Monday")
- PROGRAM DUE: List patients due for their next payment round on any program (WL, HRT, peptide, HBOT, etc.)
- PROTOCOL CHANGES: Request dose, medication, or delivery method changes — sends to provider for approval
- GENERAL: Answer questions about services, pricing, protocols

DATE HANDLING: You know today's date. When someone says "today", "tomorrow", "Monday", "next week", "this Friday", etc., calculate the correct YYYY-MM-DD date yourself. Never ask the user for a date format — just figure it out. "Monday" means the upcoming Monday. "Last Tuesday" means the most recent past Tuesday.

When staff asks about a patient's meds, next pickup, treatment plan, visit history, profile, or anything clinical — use the lookup_patient_records tool. If a patient is already selected in context, use their patient_id directly. If not, search for them first. IMPORTANT: The patient records card is shown visually below your message — do NOT repeat all the data in your text response. Keep your text to 1 sentence like "Here's Aleph's info" or answer the specific question. Never dump protocols, visits, appointments, or payment details into a paragraph — the cards already show it.
When staff asks to email a patient, use draft_email. Look up the patient's email first if needed. Write the email body in a warm, professional tone from the clinic. The draft will be previewed before sending — staff must approve it.
When staff asks to add a note about a patient — use add_note. Write the note clearly and professionally, capturing what the staff said. Use the patient_id from context.
When staff asks to create a task, to-do, or reminder — use create_task. If no specific assignee is mentioned, ask who to assign it to. Available staff: Chris, Damien, Evan, Damon, Lily, Brendyn, Tara.
When staff asks about today's schedule, who's coming in, or appointments for any date — use today_schedule. Summarize the schedule briefly after showing it.
When staff asks about communications, messages, or last contact with a patient — use lookup_comms_history.
When staff asks to cancel an appointment — first look up the patient's records or schedule to find the appointment_id, confirm with staff, then use cancel_appointment.
When staff asks about labs, bloodwork, or test results — use lookup_lab_results.
When staff asks about memberships, subscriptions, or renewals — use lookup_membership.
When staff asks about consent forms, whether forms are signed, or what's missing — use lookup_consent_forms. This also returns health screening answers from each consent form.
When staff asks about allergies, medications, medical conditions, health history, PCP, or anything from the patient's intake form — use lookup_intake_data. This is the primary source for "does this patient have allergies?", "what meds are they on?", "any medical history?".
When staff asks about payments, balance, invoices, spending, or whether someone owes anything — use lookup_payments.
When staff asks which patients are due for their next payment, round, pack, or renewal on any program — use program_due_list. Pick the matching program (weight_loss, hrt, peptide, hbot, etc.).
When staff asks to send forms to a specific patient — use send_consent_forms. Pick the service_category that matches their service (e.g. "hbot" for HBOT patients). If no specific service is mentioned, use "general" to send intake + HIPAA.
When staff asks to send forms to multiple patients at once, everyone on a date, or all patients for a service — use batch_send_forms. E.g. "send HBOT forms to all Monday patients" → batch_send_forms with date=Monday and service_category=hbot. This previews the list first — staff clicks Send All to confirm. NEVER loop through patients one by one with send_consent_forms when batch_send_forms can do it in one call.
When staff asks to change a dose, medication, frequency, delivery method, or any protocol detail — use request_protocol_change. You CANNOT make protocol changes directly. Always route through the provider approval flow. Describe the change clearly with current and proposed values.
When staff mentions a product, walk through the decision tree one question at a time. Once confirmed, use the add_to_cart tool.
When staff wants to book, search the patient, check slots, confirm, and book.

Keep responses to 1-3 sentences. You're voice-first — be concise. Act like a real person, not a bot. Never ask for technical formats — handle that yourself.

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
