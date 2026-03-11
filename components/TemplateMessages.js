// components/TemplateMessages.js
// Predefined message templates (snippets) for quick SMS sending
// Range Medical System V2

const TEMPLATES = [
  {
    category: 'Labs',
    templates: [
      {
        label: 'Labs Are In',
        message: 'Hi {{name}}, great news — your lab results are in! We\'re reviewing everything now and will be reaching out to schedule your lab review. If you\'d like to get ahead of it, you can book directly at (949) 997-3988.',
      },
      {
        label: 'Lab Review Ready to Book',
        message: 'Hi {{name}}, we\'ve finished reviewing your labs and are ready to go over the results with you. Call us at (949) 997-3988 or reply here to schedule your lab review.',
      },
      {
        label: 'Lab Draw Reminder',
        message: 'Hi {{name}}, just a reminder that your lab work is due. Please come in for your blood draw at your earliest convenience — no appointment needed for draws. Questions? Call (949) 997-3988.',
      },
      {
        label: 'Follow-Up Labs Due',
        message: 'Hi {{name}}, it\'s time for your follow-up labs so we can check your progress and make any adjustments. Walk-ins are welcome for blood draws, or call (949) 997-3988 to schedule.',
      },
      {
        label: 'Fasting Reminder',
        message: 'Hi {{name}}, just a reminder to fast for 8-12 hours before your blood draw (water is fine). This ensures the most accurate results. See you soon!',
      },
    ],
  },
  {
    category: 'Appointments',
    templates: [
      {
        label: 'Appointment Reminder',
        message: 'Hi {{name}}, just a reminder about your upcoming appointment at Range Medical. Please arrive 10 minutes early. If you need to reschedule, call us at (949) 997-3988.',
      },
      {
        label: 'Schedule Follow-Up',
        message: 'Hi {{name}}, it\'s time to schedule your follow-up visit at Range Medical. Call us at (949) 997-3988 or reply here and we\'ll get you on the books.',
      },
      {
        label: 'Missed Appointment',
        message: 'Hi {{name}}, we missed you at your appointment today. No worries — let us know when you\'d like to reschedule. Call (949) 997-3988 or reply here.',
      },
      {
        label: 'Running Behind',
        message: 'Hi {{name}}, we\'re running a few minutes behind today. We apologize for the wait and will be with you as soon as possible. Thank you for your patience!',
      },
    ],
  },
  {
    category: 'Protocols',
    templates: [
      {
        label: 'Protocol Started',
        message: 'Hi {{name}}, your protocol is now active! Remember to follow your dosing schedule as discussed. Contact us at (949) 997-3988 with any questions.',
      },
      {
        label: 'Injection Reminder',
        message: 'Hi {{name}}, just a friendly reminder to come in for your injection this week. Walk-ins are welcome during clinic hours, or call (949) 997-3988 to schedule.',
      },
      {
        label: 'Renewal Coming Up',
        message: 'Hi {{name}}, your current protocol is coming up for renewal. Let\'s review your progress and plan your next steps. Call (949) 997-3988 or reply here to schedule.',
      },
      {
        label: 'Pickup Ready',
        message: 'Hi {{name}}, your medication is ready for pickup at Range Medical. Stop by during clinic hours at your convenience. Call (949) 997-3988 with any questions.',
      },
      {
        label: 'How Are You Feeling?',
        message: 'Hi {{name}}, just checking in — how are you feeling on your current protocol? Any side effects or concerns? Reply here or call us at (949) 997-3988.',
      },
      {
        label: 'Dose Adjustment',
        message: 'Hi {{name}}, based on your progress, we\'d like to discuss a dose adjustment. Please call (949) 997-3988 or reply here so we can go over the details.',
      },
    ],
  },
  {
    category: 'Weight Loss',
    templates: [
      {
        label: 'Weigh-In Reminder',
        message: 'Hi {{name}}, just a reminder to come in for your weekly weigh-in and injection. Tracking your progress consistently helps us optimize your results. See you soon!',
      },
      {
        label: 'Weight Loss Check-In',
        message: 'Hi {{name}}, how\'s everything going with your weight loss program? Any changes in appetite, energy, or side effects? Reply here or call (949) 997-3988 to let us know.',
      },
      {
        label: 'Great Progress',
        message: 'Hi {{name}}, just wanted to say you\'re making great progress! Keep up the momentum and don\'t hesitate to reach out if you have any questions. We\'re here for you!',
      },
    ],
  },
  {
    category: 'IV & Therapies',
    templates: [
      {
        label: 'IV Session Reminder',
        message: 'Hi {{name}}, just a reminder about your IV session at Range Medical. Please make sure you\'re well hydrated beforehand. See you soon!',
      },
      {
        label: 'HBOT Session Reminder',
        message: 'Hi {{name}}, just a reminder about your hyperbaric oxygen therapy session. Please wear comfortable clothing and arrive a few minutes early. See you soon!',
      },
      {
        label: 'Therapy Package Update',
        message: 'Hi {{name}}, you\'re making great progress with your sessions. You have remaining sessions on your package — let us know if you\'d like to schedule your next one. Call (949) 997-3988.',
      },
    ],
  },
  {
    category: 'New Patients',
    templates: [
      {
        label: 'Welcome',
        message: 'Welcome to Range Medical, {{name}}! We\'re excited to start your health optimization journey. If you have any questions before your first visit, don\'t hesitate to reach out at (949) 997-3988.',
      },
      {
        label: 'Intake Forms Reminder',
        message: 'Hi {{name}}, just a reminder to complete your intake forms before your upcoming visit. This helps us make the most of your appointment time. Let us know if you have any questions!',
      },
      {
        label: 'After First Visit',
        message: 'Hi {{name}}, it was great meeting you today! We\'re looking forward to helping you reach your health goals. Don\'t hesitate to reach out with any questions — (949) 997-3988.',
      },
      {
        label: 'Referral Thank You',
        message: 'Hi {{name}}, thank you so much for referring a friend to Range Medical! We truly appreciate your trust in us. It means the world to our team.',
      },
    ],
  },
  {
    category: 'Reviews & Referrals',
    templates: [
      {
        label: 'Google Review Request',
        message: 'Hi {{name}}, thank you for choosing Range Medical! If you\'ve had a great experience, we\'d really appreciate a Google review — it helps others find us and means a lot to our team: https://g.page/r/CR-a12vKevOkEAE/review',
      },
      {
        label: 'Post-Visit Review',
        message: 'Hi {{name}}, thanks for coming in today! If you have a moment, a quick Google review would mean a lot to us: https://g.page/r/CR-a12vKevOkEAE/review — thank you!',
      },
      {
        label: 'Referral Request',
        message: 'Hi {{name}}, if you know anyone who could benefit from what we do at Range Medical — hormone optimization, peptides, weight loss, IVs — we\'d love to help them too. Referrals are the best compliment we can receive!',
      },
    ],
  },
  {
    category: 'Payments & Billing',
    templates: [
      {
        label: 'Payment Reminder',
        message: 'Hi {{name}}, just a friendly reminder that you have an outstanding balance at Range Medical. Please call (949) 997-3988 or reply here to take care of it at your convenience.',
      },
      {
        label: 'Payment Received',
        message: 'Hi {{name}}, we\'ve received your payment — thank you! If you have any questions about your account, feel free to reach out at (949) 997-3988.',
      },
    ],
  },
  {
    category: 'Re-Engagement',
    templates: [
      {
        label: 'We Miss You',
        message: 'Hi {{name}}, it\'s been a while since your last visit to Range Medical. We\'d love to see how you\'re doing and help you stay on track. Call (949) 997-3988 or reply here to schedule.',
      },
      {
        label: 'New Services Available',
        message: 'Hi {{name}}, we\'ve added some exciting new services at Range Medical and thought of you. Call (949) 997-3988 or reply here to learn more — we\'d love to catch up!',
      },
      {
        label: 'Seasonal Check-In',
        message: 'Hi {{name}}, new season, new goals! It\'s a great time to check in on your health and optimize for the months ahead. Let us know if you\'d like to schedule a visit — (949) 997-3988.',
      },
    ],
  },
  {
    category: 'Quick Replies',
    templates: [
      {
        label: 'Confirm Received',
        message: 'Got it, {{name}} — thank you! We\'ll follow up with you shortly.',
      },
      {
        label: 'Clinic Hours',
        message: 'Our clinic hours are Monday–Friday 9 AM – 5 PM. Walk-ins are welcome for injections and blood draws. Call (949) 997-3988 if you need anything!',
      },
      {
        label: 'Directions',
        message: 'We\'re located at 1401 Avocado Ave, Suite 603, Newport Beach, CA 92660. There\'s plenty of free parking in the building lot. See you soon!',
      },
      {
        label: 'Custom Message',
        message: '',
      },
    ],
  },
];

export default function TemplateMessages({ onSelect, onClose }) {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.headerTitle}>Message Snippets</span>
        <button onClick={onClose} style={styles.closeBtn}>✕</button>
      </div>
      <div style={styles.body}>
        {TEMPLATES.map((group) => (
          <div key={group.category} style={styles.group}>
            <div style={styles.groupLabel}>{group.category}</div>
            {group.templates.map((tmpl) => (
              <button
                key={tmpl.label}
                onClick={() => onSelect(tmpl.message)}
                style={styles.templateBtn}
              >
                <div style={styles.templateLabel}>{tmpl.label}</div>
                {tmpl.message && (
                  <div style={styles.templatePreview}>
                    {tmpl.message.length > 80 ? tmpl.message.substring(0, 80) + '...' : tmpl.message}
                  </div>
                )}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    borderTop: '1px solid #e5e5e5',
    background: '#fff',
    maxHeight: '300px',
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 16px',
    borderBottom: '1px solid #f0f0f0',
    position: 'sticky',
    top: 0,
    background: '#fff',
    zIndex: 1,
  },
  headerTitle: {
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#666',
    letterSpacing: '0.3px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '14px',
    cursor: 'pointer',
    color: '#999',
    padding: '4px',
  },
  body: {
    padding: '8px 12px',
  },
  group: {
    marginBottom: '12px',
  },
  groupLabel: {
    fontSize: '10px',
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#999',
    padding: '4px 4px',
    letterSpacing: '0.4px',
  },
  templateBtn: {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '8px 10px',
    border: '1px solid #f0f0f0',
    borderRadius: '8px',
    background: '#fafafa',
    cursor: 'pointer',
    marginBottom: '4px',
    transition: 'background 0.15s',
  },
  templateLabel: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#333',
  },
  templatePreview: {
    fontSize: '11px',
    color: '#999',
    marginTop: '2px',
    lineHeight: '1.3',
  },
};
