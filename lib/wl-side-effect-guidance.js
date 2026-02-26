// /lib/wl-side-effect-guidance.js
// Builds conversational side effect guidance for patient check-in SMS
// Content condensed from drip email series (Email 3, Day 2)
// Range Medical

const SIDE_EFFECT_GUIDANCE = {
  'Nausea': {
    label: 'nausea',
    guidance: 'Try eating smaller meals throughout the day, stay hydrated, and avoid greasy or fried foods. Ginger or mint tea can also help settle your stomach.',
    reassurance: 'This usually improves within the first few weeks as your body adjusts.'
  },
  'Fatigue': {
    label: 'fatigue',
    guidance: 'This is normal as your body adjusts to lower calorie intake. Make sure you\'re prioritizing protein with every meal and drinking plenty of water.',
    reassurance: 'Most patients find this levels out within 1-2 weeks.'
  },
  'Constipation': {
    label: 'constipation',
    guidance: 'Try increasing your water intake to 1.5-2 liters per day and gradually adding more fiber to your diet. Light walking can also help get things moving.',
    reassurance: 'If it persists beyond a week or two, reach out and we can help.'
  },
  'Indigestion': {
    label: 'indigestion',
    guidance: 'Eat slowly, stick to smaller portions, and avoid large or heavy meals. Bland, easy-to-digest foods tend to help.',
    reassurance: 'This usually resolves as your body adjusts to the medication.'
  },
  'Injection Site Pain': {
    label: 'injection site pain',
    guidance: 'Mild soreness after injection is normal. Try icing the area for about 10 minutes and make sure you\'re rotating injection sites each week.',
    reassurance: 'If you notice redness or swelling that lasts more than 48 hours, contact us.'
  }
};

const GENERIC_GUIDANCE = 'If anything feels off or you have questions about what you\'re experiencing, don\'t hesitate to reach out to us.';

/**
 * Build conversational side effect guidance for the check-in thank-you SMS.
 * Returns a ready-to-append string (with leading \n\n) or empty string.
 *
 * @param {string} firstName - Patient's first name
 * @param {string[]} sideEffects - Array of side effect values from the check-in form
 * @returns {string}
 */
function buildSideEffectGuidance(firstName, sideEffects) {
  if (!sideEffects || sideEffects.length === 0) return '';

  // Filter out "None" and build working list
  const effects = sideEffects.filter(e => e && e !== 'None');
  if (effects.length === 0) return '';

  // Separate known vs Other side effects
  const known = [];
  let hasOther = false;

  for (const effect of effects) {
    if (effect === 'Other' || effect.startsWith('Other:')) {
      hasOther = true;
    } else if (SIDE_EFFECT_GUIDANCE[effect]) {
      known.push(effect);
    } else {
      // Unrecognized value — treat like Other
      hasOther = true;
    }
  }

  // If only "Other" with no known side effects
  if (known.length === 0 && hasOther) {
    return `\n\nThanks for letting us know about that. ${GENERIC_GUIDANCE}`;
  }

  // If only "Other" was present and somehow no known effects
  if (known.length === 0) return '';

  const totalCount = known.length + (hasOther ? 1 : 0);
  let msg = '';

  if (totalCount === 1 && known.length === 1) {
    // Single known side effect
    const entry = SIDE_EFFECT_GUIDANCE[known[0]];
    msg = `You mentioned experiencing ${entry.label} — ${entry.guidance} ${entry.reassurance}`;
  } else if (totalCount === 2 && known.length >= 1) {
    // Two side effects
    const labels = known.map(k => SIDE_EFFECT_GUIDANCE[k].label);
    if (hasOther) labels.push('some other symptoms');
    msg = `You mentioned ${labels[0]} and ${labels[1]} — both are common.`;
    for (const k of known) {
      const entry = SIDE_EFFECT_GUIDANCE[k];
      msg += ` For the ${entry.label}: ${entry.guidance}`;
    }
    if (hasOther) {
      msg += ` ${GENERIC_GUIDANCE}`;
    }
    // Add reassurance from first known entry
    msg += ` ${SIDE_EFFECT_GUIDANCE[known[0]].reassurance}`;
  } else {
    // 3+ side effects
    const labels = known.map(k => SIDE_EFFECT_GUIDANCE[k].label);
    if (hasOther) labels.push('some other symptoms');
    const lastLabel = labels.pop();
    msg = `You mentioned ${labels.join(', ')}, and ${lastLabel} — let's go through each one.`;
    for (const k of known) {
      const entry = SIDE_EFFECT_GUIDANCE[k];
      msg += `\n\n${entry.label.charAt(0).toUpperCase() + entry.label.slice(1)}: ${entry.guidance} ${entry.reassurance}`;
    }
    if (hasOther) {
      msg += `\n\n${GENERIC_GUIDANCE}`;
    }
  }

  // Closing reassurance for multi-effect messages
  if (totalCount >= 2) {
    msg += `\n\nRemember, these side effects are common and usually improve as your body adjusts. We're here if you need us!`;
  }

  return `\n\n${msg}`;
}

module.exports = { buildSideEffectGuidance, SIDE_EFFECT_GUIDANCE };
