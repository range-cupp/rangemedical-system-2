// ============================================================
// Range Medical — GHL Phase 1 Setup Script
// Creates all pipelines, pipeline stages, and custom fields
// ============================================================
//
// INSTRUCTIONS:
// 1. Deploy this file to: /pages/api/admin/ghl-setup.js
// 2. Run it ONCE by visiting: https://rangemedical-system-2.vercel.app/api/admin/ghl-setup?secret=YOUR_ADMIN_SECRET
// 3. It will create everything and return a report of what was created
// 4. Save the output — it contains the IDs you'll need for all future API calls
// ============================================================

const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;
const BASE_URL = 'https://services.leadconnectorhq.com';

// Helper: make GHL API request
async function ghlRequest(method, endpoint, body = null) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${GHL_API_KEY}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28'
    }
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await res.json();

  if (!res.ok) {
    console.error(`GHL API Error [${method} ${endpoint}]:`, data);
    return { error: true, status: res.status, data };
  }
  return data;
}

// Helper: pause to avoid rate limits
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// CUSTOM FIELD DEFINITIONS
// ============================================================

const CUSTOM_FIELD_GROUPS = [
  {
    groupName: 'HRT Protocol',
    fields: [
      { name: 'HRT Medication', dataType: 'SINGLE_OPTIONS', options: ['Testosterone Cypionate', 'Testosterone Enanthate', 'Nandrolone'] },
      { name: 'HRT Dose', dataType: 'TEXT' },
      { name: 'Dose Per Injection', dataType: 'TEXT' },
      { name: 'Injections Per Week', dataType: 'SINGLE_OPTIONS', options: ['1', '2', '3'] },
      { name: 'Injection Days', dataType: 'SINGLE_OPTIONS', options: ['Mon/Thu', 'Tue/Fri', 'Mon/Wed/Fri'] },
      { name: 'HRT Delivery Method', dataType: 'SINGLE_OPTIONS', options: ['In Clinic', 'Take Home'] },
      { name: 'Vial Size', dataType: 'SINGLE_OPTIONS', options: ['5mL', '10mL'] },
      { name: 'HRT Start Date', dataType: 'DATE' },
      { name: 'HRT Status', dataType: 'SINGLE_OPTIONS', options: ['Active', 'Paused', 'Completed'] },
      { name: 'Next Lab Due', dataType: 'DATE' },
      { name: 'HRT Last Visit Date', dataType: 'DATE' },
      { name: 'HRT Next Expected Visit', dataType: 'DATE' },
      { name: 'HRT Reminders Enabled', dataType: 'SINGLE_OPTIONS', options: ['Yes', 'No'] },
      { name: 'HRT Reminder Schedule', dataType: 'SINGLE_OPTIONS', options: ['Mon/Thu', 'Tue/Fri'] },
      { name: 'HRT Notes', dataType: 'LARGE_TEXT' }
    ]
  },
  {
    groupName: 'Weight Loss Protocol',
    fields: [
      { name: 'WL Medication', dataType: 'SINGLE_OPTIONS', options: ['Semaglutide', 'Tirzepatide', 'Retatrutide'] },
      { name: 'WL Current Dose', dataType: 'TEXT' },
      { name: 'WL Frequency', dataType: 'SINGLE_OPTIONS', options: ['Weekly', 'Biweekly'] },
      { name: 'WL Delivery Method', dataType: 'SINGLE_OPTIONS', options: ['In Clinic', 'Take Home'] },
      { name: 'WL Start Date', dataType: 'DATE' },
      { name: 'WL Status', dataType: 'SINGLE_OPTIONS', options: ['Active', 'Paused', 'Completed'] },
      { name: 'Starting Weight', dataType: 'NUMERICAL' },
      { name: 'Current Weight', dataType: 'NUMERICAL' },
      { name: 'Goal Weight', dataType: 'NUMERICAL' },
      { name: 'Weight Lost', dataType: 'NUMERICAL' },
      { name: 'WL Last Injection Date', dataType: 'DATE' },
      { name: 'WL Next Expected Injection', dataType: 'DATE' },
      { name: 'WL Last Check-In Date', dataType: 'DATE' },
      { name: 'Days on Protocol', dataType: 'NUMERICAL' },
      { name: 'WL Sessions Used', dataType: 'NUMERICAL' },
      { name: 'WL Total Sessions', dataType: 'NUMERICAL' },
      { name: 'Drip Email Stage', dataType: 'SINGLE_OPTIONS', options: ['1', '2', '3', '4', 'Complete'] },
      { name: 'WL Notes', dataType: 'LARGE_TEXT' }
    ]
  },
  {
    groupName: 'Peptide Protocol',
    fields: [
      { name: 'Peptide Medication', dataType: 'TEXT' },
      { name: 'Peptide Category', dataType: 'SINGLE_OPTIONS', options: ['Recovery', 'Growth Hormone', 'Weight Loss', 'Immune', 'Cognitive', 'Sexual Health', 'Longevity', 'Sleep', 'Skin/Hair'] },
      { name: 'Peptide Dose', dataType: 'TEXT' },
      { name: 'Peptide Frequency', dataType: 'SINGLE_OPTIONS', options: ['Daily', '5 on/2 off', '3x/week', 'Weekly', 'Biweekly'] },
      { name: 'Peptide Delivery', dataType: 'SINGLE_OPTIONS', options: ['SubQ Injection', 'Oral', 'Nasal', 'IV', 'Topical'] },
      { name: 'Peptide Start Date', dataType: 'DATE' },
      { name: 'Peptide End Date', dataType: 'DATE' },
      { name: 'Peptide Status', dataType: 'SINGLE_OPTIONS', options: ['Active', 'Paused', 'Completed'] },
      { name: 'Peptide Supply Days', dataType: 'NUMERICAL' },
      { name: 'Peptide Last Visit', dataType: 'DATE' },
      { name: 'Peptide Next Expected', dataType: 'DATE' },
      { name: 'Peptide Notes', dataType: 'LARGE_TEXT' }
    ]
  },
  {
    groupName: 'Session Packages',
    fields: [
      { name: 'Package Type', dataType: 'SINGLE_OPTIONS', options: ['IV Therapy', 'HBOT', 'Red Light Therapy'] },
      { name: 'Package Name', dataType: 'TEXT' },
      { name: 'Total Sessions', dataType: 'NUMERICAL' },
      { name: 'Sessions Used', dataType: 'NUMERICAL' },
      { name: 'Sessions Remaining', dataType: 'NUMERICAL' },
      { name: 'Package Start Date', dataType: 'DATE' },
      { name: 'Package Expiration', dataType: 'DATE' },
      { name: 'Package Status', dataType: 'SINGLE_OPTIONS', options: ['Active', 'Completed', 'Expired'] },
      { name: 'Last Session Date', dataType: 'DATE' },
      { name: 'Package Notes', dataType: 'LARGE_TEXT' }
    ]
  },
  {
    groupName: 'Labs',
    fields: [
      { name: 'Lab Type', dataType: 'SINGLE_OPTIONS', options: ['Essential Panel', 'Elite Panel', 'Follow-Up', 'Hormone Panel', 'Metabolic Panel'] },
      { name: 'Lab Draw Date', dataType: 'DATE' },
      { name: 'Lab Results Date', dataType: 'DATE' },
      { name: 'Lab Reviewed Date', dataType: 'DATE' },
      { name: 'Lab Reviewer', dataType: 'TEXT' },
      { name: 'Lab Status', dataType: 'SINGLE_OPTIONS', options: ['Scheduled', 'Drawn', 'Results In', 'Reviewed'] },
      { name: 'Lab Notes', dataType: 'LARGE_TEXT' }
    ]
  },
  {
    groupName: 'Patient Onboarding',
    fields: [
      { name: 'Medical Intake Form', dataType: 'SINGLE_OPTIONS', options: ['Incomplete', 'Complete'] },
      { name: 'Blood Draw Consent', dataType: 'SINGLE_OPTIONS', options: ['Not Signed', 'Signed'] },
      { name: 'Treatment Consent', dataType: 'SINGLE_OPTIONS', options: ['Not Signed', 'Signed'] },
      { name: 'Patient Path', dataType: 'SINGLE_OPTIONS', options: ['Door 1 (Injury/Recovery)', 'Door 2 (Optimization)'] },
      { name: 'Referred From', dataType: 'SINGLE_OPTIONS', options: ['Range Sports Therapy', 'Website', 'Referral', 'Walk-In', 'Social Media', 'Google', 'Instagram', 'Other'] },
      { name: 'Intake PDF URL', dataType: 'TEXT' },
      { name: 'Photo ID URL', dataType: 'TEXT' },
      { name: 'Consent PDF URLs', dataType: 'LARGE_TEXT' }
    ]
  }
];

// ============================================================
// PIPELINE DEFINITIONS
// ============================================================

const PIPELINES = [
  {
    name: 'HRT Protocols',
    stages: [
      { name: 'New Patient - Labs Needed' },
      { name: 'Labs Scheduled' },
      { name: 'Labs Complete - Awaiting Review' },
      { name: 'Provider Reviewed' },
      { name: 'Consult Scheduled' },
      { name: 'Active - In Clinic' },
      { name: 'Active - Take Home' },
      { name: 'Due for Follow-Up Labs' },
      { name: 'Paused' },
      { name: 'Completed' }
    ]
  },
  {
    name: 'Weight Loss',
    stages: [
      { name: 'New - Intake Complete' },
      { name: 'Labs Needed' },
      { name: 'Labs Complete' },
      { name: 'Active - Week 1-4' },
      { name: 'Active - Maintenance' },
      { name: 'Due for Check-In' },
      { name: 'Overdue' },
      { name: 'Re-Up Needed' },
      { name: 'Paused' },
      { name: 'Completed' }
    ]
  },
  {
    name: 'Peptide Protocols',
    stages: [
      { name: 'New - Consultation' },
      { name: 'Active' },
      { name: 'Day 7 Follow-Up' },
      { name: 'Weekly Check-In Due' },
      { name: 'Re-Up Needed' },
      { name: 'Paused' },
      { name: 'Completed' }
    ]
  },
  {
    name: 'Session Packages',
    stages: [
      { name: 'Purchased' },
      { name: 'Active' },
      { name: 'Low Sessions' },
      { name: 'Completed' },
      { name: 'Expired' }
    ]
  },
  {
    name: 'Lab Pipeline',
    stages: [
      { name: 'Draw Scheduled' },
      { name: 'Draw Complete' },
      { name: 'Results In' },
      { name: 'Provider Reviewed' },
      { name: 'Consult Scheduled' },
      { name: 'Consult Complete' },
      { name: 'Treatment Started' }
    ]
  },
  {
    name: 'Patient Onboarding',
    stages: [
      { name: 'New Lead' },
      { name: 'Intake Complete' },
      { name: 'Consent Signed' },
      { name: 'Labs Ordered' },
      { name: 'Consult Booked' },
      { name: 'Active Patient' }
    ]
  }
];

// ============================================================
// MAIN HANDLER
// ============================================================

export default async function handler(req, res) {
  // Auth check
  const { secret } = req.query;
  const adminSecret = process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD;
  if (secret !== adminSecret) {
    return res.status(401).json({ error: 'Unauthorized. Pass ?secret=YOUR_ADMIN_SECRET' });
  }

  const report = {
    timestamp: new Date().toISOString(),
    customFields: { created: [], skipped: [], errors: [] },
    pipelines: { created: [], skipped: [], errors: [] },
    fieldIdMap: {},
    pipelineIdMap: {}
  };

  try {
    // STEP 1: Get existing custom fields
    console.log('Fetching existing custom fields...');
    const existingFields = await ghlRequest('GET', `/locations/${GHL_LOCATION_ID}/customFields`);
    const existingFieldNames = new Set();

    if (existingFields.customFields) {
      existingFields.customFields.forEach(f => {
        existingFieldNames.add(f.name.toLowerCase());
        report.fieldIdMap[f.name] = f.id;
      });
    }

    // STEP 2: Create custom fields
    console.log('Creating custom fields...');
    for (const group of CUSTOM_FIELD_GROUPS) {
      for (const field of group.fields) {
        if (existingFieldNames.has(field.name.toLowerCase())) {
          report.customFields.skipped.push(field.name);
          continue;
        }

        const body = {
          name: field.name,
          dataType: field.dataType,
          position: 0
        };

        if (field.options && field.options.length > 0) {
          body.options = field.options;
        }

        try {
          const result = await ghlRequest('POST', `/locations/${GHL_LOCATION_ID}/customFields`, body);
          if (result.error) {
            report.customFields.errors.push({ name: field.name, error: result.data });
          } else {
            const fieldId = result.customField?.id || result.id || 'unknown';
            report.customFields.created.push({ name: field.name, id: fieldId, dataType: field.dataType });
            report.fieldIdMap[field.name] = fieldId;
          }
        } catch (err) {
          report.customFields.errors.push({ name: field.name, error: err.message });
        }

        await delay(150);
      }
    }

    // STEP 3: Get existing pipelines
    console.log('Fetching existing pipelines...');
    const existingPipelines = await ghlRequest('GET', `/opportunities/pipelines?locationId=${GHL_LOCATION_ID}`);
    const existingPipelineNames = new Set();

    if (existingPipelines.pipelines) {
      existingPipelines.pipelines.forEach(p => {
        existingPipelineNames.add(p.name.toLowerCase());
        report.pipelineIdMap[p.name] = {
          id: p.id,
          stages: p.stages?.map(s => ({ name: s.name, id: s.id })) || []
        };
      });
    }

    // STEP 4: Create pipelines
    console.log('Creating pipelines...');
    for (const pipeline of PIPELINES) {
      if (existingPipelineNames.has(pipeline.name.toLowerCase())) {
        report.pipelines.skipped.push(pipeline.name);
        continue;
      }

      const body = {
        name: pipeline.name,
        stages: pipeline.stages.map((stage, index) => ({
          name: stage.name,
          position: index
        })),
        locationId: GHL_LOCATION_ID
      };

      try {
        const result = await ghlRequest('POST', `/opportunities/pipelines`, body);
        if (result.error) {
          report.pipelines.errors.push({ name: pipeline.name, error: result.data });
        } else {
          const pipelineId = result.pipeline?.id || result.id || 'unknown';
          const stages = result.pipeline?.stages || result.stages || [];
          report.pipelines.created.push({
            name: pipeline.name,
            id: pipelineId,
            stages: stages.map(s => ({ name: s.name, id: s.id }))
          });
          report.pipelineIdMap[pipeline.name] = {
            id: pipelineId,
            stages: stages.map(s => ({ name: s.name, id: s.id }))
          };
        }
      } catch (err) {
        report.pipelines.errors.push({ name: pipeline.name, error: err.message });
      }

      await delay(300);
    }

    // SUMMARY
    const summary = {
      customFields: {
        created: report.customFields.created.length,
        skipped: report.customFields.skipped.length,
        errors: report.customFields.errors.length
      },
      pipelines: {
        created: report.pipelines.created.length,
        skipped: report.pipelines.skipped.length,
        errors: report.pipelines.errors.length
      }
    };

    return res.status(200).json({ success: true, summary, report });

  } catch (error) {
    console.error('Setup failed:', error);
    return res.status(500).json({ success: false, error: error.message, report });
  }
}
