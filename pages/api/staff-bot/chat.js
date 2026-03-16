// /pages/api/staff-bot/chat.js
// Range Medical Staff Assistant — Claude-powered with tool use
// Claude acts as the conversational brain; tools execute real CRM actions.

import { createClient } from '@supabase/supabase-js';
import {
  handleCheckAvailability,
  handleBookAppointment,
  handleCancelAppointment,
  handleSendForms,
  handleQueryBilling,
  handleAddNote,
  handleCreateTask,
  handleGetSchedule,
  handleLookupPatient,
  handleGetServiceInfo,
  handleGetAvailableProviders,
  handleGetPatientProtocols,
  handleGetPatientAppointments,
  handleRescheduleAppointment,
  handleSendDocument,
  handleSearchKnowledge,
  DOCUMENT_CATALOG,
} from '../../../lib/staff-bot';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Tool definitions (what Claude can call) ──────────────────────────────────

const TOOLS = [
  {
    name: 'check_availability',
    description: 'Check open appointment slots on the calendar for a given service and date.',
    input_schema: {
      type: 'object',
      properties: {
        service: { type: 'string', description: 'Service name, e.g. "Range IV", "Initial Consult", "HBOT"' },
        date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
        time: { type: 'string', description: 'Optional preferred time in HH:MM 24hr format' },
        location: { type: 'string', description: 'Clinic location, e.g. "Newport Beach" or "Placentia". Required when the provider works at multiple locations.' },
      },
      required: ['service', 'date'],
    },
  },
  {
    name: 'book_appointment',
    description: 'Book an appointment on the calendar for a patient. If a specific nurse or provider is requested, pass their name in provider_name so it can be reassigned to them after booking.',
    input_schema: {
      type: 'object',
      properties: {
        service: { type: 'string', description: 'Service name, e.g. "Range IV"' },
        date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
        time: { type: 'string', description: 'Time in HH:MM 24hr format' },
        patient_name: { type: 'string', description: 'Full name of the patient being treated' },
        provider_name: { type: 'string', description: 'Optional: name of the specific nurse or provider to assign this to, e.g. "Lily"' },
        location: { type: 'string', description: 'Clinic location, e.g. "Newport Beach" or "Placentia". Required when the provider works at multiple locations.' },
      },
      required: ['service', 'date', 'time', 'patient_name'],
    },
  },
  {
    name: 'cancel_appointment',
    description: 'Cancel an existing appointment for a patient. Looks up their booking by name and optionally by date or service, then cancels it in Cal.com and marks it cancelled in the system. Always confirm the specific appointment with the user before calling this.',
    input_schema: {
      type: 'object',
      properties: {
        patient_name: { type: 'string', description: 'Full or partial name of the patient' },
        date: { type: 'string', description: 'Optional date in YYYY-MM-DD format to narrow down which booking' },
        service_type: { type: 'string', description: 'Optional service name to narrow down which booking, e.g. "Range IV"' },
        reason: { type: 'string', description: 'Optional reason for cancellation' },
      },
      required: ['patient_name'],
    },
  },
  {
    name: 'send_forms',
    description: `Send a form bundle link to a patient via SMS (and email if on file).
Bundle types and what they include:
- new-patient / onboarding: Medical Intake + HIPAA
- blood-draw / labs: Medical Intake + HIPAA + Blood Draw Consent
- iv / range-iv / injection: Medical Intake + HIPAA + IV/Injection Consent
- hrt / hormone / testosterone: Medical Intake + HIPAA + HRT Consent
- peptide / peptides: Medical Intake + HIPAA + Peptide Consent
- hbot / hyperbaric: Medical Intake + HIPAA + HBOT Consent
- weight-loss / semaglutide / tirzepatide: Medical Intake + HIPAA + Weight Loss Consent
- red-light / rlt: Medical Intake + HIPAA + Red Light Therapy Consent
- prp: Medical Intake + HIPAA + PRP Consent
- exosome: Medical Intake + HIPAA + Exosome IV Consent`,
    input_schema: {
      type: 'object',
      properties: {
        patient_name: { type: 'string', description: 'Full name of the patient' },
        bundle_type: {
          type: 'string',
          description: 'Bundle key. Default to "new-patient" if unclear.',
          enum: [
            'new-patient', 'onboarding', 'blood-draw', 'labs', 'iv', 'iv-therapy',
            'range-iv', 'injection', 'hrt', 'hormone', 'testosterone', 'peptide',
            'peptides', 'hbot', 'hyperbaric', 'weight-loss', 'semaglutide',
            'tirzepatide', 'red-light', 'rlt', 'prp', 'exosome',
          ],
        },
      },
      required: ['patient_name', 'bundle_type'],
    },
  },
  {
    name: 'query_billing',
    description: 'Look up recent invoices and charges for a patient.',
    input_schema: {
      type: 'object',
      properties: {
        patient_name: { type: 'string', description: 'Full name of the patient' },
      },
      required: ['patient_name'],
    },
  },
  {
    name: 'add_note',
    description: "Add a note to a patient's file.",
    input_schema: {
      type: 'object',
      properties: {
        patient_name: { type: 'string', description: 'Full name of the patient' },
        note: { type: 'string', description: 'The note text to add' },
      },
      required: ['patient_name', 'note'],
    },
  },
  {
    name: 'create_task',
    description: 'Create a task and assign it to a staff member. They get an SMS notification.',
    input_schema: {
      type: 'object',
      properties: {
        assigned_to: { type: 'string', description: 'First or full name of the staff member' },
        title: { type: 'string', description: 'Task description' },
        patient_name: { type: 'string', description: 'Optional patient this task is about' },
        due_date: { type: 'string', description: 'Optional due date in YYYY-MM-DD format' },
        priority: { type: 'string', enum: ['low', 'medium', 'high'] },
      },
      required: ['assigned_to', 'title'],
    },
  },
  {
    name: 'get_schedule',
    description: 'Get the appointment schedule for a specific date.',
    input_schema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
      },
      required: ['date'],
    },
  },
  {
    name: 'lookup_patient',
    description: 'Look up a patient by name — returns contact info and basic details.',
    input_schema: {
      type: 'object',
      properties: {
        patient_name: { type: 'string', description: 'Full or partial name of the patient' },
      },
      required: ['patient_name'],
    },
  },
  {
    name: 'get_available_providers',
    description: 'Get the list of providers who can perform a specific service on a given date. Filters to only staff who are hosts on that Cal.com event type — so only qualified providers are shown. Always pass the service name so the list is accurate.',
    input_schema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
        service: { type: 'string', description: 'Service name to filter providers by, e.g. "Range IV". Always pass this.' },
        location: { type: 'string', description: 'Optional location, e.g. "Newport Beach" or "Placentia"' },
      },
      required: ['date', 'service'],
    },
  },
  {
    name: 'get_service_info',
    description: 'Look up live pricing and descriptions for clinic services from the POS catalog. Use this to answer questions about how much something costs or what a service includes.',
    input_schema: {
      type: 'object',
      properties: {
        service_name: {
          type: 'string',
          description: 'Service or category to look up. Leave blank to get all active services.',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_patient_protocols',
    description: "Get a patient's active protocols — includes HRT, weight loss, peptide, IV, HBOT, and RLT programs. Shows dosing, schedule, session counts, and upcoming lab dates. Use this when staff asks what a patient is on, what their protocol is, or what they're currently taking.",
    input_schema: {
      type: 'object',
      properties: {
        patient_name: { type: 'string', description: 'Full or partial name of the patient' },
        include_inactive: { type: 'boolean', description: 'If true, also return completed/paused protocols. Default is active only.' },
      },
      required: ['patient_name'],
    },
  },
  {
    name: 'get_patient_appointments',
    description: "Get a patient's upcoming (or past) appointments. Returns scheduled/confirmed bookings from the calendar. Use this when staff asks about a patient's next appointment, appointment history, or what they have coming up.",
    input_schema: {
      type: 'object',
      properties: {
        patient_name: { type: 'string', description: 'Full or partial name of the patient' },
        include_past: { type: 'boolean', description: 'If true, return past appointments instead of upcoming ones.' },
        limit: { type: 'number', description: 'Max number of appointments to return. Default 10, max 20.' },
      },
      required: ['patient_name'],
    },
  },
  {
    name: 'reschedule_appointment',
    description: 'Reschedule an existing appointment to a new date and time. Looks up the booking by patient name, moves it in Cal.com, updates the system, and sends notifications to the patient and provider. Always confirm the specific booking and new time with the user before calling this.',
    input_schema: {
      type: 'object',
      properties: {
        patient_name: { type: 'string', description: 'Full or partial name of the patient' },
        new_date: { type: 'string', description: 'New date in YYYY-MM-DD format' },
        new_time: { type: 'string', description: 'New time in HH:MM 24hr format' },
        current_date: { type: 'string', description: 'Optional: current appointment date in YYYY-MM-DD format to narrow down which booking to reschedule' },
        service_type: { type: 'string', description: 'Optional: service name to narrow down which booking, e.g. "Range IV"' },
      },
      required: ['patient_name', 'new_date', 'new_time'],
    },
  },
  {
    name: 'search_knowledge',
    description: 'Search the clinic knowledge base for SOPs, pre/post-service instructions, clinical protocols, and admin procedures. Use this when staff asks about how to do something, what a patient should do before or after a service, what a clinical protocol requires, or any question about clinic procedures and policies.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Keywords to search for, e.g. "HBOT pre-service instructions", "peptide injection protocol", "post IV care", "cancellation policy"',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'send_document',
    description: `Send a link to a Range Medical service page to a patient via SMS or email. These are branded web pages on app.range-medical.com — not PDFs. Use this when staff says things like "send John the HBOT info", "text Sarah about hyperbaric oxygen", "email the tirzepatide page to Mike", "send the red light info to [patient]", or "send [patient] info about [service]". The document parameter should be the natural-language description of what to send (e.g. "hyperbaric oxygen", "tirzepatide", "methylene blue combo", "red light therapy", "NAD", "weight loss"). Available pages: ${DOCUMENT_CATALOG.map(d => d.name).join(', ')}.`,
    input_schema: {
      type: 'object',
      properties: {
        patient_name: { type: 'string', description: 'Full or partial name of the patient' },
        document: { type: 'string', description: 'Natural language description of what to send, e.g. "HBOT guide", "tirzepatide info", "methylene blue combo"' },
        method: { type: 'string', enum: ['sms', 'email'], description: 'Delivery method. Default: sms' },
      },
      required: ['patient_name', 'document'],
    },
  },
];

// ── Execute a tool call from Claude ─────────────────────────────────────────

async function executeTool(toolName, toolInput, staff) {
  console.log(`[StaffBot] Tool: ${toolName}`, JSON.stringify(toolInput));
  switch (toolName) {
    case 'check_availability':   return await handleCheckAvailability(toolInput);
    case 'book_appointment':     return await handleBookAppointment(toolInput);
    case 'cancel_appointment':   return await handleCancelAppointment(toolInput);
    case 'send_forms':           return await handleSendForms(toolInput);
    case 'query_billing':        return await handleQueryBilling(toolInput);
    case 'add_note':             return await handleAddNote(toolInput, staff);
    case 'create_task':          return await handleCreateTask(toolInput, staff);
    case 'get_schedule':         return await handleGetSchedule(toolInput);
    case 'lookup_patient':       return await handleLookupPatient(toolInput);
    case 'get_available_providers':   return await handleGetAvailableProviders(toolInput);
    case 'get_service_info':          return await handleGetServiceInfo(toolInput);
    case 'get_patient_protocols':     return await handleGetPatientProtocols(toolInput);
    case 'get_patient_appointments':  return await handleGetPatientAppointments(toolInput);
    case 'reschedule_appointment':    return await handleRescheduleAppointment(toolInput);
    case 'send_document':             return await handleSendDocument(toolInput);
    case 'search_knowledge':          return await handleSearchKnowledge(toolInput);
    default:                          return `Unknown tool: ${toolName}`;
  }
}

// ── System prompt ────────────────────────────────────────────────────────────

async function buildSystemPrompt(staff) {
  // Fetch live service catalog from pos_services — injected into prompt so
  // the bot always knows current pricing without needing a tool call.
  // Grouped by category for readability.
  let liveCatalogBlock = '';
  try {
    const { data: services } = await supabase
      .from('pos_services')
      .select('name, category, price_cents, recurring, interval, description')
      .eq('active', true)
      .order('category')
      .order('sort_order');

    if (services && services.length > 0) {
      const grouped = {};
      for (const s of services) {
        if (!grouped[s.category]) grouped[s.category] = [];
        grouped[s.category].push(s);
      }
      const categoryLabels = {
        assessment:   'ASSESSMENT',
        lab_panels:   'LAB PANELS',
        iv_therapy:   'IV THERAPY',
        injections:   'INJECTIONS',
        hbot:         'HBOT',
        regenerative: 'RED LIGHT THERAPY',
        packages:     'PACKAGES',
        prp:          'PRP',
        hrt:          'HRT',
        weight_loss:  'WEIGHT LOSS (GLP-1)',
        peptide:      'PEPTIDES',
      };
      const lines = ['── LIVE PRICE CATALOG (from POS) ───────────────────────────────────'];
      for (const [cat, items] of Object.entries(grouped)) {
        lines.push(`\n${categoryLabels[cat] || cat.toUpperCase()}`);
        for (const s of items) {
          const price = s.price_cents > 0
            ? `$${(s.price_cents / 100).toFixed(0)}${s.recurring ? `/${s.interval || 'mo'}` : ''}`
            : 'pricing by consultation';
          const desc = s.description ? ` — ${s.description}` : '';
          lines.push(`  ${s.name}: ${price}${desc}`);
        }
      }
      lines.push('────────────────────────────────────────────────────────────────────');
      liveCatalogBlock = lines.join('\n');
    }
  } catch (err) {
    console.warn('[StaffBot] Could not load live catalog:', err.message);
    liveCatalogBlock = '(Live catalog unavailable — use get_service_info tool for pricing)';
  }

  // Knowledge base is now on-demand via the search_knowledge tool.
  // No bulk injection here — keeps system prompt token-lean so multi-step
  // operations (cancel both, book + confirm) don't exceed the 50K input
  // tokens/minute rate limit. The bot calls search_knowledge when it needs
  // SOP content instead of having everything pre-loaded.
  const knowledgeBlock = '';

  const now = new Date();

  // All date logic anchored to Pacific time — Vercel runs UTC so we must derive
  // the Pacific calendar date first, then build a noon anchor from it.
  // Using noon avoids any DST boundary issues.
  const todayISO = now.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }); // YYYY-MM-DD in Pacific
  const today = now.toLocaleDateString('en-US', {
    timeZone: 'America/Los_Angeles',
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const timeNow = now.toLocaleTimeString('en-US', {
    timeZone: 'America/Los_Angeles', hour: 'numeric', minute: '2-digit',
  });

  // pacificAnchor = noon on today's Pacific date. getDay() on this is always
  // the correct Pacific weekday regardless of what the server's UTC clock says.
  const pacificAnchor = new Date(todayISO + 'T12:00:00');
  const currentDayPacific = pacificAnchor.getDay();

  const tomorrowAnchor = new Date(pacificAnchor);
  tomorrowAnchor.setDate(tomorrowAnchor.getDate() + 1);
  const tomorrowISO = tomorrowAnchor.toLocaleDateString('en-CA');

  // "This [day]" = nearest upcoming occurrence (always at least 1 day in the future)
  function thisWeekday(dayIndex) {
    const d = new Date(pacificAnchor);
    let diff = dayIndex - currentDayPacific;
    if (diff <= 0) diff += 7;
    d.setDate(d.getDate() + diff);
    return d.toLocaleDateString('en-CA');
  }
  // "Next [day]" = ALWAYS 7 days after thisWeekday (the following week)
  function nextWeekday(dayIndex) {
    const d = new Date(thisWeekday(dayIndex) + 'T12:00:00');
    d.setDate(d.getDate() + 7);
    return d.toLocaleDateString('en-CA');
  }

  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const thisWeekDates = Object.fromEntries(days.map((d,i) => [d, thisWeekday(i)]));
  const nextWeekDates = Object.fromEntries(days.map((d,i) => ['Next '+d, nextWeekday(i)]));

  return `You are the Range Medical staff assistant — a smart, concise AI helper for the clinic team at Range Medical in Newport Beach, CA.

Today is ${today} (${todayISO}). Current time: ${timeNow} Pacific.
Tomorrow = ${tomorrowISO}.
THIS week: ${Object.entries(thisWeekDates).map(([d,iso]) => `${d}=${iso}`).join(', ')}.
NEXT week: ${Object.entries(nextWeekDates).map(([d,iso]) => `${d}=${iso}`).join(', ')}.
DATE RULES: "Tuesday" or "this Tuesday" = ${thisWeekDates['Tuesday']}. "Next Tuesday" = ${nextWeekDates['Next Tuesday']}. Always use the NEXT WEEK date when the user says "next [day]".
You are assisting: ${staff.name}${staff.title ? ` (${staff.title})` : ''}.

── CLINIC INFO ──────────────────────────────────────────────────────
Range Medical is a regenerative medicine clinic in Newport Beach, CA.
Address: 1901 Westcliff Drive, Suite 10, Newport Beach, CA 92660
Phone: (949) 997-3988 | Website: range-medical.com
Hours: Monday–Friday 8am–5pm, Saturday by appointment (confirm with staff if unsure)
Payment: Cash, credit card, HSA/FSA accepted. We do NOT accept insurance.
Cancellation policy: 24-hour notice required. Same-day cancellations may be subject to a fee.
Parking: Free parking available in the Westcliff Plaza lot.
First visit: Patients should arrive 10–15 min early to complete paperwork. Wear comfortable clothing. No fasting required unless labs are ordered.

── KNOWLEDGE BASE ───────────────────────────────────────────────────
For SOPs, pre/post-service instructions, clinical protocols, and admin
procedures — use the search_knowledge tool. Examples:
  "What should a patient do before HBOT?" → search_knowledge("HBOT pre-service instructions")
  "How do we administer peptide injections?" → search_knowledge("peptide injection protocol")
  "What's our cancellation policy?" → search_knowledge("cancellation policy")
Always search before saying you don't know a procedure or policy.
─────────────────────────────────────────────────────────────────────

── SERVICES QUICK REFERENCE ─────────────────────────────────────────

IV THERAPY
  Duration: 30–60 min standard. NAD+ runs 2–4 hours. Exosome IV 30–60 min.
  What it is: Nutrients delivered directly into the bloodstream. Bypasses digestion — far more effective than oral supplements.
  Services:
    Range IV ($225) — Myers cocktail base, 5 nutrients, 30–60 min
    NAD+ IV — 225mg ($375) / 500mg ($525) / 750mg ($650) / 1000mg ($775) — cellular energy, brain, anti-aging
    Vitamin C IV — 25g ($215) / 50g ($255) / 75g ($330) — immune support, antioxidant
    Glutathione IV — 1g ($170) / 2g ($190) / 3g ($215) — detox, skin, immune
    MB + Vit C + Mag Combo ($750) — Methylene Blue + Vitamin C + Magnesium. Mitochondrial support, brain function, energy, anti-inflammatory. This IS a service we offer.
    IV Add-on ($35 each) — extra nutrients added to any IV
    Exosome IV — pricing by consultation
  Injections: Standard ($35) — B12, B-Complex, D3, Biotin, Amino Blend, NAC, BCAA | Premium ($50) — L-Carnitine, Glutathione, MIC-B12/Skinny Shot | NAD+ IM injection $0.50/mg (50mg–150mg)
  Common uses: Energy, immune support, hydration, recovery, hangover, athletic performance, anti-aging, mitochondrial health
  Prep: Eat beforehand, stay hydrated, wear clothing with easy arm access. No special prep.
  Contraindications: Kidney disease, CHF, certain allergies. Provider screens on first visit.
  First-timers: Brief health screening before first IV. Walk-in friendly after that.

HYPERBARIC OXYGEN THERAPY (HBOT)
  Duration: 60–90 minutes per session
  What it is: Patient breathes 100% pure oxygen inside a pressurized chamber. Increased pressure forces oxygen deep into tissues, accelerating healing, reducing inflammation, and supporting brain function.
  Common uses: Recovery, wound healing, post-surgery, traumatic brain injury (TBI), long COVID, athletic performance, anti-aging
  Prep: No food or alcohol 2 hours before. Remove all jewelry, electronics, petroleum-based products. Wear cotton clothing provided by clinic. Bring nothing into the chamber.
  Contraindications: Untreated pneumothorax, recent ear surgery, certain lung conditions. Detailed intake required.
  Pricing: Check POS for current session and package pricing.
  Note: Patients may feel pressure in their ears (like flying) — staff demonstrate equalization technique before first session.

RED LIGHT THERAPY (RLT)
  Duration: 10–20 minutes per session
  What it is: Medical-grade LED panels emit red and near-infrared light that penetrates skin and tissue, stimulating cellular energy production (mitochondria), collagen, and reducing inflammation.
  Common uses: Skin rejuvenation, pain relief, muscle recovery, hair growth, mood/energy
  Prep: Clean skin (no lotions, sunscreen, or makeup on treated area). Eye protection provided.
  Contraindications: Active cancer on treatment site, photosensitizing medications — ask provider.
  Pricing: Check POS for session and package pricing.

HORMONE REPLACEMENT THERAPY (HRT)
  Membership: $250/month — includes all hormone medications, ongoing lab monitoring, provider check-ins, and ONE IV per month ($225 value)
  What it is: Personalized hormone optimization for men and women. Testosterone, thyroid, estrogen, progesterone, DHEA based on lab results.
  Process: $250 assessment (credited toward treatment) → comprehensive hormone labs → provider review → personalized protocol → monthly monitoring
  Common uses: Low energy, brain fog, low libido, poor sleep, muscle loss, mood changes, menopause symptoms
  Timeline: Most patients notice improvements in energy and mood within 2–6 weeks.
  Delivery: Injections (self-administered at home), topical cream, or pellets depending on protocol.
  Contraindications: Active hormone-sensitive cancer, untreated sleep apnea. Labs required before starting.

WEIGHT LOSS (GLP-1 Medications)
  Medications: Tirzepatide (dual GIP/GLP-1), Semaglutide (GLP-1), Retatrutide (triple agonist — newest, strongest)
  What it is: Physician-supervised medical weight loss. Weekly self-injections. Dosing titrated monthly.
  Process: $250 assessment (credited toward treatment) → metabolic/hormone labs → provider recommendation → weekly injections → dose adjustments
  Results: Most patients lose 15–25% body weight over 6–12 months.
  Side effects: Mild nausea most common, especially in first few weeks. Usually improves with dose titration.
  Duration: Most use for 6–12 months, then maintain. Not a forever medication for most patients.
  Pricing: Check POS for current medication pricing (varies by dose).
  Prep for injections: Rotate injection sites (abdomen, thigh, upper arm). Refrigerate medication.

PEPTIDE THERAPY
  What it is: Short amino acid chains that signal the body to perform specific functions — healing, GH release, immune support, skin health.
  Common peptides offered:
    - BPC-157 / TB-500 / Wolverine Blend: injury healing, tissue repair, inflammation (results in 2–4 weeks)
    - CJC-1295 / Ipamorelin / Tesamorelin blends: growth hormone stimulation, body comp, sleep, recovery
    - GHK-Cu / GLOW / KLOW: skin and hair health, collagen
    - TA1 / LL-37 / Thymalin: immune support
    - Tirzepatide / Retatrutide: weight loss (see Weight Loss above)
  Administration: Subcutaneous injection (tiny insulin-style needle). Clinic teaches self-injection. Most do it at home.
  Schedule: Most peptides are 5 days on / 2 days off. Some are daily or weekly. Provider sets protocol.
  Pricing: Varies by peptide and dose. Check POS or ask provider.

PRP (Platelet-Rich Plasma)
  What it is: Patient's own blood drawn, spun in centrifuge to concentrate growth factors (platelets), re-injected into target area.
  Common uses: Joint pain, tendon injuries, hair restoration, facial rejuvenation
  Duration: 45–90 minutes including draw, processing, and injection
  Insurance: Not typically covered. HSA/FSA accepted. Clinic can provide documentation.
  Prep: Stay well-hydrated. Avoid NSAIDs (Advil, Aleve) for 5–7 days before.

LAB PANELS
  Essential Panel — $350: Hormones (testosterone, estradiol, DHEA, SHBG), thyroid (TSH, free T3/T4), metabolic (glucose, insulin, HbA1c), lipids (cholesterol, HDL, LDL, triglycerides), CBC, vitamins (D, B12), cortisol, PSA (men)
  Elite Panel — $750: Everything in Essential PLUS advanced cardiovascular (Lp(a), ApoB, NMR lipoprofile), inflammation (homocysteine, hsCRP, fibrinogen), advanced metabolic, IGF-1, ferritin, and additional biomarkers
  Process: Blood draw at clinic → results in 3–5 business days → provider review → results call or portal
  Prep: Fast for 8–12 hours before draw (water OK). No strenuous exercise day before.
  First-timers: Always start with a lab panel before beginning any hormone or peptide protocol.

INITIAL CONSULT / ASSESSMENT
  Cost: $250 — credited toward any treatment the patient starts
  What it is: 15–20 min conversation with a provider about symptoms, goals, and which services fit. Not a full medical appointment.
  Outcome: Provider recommends a starting point (labs, specific service, protocol). Patient decides whether to move forward. The $250 assessment fee is credited toward whatever treatment they choose.
  How to book: Can book online or via the schedule tool. No forms required in advance for consult-only.

${liveCatalogBlock}

${knowledgeBlock}

── COMMON FRONT DESK QUESTIONS ──────────────────────────────────────
Q: Do you take insurance?
A: No, we are a cash-pay clinic. We accept all major credit cards, HSA, and FSA cards.

Q: How much is the assessment?
A: The Range Assessment is $250. If you decide on any treatment, that $250 is credited toward your treatment — so you're not paying extra.

Q: How long is an IV?
A: Standard IVs are 30–60 minutes. NAD+ runs longer — typically 2–4 hours depending on dose.

Q: Do I need an appointment?
A: Yes for all services. Walk-ins may be accommodated if schedule allows, but we recommend booking.

Q: What should I bring to my first visit?
A: Valid photo ID and insurance card if you have one (for records only — we don't bill insurance). Wear comfortable clothing. Arrive 10–15 minutes early for paperwork.

Q: Do you do primary care?
A: No. We are a specialized regenerative medicine and optimization clinic, not a primary care provider.

Q: Can I combine services?
A: Yes — many patients do an IV with RLT in the same visit, or combine peptide therapy with HRT. Provider will guide combinations.

Q: How often should I come in?
A: Depends on the service. IVs: weekly to monthly. HBOT: typically 10–40 sessions in a protocol. RLT: 3x/week for best results. HRT: monthly for injections/check-ins.

── LOCATIONS ────────────────────────────────────────────────────────
Range Medical has two locations:
  - Newport Beach (default) — 1901 Westcliff Drive, Suite 10
  - Placentia — separate Cal.com event types (slugs/titles contain "placentia" or "tlab")

LOCATION RULES:
  - Default is always Newport Beach unless stated otherwise.
  - Lily Diaz (RN) works Monday mornings at PLACENTIA ONLY. She is NOT available at Newport Beach on Mondays.
  - If someone requests Lily at Newport Beach on a Monday, DO NOT check availability or proceed with the booking.
    Instead say: "Lily is at Placentia on Monday mornings and is not available at Newport Beach. Would you like to:
    1. Book Lily at Placentia on Monday, or
    2. Book with Damien Burgess at Newport Beach instead?"
    Wait for their answer before doing anything else.
  - On any other day, Lily is at Newport Beach (default).
  - Whenever booking Lily on a Monday AND the location has not been specified, STOP and ask:
    "Is this for Newport Beach or Placentia?" — wait for the answer before calling check_availability or book_appointment.
  - Always pass the confirmed location in the "location" field of check_availability and book_appointment.
  - If any other provider works at multiple locations and the user hasn't specified, ask the same question.

── BOOKING WORKFLOW (follow every time, in order) ──────────────────
PROVIDER vs PATIENT — critical distinction:
  - "Book WITH Nurse Lily" / "with Lily" → Lily is the PROVIDER (nurse/staff doing the treatment), NOT the patient.
  - The patient is the person being treated. If unclear who the patient is, ask once.

1. PATIENT: If given only a first name or partial name, call lookup_patient first.
   - 1 match → proceed.
   - 2+ matches → list them, ask "Which one?" — wait for reply.
   - 0 matches → say so, ask for clarification.

2. PROVIDER: Call get_available_providers with the service name AND date (and location if known).
   - This filters to only providers who actually perform that service — always pass service.
   - Present the list: "Available providers for [service] on [day]: [names]. Who should I book with?"
   - Wait for the staff member to pick one before proceeding.
   - If staff member already specified a provider → skip the question, just verify they're on the list.

3. AVAILABILITY: Call check_availability for the service + date.
   - If the exact time IS available → proceed to step 4.
   - If NOT available → show 3 closest slots, ask which works. Wait for reply.

4. CONFIRM: Before calling book_appointment, always show a confirmation:
   "Ready to book:
   👤 [Patient name]
   🏥 [Service]
   📅 [Day, Date] at [time]
   👩‍⚕️ [Provider]
   Confirm? (yes/no)"
   Wait for "yes" or "confirm" before booking.

5. BOOK: Call book_appointment. Report EXACT error text if it fails — do not soften it.
   On success: "✅ Booked — [Patient], [Service], [Day] at [time] with [Provider]."

Never skip any step. Never call book_appointment without a confirmed "yes."

── RESCHEDULE WORKFLOW ──────────────────────────────────────────────
When staff asks to reschedule an appointment:
1. Call get_patient_appointments to find the current booking if date/service not specified.
2. Confirm which booking to move: "Currently booked: [Service] on [Day] at [time]. Move this one?"
3. Show the new time and confirm: "Reschedule to [New Day] at [new time]? (yes/no)" — wait for yes.
4. Call reschedule_appointment. Report success or exact error.
Never reschedule without confirmation. Always resolve ambiguity (multiple bookings) before acting.
─────────────────────────────────────────────────────────────────────

PRICING:
- The LIVE PRICE CATALOG above is injected from the POS at session start — use it to answer pricing questions directly without a tool call.
- Use get_service_info tool only if a service isn't in the catalog above (e.g. custom/new items).
- Key quick-ref: Range IV $225 | MB + Vit C + Mag Combo $750 | NAD+ from $375 | HRT Membership $250/mo | Essential Labs $350 | Elite Labs $750 | Range Assessment $250 (credited toward treatment) | HBOT single $185 | RLT single $85 | PRP single $750
- When asked "what is [service]?" — answer from the knowledge base above. Then give pricing from the catalog.

GENERAL BEHAVIOR:
- Be direct and efficient. Staff are busy — get to the point.
- You know this clinic inside and out. Answer service, prep, policy, and FAQ questions confidently without needing to look them up.
- Use tools when the question is about a specific patient's data: lookup_patient for contact info, get_patient_protocols for what they're on, get_patient_appointments for their schedule.
- Use search_knowledge for ANY question about clinic procedures, pre/post-service instructions, clinical protocols, or policies. Never say "I don't know the specific protocol" — search first.
- When a tool returns an error or empty result, say exactly what happened — NEVER invent phrases like "system issue" or "database problem." If get_patient_protocols returns nothing, say "No active protocols on file for [name]" and offer to check appointments or purchases instead. If it returns a lookup error, quote the actual error text.
- Understand natural phrasing. "Hey could you send Chris Cupp the new patient forms" → send_forms, patient "Chris Cupp", bundle "new-patient".
- Dates: resolve "tomorrow", "Monday", "next Friday" using the date table above.
- Only ask a follow-up question when genuinely stuck. One question at a time.
- Emoji status indicators are fine (✅ ❌ 📋 📅). Don't overuse them.
- Stay focused on clinic operations. Redirect off-topic requests politely.`;
}

// ── Main API handler ─────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Auth
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'Invalid or expired session' });

    // Employee
    const { data: employee } = await supabase
      .from('employees')
      .select('id, name, title, is_admin, phone, calcom_user_id, permissions')
      .eq('email', user.email)
      .eq('is_active', true)
      .maybeSingle();
    if (!employee) return res.status(403).json({ error: 'No active employee account found' });

    // Message + conversation history
    const { message, history = [] } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Build initial messages array from history + new user message
    const loopMessages = [
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: message.trim() },
    ];

    const systemPrompt = await buildSystemPrompt(employee);

    // ── Agentic loop: Claude → tool calls → results → Claude ────────────────
    let finalResponse = null;
    const MAX_ITERATIONS = 6;

    // Helper: call Claude API with retry on rate limit (429)
    async function callClaude(messages) {
      const MAX_RETRIES = 3;
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1024,
            system: systemPrompt,
            tools: TOOLS,
            messages,
          }),
        });

        if (claudeRes.status === 429 && attempt < MAX_RETRIES - 1) {
          // Rate limited — wait and retry. Use retry-after header if available.
          const retryAfter = claudeRes.headers.get('retry-after');
          const waitMs = retryAfter ? Math.min(Number(retryAfter) * 1000, 15000) : (attempt + 1) * 3000;
          console.warn(`[StaffBot] Rate limited (429), retrying in ${waitMs}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
          await new Promise(resolve => setTimeout(resolve, waitMs));
          continue;
        }

        return claudeRes;
      }
    }

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const claudeRes = await callClaude(loopMessages);

      if (!claudeRes.ok) {
        const errText = await claudeRes.text();
        console.error('[StaffBot] Claude API error:', claudeRes.status, errText);
        // Friendly message for rate limits
        if (claudeRes.status === 429) {
          return res.status(200).json({
            response: '⚠️ The assistant is getting a lot of requests right now. Please wait a few seconds and try again.',
            employee: { name: employee.name, title: employee.title },
          });
        }
        let detail = '';
        try { detail = JSON.parse(errText)?.error?.message || ''; } catch {}
        return res.status(200).json({
          response: `⚠️ AI service error (${claudeRes.status})${detail ? `: ${detail}` : ''}. Please try again.`,
          employee: { name: employee.name, title: employee.title },
          _debug: { claudeStatus: claudeRes.status, claudeError: errText.slice(0, 500) },
        });
      }

      const claudeData = await claudeRes.json();
      const stopReason = claudeData.stop_reason;
      const content = claudeData.content || [];

      // Append assistant turn to loop history
      loopMessages.push({ role: 'assistant', content });

      if (stopReason === 'end_turn') {
        const textBlock = content.find((b) => b.type === 'text');
        finalResponse = textBlock?.text || '✅ Done.';
        break;
      }

      if (stopReason === 'tool_use') {
        const toolUseBlocks = content.filter((b) => b.type === 'tool_use');
        const toolResults = [];

        for (const toolUse of toolUseBlocks) {
          const result = await executeTool(toolUse.name, toolUse.input, employee);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: typeof result === 'string' ? result : JSON.stringify(result),
          });
        }

        loopMessages.push({ role: 'user', content: toolResults });
        continue;
      }

      // Fallback — unexpected stop reason
      const textBlock = content.find((b) => b.type === 'text');
      finalResponse = textBlock?.text || '✅ Done.';
      break;
    }

    if (!finalResponse) {
      finalResponse = "I wasn't able to complete that. Please try again.";
    }

    return res.status(200).json({
      response: finalResponse,
      employee: { name: employee.name, title: employee.title },
    });

  } catch (error) {
    console.error('[StaffBot] Unhandled error:', error.message, error.stack);
    return res.status(500).json({
      error: 'Something went wrong. Please try again.',
      _debug: error.message,
    });
  }
}
