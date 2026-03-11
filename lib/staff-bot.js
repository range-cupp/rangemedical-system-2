// /lib/staff-bot.js
// Range Medical Staff SMS Bot
// Handles natural language commands from staff members via Blooio SMS
// Staff texts the clinic number → bot parses intent → queries/updates CRM → replies

import { createClient } from '@supabase/supabase-js';
import { getEventTypes, getAvailableSlots, createBooking } from './calcom';
import { sendBlooioMessage } from './blooio';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ================================================================
// STAFF IDENTIFICATION
// ================================================================

export async function identifyStaff(phone) {
  if (!phone) return null;
  const normalized = phone.replace(/\D/g, '').slice(-10);

  const { data: employee } = await supabase
    .from('employees')
    .select('id, name, title, is_admin, phone, calcom_user_id')
    .ilike('phone', `%${normalized}`)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  return employee || null;
}

// ================================================================
// INTENT PARSING via Claude Haiku
// ================================================================

async function parseIntent(text, staffName) {
  const now = new Date();
  const today = now.toLocaleDateString('en-US', {
    timeZone: 'America/Los_Angeles',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const todayISO = now.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }); // YYYY-MM-DD

  const systemPrompt = `You are a command parser for Range Medical, a medical clinic in Newport Beach, CA.
Parse staff member ${staffName}'s SMS message and return a JSON object only — no other text.

Today is ${today}. Today's ISO date is ${todayISO}. Timezone: America/Los_Angeles.

Supported intents and their params:

"check_availability" — check open slots on Cal.com
  params: { service (string), date (YYYY-MM-DD), time (HH:MM 24hr, optional) }

"book_appointment" — book an appointment on Cal.com for a patient
  params: { service (string), date (YYYY-MM-DD), time (HH:MM 24hr), patient_name (string) }

"query_billing" — look up patient invoices/charges
  params: { patient_name (string) }

"add_note" — add a note to a patient's file
  params: { patient_name (string), note (string) }

"create_task" — create a task and assign it to a staff member (notifies them by SMS)
  params: { assigned_to (string, first name or full name), title (string), patient_name (string, optional), due_date (YYYY-MM-DD, optional), priority ("low"|"medium"|"high", default "medium") }

"get_schedule" — get the appointment schedule for a day
  params: { date (YYYY-MM-DD) }

"lookup_patient" — look up basic patient info
  params: { patient_name (string) }

"help" — show available commands
  params: {}

"unknown" — cannot parse
  params: { original: (the original text) }

Examples:
"Is there a Range IV slot tomorrow at 10:30?" → {"intent":"check_availability","params":{"service":"Range IV","date":"TOMORROW_DATE","time":"10:30"}}
"Book Range IV for Sarah Johnson tomorrow at 2pm" → {"intent":"book_appointment","params":{"service":"Range IV","date":"TOMORROW_DATE","time":"14:00","patient_name":"Sarah Johnson"}}
"What did we charge John Smith?" → {"intent":"query_billing","params":{"patient_name":"John Smith"}}
"Add note to Mike Chen: called to confirm appointment" → {"intent":"add_note","params":{"patient_name":"Mike Chen","note":"called to confirm appointment"}}
"Create task for Ashley: call Sarah Johnson about labs - due tomorrow, high priority" → {"intent":"create_task","params":{"assigned_to":"Ashley","title":"call Sarah Johnson about labs","patient_name":"Sarah Johnson","due_date":"TOMORROW_DATE","priority":"high"}}
"What's on the schedule today?" → {"intent":"get_schedule","params":{"date":"${todayISO}"}}
"Look up Chris Cupp" → {"intent":"lookup_patient","params":{"patient_name":"Chris Cupp"}}
"help" → {"intent":"help","params":{}}

Replace TOMORROW_DATE with the actual tomorrow date in YYYY-MM-DD format.
Return ONLY valid JSON. No markdown, no explanation.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: systemPrompt,
        messages: [{ role: 'user', content: text }],
      }),
    });

    if (!response.ok) {
      console.error('Claude API error:', response.status, await response.text());
      return { intent: 'unknown', params: { original: text } };
    }

    const data = await response.json();
    const jsonText = data.content?.[0]?.text?.trim();
    return JSON.parse(jsonText);
  } catch (err) {
    console.error('Intent parsing error:', err.message);
    return { intent: 'unknown', params: { original: text } };
  }
}

// ================================================================
// HELPER: Find patient by name
// ================================================================

async function findPatient(name) {
  if (!name) return null;
  const parts = name.trim().split(/\s+/);
  const first = parts[0];
  const last = parts[parts.length - 1];

  const { data: patients } = await supabase
    .from('patients')
    .select('id, first_name, last_name, email, phone, date_of_birth, ghl_contact_id')
    .or(`first_name.ilike.${first}%,last_name.ilike.${last}%`)
    .limit(5);

  if (!patients || patients.length === 0) return null;

  // Prefer exact full name match
  const exact = patients.find(
    (p) => `${p.first_name} ${p.last_name}`.toLowerCase() === name.toLowerCase()
  );
  return exact || patients[0];
}

// ================================================================
// HELPER: Format date/time for SMS display
// ================================================================

function formatDate(dateStr) {
  // dateStr is YYYY-MM-DD
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(timeStr) {
  // timeStr is HH:MM (24hr)
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'pm' : 'am';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m}${ampm}`;
}

function slotToDisplayTime(isoTime) {
  return new Date(isoTime).toLocaleTimeString('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// ================================================================
// HELPER: Match service name to Cal.com event type
// ================================================================

async function findEventType(serviceName) {
  const eventTypesData = await getEventTypes();

  // getEventTypes() returns result.data — could be array or { eventTypes: [...] }
  let allEvents = [];
  if (Array.isArray(eventTypesData)) {
    allEvents = eventTypesData;
  } else if (eventTypesData?.eventTypes) {
    allEvents = eventTypesData.eventTypes;
  } else if (eventTypesData) {
    allEvents = [eventTypesData];
  }

  if (allEvents.length === 0) return null;

  const needle = serviceName?.toLowerCase() || '';

  // Exact or substring match
  return (
    allEvents.find(
      (et) =>
        et.title?.toLowerCase() === needle ||
        et.title?.toLowerCase().includes(needle) ||
        needle.includes(et.title?.toLowerCase())
    ) || null
  );
}

// ================================================================
// INTENT HANDLERS
// ================================================================

async function handleCheckAvailability(params) {
  try {
    const eventType = await findEventType(params.service);
    if (!eventType) {
      return `❌ Service "${params.service}" not found on the calendar. Check the name and try again.`;
    }

    const date = params.date;
    const startTime = `${date}T00:00:00`;
    const endTime = `${date}T23:59:59`;

    const slotsData = await getAvailableSlots(eventType.id, startTime, endTime);

    // slotsData could be { slots: { "date": [...] } } or { "date": [...] }
    const slotsObj = slotsData?.slots || slotsData || {};
    const daySlots = slotsObj[date] || [];

    if (daySlots.length === 0) {
      return `❌ No availability for ${eventType.title} on ${formatDate(date)}.`;
    }

    // If specific time was requested, check if it's available
    if (params.time) {
      const requestedHHMM = params.time; // "10:30"
      const isAvailable = daySlots.some((slot) => {
        const slotHHMM = new Date(slot.time).toLocaleTimeString('en-US', {
          timeZone: 'America/Los_Angeles',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
        return slotHHMM === requestedHHMM;
      });

      if (isAvailable) {
        return (
          `✅ ${eventType.title} at ${formatTime(params.time)} on ${formatDate(date)} is available.\n\n` +
          `Reply: "Book ${params.service} ${formatDate(date)} ${formatTime(params.time)} for [Patient Name]"`
        );
      } else {
        const nearby = daySlots
          .slice(0, 6)
          .map((s) => slotToDisplayTime(s.time))
          .join(', ');
        return (
          `❌ ${eventType.title} at ${formatTime(params.time)} on ${formatDate(date)} is taken.\n\n` +
          `Available times: ${nearby}`
        );
      }
    }

    // No specific time — show all available slots
    const displaySlots = daySlots
      .slice(0, 10)
      .map((s) => slotToDisplayTime(s.time))
      .join(', ');
    const extra = daySlots.length > 10 ? ` +${daySlots.length - 10} more` : '';

    return `📅 ${eventType.title} — ${formatDate(date)}:\n${displaySlots}${extra}`;
  } catch (err) {
    console.error('check_availability error:', err);
    return `❌ Error checking availability: ${err.message}`;
  }
}

async function handleBookAppointment(params) {
  try {
    // Find patient
    const patient = await findPatient(params.patient_name);
    if (!patient) {
      return `❌ Patient "${params.patient_name}" not found in the CRM. Check the name and try again.`;
    }
    const patientName = `${patient.first_name} ${patient.last_name}`;

    // Find event type
    const eventType = await findEventType(params.service);
    if (!eventType) {
      return `❌ Service "${params.service}" not found on the calendar.`;
    }

    // Build ISO start (assume Pacific time input)
    const startISO = `${params.date}T${params.time}:00`;

    // Create booking
    const booking = await createBooking({
      eventTypeId: eventType.id,
      start: startISO,
      name: patientName,
      email: patient.email || `noemail+${patient.id}@range-medical.com`,
      phoneNumber: patient.phone || undefined,
      notes: 'Booked via staff SMS bot',
    });

    if (booking?.error || !booking?.uid) {
      const errText = booking?.error || JSON.stringify(booking).slice(0, 120);
      return `❌ Cal.com booking failed: ${errText}`;
    }

    // Save to appointments table (best-effort)
    const durationMins = eventType.length || 60;
    const endISO = new Date(
      new Date(startISO).getTime() + durationMins * 60000
    ).toISOString();

    await supabase
      .from('appointments')
      .insert({
        patient_id: patient.id,
        patient_name: patientName,
        patient_phone: patient.phone || null,
        service_name: eventType.title,
        service_category: eventType.title,
        start_time: new Date(startISO).toISOString(),
        end_time: endISO,
        duration_minutes: durationMins,
        status: 'scheduled',
        source: 'staff_sms',
        cal_com_booking_id: booking.uid,
        notes: 'Booked via staff SMS bot',
      })
      .catch((e) => console.warn('DB appointment insert failed:', e.message));

    return (
      `✅ Booked!\n` +
      `👤 ${patientName}\n` +
      `🏥 ${eventType.title}\n` +
      `📅 ${formatDate(params.date)} at ${formatTime(params.time)}\n` +
      `🔖 Ref: ${booking.uid}`
    );
  } catch (err) {
    console.error('book_appointment error:', err);
    return `❌ Booking error: ${err.message}`;
  }
}

async function handleQueryBilling(params) {
  try {
    const patient = await findPatient(params.patient_name);
    if (!patient) return `❌ Patient "${params.patient_name}" not found.`;

    const { data: invoices } = await supabase
      .from('invoices')
      .select('total_cents, status, created_at, items, paid_at')
      .eq('patient_id', patient.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (!invoices || invoices.length === 0) {
      return `No invoices found for ${patient.first_name} ${patient.last_name}.`;
    }

    const totalPaid = invoices
      .filter((i) => i.status === 'paid')
      .reduce((sum, i) => sum + (i.total_cents || 0), 0);

    const lines = invoices
      .map((inv) => {
        const date = new Date(inv.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
        const items = Array.isArray(inv.items)
          ? inv.items.map((i) => i.description || i.name || 'Service').join(', ')
          : 'Service';
        return `• ${date}: $${(inv.total_cents / 100).toFixed(2)} — ${items} (${inv.status})`;
      })
      .join('\n');

    return (
      `💰 ${patient.first_name} ${patient.last_name}\n` +
      `Total paid: $${(totalPaid / 100).toFixed(2)}\n\n` +
      `Recent invoices:\n${lines}`
    );
  } catch (err) {
    console.error('query_billing error:', err);
    return `❌ Billing error: ${err.message}`;
  }
}

async function handleAddNote(params, staff) {
  try {
    const patient = await findPatient(params.patient_name);
    if (!patient) return `❌ Patient "${params.patient_name}" not found.`;

    await supabase.from('patient_notes').insert({
      patient_id: patient.id,
      body: params.note,
      note_date: new Date().toISOString(),
      source: 'staff_sms',
      created_by: staff.name,
    });

    return `✅ Note added to ${patient.first_name} ${patient.last_name}'s file.`;
  } catch (err) {
    console.error('add_note error:', err);
    return `❌ Note error: ${err.message}`;
  }
}

async function handleCreateTask(params, staff) {
  try {
    // Find assignee
    const { data: employees } = await supabase
      .from('employees')
      .select('id, name, phone')
      .eq('is_active', true);

    const assigneeName = params.assigned_to?.toLowerCase() || '';
    const assignee = employees?.find(
      (e) =>
        e.name?.toLowerCase() === assigneeName ||
        e.name?.toLowerCase().startsWith(assigneeName) ||
        assigneeName.includes(e.name?.toLowerCase().split(' ')[0])
    );

    if (!assignee) {
      const names = employees?.map((e) => e.name).join(', ') || 'none';
      return `❌ Employee "${params.assigned_to}" not found. Staff: ${names}`;
    }

    // Optional patient link
    let patientId = null;
    let patientName = params.patient_name || null;
    if (params.patient_name) {
      const p = await findPatient(params.patient_name);
      if (p) {
        patientId = p.id;
        patientName = `${p.first_name} ${p.last_name}`;
      }
    }

    // Insert task
    await supabase.from('tasks').insert({
      title: params.title,
      assigned_to: assignee.id,
      assigned_by: staff.id,
      patient_id: patientId,
      patient_name: patientName,
      priority: params.priority || 'medium',
      due_date: params.due_date || null,
      status: 'pending',
    });

    // Notify assignee by SMS (if different from sender and has a phone)
    let notifyMsg = '';
    const normalizedStaffPhone = staff.phone?.replace(/\D/g, '').slice(-10);
    const normalizedAssigneePhone = assignee.phone?.replace(/\D/g, '').slice(-10);

    if (assignee.phone && normalizedAssigneePhone !== normalizedStaffPhone) {
      const taskSMS =
        `📋 New task from ${staff.name}:\n"${params.title}"` +
        (patientName ? `\nPatient: ${patientName}` : '') +
        (params.due_date ? `\nDue: ${formatDate(params.due_date)}` : '') +
        (params.priority === 'high' ? '\n⚠️ High priority' : '');

      await sendBlooioMessage({ to: assignee.phone, message: taskSMS }).catch((e) =>
        console.warn('Task notification SMS failed:', e.message)
      );
      notifyMsg = ` ${assignee.name} has been notified by SMS.`;
    }

    return `✅ Task created for ${assignee.name}.${notifyMsg}`;
  } catch (err) {
    console.error('create_task error:', err);
    return `❌ Task error: ${err.message}`;
  }
}

async function handleGetSchedule(params) {
  try {
    const date = params.date;
    const startOfDay = `${date}T00:00:00`;
    const endOfDay = `${date}T23:59:59`;

    const { data: appointments } = await supabase
      .from('appointments')
      .select('patient_name, service_name, start_time, status, provider')
      .gte('start_time', startOfDay)
      .lte('start_time', endOfDay)
      .not('status', 'eq', 'cancelled')
      .order('start_time', { ascending: true });

    if (!appointments || appointments.length === 0) {
      return `📅 No appointments scheduled for ${formatDate(date)}.`;
    }

    const lines = appointments
      .map((a) => {
        const time = new Date(a.start_time).toLocaleTimeString('en-US', {
          timeZone: 'America/Los_Angeles',
          hour: 'numeric',
          minute: '2-digit',
        });
        return `• ${time} — ${a.patient_name} (${a.service_name})`;
      })
      .join('\n');

    return `📅 ${formatDate(date)} — ${appointments.length} appt${appointments.length !== 1 ? 's' : ''}:\n${lines}`;
  } catch (err) {
    console.error('get_schedule error:', err);
    return `❌ Schedule error: ${err.message}`;
  }
}

async function handleLookupPatient(params) {
  try {
    const parts = (params.patient_name || '').trim().split(/\s+/);
    const first = parts[0];
    const last = parts[parts.length - 1];

    const { data: patients } = await supabase
      .from('patients')
      .select('id, first_name, last_name, email, phone, date_of_birth')
      .or(`first_name.ilike.${first}%,last_name.ilike.${last}%`)
      .limit(4);

    if (!patients || patients.length === 0) {
      return `❌ No patient found for "${params.patient_name}".`;
    }

    if (patients.length === 1) {
      const p = patients[0];
      const dob = p.date_of_birth
        ? new Date(p.date_of_birth).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : 'N/A';
      return (
        `👤 ${p.first_name} ${p.last_name}\n` +
        `📱 ${p.phone || 'No phone'}\n` +
        `📧 ${p.email || 'No email'}\n` +
        `🎂 ${dob}`
      );
    }

    // Multiple matches
    const matches = patients
      .map((p) => `• ${p.first_name} ${p.last_name} — ${p.phone || p.email || 'no contact'}`)
      .join('\n');
    return `Found ${patients.length} matches:\n${matches}\n\nBe more specific.`;
  } catch (err) {
    console.error('lookup_patient error:', err);
    return `❌ Lookup error: ${err.message}`;
  }
}

function handleHelp(staffName) {
  return (
    `👋 Hi ${staffName}! Range Medical Staff Bot\n\n` +
    `🗓 AVAILABILITY\n"Is there a Range IV slot tomorrow at 2pm?"\n\n` +
    `📌 BOOK\n"Book Range IV for [Patient] on [date] at [time]"\n\n` +
    `💰 BILLING\n"What did we charge [Patient Name]?"\n\n` +
    `📝 NOTE\n"Add note to [Patient]: [note text]"\n\n` +
    `✅ TASK\n"Create task for [Staff]: [task] due [date]"\n\n` +
    `📅 SCHEDULE\n"What's on the schedule today/tomorrow?"\n\n` +
    `🔍 PATIENT\n"Look up [Patient Name]"`
  );
}

// ================================================================
// MAIN ENTRY POINT
// ================================================================

export async function handleStaffMessage(messageText, staff) {
  console.log(`[StaffBot] ${staff.name} (${staff.phone}): "${messageText}"`);

  const parsed = await parseIntent(messageText, staff.name);
  console.log(`[StaffBot] Intent: ${parsed.intent}`, JSON.stringify(parsed.params));

  switch (parsed.intent) {
    case 'check_availability':
      return await handleCheckAvailability(parsed.params);
    case 'book_appointment':
      return await handleBookAppointment(parsed.params);
    case 'query_billing':
      return await handleQueryBilling(parsed.params);
    case 'add_note':
      return await handleAddNote(parsed.params, staff);
    case 'create_task':
      return await handleCreateTask(parsed.params, staff);
    case 'get_schedule':
      return await handleGetSchedule(parsed.params);
    case 'lookup_patient':
      return await handleLookupPatient(parsed.params);
    case 'help':
      return handleHelp(staff.name);
    default:
      return `❓ I didn't understand that. Text "help" to see available commands.`;
  }
}
