// /pages/api/voice-agent/internal-retell.js
// Retell webhook for the internal staff voice assistant.
// Routes function calls to the existing staff bot handlers.

import {
  handleCheckAvailability,
  handleBookAppointment,
  handleQueryBilling,
  handleAddNote,
  handleCreateTask,
  handleGetSchedule,
  handleLookupPatient,
  handleGetServiceInfo,
} from '../../../lib/staff-bot';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { function_name, arguments: funcArgs, args, call } = req.body;
  const params = funcArgs || args || {};

  const employeeName = call?.metadata?.employee_name || 'Voice Assistant';
  const employeeId = call?.metadata?.employee_id || null;
  const staff = { name: employeeName, id: employeeId };

  try {
    let result;
    switch (function_name) {
      case 'check_availability':
        result = await handleCheckAvailability(params);
        break;
      case 'book_appointment':
        result = await handleBookAppointment(params);
        break;
      case 'lookup_patient':
        result = await handleLookupPatient(params);
        break;
      case 'get_schedule': {
        const schedParams = { ...params };
        if (!schedParams.date) {
          schedParams.date = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
        }
        result = await handleGetSchedule(schedParams);
        break;
      }
      case 'query_billing':
        result = await handleQueryBilling({
          patient_name: params.patient_name,
          patient_phone: params.patient_phone,
        });
        break;
      case 'add_note':
        result = await handleAddNote(
          { patient_name: params.patient_name, note: params.note },
          staff,
        );
        break;
      case 'create_task':
        result = await handleCreateTask(params, staff);
        break;
      case 'get_service_info':
        result = await handleGetServiceInfo({ service_name: params.service });
        break;
      default:
        result = `I don't have a function called "${function_name}".`;
    }

    return res.status(200).json({
      result: typeof result === 'string' ? result : JSON.stringify(result),
    });
  } catch (err) {
    console.error(`internal-voice/${function_name} error:`, err);
    return res.status(200).json({
      result: 'I ran into a technical issue. Try again or ask a different way.',
    });
  }
}
