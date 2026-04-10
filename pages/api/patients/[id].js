// pages/api/patients/[id].js
// Patient Profile API - Range Medical
// Unified patient data endpoint: demographics, protocols, labs, intakes, sessions, purchases

import { createClient } from '@supabase/supabase-js';
import stripe from '../../../lib/stripe';
import { getProtocolTracking } from '../../../lib/protocol-tracking';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Calculate days/sessions remaining — delegates to shared lib
function calculateRemaining(protocol) {
  const tracking = getProtocolTracking(protocol);
  return {
    days_remaining: tracking.days_remaining ?? null,
    total_days: tracking.total_days,
    sessions_remaining: tracking.sessions_remaining,
    total_sessions: tracking.total_sessions,
    status_text: tracking.status_text,
  };
}

// Get category for protocol (for color coding)
function getProtocolCategory(protocol) {
  const programType = (protocol.program_type || protocol.program_name || '').toLowerCase();

  if (programType.includes('hrt') || programType.includes('testosterone') || programType.includes('hormone')) {
    return 'hrt';
  }
  if (programType.includes('weight') || programType.includes('glp') || programType.includes('tirzepatide') || programType.includes('semaglutide')) {
    return 'weight_loss';
  }
  if (programType.includes('peptide') || programType.includes('bpc') || programType.includes('tb-500') || programType.includes('recovery') || programType.includes('month_program') || programType.includes('jumpstart') || programType.includes('maintenance_4week') || programType.includes('gh_peptide')) {
    return 'peptide';
  }
  if (programType.includes('iv') || programType.includes('infusion')) {
    return 'iv';
  }
  if (programType.includes('hbot') || programType.includes('hyperbaric')) {
    return 'hbot';
  }
  if (programType.includes('rlt') || programType.includes('red_light') || programType.includes('red light')) {
    return 'rlt';
  }
  if (programType.includes('injection') || programType.includes('b12') || programType.includes('vitamin') || programType.includes('nad')) {
    return 'injection';
  }
  if (programType.includes('lab')) {
    return 'labs';
  }
  // Fall back to checking medication name when program_type is generic
  const med = (protocol.medication || '').toLowerCase();
  if (med.includes('nad')) return 'injection';
  if (med.includes('b12') || med.includes('lipo') || med.includes('taurine') || med.includes('toradol') || med.includes('glutathione')) return 'injection';
  if (med.includes('semaglutide') || med.includes('tirzepatide') || med.includes('retatrutide')) return 'weight_loss';
  if (med.includes('testosterone') || med.includes('estradiol') || med.includes('progesterone')) return 'hrt';
  if (med.includes('bpc') || med.includes('tb-500') || med.includes('recovery') || med.includes('glow') || med.includes('ghk')) return 'peptide';
  return 'other';
}

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Patient ID required' });
  }

  if (req.method === 'GET') {
    try {
      // ── Step 1: Fetch patient record (needed for GHL/email/phone fallbacks) ──
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

      if (patientError || !patient) {
        console.error('Patient not found:', patientError);
        return res.status(404).json({ error: 'Patient not found' });
      }

      // ── Step 2: Run ALL independent queries in parallel ──
      const intakeFields = 'id, first_name, last_name, email, phone, date_of_birth, gender, preferred_name, submitted_at, pdf_url, symptoms, symptom_followups, symptom_duration, photo_id_url, signature_url, patient_id, ghl_contact_id, how_heard, how_heard_other, street_address, city, state, postal_code, country, allergies, allergy_reactions, has_allergies, on_medications, current_medications, medication_notes, medical_conditions, on_hrt, hrt_details, additional_notes, is_minor, guardian_name, guardian_relationship, has_pcp, pcp_name, recent_hospitalization, hospitalization_reason';
      const consentFields = 'id, consent_type, first_name, last_name, email, phone, consent_date, consent_given, signature_url, pdf_url, submitted_at, patient_id, ghl_contact_id';
      const purchaseFilter = patient.ghl_contact_id
        ? `patient_id.eq.${id},ghl_contact_id.eq.${patient.ghl_contact_id}`
        : `patient_id.eq.${id}`;

      const [
        protocolsResult,
        pendingLabOrdersResult,
        labsResult,
        pendingPurchasesResult,
        intakesByPatientIdResult,
        sessionsResult,
        symptomResult,
        questionnaireResult,
        consentsByPatientIdResult,
        medicalDocumentsResult,
        assessmentsResult,
        tasksResult,
        weightLossLogsResult,
        serviceLogsResult,
        commsLogResult,
        allPurchasesResult,
        invoicesResult,
        subscriptionsResult,
        medicationsResult,
        prescriptionsResult,
        notesResult,
        clinicAppointmentsResult,
        nativeAppointmentsResult,
        baselineQuestionnairesResult,
        checkInsResult,
      ] = await Promise.all([
        // Protocols
        supabase.from('protocols').select('*').eq('patient_id', id).order('created_at', { ascending: false }),
        // Pending lab orders
        supabase.from('lab_orders').select('*').eq('patient_id', id).eq('status', 'pending').order('order_date', { ascending: false }),
        // Labs
        supabase.from('labs').select('id, patient_id, test_date, lab_type, panel_type, lab_provider, status, completed_date, results_received_date').eq('patient_id', id).order('test_date', { ascending: false }),
        // Pending purchases (by patient_id first)
        supabase.from('purchases').select('*').eq('patient_id', id).eq('protocol_created', false).is('protocol_id', null).eq('dismissed', false).order('purchase_date', { ascending: false }),
        // Intakes (by patient_id first)
        supabase.from('intakes').select(intakeFields).eq('patient_id', id).order('submitted_at', { ascending: false }),
        // Sessions
        supabase.from('sessions').select('*, protocols(program_name, program_type)').eq('patient_id', id).order('session_date', { ascending: false }).limit(50),
        // Symptoms (legacy)
        supabase.from('symptoms').select('*').eq('patient_id', id).order('symptom_date', { ascending: false }).limit(10),
        // Questionnaire responses
        supabase.from('symptom_responses').select('*').eq('patient_id', id).eq('response_type', 'baseline').order('submitted_at', { ascending: false }).limit(20),
        // Consents (by patient_id first)
        supabase.from('consents').select(consentFields).eq('patient_id', id).order('submitted_at', { ascending: false }),
        // Medical documents
        supabase.from('medical_documents').select('*').eq('patient_id', id).order('uploaded_at', { ascending: false }),
        // Assessments
        patient.email
          ? supabase.from('assessment_leads').select('id, first_name, last_name, email, phone, assessment_path, injury_type, injury_location, injury_duration, in_physical_therapy, recovery_goal, primary_symptom, symptom_duration, has_recent_labs, tried_hormone_therapy, energy_goal, additional_info, medical_history, pdf_url, created_at').eq('email', patient.email.toLowerCase().trim()).order('created_at', { ascending: false })
          : Promise.resolve({ data: [] }),
        // Tasks
        supabase.from('tasks').select('*').eq('patient_id', id).order('created_at', { ascending: false }),
        // Weight loss service logs
        supabase.from('service_logs').select('id, protocol_id, entry_type, entry_date, medication, dosage, weight, quantity, notes, fulfillment_method, tracking_number').eq('patient_id', id).eq('category', 'weight_loss').order('entry_date', { ascending: true }),
        // All service logs
        supabase.from('service_logs').select('id, category, entry_type, entry_date, medication, dosage, quantity, administered_by, notes, created_at, protocol_id, fulfillment_method, tracking_number').eq('patient_id', id).order('entry_date', { ascending: false }).limit(200),
        // Communications log
        supabase.from('comms_log').select('id, channel, message_type, message, status, recipient, subject, direction, source, created_at').eq('patient_id', id).order('created_at', { ascending: false }).limit(100),
        // All purchases
        supabase.from('purchases').select('*').or(purchaseFilter).order('purchase_date', { ascending: false }),
        // Invoices
        supabase.from('invoices').select('*').eq('patient_id', id).order('created_at', { ascending: false }),
        // Subscriptions
        supabase.from('subscriptions').select('*').eq('patient_id', id).order('started_at', { ascending: false }),
        // Medications
        supabase.from('patient_medications').select('*').eq('patient_id', id).order('is_active', { ascending: false }).order('medication_name', { ascending: true }),
        // Prescriptions
        supabase.from('prescriptions').select('*').eq('patient_id', id).order('created_at', { ascending: false }),
        // Notes
        supabase.from('patient_notes').select('id, body, raw_input, note_date, source, created_by, created_at, pinned, protocol_id, protocol_name, appointment_id, encounter_service, signed_by, signed_at, status, parent_note_id, note_category, edited_after_signing').eq('patient_id', id).order('note_date', { ascending: false }),
        // Clinic appointments
        supabase.from('clinic_appointments').select('*').eq('patient_id', id).order('start_time', { ascending: false }).limit(50),
        // Native appointments
        supabase.from('appointments').select('id, patient_id, patient_name, service_name, service_category, provider, start_time, end_time, duration_minutes, status, notes, source, ghl_appointment_id, created_at').eq('patient_id', id).order('start_time', { ascending: false }).limit(200),
        // Baseline questionnaires (new validated instruments)
        supabase.from('baseline_questionnaires').select('id, patient_id, intake_id, door, questionnaire_type, responses, scored_totals, sections_completed, status, submitted_at, created_at, ai_synopsis, ai_synopsis_generated_at').eq('patient_id', id).order('submitted_at', { ascending: false }).limit(20),
        // Weekly check-ins (symptom scores from patient portal)
        supabase.from('check_ins').select('id, patient_id, check_in_date, energy_score, sleep_score, mood_score, brain_fog_score, pain_score, libido_score, overall_score, weight, notes, created_at').eq('patient_id', id).order('check_in_date', { ascending: false }).limit(50),
      ]);

      // ── Step 3: Extract results ──
      const allProtocols = protocolsResult.data || [];
      const pendingLabOrders = pendingLabOrdersResult.data || [];
      const labs = labsResult.data || [];
      const sessions = sessionsResult.data || [];
      const symptomResponses = symptomResult.data || [];
      const questionnaireResponses = questionnaireResult.data || [];
      const baselineQuestionnaires = baselineQuestionnairesResult.data || [];
      const checkIns = checkInsResult.data || [];
      const medicalDocumentsRaw = medicalDocumentsResult.data || [];
      // Generate signed URLs for documents stored in Supabase Storage
      const medicalDocuments = await Promise.all(
        medicalDocumentsRaw.map(async (doc) => {
          if (doc.file_path) {
            const { data: urlData } = await supabase.storage
              .from('patient-documents')
              .createSignedUrl(doc.file_path, 60 * 60);
            return { ...doc, document_url: urlData?.signedUrl || doc.document_url };
          }
          return doc;
        })
      );
      const assessments = assessmentsResult.data || [];
      const weightLossLogs = weightLossLogsResult.data || [];
      const serviceLogs = serviceLogsResult.data || [];
      const commsLog = commsLogResult.data || [];
      const allPurchases = allPurchasesResult.data || [];
      const invoices = invoicesResult.data || [];
      let subscriptions = subscriptionsResult.data || [];
      const medications = medicationsResult.data || [];
      const prescriptions = prescriptionsResult.data || [];

      // ── Notes (with fallback for old schema) ──
      let patientNotes;
      if (notesResult.error) {
        const { data: notesFallback } = await supabase
          .from('patient_notes')
          .select('id, body, note_date, source, created_at')
          .eq('patient_id', id)
          .order('note_date', { ascending: false });
        patientNotes = notesFallback || [];
      } else {
        patientNotes = notesResult.data || [];
      }

      // ── Step 4: Fallback queries (only if primary returned empty) — run in parallel ──
      let pendingNotifications = pendingPurchasesResult.data || [];
      let intakes = intakesByPatientIdResult.data || [];
      let consents = consentsByPatientIdResult.data || [];
      let appointments = clinicAppointmentsResult.data || [];

      // Build list of fallback queries needed
      const fallbackQueries = [];
      const fallbackKeys = [];

      // Pending purchases fallback
      if (pendingNotifications.length === 0 && patient.ghl_contact_id) {
        fallbackKeys.push('pendingPurchases');
        fallbackQueries.push(
          supabase.from('purchases').select('*').eq('ghl_contact_id', patient.ghl_contact_id).eq('protocol_created', false).is('protocol_id', null).eq('dismissed', false).order('purchase_date', { ascending: false })
        );
      }

      // Intakes fallback (ghl then email)
      if (intakes.length === 0 && patient.ghl_contact_id) {
        fallbackKeys.push('intakesGhl');
        fallbackQueries.push(
          supabase.from('intakes').select(intakeFields).eq('ghl_contact_id', patient.ghl_contact_id).order('submitted_at', { ascending: false })
        );
      }

      // Consents fallback (ghl)
      if (consents.length === 0 && patient.ghl_contact_id) {
        fallbackKeys.push('consentsGhl');
        fallbackQueries.push(
          supabase.from('consents').select(consentFields).eq('ghl_contact_id', patient.ghl_contact_id).order('submitted_at', { ascending: false })
        );
      }

      // Appointments fallback (ghl)
      if (appointments.length === 0 && patient.ghl_contact_id) {
        fallbackKeys.push('appointmentsGhl');
        fallbackQueries.push(
          supabase.from('clinic_appointments').select('*').eq('ghl_contact_id', patient.ghl_contact_id).order('start_time', { ascending: false }).limit(50)
        );
      }

      // Run first round of fallbacks in parallel
      if (fallbackQueries.length > 0) {
        const fallbackResults = await Promise.all(fallbackQueries);
        fallbackResults.forEach((result, i) => {
          const key = fallbackKeys[i];
          const data = result.data || [];
          if (key === 'pendingPurchases' && data.length > 0) pendingNotifications = data;
          if (key === 'intakesGhl' && data.length > 0) intakes = data;
          if (key === 'consentsGhl' && data.length > 0) consents = data;
          if (key === 'appointmentsGhl' && data.length > 0) appointments = data;
        });
      }

      // Second round: email/phone fallbacks (only if ghl didn't find anything)
      const fallbackQueries2 = [];
      const fallbackKeys2 = [];

      if (intakes.length === 0 && patient.email) {
        fallbackKeys2.push('intakesEmail');
        fallbackQueries2.push(
          supabase.from('intakes').select(intakeFields).ilike('email', patient.email).order('submitted_at', { ascending: false })
        );
      }

      if (consents.length === 0 && patient.email) {
        fallbackKeys2.push('consentsEmail');
        fallbackQueries2.push(
          supabase.from('consents').select(consentFields).ilike('email', patient.email).order('submitted_at', { ascending: false })
        );
      }

      if (fallbackQueries2.length > 0) {
        const fallbackResults2 = await Promise.all(fallbackQueries2);
        fallbackResults2.forEach((result, i) => {
          const key = fallbackKeys2[i];
          const data = result.data || [];
          if (key === 'intakesEmail' && data.length > 0) intakes = data;
          if (key === 'consentsEmail' && data.length > 0) consents = data;
        });
      }

      // Final consent fallback: phone
      if (consents.length === 0 && patient.phone) {
        const normalizedPhone = patient.phone.replace(/\D/g, '').slice(-10);
        if (normalizedPhone.length === 10) {
          const { data: consentsByPhone } = await supabase
            .from('consents')
            .select(consentFields)
            .or(`phone.ilike.%${normalizedPhone}%`)
            .order('submitted_at', { ascending: false });
          if (consentsByPhone && consentsByPhone.length > 0) {
            consents = consentsByPhone;
          }
        }
      }

      // ── Step 5: Background backfills (fire and forget — don't block response) ──
      // Backfill patient_id on consents/intakes found via fallback
      if (consents.length > 0) {
        const unlinkedIds = consents.filter(c => c.patient_id !== id).map(c => c.id);
        if (unlinkedIds.length > 0) {
          supabase.from('consents').update({ patient_id: id }).in('id', unlinkedIds).then(() => {});
        }
      }
      if (intakes.length > 0) {
        const unlinkedIntakeIds = intakes.filter(i => i.patient_id !== id).map(i => i.id);
        if (unlinkedIntakeIds.length > 0) {
          supabase.from('intakes').update({ patient_id: id }).in('id', unlinkedIntakeIds).then(() => {});
        }
      }

      // Stripe lazy sync — fire and forget, don't block the response
      // Auto-link Stripe customer by email if stripe_customer_id is missing
      {
        let stripeCustomerId = patient.stripe_customer_id;
        (async () => {
          try {
            if (!stripeCustomerId && patient.email) {
              const existing = await stripe.customers.list({ email: patient.email, limit: 1 });
              if (existing.data.length > 0) {
                stripeCustomerId = existing.data[0].id;
                await supabase.from('patients').update({ stripe_customer_id: stripeCustomerId }).eq('id', id);
              }
            }
            if (!stripeCustomerId) return;
            const stripeSubs = await stripe.subscriptions.list({
              customer: stripeCustomerId,
              limit: 100,
              expand: ['data.latest_invoice'],
            });

            const existingStripeIds = new Set(
              (subscriptions || []).map(s => s.stripe_subscription_id).filter(Boolean)
            );

            for (const sub of stripeSubs.data) {
              const item = sub.items.data[0];
              const price = item?.price;
              const invoice = sub.latest_invoice && typeof sub.latest_invoice === 'object' ? sub.latest_invoice : null;
              const actualAmount = invoice?.amount_paid != null ? invoice.amount_paid : (price?.unit_amount || 0);
              const record = {
                status: sub.status,
                amount_cents: actualAmount,
                currency: price?.currency || 'usd',
                interval: price?.recurring?.interval || 'month',
                interval_count: price?.recurring?.interval_count || 1,
                current_period_start: sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : null,
                current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
                cancel_at_period_end: sub.cancel_at_period_end,
                canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
              };

              if (existingStripeIds.has(sub.id)) {
                await supabase.from('subscriptions').update(record).eq('stripe_subscription_id', sub.id);
              } else {
                await supabase.from('subscriptions').insert({
                  ...record,
                  patient_id: id,
                  stripe_subscription_id: sub.id,
                  stripe_customer_id: stripeCustomerId,
                  description: sub.metadata?.description || price?.nickname || 'Subscription',
                  service_category: sub.metadata?.service_category || null,
                  started_at: sub.start_date ? new Date(sub.start_date * 1000).toISOString() : null,
                });
              }
            }
          } catch (stripeErr) {
            console.error('Stripe subscription lazy sync error:', stripeErr.message);
          }
        })();
      }

      // ── Step 6: Process results (CPU-only, no DB calls) ──

      // Split and format protocols
      const activeProtocols = [];
      const completedProtocols = [];

      allProtocols.forEach(protocol => {
        const tracking = calculateRemaining(protocol);
        const category = getProtocolCategory(protocol);

        const formatted = {
          ...protocol,
          days_remaining: tracking.days_remaining,
          total_days: tracking.total_days,
          sessions_remaining: tracking.sessions_remaining,
          status_text: tracking.status_text,
          category
        };

        const isWeightLoss = (protocol.program_type || '').toLowerCase().includes('weight');
        const isHRT = (protocol.program_type || '').toLowerCase() === 'hrt';
        const neverAutoComplete = isWeightLoss || isHRT;
        const isCompleted =
          protocol.status === 'completed' ||
          protocol.status === 'historic' ||
          (!neverAutoComplete && tracking.days_remaining !== null && tracking.days_remaining <= -7) ||
          (!neverAutoComplete && tracking.sessions_remaining !== undefined && tracking.sessions_remaining <= 0 && protocol.total_sessions > 0);

        if (protocol.program_type === 'labs') return;

        if (isCompleted || protocol.status === 'merged') {
          completedProtocols.push(formatted);
        } else if (protocol.status !== 'cancelled') {
          activeProtocols.push(formatted);
        }
      });

      const labProtocols = allProtocols
        .filter(p => p.program_type === 'labs' && p.status !== 'cancelled')
        .map(p => ({
          id: p.id, program_name: p.program_name, medication: p.medication,
          status: p.status, start_date: p.start_date, notes: p.notes,
          delivery_method: p.delivery_method, updated_at: p.updated_at, created_at: p.created_at,
        }));

      // Protocol logs — run after we have protocol IDs
      const protocolIds = allProtocols.map(p => p.id).filter(Boolean);
      let protocolLogs = [];
      if (protocolIds.length > 0) {
        const { data: pLogs } = await supabase
          .from('protocol_logs')
          .select('id, protocol_id, log_type, log_date, weight, dose, notes, created_at')
          .in('protocol_id', protocolIds)
          .order('log_date', { ascending: true });
        protocolLogs = pLogs || [];
      }

      // Tasks: enrich with employee names
      let patientTasks = [];
      const tasksData = tasksResult.data || [];
      if (tasksData.length > 0) {
        const empIds = [...new Set([
          ...tasksData.map(t => t.assigned_to),
          ...tasksData.map(t => t.assigned_by),
        ])];
        const { data: empNames } = await supabase
          .from('employees')
          .select('id, name')
          .in('id', empIds);
        const empMap = {};
        (empNames || []).forEach(e => { empMap[e.id] = e.name; });
        patientTasks = tasksData.map(t => ({
          ...t,
          assigned_to_name: empMap[t.assigned_to] || 'Unknown',
          assigned_by_name: empMap[t.assigned_by] || 'Unknown',
        }));
      }

      // Build encounter note counts per appointment
      const encounterNoteCounts = {};
      (patientNotes || []).forEach(n => {
        if (n.appointment_id) {
          encounterNoteCounts[n.appointment_id] = (encounterNoteCounts[n.appointment_id] || 0) + 1;
        }
      });

      // Merge clinic + native appointments
      const nativeAppointments = nativeAppointmentsResult.data || [];
      const normalizedNative = nativeAppointments.map(a => ({
        id: a.id, calendar_name: a.service_name, appointment_title: a.service_category,
        start_time: a.start_time, end_time: a.end_time, status: a.status, notes: a.notes,
        source: a.source || 'native', provider: a.provider, duration_minutes: a.duration_minutes,
        ghl_appointment_id: a.ghl_appointment_id, _table: 'appointments'
      }));

      const taggedClinic = appointments.map(a => ({ ...a, _table: 'clinic_appointments' }));
      const seen = new Set();
      const merged = [];
      for (const apt of [...taggedClinic, ...normalizedNative]) {
        const key = apt.ghl_appointment_id || `${apt.start_time}-${apt.calendar_name}`;
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(apt);
        }
      }
      merged.sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
      appointments = merged.map(a => ({
        ...a,
        encounter_note_count: encounterNoteCounts[a.id] || 0,
      }));

      // Extract demographics from intake
      let intakeDemographics = null;
      const firstIntake = intakes?.[0];
      if (firstIntake) {
        const hasMissingDemographics = !patient.date_of_birth || !patient.gender || !patient.first_name || !patient.last_name || !patient.preferred_name || !patient.address;
        if (hasMissingDemographics || firstIntake.how_heard) {
          intakeDemographics = {
            date_of_birth: firstIntake.date_of_birth, gender: firstIntake.gender,
            first_name: firstIntake.first_name, last_name: firstIntake.last_name,
            phone: firstIntake.phone, email: firstIntake.email,
            preferred_name: firstIntake.preferred_name || null, how_heard: firstIntake.how_heard || null,
            street_address: firstIntake.street_address || null, city: firstIntake.city || null,
            state: firstIntake.state || null, postal_code: firstIntake.postal_code || null,
          };
        }
      }

      // Calculate stats
      const upcomingAppointments = appointments.filter(apt => new Date(apt.start_time) >= new Date());
      // ── LTV calculation ──
      // ALWAYS reflect what the patient was actually charged. Prefer the verified
      // Stripe amount (source of truth) and fall back to amount_paid. Never use
      // original_amount or any list/catalog price.
      const ltv = allPurchases.reduce((sum, p) => {
        if (p.stripe_amount_cents != null && p.stripe_status === 'succeeded') {
          return sum + (p.stripe_amount_cents / 100);
        }
        return sum + (parseFloat(p.amount_paid) || 0);
      }, 0);
      const purchaseDates = allPurchases
        .map(p => p.purchase_date || p.created_at)
        .filter(Boolean)
        .sort();
      const firstPurchase = purchaseDates[0] || null;
      const lastPurchase = purchaseDates[purchaseDates.length - 1] || null;
      let avgPerMonth = null;
      if (firstPurchase && ltv > 0) {
        const months = Math.max(1, (Date.now() - new Date(firstPurchase).getTime()) / (1000 * 60 * 60 * 24 * 30.44));
        avgPerMonth = Math.round(ltv / months);
      }

      const stats = {
        activeCount: activeProtocols.length,
        completedCount: completedProtocols.length,
        pendingLabsCount: pendingLabOrders?.length || 0,
        totalProtocols: allProtocols?.length || 0,
        intakeCount: intakes?.length || 0,
        consentCount: consents?.length || 0,
        documentCount: medicalDocuments?.length || 0,
        sessionCount: sessions?.length || 0,
        appointmentCount: appointments?.length || 0,
        upcomingAppointments: upcomingAppointments?.length || 0,
        ltv,
        avgPerMonth,
        purchaseCount: allPurchases.length,
        firstPurchase,
        lastPurchase,
      };

      return res.status(200).json({
        patient,
        intakeDemographics,
        activeProtocols,
        completedProtocols,
        pendingNotifications: pendingNotifications || [],
        labProtocols,
        pendingLabOrders: pendingLabOrders || [],
        labs: labs || [],
        intakes: intakes || [],
        consents: consents || [],
        medicalDocuments: medicalDocuments || [],
        assessments: assessments || [],
        patientTasks: patientTasks || [],
        sessions: sessions || [],
        symptomResponses: symptomResponses || [],
        questionnaireResponses: questionnaireResponses || [],
        baselineQuestionnaires: baselineQuestionnaires || [],
        appointments: appointments || [],
        notes: patientNotes || [],
        weightLossLogs: weightLossLogs || [],
        protocolLogs: protocolLogs || [],
        serviceLogs: serviceLogs || [],
        commsLog: commsLog || [],
        allPurchases: allPurchases || [],
        invoices: invoices || [],
        subscriptions: subscriptions || [],
        medications: medications || [],
        prescriptions: prescriptions || [],
        checkIns: checkIns || [],
        stats
      });

    } catch (error) {
      console.error('Patient API error:', error);
      return res.status(500).json({ error: 'Server error', details: error.message });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const body = req.body;

      // Only allow fields that exist in the patients table
      const allowedFields = [
        'first_name', 'last_name', 'name', 'preferred_name', 'email', 'phone',
        'date_of_birth', 'gender', 'ghl_contact_id',
        'address', 'city', 'state', 'zip_code',
        'notes', 'tags', 'status'
      ];

      // Date fields that need empty-string → null conversion
      const dateFields = ['date_of_birth'];

      const updates = {};
      for (const [key, value] of Object.entries(body)) {
        if (allowedFields.includes(key)) {
          // Convert empty strings to null for date fields
          if (dateFields.includes(key) && (value === '' || value === null)) {
            updates[key] = null;
          } else {
            updates[key] = value;
          }
        }
      }

      // Auto-sync the full name field
      if (updates.first_name !== undefined || updates.last_name !== undefined) {
        const firstName = updates.first_name ?? body.first_name ?? '';
        const lastName = updates.last_name ?? body.last_name ?? '';
        updates.name = `${firstName} ${lastName}`.trim() || null;
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }

      // Try update — if columns don't exist, retry without them
      let { data, error } = await supabase
        .from('patients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      // If a column doesn't exist, strip unknown columns and retry
      if (error && error.message && error.message.includes('column')) {
        const maybeNewColumns = ['address', 'city', 'state', 'zip_code', 'preferred_name'];
        const retryUpdates = { ...updates };
        maybeNewColumns.forEach(col => delete retryUpdates[col]);

        if (Object.keys(retryUpdates).length > 0) {
          console.log('Retrying patient update without address columns');
          const retry = await supabase
            .from('patients')
            .update(retryUpdates)
            .eq('id', id)
            .select()
            .single();
          data = retry.data;
          error = retry.error;
        }
      }

      if (error) {
        console.error('Patient update error:', error);
        return res.status(500).json({ error: error.message || 'Failed to update patient' });
      }

      return res.status(200).json({ patient: data });
    } catch (error) {
      console.error('Patient PATCH error:', error);
      return res.status(500).json({ error: error.message || 'Server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
