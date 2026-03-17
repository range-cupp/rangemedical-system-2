// lib/lab-post-import.js
// Shared post-import actions run after each patient's labs are successfully imported.
// 1. Advances the lab protocol: blood_draw_complete → results_received
// 2. Creates "Review Labs" tasks for Evan and Dr. Burgess (clinical review)
// 3. Creates "Contact Patient" tasks for Tara and Damon (scheduling)

/**
 * Load all relevant staff IDs once per import batch.
 * Returns { evanId, burgessId, taraId, damonId } — any may be null if not found.
 */
export async function loadReviewerIds(supabase) {
  const { data } = await supabase
    .from('employees')
    .select('id, email')
    .in('email', [
      'evan@range-medical.com',
      'burgess@range-medical.com',
      'tara@range-medical.com',
      'damon@range-medical.com',
    ])
    .eq('is_active', true);

  const evanId    = data?.find(e => e.email === 'evan@range-medical.com')?.id    || null;
  const burgessId = data?.find(e => e.email === 'burgess@range-medical.com')?.id || null;
  const taraId    = data?.find(e => e.email === 'tara@range-medical.com')?.id    || null;
  const damonId   = data?.find(e => e.email === 'damon@range-medical.com')?.id   || null;
  return { evanId, burgessId, taraId, damonId };
}

/**
 * Run post-import actions for one patient whose labs were just imported.
 *
 * @param {object} supabase    - Supabase client
 * @param {string} patientId   - UUID of the patient
 * @param {string} patientName - Display name e.g. "Jamie Lewis"
 * @param {string} testDate    - YYYY-MM-DD of the lab collection date
 * @param {object} reviewerIds - { evanId, burgessId, taraId, damonId }
 */
export async function postImportActions(supabase, patientId, patientName, testDate, reviewerIds) {
  const { evanId, burgessId, taraId, damonId } = reviewerIds;

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

  const today = new Date();

  // ── 2. Clinical review tasks (Evan + Dr. Burgess) ──────────────────────────
  // Due in 2 business days — review results and flag out-of-range values
  const reviewDue = new Date(today);
  reviewDue.setDate(reviewDue.getDate() + 2);
  const reviewDueStr = reviewDue.toISOString().split('T')[0];

  const reviewTask = {
    title: `Review labs — ${patientName}`,
    description: `New lab results imported for ${patientName} (collected ${testDate}). Please review results, flag any out-of-range values, and advance the lab pipeline to "Provider Reviewed".`,
    patient_id: patientId,
    patient_name: patientName,
    priority: 'high',
    due_date: reviewDueStr,
    status: 'pending',
    category: 'labs',
  };

  const reviewTasks = [];
  if (evanId)    reviewTasks.push({ ...reviewTask, assigned_to: evanId,    assigned_by: evanId });
  if (burgessId) reviewTasks.push({ ...reviewTask, assigned_to: burgessId, assigned_by: burgessId });

  if (reviewTasks.length > 0) {
    try {
      await supabase.from('tasks').insert(reviewTasks);
    } catch (e) {
      console.error(`[lab-post-import] Review task creation error for ${patientName}:`, e.message);
    }
  }

  // ── 3. Scheduling tasks (Tara + Damon) ─────────────────────────────────────
  // Due tomorrow — contact the patient to schedule their results consult
  const schedDue = new Date(today);
  schedDue.setDate(schedDue.getDate() + 1);
  const schedDueStr = schedDue.toISOString().split('T')[0];

  const schedTask = {
    title: `📞 Contact ${patientName} — lab results ready`,
    description: `Lab results for ${patientName} (collected ${testDate}) have just been uploaded. Please reach out to schedule a results consult with the provider.`,
    patient_id: patientId,
    patient_name: patientName,
    priority: 'high',
    due_date: schedDueStr,
    status: 'pending',
    category: 'labs',
  };

  const schedTasks = [];
  if (taraId)  schedTasks.push({ ...schedTask, assigned_to: taraId,  assigned_by: taraId });
  if (damonId) schedTasks.push({ ...schedTask, assigned_to: damonId, assigned_by: damonId });

  if (schedTasks.length > 0) {
    try {
      await supabase.from('tasks').insert(schedTasks);
    } catch (e) {
      console.error(`[lab-post-import] Scheduling task creation error for ${patientName}:`, e.message);
    }
  }
}
