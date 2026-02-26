// pages/api/patients/[id].js
// Patient Profile API - Range Medical
// Unified patient data endpoint: demographics, protocols, labs, intakes, sessions, purchases

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Calculate days/sessions remaining based on protocol type
function calculateRemaining(protocol) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const programType = (protocol.program_type || '').toLowerCase();
  const deliveryMethod = (protocol.delivery_method || '').toLowerCase();
  const isWeightLoss = programType.includes('weight') || programType.includes('wl') || programType.includes('glp');
  const isHRT = programType.includes('hrt') || programType.includes('testosterone') || programType.includes('hormone');
  const isPeptide = programType.includes('peptide') || programType.includes('bpc') || programType.includes('recovery');
  const isTakeHome = deliveryMethod.includes('take') || deliveryMethod.includes('home');
  const isInClinic = deliveryMethod.includes('clinic');

  // ===== WEIGHT LOSS =====
  if (isWeightLoss) {
    if (isTakeHome) {
      const totalInjections = protocol.total_sessions || 4;
      const supplyDays = totalInjections * 7;
      const trackingDate = protocol.last_refill_date || protocol.start_date;

      if (trackingDate) {
        const startDate = new Date(trackingDate + 'T00:00:00');
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + supplyDays);
        const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

        let statusText = daysRemaining <= 0 ? 'Supply exhausted' :
                         daysRemaining <= 3 ? `${daysRemaining}d - Refill soon` :
                         daysRemaining <= 14 ? `${daysRemaining} days left` :
                         `~${Math.floor(daysRemaining / 7)} weeks left`;

        return { days_remaining: daysRemaining, total_days: supplyDays, status_text: statusText };
      }
    } else {
      if (protocol.total_sessions && protocol.total_sessions > 0) {
        const sessionsUsed = protocol.sessions_used || 0;
        const sessionsRemaining = protocol.total_sessions - sessionsUsed;
        const statusText = sessionsRemaining <= 0 ? 'All sessions used' :
                           `${sessionsRemaining}/${protocol.total_sessions} injections`;
        return { sessions_remaining: sessionsRemaining, total_sessions: protocol.total_sessions, status_text: statusText };
      }
    }
  }

  // ===== HRT =====
  if (isHRT) {
    const supplyType = (protocol.supply_type || '').toLowerCase();
    const selectedDose = (protocol.selected_dose || protocol.current_dose || '').toLowerCase();
    const lastRefillDate = protocol.last_refill_date || protocol.start_date;

    if (lastRefillDate) {
      const refillDate = new Date(lastRefillDate + 'T00:00:00');
      const daysSinceRefill = Math.ceil((today - refillDate) / (1000 * 60 * 60 * 24));

      if (supplyType.includes('vial') || selectedDose.includes('vial')) {
        // Determine vial size
        const is10ml = supplyType.includes('10') || selectedDose.includes('10ml');
        const vialMl = is10ml ? 10 : 5;

        // Parse dose per injection - but NOT from vial descriptions
        let dosePerInjection = 0.4; // default for male HRT
        const doseField = protocol.dose_per_injection || protocol.frequency || '';

        // Try to find dose from dose_per_injection or frequency field first
        let doseMatch = (doseField || '').toString().match(/^(\d+\.?\d*)\s*ml/i) ||
                        (doseField || '').toString().match(/(\d+\.?\d*)\s*ml/i);

        // If not found there, try selected_dose but ONLY if it doesn't describe a vial
        if (!doseMatch && !selectedDose.includes('vial')) {
          doseMatch = selectedDose.match(/^(\d+\.?\d*)\s*ml/i);
        }

        // Also try to parse mg and convert (at 200mg/ml concentration)
        if (!doseMatch) {
          const mgMatch = (doseField || selectedDose).match(/(\d+)\s*mg/i);
          if (mgMatch && !selectedDose.includes('@')) {
            // Convert mg to ml assuming 200mg/ml concentration
            dosePerInjection = parseInt(mgMatch[1]) / 200;
          }
        } else {
          dosePerInjection = parseFloat(doseMatch[1]);
        }

        // Sanity check - dose should be between 0.1ml and 1ml for HRT
        if (dosePerInjection < 0.1 || dosePerInjection > 1) {
          dosePerInjection = 0.4; // fall back to default
        }

        const injectionsPerWeek = protocol.injections_per_week || 2;
        const weeksSupply = Math.floor(vialMl / (dosePerInjection * injectionsPerWeek));
        const vialDays = weeksSupply * 7;
        const daysRemaining = vialDays - daysSinceRefill;

        const statusText = daysRemaining <= 0 ? 'Refill overdue' :
                           daysRemaining <= 14 ? `${daysRemaining}d - Refill soon` :
                           `~${Math.floor(daysRemaining / 7)} weeks left`;

        return { days_remaining: daysRemaining, total_days: vialDays, status_text: statusText };
      } else {
        const is4Week = supplyType.includes('4') || supplyType.includes('four') || supplyType.includes('month');
        const supplyDays = is4Week ? 28 : 14;
        const daysRemaining = supplyDays - daysSinceRefill;

        const statusText = daysRemaining <= 0 ? 'Refill overdue' :
                           daysRemaining <= 3 ? `${daysRemaining}d - Refill soon` :
                           `${daysRemaining} days left`;

        return { days_remaining: daysRemaining, total_days: supplyDays, status_text: statusText };
      }
    }
  }

  // ===== PEPTIDE / DATE-BASED =====
  if (protocol.end_date) {
    const endDate = new Date(protocol.end_date + 'T23:59:59');
    const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

    let totalDays = 30;
    const programName = (protocol.program_name || '').toLowerCase();
    if (programName.includes('7')) totalDays = 7;
    else if (programName.includes('10')) totalDays = 10;
    else if (programName.includes('14')) totalDays = 14;
    else if (programName.includes('20')) totalDays = 20;
    else if (programName.includes('30')) totalDays = 30;

    const statusText = daysRemaining <= 0 ? 'Protocol ended' :
                       daysRemaining <= 3 ? `${daysRemaining}d left!` :
                       `${daysRemaining} days left`;

    return { days_remaining: daysRemaining, total_days: totalDays, status_text: statusText };
  }

  // ===== SESSION-BASED (IV, HBOT, RLT) =====
  if (protocol.total_sessions && protocol.total_sessions > 0) {
    const sessionsUsed = protocol.sessions_used || 0;
    const sessionsRemaining = protocol.total_sessions - sessionsUsed;
    const statusText = sessionsRemaining <= 0 ? 'All sessions used' :
                       `${sessionsRemaining}/${protocol.total_sessions} sessions`;
    return { sessions_remaining: sessionsRemaining, total_sessions: protocol.total_sessions, status_text: statusText };
  }

  return { days_remaining: null, status_text: 'Active' };
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
  if (programType.includes('peptide') || programType.includes('bpc') || programType.includes('tb-500')) {
    return 'peptide';
  }
  if (programType.includes('iv') || programType.includes('infusion') || programType.includes('nad')) {
    return 'iv';
  }
  if (programType.includes('hbot') || programType.includes('hyperbaric')) {
    return 'hbot';
  }
  if (programType.includes('rlt') || programType.includes('red light')) {
    return 'rlt';
  }
  if (programType.includes('injection')) {
    return 'injection';
  }
  return 'other';
}

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Patient ID required' });
  }

  if (req.method === 'GET') {
    try {
      // Get patient details
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();

      if (patientError || !patient) {
        console.error('Patient not found:', patientError);
        return res.status(404).json({ error: 'Patient not found' });
      }

      // Get ALL protocols for this patient
      const { data: allProtocols, error: protocolsError } = await supabase
        .from('protocols')
        .select('*')
        .eq('patient_id', id)
        .order('start_date', { ascending: false });

      if (protocolsError) {
        console.error('Error fetching protocols:', protocolsError);
      }

      // Split and format protocols
      const activeProtocols = [];
      const completedProtocols = [];

      (allProtocols || []).forEach(protocol => {
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

        const isCompleted =
          protocol.status === 'completed' ||
          (tracking.days_remaining !== null && tracking.days_remaining <= -7) ||
          (tracking.sessions_remaining !== undefined && tracking.sessions_remaining <= 0 && protocol.total_sessions > 0);

        if (isCompleted) {
          completedProtocols.push(formatted);
        } else if (protocol.status !== 'cancelled') {
          activeProtocols.push(formatted);
        }
      });

      // Get pending lab orders
      const { data: pendingLabOrders } = await supabase
        .from('lab_orders')
        .select('*')
        .eq('patient_id', id)
        .eq('status', 'pending')
        .order('order_date', { ascending: false });

      // Get lab results
      const { data: labs } = await supabase
        .from('patient_labs')
        .select('*')
        .eq('patient_id', id)
        .order('collection_date', { ascending: false });

      // Get pending purchases
      let pendingNotifications = [];

      const { data: purchasesByPatientId } = await supabase
        .from('purchases')
        .select('*')
        .eq('patient_id', id)
        .eq('protocol_created', false)
        .eq('dismissed', false)
        .order('purchase_date', { ascending: false });

      if (purchasesByPatientId && purchasesByPatientId.length > 0) {
        pendingNotifications = purchasesByPatientId;
      } else if (patient.ghl_contact_id) {
        const { data: purchasesByGhl } = await supabase
          .from('purchases')
          .select('*')
          .eq('ghl_contact_id', patient.ghl_contact_id)
          .eq('protocol_created', false)
          .eq('dismissed', false)
          .order('purchase_date', { ascending: false });

        pendingNotifications = purchasesByGhl || [];
      }

      // ===== NEW: Get intake forms =====
      let intakes = [];
      const intakeFields = 'id, first_name, last_name, email, phone, date_of_birth, gender, submitted_at, pdf_url, symptoms, photo_id_url, signature_url, patient_id, ghl_contact_id';

      // Try by patient_id first
      const { data: intakesByPatientId } = await supabase
        .from('intakes')
        .select(intakeFields)
        .eq('patient_id', id)
        .order('submitted_at', { ascending: false });

      if (intakesByPatientId && intakesByPatientId.length > 0) {
        intakes = intakesByPatientId;
      }

      // Also try ghl_contact_id if we haven't found any yet
      if (intakes.length === 0 && patient.ghl_contact_id) {
        const { data: intakesByGhl } = await supabase
          .from('intakes')
          .select(intakeFields)
          .eq('ghl_contact_id', patient.ghl_contact_id)
          .order('submitted_at', { ascending: false });

        if (intakesByGhl && intakesByGhl.length > 0) {
          intakes = intakesByGhl;
        }
      }

      // Also try email if we still haven't found any
      if (intakes.length === 0 && patient.email) {
        const { data: intakesByEmail } = await supabase
          .from('intakes')
          .select(intakeFields)
          .ilike('email', patient.email)  // Case-insensitive match
          .order('submitted_at', { ascending: false });

        if (intakesByEmail && intakesByEmail.length > 0) {
          intakes = intakesByEmail;
        }
      }

      // ===== NEW: Get sessions/visits =====
      const { data: sessions } = await supabase
        .from('sessions')
        .select('*, protocols(program_name, program_type)')
        .eq('patient_id', id)
        .order('session_date', { ascending: false })
        .limit(50);

      // ===== NEW: Get symptoms questionnaires =====
      const { data: symptomResponses } = await supabase
        .from('symptoms')
        .select('*')
        .eq('patient_id', id)
        .order('symptom_date', { ascending: false })
        .limit(10);

      // ===== NEW: Get consent forms =====
      let consents = [];
      const consentFields = 'id, consent_type, first_name, last_name, email, phone, consent_date, consent_given, signature_url, pdf_url, submitted_at, patient_id, ghl_contact_id';

      // Try by patient_id first
      const { data: consentsByPatientId } = await supabase
        .from('consents')
        .select(consentFields)
        .eq('patient_id', id)
        .order('submitted_at', { ascending: false });

      if (consentsByPatientId && consentsByPatientId.length > 0) {
        consents = consentsByPatientId;
      }

      // Also try ghl_contact_id if we haven't found any yet
      if (consents.length === 0 && patient.ghl_contact_id) {
        const { data: consentsByGhl } = await supabase
          .from('consents')
          .select(consentFields)
          .eq('ghl_contact_id', patient.ghl_contact_id)
          .order('submitted_at', { ascending: false });

        if (consentsByGhl && consentsByGhl.length > 0) {
          consents = consentsByGhl;
        }
      }

      // Try email if we haven't found any consents yet
      if (consents.length === 0 && patient.email) {
        const { data: consentsByEmail } = await supabase
          .from('consents')
          .select(consentFields)
          .ilike('email', patient.email)
          .order('submitted_at', { ascending: false });

        if (consentsByEmail && consentsByEmail.length > 0) {
          consents = consentsByEmail;
        }
      }

      // Try phone (normalized last 10 digits) if we still haven't found any
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

      // Backfill patient_id on consents found via fallback (ghl, email, phone)
      if (consents.length > 0) {
        const unlinkedIds = consents
          .filter(c => c.patient_id !== id)
          .map(c => c.id);
        if (unlinkedIds.length > 0) {
          await supabase.from('consents')
            .update({ patient_id: id })
            .in('id', unlinkedIds);
        }
      }

      // ===== NEW: Get medical documents =====
      const { data: medicalDocuments } = await supabase
        .from('medical_documents')
        .select('*')
        .eq('patient_id', id)
        .order('uploaded_at', { ascending: false });

      // ===== Weight loss service logs (for progress chart) =====
      const { data: weightLossLogs } = await supabase
        .from('service_logs')
        .select('entry_date, medication, dosage, weight')
        .eq('patient_id', id)
        .eq('category', 'weight_loss')
        .order('entry_date', { ascending: true });

      // ===== NEW: Get patient notes (GHL backup) =====
      const { data: patientNotes } = await supabase
        .from('patient_notes')
        .select('id, body, note_date, source')
        .eq('patient_id', id)
        .order('note_date', { ascending: false });

      // ===== NEW: Get clinic appointments =====
      let appointments = [];

      // Try by patient_id first
      const { data: appointmentsByPatientId } = await supabase
        .from('clinic_appointments')
        .select('*')
        .eq('patient_id', id)
        .order('start_time', { ascending: false })
        .limit(50);

      if (appointmentsByPatientId && appointmentsByPatientId.length > 0) {
        appointments = appointmentsByPatientId;
      }

      // Also try ghl_contact_id if we haven't found any yet
      if (appointments.length === 0 && patient.ghl_contact_id) {
        const { data: appointmentsByGhl } = await supabase
          .from('clinic_appointments')
          .select('*')
          .eq('ghl_contact_id', patient.ghl_contact_id)
          .order('start_time', { ascending: false })
          .limit(50);

        if (appointmentsByGhl && appointmentsByGhl.length > 0) {
          appointments = appointmentsByGhl;
        }
      }

      // Extract demographics from intake if patient record is missing them
      let intakeDemographics = null;
      const firstIntake = intakes?.[0];
      if (firstIntake) {
        const hasMissingDemographics = !patient.date_of_birth || !patient.gender || !patient.first_name || !patient.last_name;
        if (hasMissingDemographics) {
          intakeDemographics = {
            date_of_birth: firstIntake.date_of_birth,
            gender: firstIntake.gender,
            first_name: firstIntake.first_name,
            last_name: firstIntake.last_name,
            phone: firstIntake.phone,
            email: firstIntake.email
          };
        }
      }

      // Calculate stats
      const upcomingAppointments = appointments.filter(apt => new Date(apt.start_time) >= new Date());
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
        upcomingAppointments: upcomingAppointments?.length || 0
      };

      console.log(`Patient ${patient.name}: ${activeProtocols.length} active, ${completedProtocols.length} completed, ${intakes?.length || 0} intakes, ${consents?.length || 0} consents`);

      return res.status(200).json({
        patient,
        intakeDemographics,
        activeProtocols,
        completedProtocols,
        pendingNotifications: pendingNotifications || [],
        pendingLabOrders: pendingLabOrders || [],
        labs: labs || [],
        intakes: intakes || [],
        consents: consents || [],
        medicalDocuments: medicalDocuments || [],
        sessions: sessions || [],
        symptomResponses: symptomResponses || [],
        appointments: appointments || [],
        notes: patientNotes || [],
        weightLossLogs: weightLossLogs || [],
        stats
      });

    } catch (error) {
      console.error('Patient API error:', error);
      return res.status(500).json({ error: 'Server error', details: error.message });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const updates = req.body;

      const { data, error } = await supabase
        .from('patients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: 'Failed to update patient' });
      }

      return res.status(200).json({ patient: data });
    } catch (error) {
      return res.status(500).json({ error: 'Server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
