// lib/lab-post-import.js
// Shared post-import actions run after each patient's labs are successfully imported.
// 1. Advances the lab protocol: blood_draw_complete → results_received
// 2. Creates "Review Labs" tasks for Evan and Dr. Burgess

/**
 * Load the reviewer employee IDs once per import batch.
 * Returns { evanId, burgessId } — either may be null if not found.
 */
export async function loadReviewerIds(supabase) {
  const { data } = await supabase
    .from('employees')
    .select('id, email')
    .in('email', ['evan@range-medical.com', 'burgess@range-medical.com'])
    .eq('is_active', true);

  const evanId    = data?.find(e => e.email === 'evan@range-medical.com')?.id    || null;
  const burgessId = data?.find(e => e.email === 'burgess@range-medical.com')?.id || null;
  return { evanId, burgessId };
}

/**
 * Run post-import actions for one patient whose labs were just imported.
 *
 * @param {object} supabase  - Supabase client
 * @param {string} patientId - UUID of the patient
 * @param {string} patientName - Display name e.g. "Jamie Lewis"
 * @param {string} testDate  - YYYY-MM-DD of the lab collection date
 * @param {object} reviewerIds - { evanId, burgessId } from loadReviewerIds()
 */
export async function postImportActions(supabase, patientId, patientName, testDate, reviewerIds) {
  const { evanId, burgessId } = reviewerIds;

  // ── 1. Advance lab protocol ─────────────────────────────────────────────────
  // If the patient has a lab protocol stuck at blood_draw_complete, move it to
  // results_received now that labs are in the system.
  try {
    const { data: proto } = await supabase
      .from('protocols')
      .select('id, status')
      .eq('patient_id', patientId)
      .eq('program_type', 'labs')
      .in('status', ['blood_draw_complete', 'ordered', 'draw_scheduled'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (proto) {
      await supabase
        .from('protocols')
        .update({ status: 'results_received', updated_at: new Date().toISOString() })
        .eq('id', proto.id);
    }
  } catch (e) {
    console.error(`[lab-post-import] Protocol advance error for ${patientName}:`, e.message);
  }

  // ── 2. Create review tasks ──────────────────────────────────────────────────
  // Due in 2 business days from today
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 2);
  const dueDateStr = dueDate.toISOString().split('T')[0];

  const taskBase = {
    title: `Review labs — ${patientName}`,
    description: `New Primex/lab results are available for ${patientName} (collected ${testDate}). Please review results, flag any out-of-range values, and advance the lab pipeline.`,
    patient_id: patientId,
    patient_name: patientName,
    priority: 'high',
    due_date: dueDateStr,
    status: 'pending',
  };

  const tasks = [];
  if (evanId)    tasks.push({ ...taskBase, assigned_to: evanId,    assigned_by: evanId });
  if (burgessId) tasks.push({ ...taskBase, assigned_to: burgessId, assigned_by: burgessId });

  if (tasks.length > 0) {
    try {
      await supabase.from('tasks').insert(tasks);
    } catch (e) {
      console.error(`[lab-post-import] Task creation error for ${patientName}:`, e.message);
    }
  }
}
