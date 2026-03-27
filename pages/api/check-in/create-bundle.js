// /pages/api/check-in/create-bundle.js
// Creates a form bundle for in-clinic iPad check-in
// Range Medical

import { createFormBundle } from '../../../lib/form-bundles';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { formIds, patientId, patientName, patientEmail, patientPhone } = req.body;

  if (!formIds || !Array.isArray(formIds) || formIds.length === 0) {
    return res.status(400).json({ error: 'At least one form is required' });
  }

  try {
    const { token, url } = await createFormBundle({
      formIds,
      patientId: patientId || null,
      patientName: patientName || null,
      patientEmail: patientEmail || null,
      patientPhone: patientPhone || null,
      metadata: { source: 'check-in-kiosk' },
    });

    return res.status(200).json({ token, url });
  } catch (error) {
    console.error('Check-in bundle creation error:', error);
    return res.status(500).json({ error: 'Failed to create form bundle' });
  }
}
