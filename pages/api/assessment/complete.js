import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID || 'WICdvbXmTjQORW6GiHWW';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { leadId, assessmentPath, formData, intakeData, recommendation } = req.body;

    if (!leadId || !assessmentPath || !formData || !intakeData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { firstName, lastName, email, phone } = formData;

    // 1. Update assessment_leads with intake data
    if (supabase) {
      const updateData = {
        intake_completed_at: new Date().toISOString(),
        intake_status: 'completed',
        medical_history: intakeData.medicalHistory || null,
        medications: intakeData.medications || null,
        allergies: intakeData.noKnownAllergies ? { none: true } : { text: intakeData.knownAllergiesText || '' },
        surgical_history: intakeData.surgicalHistory || null,
        emergency_contact_name: intakeData.emergencyContactName || null,
        emergency_contact_phone: intakeData.emergencyContactPhone || null,
        emergency_contact_relationship: intakeData.emergencyContactRelationship || null,
        current_medications_text: intakeData.currentMedicationsText || null,
        known_allergies_text: intakeData.knownAllergiesText || null,
        no_known_allergies: !!intakeData.noKnownAllergies,
        diagnosed_conditions_text: intakeData.diagnosedConditionsText || null,
        recommended_panel: recommendation?.panel || null,
        recommended_peptides: assessmentPath === 'injury' ? { bpc157: true, tb4: true } : null,
      };

      const { error: updateError } = await supabase
        .from('assessment_leads')
        .update(updateData)
        .eq('id', leadId);

      if (updateError) {
        console.error('Supabase update error:', updateError);
      }
    }

    // 2. Generate PDF
    let pdfUrl = null;
    try {
      const pdfBytes = await generateAssessmentPDF({
        firstName, lastName, email, phone,
        assessmentPath, formData, intakeData, recommendation
      });

      // Upload to Supabase Storage
      if (supabase && pdfBytes) {
        const fileName = `${leadId}/${Date.now()}-assessment-${assessmentPath}.pdf`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('assessment-pdfs')
          .upload(fileName, pdfBytes, {
            contentType: 'application/pdf',
            upsert: false
          });

        if (uploadError) {
          console.error('PDF upload error:', uploadError);
        } else {
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('assessment-pdfs')
            .getPublicUrl(fileName);
          pdfUrl = urlData?.publicUrl || null;

          // Save URL to DB
          await supabase
            .from('assessment_leads')
            .update({ pdf_url: pdfUrl })
            .eq('id', leadId);
        }
      }
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError);
    }

    // 3. Send consolidated clinic email
    try {
      await sendConsolidatedEmail({
        firstName, lastName, email, phone,
        assessmentPath, formData, intakeData, recommendation, pdfUrl
      });

      if (supabase) {
        await supabase
          .from('assessment_leads')
          .update({ consolidated_email_sent: true })
          .eq('id', leadId);
      }
    } catch (emailError) {
      console.error('Consolidated email error:', emailError);
    }

    // 4. Update GHL contact
    if (GHL_API_KEY) {
      try {
        // Find the contact by email
        const searchResponse = await fetch(
          `https://services.leadconnectorhq.com/contacts/?locationId=${GHL_LOCATION_ID}&query=${encodeURIComponent(email)}`,
          {
            headers: {
              'Authorization': `Bearer ${GHL_API_KEY}`,
              'Version': '2021-07-28'
            }
          }
        );

        const searchData = await searchResponse.json();
        const contact = searchData.contacts?.find(c => c.email?.toLowerCase() === email.toLowerCase());

        if (contact) {
          // Add tags
          const existingTags = contact.tags || [];
          const newTags = [...new Set([...existingTags, 'intake-completed', 'assessment-completed'])];

          await fetch(
            `https://services.leadconnectorhq.com/contacts/${contact.id}`,
            {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${GHL_API_KEY}`,
                'Content-Type': 'application/json',
                'Version': '2021-07-28'
              },
              body: JSON.stringify({
                tags: newTags,
                locationId: GHL_LOCATION_ID
              })
            }
          );

          // Add note with full intake summary
          const noteBody = buildIntakeNote(assessmentPath, formData, intakeData, recommendation);
          await fetch(
            `https://services.leadconnectorhq.com/contacts/${contact.id}/notes`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${GHL_API_KEY}`,
                'Version': '2021-07-28',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ body: noteBody })
            }
          );
        }
      } catch (ghlError) {
        console.error('GHL update error:', ghlError);
      }
    }

    return res.status(200).json({ success: true, pdfUrl });

  } catch (error) {
    console.error('Assessment complete error:', error);
    return res.status(500).json({ error: 'Failed to complete assessment' });
  }
}

// Generate PDF using pdf-lib
async function generateAssessmentPDF({ firstName, lastName, email, phone, assessmentPath, formData, intakeData, recommendation }) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;
  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const black = rgb(0, 0, 0);
  const gray = rgb(0.45, 0.45, 0.45);
  const lightGray = rgb(0.85, 0.85, 0.85);

  const addNewPage = () => {
    currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
    return currentPage;
  };

  const checkSpace = (needed) => {
    if (y - needed < margin) {
      addNewPage();
    }
  };

  const drawText = (text, options = {}) => {
    const size = options.size || 10;
    const f = options.bold ? fontBold : font;
    const color = options.color || black;
    checkSpace(size + 6);
    currentPage.drawText(text, { x: options.x || margin, y, size, font: f, color });
    y -= size + (options.spacing || 6);
  };

  const drawLine = () => {
    checkSpace(12);
    currentPage.drawLine({
      start: { x: margin, y },
      end: { x: pageWidth - margin, y },
      thickness: 0.5,
      color: lightGray
    });
    y -= 12;
  };

  const drawWrappedText = (text, options = {}) => {
    const size = options.size || 10;
    const f = options.bold ? fontBold : font;
    const color = options.color || black;
    const maxWidth = options.maxWidth || contentWidth;
    const words = (text || '').split(' ');
    let line = '';

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      const width = f.widthOfTextAtSize(testLine, size);
      if (width > maxWidth && line) {
        checkSpace(size + 4);
        currentPage.drawText(line, { x: options.x || margin, y, size, font: f, color });
        y -= size + 4;
        line = word;
      } else {
        line = testLine;
      }
    }
    if (line) {
      checkSpace(size + 4);
      currentPage.drawText(line, { x: options.x || margin, y, size, font: f, color });
      y -= size + (options.spacing || 6);
    }
  };

  // Header
  drawText('RANGE MEDICAL', { size: 18, bold: true, spacing: 4 });
  drawText('Assessment & Medical Intake Summary', { size: 11, color: gray, spacing: 2 });
  const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  drawText(date, { size: 9, color: gray, spacing: 12 });
  drawLine();

  // Patient Info
  y -= 4;
  drawText('PATIENT INFORMATION', { size: 9, bold: true, color: gray, spacing: 10 });
  drawText(`Name: ${firstName} ${lastName}`, { size: 10 });
  drawText(`Email: ${email}`, { size: 10 });
  drawText(`Phone: ${phone}`, { size: 10, spacing: 12 });
  drawText(`Assessment Path: ${assessmentPath === 'injury' ? 'Injury & Recovery' : 'Energy & Optimization'}`, { size: 10, spacing: 8 });
  drawLine();

  // Assessment Answers
  y -= 4;
  drawText('ASSESSMENT ANSWERS', { size: 9, bold: true, color: gray, spacing: 10 });

  if (assessmentPath === 'injury') {
    const injuryTypeLabels = {
      'joint_ligament': 'Joint or ligament injury', 'muscle_tendon': 'Muscle or tendon injury',
      'post_surgical': 'Post-surgical recovery', 'concussion': 'Concussion or head injury',
      'chronic_pain': 'Chronic pain condition', 'fracture': 'Bone fracture', 'other': 'Other'
    };
    const locationLabels = {
      'shoulder': 'Shoulder', 'knee': 'Knee', 'back': 'Back', 'hip': 'Hip',
      'neck': 'Neck', 'ankle': 'Ankle', 'elbow': 'Elbow', 'wrist_hand': 'Wrist or hand',
      'head': 'Head', 'multiple': 'Multiple areas', 'other': 'Other'
    };
    const durationLabels = {
      'less_2_weeks': 'Less than 2 weeks', '2_4_weeks': '2-4 weeks', '1_3_months': '1-3 months',
      '3_6_months': '3-6 months', '6_plus_months': '6+ months'
    };
    const goalLabels = {
      'return_sport': 'Return to sport', 'daily_activities': 'Daily activities pain-free',
      'avoid_surgery': 'Avoid surgery', 'speed_healing': 'Speed up healing',
      'reduce_pain': 'Reduce pain and inflammation', 'post_surgery': 'Recover faster after surgery'
    };

    drawText(`Injury Type: ${injuryTypeLabels[formData.injuryType] || formData.injuryType || 'Not specified'}`, { size: 10 });
    drawText(`Location: ${locationLabels[formData.injuryLocation] || formData.injuryLocation || 'Not specified'}`, { size: 10 });
    drawText(`Duration: ${durationLabels[formData.injuryDuration] || formData.injuryDuration || 'Not specified'}`, { size: 10 });
    const goals = (formData.recoveryGoal || []).map(g => goalLabels[g] || g).join(', ');
    drawText(`Recovery Goals: ${goals || 'Not specified'}`, { size: 10, spacing: 8 });

    drawLine();
    y -= 4;
    drawText('RECOMMENDED PROTOCOL', { size: 9, bold: true, color: gray, spacing: 10 });
    drawText('BPC-157 + TB-4 Peptide Protocol', { size: 11, bold: true, spacing: 8 });
    drawWrappedText('BPC-157 (Body Protection Compound) may support tissue repair at the injury site and improve blood flow to damaged tissue.', { size: 9, color: gray, spacing: 6 });
    drawWrappedText('TB-4 (Thymosin Beta-4) may help reduce inflammation and swelling, and bring more blood flow to the injured area.', { size: 9, color: gray, spacing: 8 });

  } else {
    const symptomLabels = {
      'fatigue': 'Fatigue or low energy', 'brain_fog': 'Brain fog or poor focus',
      'weight_gain': 'Unexplained weight gain', 'poor_sleep': 'Poor sleep or insomnia',
      'low_libido': 'Low libido', 'muscle_loss': 'Muscle loss or weakness',
      'mood_changes': 'Mood changes or irritability', 'recovery': 'Slow recovery from workouts'
    };
    const goalLabels = {
      'more_energy': 'More energy', 'better_sleep': 'Better sleep', 'lose_weight': 'Lose weight',
      'build_muscle': 'Build muscle', 'mental_clarity': 'Mental clarity',
      'feel_myself': 'Feel like myself again', 'longevity': 'Longevity', 'performance': 'Performance'
    };

    const symptoms = (formData.symptoms || []).map(s => symptomLabels[s] || s).join(', ');
    drawText(`Symptoms: ${symptoms || 'Not specified'}`, { size: 10 });
    const goals = (formData.goals || []).map(g => goalLabels[g] || g).join(', ');
    drawText(`Goals: ${goals || 'Not specified'}`, { size: 10, spacing: 8 });

    if (recommendation) {
      drawLine();
      y -= 4;
      drawText('RECOMMENDED LAB PANEL', { size: 9, bold: true, color: gray, spacing: 10 });
      drawText(`${recommendation.panel === 'elite' ? 'Elite Panel ($750)' : 'Essential Panel ($350)'}`, { size: 11, bold: true, spacing: 8 });

      if (recommendation.eliteReasons?.length > 0) {
        drawText('Why we recommend this panel:', { size: 9, color: gray, spacing: 4 });
        recommendation.eliteReasons.slice(0, 3).forEach(reason => {
          drawWrappedText(`- ${reason}`, { size: 9, color: gray, spacing: 4 });
        });
      }
    }
  }

  if (formData.additionalInfo) {
    y -= 4;
    drawText('Additional Notes:', { size: 10, bold: true, spacing: 4 });
    drawWrappedText(formData.additionalInfo, { size: 9, color: gray });
  }

  drawLine();

  // Medical Intake Section
  y -= 4;
  drawText('MEDICAL INTAKE', { size: 9, bold: true, color: gray, spacing: 10 });

  // Medical History (injury path)
  if (intakeData.medicalHistory && Object.keys(intakeData.medicalHistory).length > 0) {
    drawText('Medical History:', { size: 10, bold: true, spacing: 4 });
    Object.entries(intakeData.medicalHistory).forEach(([condition, info]) => {
      let text = `- ${condition}`;
      if (info.year) text += ` (diagnosed ${info.year})`;
      if (info.detail) text += ` — ${info.detail}`;
      drawWrappedText(text, { size: 9, spacing: 4 });
    });
    y -= 4;
  } else if (assessmentPath === 'injury') {
    drawText('Medical History: No conditions reported', { size: 10, spacing: 6 });
  }

  // Medications
  if (intakeData.noCurrentMedications) {
    drawText('Medications: No current medications', { size: 10, spacing: 6 });
  } else if (intakeData.medications && intakeData.medications.length > 0) {
    drawText('Medications:', { size: 10, bold: true, spacing: 4 });
    intakeData.medications.forEach(med => {
      const parts = [med.name, med.dosage, med.frequency].filter(Boolean).join(' — ');
      drawText(`- ${parts}`, { size: 9, spacing: 4 });
    });
    y -= 4;
  } else if (intakeData.currentMedicationsText) {
    drawText('Medications:', { size: 10, bold: true, spacing: 4 });
    drawWrappedText(intakeData.currentMedicationsText, { size: 9, spacing: 4 });
    y -= 4;
  }

  // Allergies
  if (intakeData.noKnownAllergies) {
    drawText('Allergies: No known allergies', { size: 10, spacing: 6 });
  } else if (intakeData.knownAllergiesText) {
    drawText(`Allergies: ${intakeData.knownAllergiesText}`, { size: 10, spacing: 6 });
  }

  // Diagnosed Conditions (energy path)
  if (intakeData.diagnosedConditionsText) {
    drawText('Diagnosed Conditions:', { size: 10, bold: true, spacing: 4 });
    drawWrappedText(intakeData.diagnosedConditionsText, { size: 9, spacing: 4 });
    y -= 4;
  }

  // Surgical History
  if (intakeData.noPriorSurgeries) {
    drawText('Surgical History: No prior surgeries', { size: 10, spacing: 6 });
  } else if (intakeData.surgicalHistory && intakeData.surgicalHistory.length > 0) {
    drawText('Surgical History:', { size: 10, bold: true, spacing: 4 });
    intakeData.surgicalHistory.forEach(surgery => {
      const text = surgery.year ? `- ${surgery.procedure} (${surgery.year})` : `- ${surgery.procedure}`;
      drawText(text, { size: 9, spacing: 4 });
    });
    y -= 4;
  }

  // Emergency Contact
  drawLine();
  y -= 4;
  drawText('EMERGENCY CONTACT', { size: 9, bold: true, color: gray, spacing: 10 });
  drawText(`Name: ${intakeData.emergencyContactName || 'Not provided'}`, { size: 10 });
  drawText(`Phone: ${intakeData.emergencyContactPhone || 'Not provided'}`, { size: 10 });
  drawText(`Relationship: ${intakeData.emergencyContactRelationship || 'Not provided'}`, { size: 10, spacing: 12 });

  // Footer
  drawLine();
  y -= 4;
  drawText(`Generated: ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}`, { size: 8, color: gray });
  drawText('Range Medical — 1901 Westcliff Dr Suite 10, Newport Beach, CA 92660 — (949) 997-3988', { size: 8, color: gray });
  drawText('This document is confidential and intended for Range Medical staff use only.', { size: 7, color: gray });

  return await pdfDoc.save();
}

// Build GHL note with intake summary
function buildIntakeNote(assessmentPath, formData, intakeData, recommendation) {
  const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const lines = [];

  lines.push(`📋 Medical Intake Completed — ${date}`);
  lines.push(`Path: ${assessmentPath === 'injury' ? 'Injury & Recovery' : 'Energy & Optimization'}`);
  lines.push('');

  // Medical history
  if (intakeData.medicalHistory && Object.keys(intakeData.medicalHistory).length > 0) {
    lines.push('Medical History:');
    Object.entries(intakeData.medicalHistory).forEach(([condition, info]) => {
      let text = `  - ${condition}`;
      if (info.year) text += ` (${info.year})`;
      if (info.detail) text += ` — ${info.detail}`;
      lines.push(text);
    });
    lines.push('');
  }

  // Medications
  if (intakeData.noCurrentMedications) {
    lines.push('Medications: None');
  } else if (intakeData.medications?.length > 0) {
    lines.push('Medications:');
    intakeData.medications.forEach(med => {
      lines.push(`  - ${[med.name, med.dosage, med.frequency].filter(Boolean).join(' — ')}`);
    });
  } else if (intakeData.currentMedicationsText) {
    lines.push(`Medications: ${intakeData.currentMedicationsText}`);
  }

  // Allergies
  if (intakeData.noKnownAllergies) {
    lines.push('Allergies: None');
  } else if (intakeData.knownAllergiesText) {
    lines.push(`Allergies: ${intakeData.knownAllergiesText}`);
  }

  // Diagnosed conditions
  if (intakeData.diagnosedConditionsText) {
    lines.push(`Diagnosed Conditions: ${intakeData.diagnosedConditionsText}`);
  }

  // Surgical history
  if (intakeData.noPriorSurgeries) {
    lines.push('Surgical History: None');
  } else if (intakeData.surgicalHistory?.length > 0) {
    lines.push('Surgical History:');
    intakeData.surgicalHistory.forEach(s => {
      lines.push(`  - ${s.procedure}${s.year ? ` (${s.year})` : ''}`);
    });
  }

  lines.push('');
  lines.push(`Emergency Contact: ${intakeData.emergencyContactName || 'N/A'} — ${intakeData.emergencyContactPhone || 'N/A'} (${intakeData.emergencyContactRelationship || 'N/A'})`);

  if (recommendation) {
    lines.push('');
    lines.push(`Recommended Panel: ${recommendation.panel === 'elite' ? 'Elite ($750)' : 'Essential ($350)'}`);
  }

  return lines.join('\n');
}

// Send consolidated email to clinic
async function sendConsolidatedEmail({ firstName, lastName, email, phone, assessmentPath, formData, intakeData, recommendation, pdfUrl }) {
  const pathName = assessmentPath === 'injury' ? 'Injury & Recovery' : 'Energy & Optimization';
  const date = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
  });

  // Build medical intake section
  let intakeHtml = '';

  // Medical history
  if (intakeData.medicalHistory && Object.keys(intakeData.medicalHistory).length > 0) {
    intakeHtml += '<tr><td style="padding: 8px 0; color: #737373; vertical-align: top;">Medical History:</td><td style="padding: 8px 0; color: #171717;">';
    Object.entries(intakeData.medicalHistory).forEach(([condition, info]) => {
      let text = condition;
      if (info.year) text += ` (${info.year})`;
      if (info.detail) text += ` — ${info.detail}`;
      intakeHtml += `${text}<br/>`;
    });
    intakeHtml += '</td></tr>';
  } else if (assessmentPath === 'injury') {
    intakeHtml += '<tr><td style="padding: 8px 0; color: #737373;">Medical History:</td><td style="padding: 8px 0; color: #171717;">No conditions reported</td></tr>';
  }

  // Medications
  if (intakeData.noCurrentMedications) {
    intakeHtml += '<tr><td style="padding: 8px 0; color: #737373;">Medications:</td><td style="padding: 8px 0; color: #171717;">None</td></tr>';
  } else if (intakeData.medications?.length > 0) {
    intakeHtml += '<tr><td style="padding: 8px 0; color: #737373; vertical-align: top;">Medications:</td><td style="padding: 8px 0; color: #171717;">';
    intakeData.medications.forEach(med => {
      intakeHtml += `${[med.name, med.dosage, med.frequency].filter(Boolean).join(' — ')}<br/>`;
    });
    intakeHtml += '</td></tr>';
  } else if (intakeData.currentMedicationsText) {
    intakeHtml += `<tr><td style="padding: 8px 0; color: #737373;">Medications:</td><td style="padding: 8px 0; color: #171717;">${intakeData.currentMedicationsText}</td></tr>`;
  }

  // Allergies
  if (intakeData.noKnownAllergies) {
    intakeHtml += '<tr><td style="padding: 8px 0; color: #737373;">Allergies:</td><td style="padding: 8px 0; color: #171717;">None</td></tr>';
  } else if (intakeData.knownAllergiesText) {
    intakeHtml += `<tr><td style="padding: 8px 0; color: #737373;">Allergies:</td><td style="padding: 8px 0; color: #171717;">${intakeData.knownAllergiesText}</td></tr>`;
  }

  // Diagnosed conditions
  if (intakeData.diagnosedConditionsText) {
    intakeHtml += `<tr><td style="padding: 8px 0; color: #737373;">Diagnosed Conditions:</td><td style="padding: 8px 0; color: #171717;">${intakeData.diagnosedConditionsText}</td></tr>`;
  }

  // Surgical history
  if (intakeData.noPriorSurgeries) {
    intakeHtml += '<tr><td style="padding: 8px 0; color: #737373;">Surgical History:</td><td style="padding: 8px 0; color: #171717;">None</td></tr>';
  } else if (intakeData.surgicalHistory?.length > 0) {
    intakeHtml += '<tr><td style="padding: 8px 0; color: #737373; vertical-align: top;">Surgical History:</td><td style="padding: 8px 0; color: #171717;">';
    intakeData.surgicalHistory.forEach(s => {
      intakeHtml += `${s.procedure}${s.year ? ` (${s.year})` : ''}<br/>`;
    });
    intakeHtml += '</td></tr>';
  }

  // Emergency contact
  intakeHtml += `<tr><td style="padding: 8px 0; color: #737373;">Emergency Contact:</td><td style="padding: 8px 0; color: #171717;">${intakeData.emergencyContactName || 'N/A'} — ${intakeData.emergencyContactPhone || 'N/A'} (${intakeData.emergencyContactRelationship || 'N/A'})</td></tr>`;

  // Build assessment details section
  let detailsHtml = '';
  if (assessmentPath === 'injury') {
    const injuryTypeLabels = {
      'joint_ligament': 'Joint or ligament injury', 'muscle_tendon': 'Muscle or tendon injury',
      'post_surgical': 'Post-surgical recovery', 'concussion': 'Concussion or head injury',
      'chronic_pain': 'Chronic pain condition', 'fracture': 'Bone fracture', 'other': 'Other'
    };
    const locationLabels = {
      'shoulder': 'Shoulder', 'knee': 'Knee', 'back': 'Back', 'hip': 'Hip',
      'neck': 'Neck', 'ankle': 'Ankle', 'elbow': 'Elbow', 'wrist_hand': 'Wrist or hand',
      'head': 'Head', 'multiple': 'Multiple areas', 'other': 'Other'
    };
    const durationLabels = {
      'less_2_weeks': 'Less than 2 weeks', '2_4_weeks': '2-4 weeks', '1_3_months': '1-3 months',
      '3_6_months': '3-6 months', '6_plus_months': '6+ months'
    };
    const goalLabels = {
      'return_sport': 'Return to sport', 'daily_activities': 'Daily activities pain-free',
      'avoid_surgery': 'Avoid surgery', 'speed_healing': 'Speed up healing',
      'reduce_pain': 'Reduce pain', 'post_surgery': 'Post-surgery recovery'
    };

    detailsHtml = `
      <tr><td style="padding: 8px 0; color: #737373;">Injury Type:</td><td style="padding: 8px 0; color: #171717; font-weight: 500;">${injuryTypeLabels[formData.injuryType] || 'Not specified'}</td></tr>
      <tr><td style="padding: 8px 0; color: #737373;">Location:</td><td style="padding: 8px 0; color: #171717; font-weight: 500;">${locationLabels[formData.injuryLocation] || 'Not specified'}</td></tr>
      <tr><td style="padding: 8px 0; color: #737373;">Duration:</td><td style="padding: 8px 0; color: #171717; font-weight: 500;">${durationLabels[formData.injuryDuration] || 'Not specified'}</td></tr>
      <tr><td style="padding: 8px 0; color: #737373;">Recovery Goals:</td><td style="padding: 8px 0; color: #171717; font-weight: 500;">${(formData.recoveryGoal || []).map(g => goalLabels[g] || g).join(', ') || 'Not specified'}</td></tr>
      <tr><td style="padding: 8px 0; color: #737373;">Recommended:</td><td style="padding: 8px 0; color: #171717; font-weight: 500;">BPC-157 + TB-4 Protocol</td></tr>
    `;
  } else {
    const symptomLabels = {
      'fatigue': 'Fatigue', 'brain_fog': 'Brain fog', 'weight_gain': 'Weight gain',
      'poor_sleep': 'Poor sleep', 'low_libido': 'Low libido', 'muscle_loss': 'Muscle loss',
      'mood_changes': 'Mood changes', 'recovery': 'Slow recovery'
    };
    const goalLabels = {
      'more_energy': 'More energy', 'better_sleep': 'Better sleep', 'lose_weight': 'Lose weight',
      'build_muscle': 'Build muscle', 'mental_clarity': 'Mental clarity',
      'feel_myself': 'Feel like myself again', 'longevity': 'Longevity', 'performance': 'Performance'
    };

    detailsHtml = `
      <tr><td style="padding: 8px 0; color: #737373;">Symptoms:</td><td style="padding: 8px 0; color: #171717; font-weight: 500;">${(formData.symptoms || []).map(s => symptomLabels[s] || s).join(', ') || 'Not specified'}</td></tr>
      <tr><td style="padding: 8px 0; color: #737373;">Goals:</td><td style="padding: 8px 0; color: #171717; font-weight: 500;">${(formData.goals || []).map(g => goalLabels[g] || g).join(', ') || 'Not specified'}</td></tr>
      <tr><td style="padding: 8px 0; color: #737373;">Recommended Panel:</td><td style="padding: 8px 0; color: #171717; font-weight: 500;">${recommendation?.panel === 'elite' ? 'Elite Panel ($750)' : 'Essential Panel ($350)'}</td></tr>
    `;
  }

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="background-color: #000000; padding: 24px 32px;">
              <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 600;">Assessment Complete — Ready for Review</h1>
            </td>
          </tr>

          <!-- Path Badge -->
          <tr>
            <td style="padding: 24px 32px 0;">
              <span style="display: inline-block; background: ${assessmentPath === 'injury' ? '#fef2f2' : '#f0fdf4'}; color: ${assessmentPath === 'injury' ? '#dc2626' : '#16a34a'}; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; padding: 6px 12px; border-radius: 4px;">
                ${pathName}
              </span>
              <span style="display: inline-block; background: #f0fdf4; color: #16a34a; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; padding: 6px 12px; border-radius: 4px; margin-left: 8px;">
                INTAKE COMPLETED
              </span>
              <p style="margin: 8px 0 0; font-size: 13px; color: #737373;">${date}</p>
            </td>
          </tr>

          <!-- Contact Info -->
          <tr>
            <td style="padding: 24px 32px;">
              <h2 style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #737373; text-transform: uppercase; letter-spacing: 0.05em;">Contact Information</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 15px;">
                <tr><td style="padding: 8px 0; color: #737373;">Name:</td><td style="padding: 8px 0; color: #171717; font-weight: 600;">${firstName} ${lastName}</td></tr>
                <tr><td style="padding: 8px 0; color: #737373;">Email:</td><td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #171717;">${email}</a></td></tr>
                <tr><td style="padding: 8px 0; color: #737373;">Phone:</td><td style="padding: 8px 0;"><a href="tel:${phone}" style="color: #171717;">${phone}</a></td></tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 32px;"><hr style="border: none; border-top: 1px solid #e5e5e5; margin: 0;"></td>
          </tr>

          <!-- Assessment Details -->
          <tr>
            <td style="padding: 24px 32px;">
              <h2 style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #737373; text-transform: uppercase; letter-spacing: 0.05em;">Assessment Details</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 15px;">
                ${detailsHtml}
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 32px;"><hr style="border: none; border-top: 1px solid #e5e5e5; margin: 0;"></td>
          </tr>

          <!-- Medical Intake -->
          <tr>
            <td style="padding: 24px 32px;">
              <h2 style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #737373; text-transform: uppercase; letter-spacing: 0.05em;">Medical Intake</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 15px;">
                ${intakeHtml}
              </table>
            </td>
          </tr>

          ${formData.additionalInfo ? `
          <!-- Additional Notes -->
          <tr>
            <td style="padding: 0 32px 24px;">
              <div style="background: #fafafa; border-radius: 8px; padding: 16px;">
                <h3 style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #737373; text-transform: uppercase;">Additional Notes</h3>
                <p style="margin: 0; font-size: 14px; color: #525252; line-height: 1.6;">${formData.additionalInfo}</p>
              </div>
            </td>
          </tr>
          ` : ''}

          ${pdfUrl ? `
          <!-- PDF Link -->
          <tr>
            <td style="padding: 0 32px 24px; text-align: center;">
              <a href="${pdfUrl}" style="display: inline-block; background: #171717; color: #ffffff; padding: 12px 24px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 14px;">
                View Full PDF Summary
              </a>
            </td>
          </tr>
          ` : ''}

          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; padding: 20px 32px; text-align: center; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0; font-size: 13px; color: #737373;">Range Medical Assessment System</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const { error } = await resend.emails.send({
    from: 'Range Medical <notifications@range-medical.com>',
    to: 'cupp@range-medical.com',
    subject: `Assessment Complete: ${firstName} ${lastName} — ${pathName}`,
    html: emailHtml
  });

  if (error) {
    console.error('Consolidated email error:', error);
    throw error;
  }
}
