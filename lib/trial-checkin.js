// lib/trial-checkin.js
// Check-in recommendation engine for RLT trial
// Computes pre vs post survey deltas and returns next-step recommendation
// Range Medical

/**
 * Generate a recommendation based on trial data
 *
 * @param {Object} params
 * @param {Object} params.preSurvey   - { energy, brain_fog, recovery, sleep, stress }
 * @param {Object} params.postSurvey  - { energy, brain_fog, recovery, sleep, stress, noticed_notes }
 * @param {number} params.importance  - importance_1_10 from initial DM qualification
 * @param {number} params.sessionsUsed
 * @returns {{ recommendation: string, reasoning: string, deltas: Object, suggestedProducts: string[] }}
 */
export function generateTrialRecommendation({ preSurvey, postSurvey, importance, sessionsUsed }) {
  // Compute deltas (positive = improvement for energy/recovery/sleep, negative = improvement for brain_fog/stress)
  const deltas = {};
  const improvementFields = ['energy', 'recovery', 'sleep'];
  const reductionFields = ['brain_fog', 'stress'];

  let totalImprovement = 0;

  for (const field of improvementFields) {
    const pre = preSurvey?.[field] ?? 5;
    const post = postSurvey?.[field] ?? pre;
    deltas[field] = post - pre; // positive = got better
    if (deltas[field] > 0) totalImprovement += deltas[field];
  }

  for (const field of reductionFields) {
    const pre = preSurvey?.[field] ?? 5;
    const post = postSurvey?.[field] ?? pre;
    deltas[field] = pre - post; // positive = went down = got better
    if (deltas[field] > 0) totalImprovement += deltas[field];
  }

  const anyDeltaPositive = Object.values(deltas).some(d => d >= 1);
  const significantImprovement = totalImprovement >= 3;
  const highImportance = (importance || 0) >= 8;
  const wantsLabs = preSurvey?.labs_past_12mo === false;
  const wantsFix = preSurvey?.want_fix_90d === true;

  // Decision logic
  // Path 1: High importance + any improvement → Assessment + program
  if (highImportance && anyDeltaPositive) {
    return {
      recommendation: 'assessment_program',
      reasoning: `High urgency (${importance}/10) and saw improvement in ${Object.entries(deltas).filter(([, d]) => d >= 1).map(([k]) => k).join(', ')}. Good candidate for Range Assessment and a 6-week energy or recovery plan.`,
      deltas,
      suggestedProducts: ['Range Assessment', 'Cellular Energy Program', 'Recovery Program'],
    };
  }

  // Path 2: Significant improvement + wants to fix in 90 days → Assessment
  if (significantImprovement && wantsFix) {
    return {
      recommendation: 'assessment_program',
      reasoning: `Total improvement of ${totalImprovement} points across metrics and wants to fix in 90 days. Recommend full assessment.`,
      deltas,
      suggestedProducts: ['Range Assessment', 'Cellular Energy Program'],
    };
  }

  // Path 3: Liked the bed, some improvement but doesn't want labs → Membership or pack
  if (anyDeltaPositive || sessionsUsed >= 3) {
    return {
      recommendation: 'membership',
      reasoning: `Showed interest with ${sessionsUsed} sessions. ${anyDeltaPositive ? 'Some improvement noticed.' : 'No measurable improvement yet but engaged.'} Offer RLT Membership or 10-pack.`,
      deltas,
      suggestedProducts: ['RLT Membership ($399/mo)', 'RLT 10-Pack ($600)'],
    };
  }

  // Path 4: No improvement or low engagement → Nurture
  return {
    recommendation: 'nurture',
    reasoning: `Low engagement (${sessionsUsed} sessions) or no measurable improvement. Add to long-term nurture list.`,
    deltas,
    suggestedProducts: [],
  };
}
