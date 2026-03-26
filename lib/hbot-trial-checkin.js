// lib/hbot-trial-checkin.js
// Check-in recommendation engine for HBOT trial
// Computes pre vs post survey deltas and returns next-step recommendation
// Range Medical

/**
 * Generate a recommendation based on HBOT trial data
 *
 * @param {Object} params
 * @param {Object} params.preSurvey   - { brain_fog, headaches, recovery, sleep, mood }
 * @param {Object} params.postSurvey  - { brain_fog, headaches, recovery, sleep, mood, noticed_notes }
 * @param {number} params.importance  - importance_1_10 from initial qualification
 * @param {number} params.sessionsUsed
 * @param {boolean} params.wantsFix   - want_fix_90d from pre-survey
 * @returns {{ recommendation: string, reasoning: string, deltas: Object, suggestedProducts: string[] }}
 */
export function generateHBOTTrialRecommendation({ preSurvey, postSurvey, importance, sessionsUsed, wantsFix }) {
  // Compute deltas
  // brain_fog: reduction = better (pre - post > 0 = improvement)
  // headaches: reduction = better (pre - post > 0 = improvement)
  // recovery: increase = better (post - pre > 0 = improvement)
  // sleep: increase = better (post - pre > 0 = improvement)
  // mood: increase = better (post - pre > 0 = improvement)
  const deltas = {};
  const reductionFields = ['brain_fog', 'headaches'];
  const improvementFields = ['recovery', 'sleep', 'mood'];

  let totalImprovement = 0;

  for (const field of reductionFields) {
    const pre = preSurvey?.[field] ?? 5;
    const post = postSurvey?.[field] ?? pre;
    deltas[field] = pre - post; // positive = went down = got better
    if (deltas[field] > 0) totalImprovement += deltas[field];
  }

  for (const field of improvementFields) {
    const pre = preSurvey?.[field] ?? 5;
    const post = postSurvey?.[field] ?? pre;
    deltas[field] = post - pre; // positive = went up = got better
    if (deltas[field] > 0) totalImprovement += deltas[field];
  }

  const anyDeltaPositive = Object.values(deltas).some(d => d >= 1);
  const highImportance = (importance || 0) >= 8;

  // Decision logic
  // Path 1: "Deep Plan" (assessment_program) — high importance OR wants fix, AND any delta >= 1
  if ((highImportance || wantsFix) && anyDeltaPositive) {
    return {
      recommendation: 'assessment_program',
      reasoning: `${highImportance ? `High urgency (${importance}/10)` : 'Wants to fix in 90 days'} and saw improvement in ${Object.entries(deltas).filter(([, d]) => d >= 1).map(([k]) => k.replace('_', ' ')).join(', ')}. Good candidate for Range Assessment and a Brain & Recovery program.`,
      deltas,
      suggestedProducts: ['Range Assessment', 'Brain & Recovery Program'],
    };
  }

  // Path 2: "HBOT Only" (hbot_membership) — any positive delta OR 3+ sessions, doesn't meet Deep Plan
  if (anyDeltaPositive || sessionsUsed >= 3) {
    return {
      recommendation: 'hbot_membership',
      reasoning: `${anyDeltaPositive ? 'Noticed improvement' : 'Completed all sessions'} but doesn't meet full assessment criteria. Offer HBOT membership or 10-pack.`,
      deltas,
      suggestedProducts: ['HBOT Membership', 'HBOT 10-Pack'],
    };
  }

  // Path 3: "Nurture" — fallback
  return {
    recommendation: 'nurture',
    reasoning: `Low engagement (${sessionsUsed} sessions) or no measurable improvement. Add to long-term nurture list.`,
    deltas,
    suggestedProducts: [],
  };
}
