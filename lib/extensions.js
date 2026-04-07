// lib/extensions.js
// Extension directory for Range Medical phone system
// Grandstream phones use SIP transfers to dial extensions
// Cell extensions allow transferring calls to staff mobile phones

const EXTENSIONS = {
  // Grandstream SIP phones
  '101': { type: 'sip', name: 'Front Desk 1', sip: 'sip:frontdesk1@rangemedical.sip.twilio.com' },
  '102': { type: 'sip', name: 'Front Desk 2', sip: 'sip:frontdesk2@rangemedical.sip.twilio.com' },
  '103': { type: 'sip', name: 'Nursing Station', sip: 'sip:nursing@rangemedical.sip.twilio.com' },
  // Cell phone extensions
  '333': { type: 'phone', name: 'Chris Cupp', number: '+19496900339' },
  '334': { type: 'phone', name: 'Damien Burgess', number: '+17146187880' },
  '335': { type: 'phone', name: 'Lily Diaz', number: '+19494244679' },
  '336': { type: 'phone', name: 'Evan Riederich', number: '+17147937031' },
};

// SIP endpoints to ring simultaneously on incoming calls
const ALL_SIP_ENDPOINTS = [
  'sip:frontdesk1@rangemedical.sip.twilio.com',
  'sip:frontdesk2@rangemedical.sip.twilio.com',
  'sip:nursing@rangemedical.sip.twilio.com',
];

module.exports = { EXTENSIONS, ALL_SIP_ENDPOINTS };
