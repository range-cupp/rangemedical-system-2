// /lib/ghl-sync.js
// GHL Sync Utility - Syncs protocol data to GoHighLevel
// Range Medical
// CREATED: 2026-01-04
// UPDATED: 2026-01-04 - Added all protocol types with exact GHL field names

const GHL_API_KEY = process.env.GHL_API_KEY || 'pit-3077d6b0-6f08-4cb6-b74e-be7dd765e91d';
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID || 'WICdvbXmTjQORW6GiHWW';

// ============================================
// CONTACT UPDATE - Using field keys
// ============================================

export async function updateGHLContact(contactId, fields) {
  if (!contactId) {
    console.log('GHL Sync: No contact ID, skipping update');
    return null;
  }
  
  try {
    // Convert fields object to GHL customFields array format
    const customFields = Object.entries(fields).map(([key, value]) => ({
      key: key,
      field_value: value
    }));
    
    console.log('GHL Update:', contactId, customFields);
    
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
        body: JSON.stringify({ customFields })
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
        body: JSON.stringify({ body: noteBody })
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
          dueDate: dueDate,
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
// HRT PROTOCOL SYNC
// GHL Fields: HRT - Program Status, HRT - Program Start Date, 
// HRT - Current Medication, HRT - Secondary Medication, HRT - Current Dosage,
// HRT - Current Fulfillment, HRT - Last Fulfillment Pickup, HRT - Next Fulfillment Date,
// HRT - Last Blood Draw, HRT - Next Blood Draw, HRT - Monthly Payment Date, HRT - Current Payment Amount
// ============================================

export async function syncHRTProtocolCreated(contactId, protocol, patientName, options = {}) {
  if (!contactId) return;
  
  const medication = protocol.medication || options.medication || '';
  const secondaryMed = options.secondaryMedication || '';
  const dosage = protocol.selected_dose || options.dosage || '';
  const fulfillmentType = protocol.delivery_method || options.fulfillmentType || ''; // Pre-filled 2 Week, Pre-filled 4 Week, Vial
  const startDate = protocol.start_date || new Date().toISOString().split('T')[0];
  const paymentAmount = options.paymentAmount || '';
  
  // Calculate next fulfillment based on type
  let nextFulfillmentDate = '';
  if (fulfillmentType.includes('2 Week') || fulfillmentType.includes('2-week')) {
    const next = new Date(startDate);
    next.setDate(next.getDate() + 14);
    nextFulfillmentDate = next.toISOString().split('T')[0];
  } else if (fulfillmentType.includes('4 Week') || fulfillmentType.includes('4-week')) {
    const next = new Date(startDate);
    next.setDate(next.getDate() + 28);
    nextFulfillmentDate = next.toISOString().split('T')[0];
  } else if (fulfillmentType.toLowerCase().includes('vial')) {
    // Vial lasts 10-12 weeks, use 10 weeks as default
    const next = new Date(startDate);
    next.setDate(next.getDate() + 70);
    nextFulfillmentDate = next.toISOString().split('T')[0];
  }
  
  // Calculate next blood draw (typically 6-8 weeks from start)
  const nextBloodDraw = new Date(startDate);
  nextBloodDraw.setDate(nextBloodDraw.getDate() + 42); // 6 weeks
  
  // Update custom fields
  const fields = {
    'contact.hrt__program_status': 'Active',
    'contact.hrt__program_start_date': startDate,
    'contact.hrt__current_medication': medication,
    'contact.hrt__current_dosage': dosage,
    'contact.hrt__current_fulfillment': fulfillmentType,
    'contact.hrt__last_medication_pickup': startDate,
    'contact.hrt__next_fulfillment_date': nextFulfillmentDate,
    'contact.hrt__next_blood_draw': nextBloodDraw.toISOString().split('T')[0]
  };
  
  if (secondaryMed) {
    fields['contact.hrt__secondary_medication'] = secondaryMed;
  }
  if (paymentAmount) {
    fields['contact.hrt__current_payment_amount'] = paymentAmount;
  }
  
  await updateGHLContact(contactId, fields);
  
  // Add note
  const note = `🟢 HRT MEMBERSHIP STARTED

Medication: ${medication}${secondaryMed ? `\nSecondary: ${secondaryMed}` : ''}
Dosage: ${dosage}
Fulfillment: ${fulfillmentType}
Start Date: ${startDate}
Next Pickup: ${nextFulfillmentDate}
Next Blood Draw: ${nextBloodDraw.toISOString().split('T')[0]}`;
  
  await addGHLNote(contactId, note);
  
  // Create task for next fulfillment
  if (nextFulfillmentDate) {
    await createGHLTask(
      contactId,
      `💊 HRT Fulfillment Due - ${patientName}`,
      new Date(nextFulfillmentDate).toISOString(),
      `${medication} ${dosage} - ${fulfillmentType}`
    );
  }
}

export async function syncHRTFulfillment(contactId, patientName, options = {}) {
  if (!contactId) return;
  
  const today = new Date().toISOString().split('T')[0];
  const fulfillmentType = options.fulfillmentType || '';
  const medication = options.medication || '';
  const dosage = options.dosage || '';
  
  // Calculate next fulfillment
  let nextFulfillmentDate = '';
  if (fulfillmentType.includes('2 Week') || fulfillmentType.includes('2-week')) {
    const next = new Date();
    next.setDate(next.getDate() + 14);
    nextFulfillmentDate = next.toISOString().split('T')[0];
  } else if (fulfillmentType.includes('4 Week') || fulfillmentType.includes('4-week')) {
    const next = new Date();
    next.setDate(next.getDate() + 28);
    nextFulfillmentDate = next.toISOString().split('T')[0];
  } else if (fulfillmentType.toLowerCase().includes('vial')) {
    const next = new Date();
    next.setDate(next.getDate() + 70);
    nextFulfillmentDate = next.toISOString().split('T')[0];
  }
  
  await updateGHLContact(contactId, {
    'contact.hrt__last_medication_pickup': today,
    'contact.hrt__next_fulfillment_date': nextFulfillmentDate
  });
  
  const note = `💊 HRT FULFILLMENT PICKUP

Date: ${today}
Medication: ${medication}
Dosage: ${dosage}
Next Pickup: ${nextFulfillmentDate}`;
  
  await addGHLNote(contactId, note);
  
  // Create task for next fulfillment
  if (nextFulfillmentDate) {
    await createGHLTask(
      contactId,
      `💊 HRT Fulfillment Due - ${patientName}`,
      new Date(nextFulfillmentDate).toISOString(),
      `${medication} ${dosage} - ${fulfillmentType}`
    );
  }
}

export async function syncHRTBloodDraw(contactId, patientName, options = {}) {
  if (!contactId) return;
  
  const today = new Date().toISOString().split('T')[0];
  
  // Next blood draw typically 8-12 weeks
  const nextBloodDraw = new Date();
  nextBloodDraw.setDate(nextBloodDraw.getDate() + 56); // 8 weeks
  
  await updateGHLContact(contactId, {
    'contact.hrt__last_blood_draw': today,
    'contact.hrt__next_blood_draw': nextBloodDraw.toISOString().split('T')[0]
  });
  
  const note = `🩸 HRT BLOOD DRAW COMPLETED

Date: ${today}
Next Blood Draw: ${nextBloodDraw.toISOString().split('T')[0]}`;
  
  await addGHLNote(contactId, note);
  
  // Create task for next blood draw
  await createGHLTask(
    contactId,
    `🩸 HRT Blood Draw Due - ${patientName}`,
    nextBloodDraw.toISOString(),
    'Schedule blood work'
  );
}

// ============================================
// WEIGHT LOSS PROTOCOL SYNC
// GHL Fields: WL - Program Status, WL - Medication, WL - Start Date,
// WL - Starting Weight, WL - Current Weight, WL - Starting Dose,
// WL - Current Dose, WL - Fulfillment, WL - Next Fulfillment Date,
// WL - Total Injections, WL - Injections Used, WL - Injections Remaining
// ============================================

export async function syncWeightLossProtocolCreated(contactId, protocol, patientName) {
  if (!contactId) return;
  
  const medication = protocol.medication || '';
  const dose = protocol.selected_dose || '';
  const startDate = protocol.start_date || new Date().toISOString().split('T')[0];
  const totalInjections = protocol.total_sessions || 4;
  const deliveryMethod = protocol.delivery_method === 'in_clinic' ? 'In Clinic' : 'Take Home';
  
  // Calculate next due date (7 days for weekly injections)
  const nextDue = new Date(startDate);
  nextDue.setDate(nextDue.getDate() + 7);
  const nextDueStr = nextDue.toISOString().split('T')[0];
  
  // Update custom fields
  await updateGHLContact(contactId, {
    'contact.wl__program_status': 'Active',
    'contact.wl__medication': medication,
    'contact.wl__start_date': startDate,
    'contact.wl__starting_dose': dose,
    'contact.wl__current_dose': dose,
    'contact.wl__fulfillment': deliveryMethod,
    'contact.wl__next_fulfillment_date': nextDueStr,
    'contact.wl__total_injections': String(totalInjections),
    'contact.wl__injections_used': '0',
    'contact.wl__injections_remaining': String(totalInjections)
  });
  
  // Add note
  const note = `🟢 WEIGHT LOSS PROTOCOL STARTED

Medication: ${medication}
Starting Dose: ${dose}
Delivery: ${deliveryMethod}
Total Injections: ${totalInjections}
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
  
  const injectionsUsed = protocol.sessions_used || 0;
  const totalInjections = protocol.total_sessions || 4;
  const injectionsRemaining = totalInjections - injectionsUsed;
  const currentWeight = log.weight || null;
  const dose = log.dose || protocol.selected_dose || '';
  const logDate = log.log_date || new Date().toISOString().split('T')[0];
  
  // Calculate weight change
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
    'contact.wl__current_dose': dose,
    'contact.wl__injections_used': String(injectionsUsed),
    'contact.wl__injections_remaining': String(injectionsRemaining)
  };
  
  if (currentWeight) {
    fields['contact.wl__current_weight'] = String(currentWeight);
    // Set starting weight if first injection
    if (injectionsUsed === 1) {
      fields['contact.wl__starting_weight'] = String(currentWeight);
    }
  }
  
  if (injectionsRemaining > 0) {
    fields['contact.wl__next_fulfillment_date'] = nextDueStr;
  }
  
  if (injectionsRemaining === 0) {
    fields['contact.wl__program_status'] = 'Completed';
  }
  
  await updateGHLContact(contactId, fields);
  
  // Add note
  let note = `💉 INJECTION #${injectionsUsed} LOGGED

Date: ${logDate}
Dose: ${dose}`;
  
  if (currentWeight) {
    note += `\nWeight: ${currentWeight} lbs`;
    if (weightChange) {
      note += ` (${weightChange} from start)`;
    }
  }
  
  note += `\nInjections: ${injectionsRemaining}/${totalInjections} remaining`;
  
  if (log.notes) {
    note += `\nNotes: ${log.notes}`;
  }
  
  if (injectionsRemaining === 0) {
    note += `\n\n✅ PROTOCOL COMPLETE`;
  }
  
  await addGHLNote(contactId, note);
  
  // Create task for next injection if injections remain
  if (injectionsRemaining > 0) {
    await createGHLTask(
      contactId,
      `💉 Weight Loss Injection #${injectionsUsed + 1} - ${patientName}`,
      nextDue.toISOString(),
      `Injection ${injectionsUsed + 1} of ${totalInjections} due`
    );
  }
}

// ============================================
// PEPTIDE PROTOCOL SYNC
// GHL Fields: P - Peptide Therapy Status, P - Start Date, P - Peptide,
// P - Peptide Dosage, P -Projected End Date, P - Notes
// ============================================

export async function syncPeptideProtocolCreated(contactId, protocol, patientName) {
  if (!contactId) return;
  
  const medication = protocol.medication || protocol.peptide || '';
  const dose = protocol.selected_dose || '';
  const frequency = protocol.frequency || '';
  const startDate = protocol.start_date || new Date().toISOString().split('T')[0];
  const endDate = protocol.end_date || '';
  const programName = protocol.program_name || '';
  const notes = protocol.notes || '';
  
  // Update custom fields
  await updateGHLContact(contactId, {
    'contact.p__peptide_therapy_status': 'Active',
    'contact.p__start_date': startDate,
    'contact.p__peptide': medication,
    'contact.p__peptide_dosage': dose,
    'contact.p_projected_end_date': endDate,
    'contact.p__notes': notes || programName
  });
  
  // Add note
  const note = `🟢 PEPTIDE PROTOCOL STARTED

Program: ${programName}
Peptide: ${medication}
Dose: ${dose}
Frequency: ${frequency}
Start: ${startDate}
End: ${endDate}`;
  
  await addGHLNote(contactId, note);
  
  // Create task for protocol end/followup
  if (endDate) {
    await createGHLTask(
      contactId,
      `📋 Peptide Protocol Ending - ${patientName}`,
      new Date(endDate).toISOString(),
      `${programName} - ${medication} protocol ending. Follow up on results.`
    );
  }
}

export async function syncPeptideProtocolCompleted(contactId, protocol, patientName) {
  if (!contactId) return;
  
  await updateGHLContact(contactId, {
    'contact.p__peptide_therapy_status': 'Completed'
  });
  
  const note = `✅ PEPTIDE PROTOCOL COMPLETED

Program: ${protocol.program_name || ''}
Peptide: ${protocol.medication || ''}
Completed: ${new Date().toISOString().split('T')[0]}`;
  
  await addGHLNote(contactId, note);
}

// ============================================
// IV PACKAGES SYNC
// GHL Fields: IV - Package Name, IV - Package Price, IV - Services,
// IV - Quantity, IV - Used, IV - Balance
// ============================================

export async function syncIVPackageCreated(contactId, protocol, patientName) {
  if (!contactId) return;
  
  const packageName = protocol.program_name || '';
  const totalSessions = protocol.total_sessions || 0;
  const price = protocol.price || '';
  const services = protocol.services || protocol.medication || '';
  
  await updateGHLContact(contactId, {
    'contact.iv__package_name': packageName,
    'contact.iv__package_price': price ? String(price) : '',
    'contact.iv__services': services,
    'contact.iv__quantity': String(totalSessions),
    'contact.iv__used': '0',
    'contact.iv__balance': String(totalSessions)
  });
  
  const note = `🟢 IV PACKAGE STARTED

Package: ${packageName}
Services: ${services}
Sessions: ${totalSessions}`;
  
  await addGHLNote(contactId, note);
}

export async function syncIVSessionLogged(contactId, protocol, patientName) {
  if (!contactId) return;
  
  const sessionsUsed = protocol.sessions_used || 0;
  const totalSessions = protocol.total_sessions || 0;
  const sessionsRemaining = totalSessions - sessionsUsed;
  
  await updateGHLContact(contactId, {
    'contact.iv__used': String(sessionsUsed),
    'contact.iv__balance': String(sessionsRemaining)
  });
  
  let note = `💧 IV SESSION LOGGED

Session: ${sessionsUsed}/${totalSessions}
Remaining: ${sessionsRemaining}`;
  
  if (sessionsRemaining === 0) {
    note += `\n\n✅ PACKAGE COMPLETE`;
  }
  
  await addGHLNote(contactId, note);
}

// ============================================
// INJECTION PACKAGES SYNC (non-weight loss)
// GHL Fields: INJ - Package Name, INJ - Package Price,
// INJ - Quantity, INJ - Used, INJ - Balance
// ============================================

export async function syncInjectionProtocolCreated(contactId, protocol, patientName) {
  if (!contactId) return;
  
  const packageName = protocol.program_name || '';
  const totalSessions = protocol.total_sessions || 0;
  const medication = protocol.medication || '';
  const price = protocol.price || '';
  
  await updateGHLContact(contactId, {
    'contact.inj__package_name': packageName,
    'contact.inj__package_price': price ? String(price) : '',
    'contact.inj__quantity': String(totalSessions),
    'contact.inj__used': '0',
    'contact.inj__balance': String(totalSessions)
  });
  
  const note = `🟢 INJECTION PACKAGE STARTED

Package: ${packageName}
Medication: ${medication}
Sessions: ${totalSessions}`;
  
  await addGHLNote(contactId, note);
}

export async function syncInjectionSessionLogged(contactId, protocol, patientName) {
  if (!contactId) return;
  
  const sessionsUsed = protocol.sessions_used || 0;
  const totalSessions = protocol.total_sessions || 0;
  const sessionsRemaining = totalSessions - sessionsUsed;
  
  await updateGHLContact(contactId, {
    'contact.inj__used': String(sessionsUsed),
    'contact.inj__balance': String(sessionsRemaining)
  });
  
  let note = `💉 INJECTION SESSION LOGGED

Session: ${sessionsUsed}/${totalSessions}
Remaining: ${sessionsRemaining}`;
  
  if (sessionsRemaining === 0) {
    note += `\n\n✅ PACKAGE COMPLETE`;
  }
  
  await addGHLNote(contactId, note);
}

// ============================================
// HBOT SYNC
// GHL Fields: HBOT - Package Name, HBOT - New Package Start Date,
// HBOT - Sessions In Package, HBOT - Completed Sessions, HBOT - Sessions Remaining
// ============================================

export async function syncHBOTPackageCreated(contactId, protocol, patientName) {
  if (!contactId) return;
  
  const packageName = protocol.program_name || '';
  const totalSessions = protocol.total_sessions || 0;
  const startDate = protocol.start_date || new Date().toISOString().split('T')[0];
  
  await updateGHLContact(contactId, {
    'contact.hbot__package_name': packageName,
    'contact.hbot__new_package_start_date': startDate,
    'contact.hbot__sessions_in_package': String(totalSessions),
    'contact.hbot__completed_sessions': '0',
    'contact.hbot__sessions_remaining': String(totalSessions)
  });
  
  const note = `🟢 HBOT PACKAGE STARTED

Package: ${packageName}
Sessions: ${totalSessions}
Start Date: ${startDate}`;
  
  await addGHLNote(contactId, note);
}

export async function syncHBOTSessionLogged(contactId, protocol, patientName) {
  if (!contactId) return;
  
  const sessionsUsed = protocol.sessions_used || 0;
  const totalSessions = protocol.total_sessions || 0;
  const sessionsRemaining = totalSessions - sessionsUsed;
  
  await updateGHLContact(contactId, {
    'contact.hbot__completed_sessions': String(sessionsUsed),
    'contact.hbot__sessions_remaining': String(sessionsRemaining)
  });
  
  let note = `🫧 HBOT SESSION LOGGED

Session: ${sessionsUsed}/${totalSessions}
Remaining: ${sessionsRemaining}`;
  
  if (sessionsRemaining === 0) {
    note += `\n\n✅ PACKAGE COMPLETE`;
  }
  
  await addGHLNote(contactId, note);
}

// ============================================
// RED LIGHT THERAPY SYNC
// GHL Fields: RLT - Package Name, RLT - New Package Start Date,
// RLT - Sessions In Package, RLT - Completed Sessions, RLT - Sessions Remaining
// ============================================

export async function syncRLTPackageCreated(contactId, protocol, patientName) {
  if (!contactId) return;
  
  const packageName = protocol.program_name || '';
  const totalSessions = protocol.total_sessions || 0;
  const startDate = protocol.start_date || new Date().toISOString().split('T')[0];
  
  await updateGHLContact(contactId, {
    'contact.package_name': packageName, // RLT uses different key format
    'contact.rlt__new_package_start_date': startDate,
    'contact.rlt__sessions_in_package': String(totalSessions),
    'contact.rlt__sessions_used': '0',
    'contact.sessions_remaining': String(totalSessions)
  });
  
  const note = `🟢 RED LIGHT THERAPY PACKAGE STARTED

Package: ${packageName}
Sessions: ${totalSessions}
Start Date: ${startDate}`;
  
  await addGHLNote(contactId, note);
}

export async function syncRLTSessionLogged(contactId, protocol, patientName) {
  if (!contactId) return;
  
  const sessionsUsed = protocol.sessions_used || 0;
  const totalSessions = protocol.total_sessions || 0;
  const sessionsRemaining = totalSessions - sessionsUsed;
  
  await updateGHLContact(contactId, {
    'contact.rlt__sessions_used': String(sessionsUsed),
    'contact.sessions_remaining': String(sessionsRemaining)
  });
  
  let note = `🔴 RED LIGHT SESSION LOGGED

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

// ============================================
// HELPER: Determine sync function based on protocol type
// ============================================

export async function syncProtocolToGHL(contactId, protocol, patientName, action = 'created') {
  if (!contactId) return;
  
  const programType = (protocol.program_type || '').toLowerCase();
  const programName = (protocol.program_name || '').toLowerCase();
  
  if (action === 'created') {
    if (programType === 'weight_loss' || programName.includes('weight loss')) {
      await syncWeightLossProtocolCreated(contactId, protocol, patientName);
    } else if (programType === 'peptide' || programName.includes('peptide')) {
      await syncPeptideProtocolCreated(contactId, protocol, patientName);
    } else if (programType === 'hrt' || programName.includes('hrt')) {
      await syncHRTProtocolCreated(contactId, protocol, patientName);
    } else if (programType === 'iv_therapy' || programName.includes('iv')) {
      await syncIVPackageCreated(contactId, protocol, patientName);
    } else if (programType === 'hbot' || programName.includes('hbot') || programName.includes('hyperbaric')) {
      await syncHBOTPackageCreated(contactId, protocol, patientName);
    } else if (programType === 'red_light' || programName.includes('red light') || programName.includes('rlt')) {
      await syncRLTPackageCreated(contactId, protocol, patientName);
    } else if (programType === 'injection' || protocol.total_sessions) {
      await syncInjectionProtocolCreated(contactId, protocol, patientName);
    } else {
      // Generic - use peptide format
      await syncPeptideProtocolCreated(contactId, protocol, patientName);
    }
  }
}

export async function syncSessionLogToGHL(contactId, protocol, log, patientName) {
  if (!contactId) return;
  
  const programType = (protocol.program_type || '').toLowerCase();
  const programName = (protocol.program_name || '').toLowerCase();
  
  if (programType === 'weight_loss' || programName.includes('weight loss')) {
    await syncWeightLossInjectionLogged(contactId, protocol, log, patientName);
  } else if (programType === 'iv_therapy' || programName.includes('iv')) {
    await syncIVSessionLogged(contactId, protocol, patientName);
  } else if (programType === 'hbot' || programName.includes('hbot') || programName.includes('hyperbaric')) {
    await syncHBOTSessionLogged(contactId, protocol, patientName);
  } else if (programType === 'red_light' || programName.includes('red light') || programName.includes('rlt')) {
    await syncRLTSessionLogged(contactId, protocol, patientName);
  } else {
    await syncInjectionSessionLogged(contactId, protocol, patientName);
  }
}
