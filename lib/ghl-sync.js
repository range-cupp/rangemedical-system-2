
// Add these functions to lib/ghl-sync.js

/**
 * Sync HBOT package creation to GHL
 */
export async function syncHBOTPackageCreated(contactId, protocol, patientName) {
  const packageName = protocol.program_name || 'HBOT Package';
  const totalSessions = protocol.total_sessions || 1;
  const sessionsUsed = protocol.sessions_used || 0;
  const sessionsRemaining = totalSessions - sessionsUsed;

  // Update GHL custom fields
  await updateGHLContact(contactId, {
    'hbot_package_name': packageName,
    'hbot_new_package_start_date': protocol.start_date,
    'hbot_sessions_in_package': totalSessions,
    'hbot_completed_sessions': sessionsUsed,
    'hbot_sessions_remaining': sessionsRemaining
  });

  // Add timeline note
  await addGHLNote(contactId, `🫁 HBOT PACKAGE STARTED

Package: ${packageName}
Sessions: ${totalSessions}
Start Date: ${protocol.start_date}
${protocol.notes ? '\nNotes: ' + protocol.notes : ''}`);

  console.log(`✓ HBOT package synced to GHL for ${patientName}`);
}

/**
 * Sync Red Light Therapy package creation to GHL
 */
export async function syncRLTPackageCreated(contactId, protocol, patientName) {
  const packageName = protocol.program_name || 'Red Light Therapy Package';
  const totalSessions = protocol.total_sessions || 1;
  const sessionsUsed = protocol.sessions_used || 0;
  const sessionsRemaining = totalSessions - sessionsUsed;

  // Update GHL custom fields
  await updateGHLContact(contactId, {
    'rlt_package_name': packageName,
    'rlt_new_package_start_date': protocol.start_date,
    'rlt_sessions_in_package': totalSessions,
    'rlt_completed_sessions': sessionsUsed,
    'rlt_sessions_remaining': sessionsRemaining
  });

  // Add timeline note
  await addGHLNote(contactId, `🔴 RED LIGHT THERAPY PACKAGE STARTED

Package: ${packageName}
Sessions: ${totalSessions}
Start Date: ${protocol.start_date}
${protocol.notes ? '\nNotes: ' + protocol.notes : ''}`);

  console.log(`✓ RLT package synced to GHL for ${patientName}`);
}
