// components/TemplateMessages.js
// Predefined message templates for quick SMS sending
// Range Medical System V2

const TEMPLATES = [
  {
    category: 'Appointments',
    templates: [
      {
        label: 'Appointment Reminder',
        message: 'Hi {{name}}, just a reminder about your upcoming appointment at Range Medical. Please arrive 10 minutes early. If you need to reschedule, call us at (949) 438-3881.',
      },
      {
        label: 'Follow-up Scheduling',
        message: 'Hi {{name}}, it\'s time to schedule your follow-up visit at Range Medical. You can book online or call us at (949) 438-3881.',
      },
      {
        label: 'Check-In Request',
        message: 'Hi {{name}}, how are you feeling on your current protocol? Reply to this message or call (949) 438-3881 to let us know.',
      },
    ],
  },
  {
    category: 'Labs',
    templates: [
      {
        label: 'Lab Draw Reminder',
        message: 'Hi {{name}}, your lab work is due. Please schedule your blood draw at your earliest convenience. Book online or call (949) 438-3881.',
      },
      {
        label: 'Labs Ready',
        message: 'Hi {{name}}, your lab results are in! We\'ll review them and follow up with you shortly. Contact us at (949) 438-3881 with any questions.',
      },
    ],
  },
  {
    category: 'Protocols',
    templates: [
      {
        label: 'Protocol Started',
        message: 'Hi {{name}}, your protocol is now active! Remember to follow your dosing schedule as discussed. Contact us at (949) 438-3881 with any questions.',
      },
      {
        label: 'Renewal Reminder',
        message: 'Hi {{name}}, your current protocol is coming up for renewal. Let\'s discuss your results and next steps. Call (949) 438-3881 to schedule.',
      },
      {
        label: 'Medication Reminder',
        message: 'Hi {{name}}, just a friendly reminder about your medication schedule. If you\'re running low or have questions, reach out to us at (949) 438-3881.',
      },
    ],
  },
  {
    category: 'General',
    templates: [
      {
        label: 'Welcome',
        message: 'Welcome to Range Medical, {{name}}! We\'re excited to start your health optimization journey. Reach us anytime at (949) 438-3881.',
      },
      {
        label: 'Thank You',
        message: 'Thanks for visiting Range Medical today, {{name}}! If you have any questions about your visit, don\'t hesitate to reach out at (949) 438-3881.',
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
        <span style={styles.headerTitle}>Message Templates</span>
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
    maxHeight: '250px',
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
