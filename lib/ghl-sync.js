// /lib/ghl-sync.js
// GHL Sync Utility - Syncs protocol data to GoHighLevel
// Range Medical
// CREATED: 2026-01-04

const GHL_API_KEY = process.env.GHL_API_KEY || 'pit-3077d6b0-6f08-4cb6-b74e-be7dd765e91d';
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID || 'WICdvbXmTjQORW6GiHWW';

// ============================================
// CONTACT UPDATE
// ============================================

export async function updateGHLContact(contactId, customFields) {
  if (!contactId) {
    console.log('GHL Sync: No contact ID, skipping update');
    return null;
  }
  
  try {
    const response = await fetch(
      `https://services.leadconnectorhq.com/contacts/${contactId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          customFields: Object.entries(customFields).map(([key, value]) => ({
            key,
            field_value: value
          }))
        })
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('GHL Contact Update error:', response.status, errorText);
      return null;
    }
    
    const result = await response.json();
    console.log('GHL Contact updated:', contactId);
    return result;
  } catch (error) {
    console.error('Error updating GHL contact:', error);
    return null;
  }
}

// ============================================
// NOTES
// ============================================

export async function addGHLNote(contactId, noteBody) {
  if (!contactId) {
    console.log('GHL Sync: No contact ID, skipping note');
    return null;
  }
  
  try {
    const response = await fetch(
      `https://services.leadconnectorhq.com/contacts/${contactId}/notes`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          body: noteBody
        })
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('GHL Note error:', response.status, errorText);
      return null;
    }
    
    const result = await response.json();
    console.log('GHL Note created for:', contactId);
    return result;
  } catch (error) {
    console.error('Error creating GHL note:', error);
    return null;
  }
}

// ============================================
// TASKS
// ============================================

export async function createGHLTask(contactId, title, dueDate, description = '') {
  if (!contactId) {
    console.log('GHL Sync: No contact ID, skipping task');
    return null;
  }
  
  try {
    const response = await fetch(
      `https://services.leadconnectorhq.com/contacts/${contactId}/tasks`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          title,
          body: description,
          dueDate: dueDate, // ISO format
          completed: false
        })
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('GHL Task error:', response.status, errorText);
      return null;
    }
    
    const result = await response.json();
    console.log('GHL Task created for:', contactId, '| Due:', dueDate);
    return result;
  } catch (error) {
    console.error('Error creating GHL task:', error);
    return null;
  }
}

// ============================================
// WEIGHT LOSS PROTOCOL SYNC
// ============================================

export async function syncWeightLossProtocolCreated(contactId, protocol, patientName) {
  if (!contactId) return;
  
  const medication = protocol.medication || '';
  const dose = protocol.selected_dose || '';
  const startDate = protocol.start_date || new Date().toISOString().split('T')[0];
  const totalSessions = protocol.total_sessions || 4;
  const deliveryMethod = protocol.delivery_method === 'in_clinic' ? 'In Clinic' : 'Take Home';
  
  // Calculate next due date (7 days from start for weekly)
  const nextDue = new Date(startDate);
  nextDue.setDate(nextDue.getDate() + 7);
  const nextDueStr = nextDue.toISOString().split('T')[0];
  
  // Update custom fields
  await updateGHLContact(contactId, {
    'WL - Medication': medication,
    'WL - Current Dose': dose,
    'WL - Start Date': startDate,
    'WL - Sessions Remaining': String(totalSessions),
    'WL - Fulfillment': deliveryMethod,
    'WL - Next Fulfillment Date': nextDueStr
  });
  
  // Add note
  const note = `🟢 WEIGHT LOSS PROTOCOL STARTED

Medication: ${medication}
Starting Dose: ${dose}
Delivery: ${deliveryMethod}
Total Sessions: ${totalSessions}
Start Date: ${startDate}
Next Due: ${nextDueStr}`;
  
  await addGHLNote(contactId, note);
  
  // Create first task if in-clinic
  if (protocol.delivery_method === 'in_clinic') {
    await createGHLTask(
      contactId,
      `💉 Weight Loss Injection #1 - ${patientName}`,
      nextDue.toISOString(),
      `First injection due for ${medication} ${dose}`
    );
  }
}

export async function syncWeightLossInjectionLogged(contactId, protocol, log, patientName) {
  if (!contactId) return;
  
  const sessionsUsed = protocol.sessions_used || 0;
  const totalSessions = protocol.total_sessions || 4;
  const sessionsRemaining = totalSessions - sessionsUsed;
  const currentWeight = log.weight || null;
  const dose = log.dose || protocol.selected_dose || '';
  const logDate = log.log_date || new Date().toISOString().split('T')[0];
  
  // Calculate weight change if we have starting weight
  let weightChange = '';
  if (currentWeight && protocol.starting_weight) {
    const change = currentWeight - protocol.starting_weight;
    weightChange = change < 0 ? `↓ ${Math.abs(change).toFixed(1)} lbs` : `↑ ${change.toFixed(1)} lbs`;
  }
  
  // Calculate next due date
  const nextDue = new Date(logDate);
  nextDue.setDate(nextDue.getDate() + 7);
  const nextDueStr = nextDue.toISOString().split('T')[0];
  
  // Update custom fields
  const fields = {
    'WL - Current Dose': dose,
    'WL - Sessions Remaining': String(sessionsRemaining),
  };
  
  if (currentWeight) {
    fields['WL - Current Weight'] = String(currentWeight);
  }
  
  if (sessionsRemaining > 0) {
    fields['WL - Next Fulfillment Date'] = nextDueStr;
  }
  
  await updateGHLContact(contactId, fields);
  
  // Add note
  let note = `💉 INJECTION #${sessionsUsed} LOGGED

Date: ${logDate}
Dose: ${dose}`;
  
  if (currentWeight) {
    note += `\nWeight: ${currentWeight} lbs`;
    if (weightChange) {
      note += ` (${weightChange} from start)`;
    }
  }
  
  note += `\nSessions: ${sessionsRemaining}/${totalSessions} remaining`;
  
  if (log.notes) {
    note += `\nNotes: ${log.notes}`;
  }
  
  if (sessionsRemaining === 0) {
    note += `\n\n✅ PROTOCOL COMPLETE`;
  }
  
  await addGHLNote(contactId, note);
  
  // Create task for next injection if sessions remain
  if (sessionsRemaining > 0) {
    await createGHLTask(
      contactId,
      `💉 Weight Loss Injection #${sessionsUsed + 1} - ${patientName}`,
      nextDue.toISOString(),
      `Injection ${sessionsUsed + 1} of ${totalSessions} due`
    );
  }
}

// ============================================
// PEPTIDE PROTOCOL SYNC
// ============================================

export async function syncPeptideProtocolCreated(contactId, protocol, patientName) {
  if (!contactId) return;
  
  const medication = protocol.medication || protocol.peptide || '';
  const dose = protocol.selected_dose || '';
  const frequency = protocol.frequency || '';
  const startDate = protocol.start_date || new Date().toISOString().split('T')[0];
  const endDate = protocol.end_date || '';
  const deliveryMethod = protocol.delivery_method === 'in_clinic' ? 'In Clinic' : 'Take Home';
  const programName = protocol.program_name || '';
  
  // Calculate days
  let daysRemaining = '';
  if (endDate) {
    const end = new Date(endDate);
    const today = new Date();
    const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    daysRemaining = String(Math.max(0, diff));
  }
  
  // Update custom fields
  await updateGHLContact(contactId, {
    'P - Peptide': medication,
    'P - Peptide Dosage': dose,
    'P - Start Date': startDate,
    'P -Projected End Date': endDate,
    'P - Peptide Therapy Status': 'Active',
    'protocol days remaining': daysRemaining,
    'current protocol': programName
  });
  
  // Add note
  const note = `🟢 PEPTIDE PROTOCOL STARTED

Program: ${programName}
Peptide: ${medication}
Dose: ${dose}
Frequency: ${frequency}
Delivery: ${deliveryMethod}
Start: ${startDate}
End: ${endDate}
Days: ${daysRemaining}`;
  
  await addGHLNote(contactId, note);
}

export async function syncPeptideProtocolCompleted(contactId, protocol, patientName) {
  if (!contactId) return;
  
  await updateGHLContact(contactId, {
    'P - Peptide Therapy Status': 'Completed',
    'protocol days remaining': '0'
  });
  
  const note = `✅ PEPTIDE PROTOCOL COMPLETED

Program: ${protocol.program_name || ''}
Peptide: ${protocol.medication || ''}
Completed: ${new Date().toISOString().split('T')[0]}`;
  
  await addGHLNote(contactId, note);
}

// ============================================
// INJECTION PROTOCOL SYNC (Non-Weight Loss)
// ============================================

export async function syncInjectionProtocolCreated(contactId, protocol, patientName) {
  if (!contactId) return;
  
  const medication = protocol.medication || '';
  const totalSessions = protocol.total_sessions || 0;
  const deliveryMethod = protocol.delivery_method === 'in_clinic' ? 'In Clinic' : 'Take Home';
  const programName = protocol.program_name || '';
  
  // Update custom fields
  await updateGHLContact(contactId, {
    'INJ - Package Name': programName,
    'INJ - Quantity': String(totalSessions),
    'INJ - Used': '0',
    'INJ - Balance': String(totalSessions)
  });
  
  // Add note
  const note = `🟢 INJECTION PROTOCOL STARTED

Package: ${programName}
Medication: ${medication}
Sessions: ${totalSessions}
Delivery: ${deliveryMethod}`;
  
  await addGHLNote(contactId, note);
}

export async function syncInjectionSessionLogged(contactId, protocol, patientName) {
  if (!contactId) return;
  
  const sessionsUsed = protocol.sessions_used || 0;
  const totalSessions = protocol.total_sessions || 0;
  const sessionsRemaining = totalSessions - sessionsUsed;
  
  // Update custom fields
  await updateGHLContact(contactId, {
    'INJ - Used': String(sessionsUsed),
    'INJ - Balance': String(sessionsRemaining)
  });
  
  // Add note
  let note = `💉 INJECTION SESSION LOGGED

Session: ${sessionsUsed}/${totalSessions}
Remaining: ${sessionsRemaining}`;
  
  if (sessionsRemaining === 0) {
    note += `\n\n✅ PACKAGE COMPLETE`;
  }
  
  await addGHLNote(contactId, note);
}

// ============================================
// PURCHASE SYNC
// ============================================

export async function syncPurchaseToGHL(contactId, purchase) {
  if (!contactId) return;
  
  const note = `💳 NEW PURCHASE

Item: ${purchase.product_name || 'Unknown'}${purchase.variant ? ` (${purchase.variant})` : ''}
Amount Paid: $${(purchase.amount || 0).toFixed(2)}
Date: ${purchase.purchase_date}
Category: ${purchase.category || 'Other'}`;
  
  await addGHLNote(contactId, note);
}
