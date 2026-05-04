// POST /api/appointments/create
// Thin wrapper around lib/create-appointment.js. All the actual creation
// logic — multi-service splitting, dedupe via cal_com_booking_id,
// shadow calcom_bookings row, notifications, automations, audit log,
// staff note mirror, and energy_workup pipeline advance — lives in the
// shared helper so every booking entry point uses the same write path.

import { createAppointment, CreateAppointmentError } from '../../../lib/create-appointment';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await createAppointment(req.body, { req });
    return res.status(200).json(result);
  } catch (e) {
    if (e instanceof CreateAppointmentError) {
      return res.status(e.statusCode).json({ error: e.message });
    }
    console.error('Create appointment error:', e);
    return res.status(500).json({ error: e.message });
  }
}
