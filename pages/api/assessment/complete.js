import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// Allow large payloads for photo ID uploads
export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } }
};

const resend = new Resend(process.env.RESEND_API_KEY);
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

// Condition labels for display
const CONDITION_LABELS = {
  hypertension: 'High Blood Pressure',
  highCholesterol: 'High Cholesterol',
  heartDisease: 'Heart Disease',
  diabetes: 'Diabetes',
  thyroid: 'Thyroid Disorder',
  depression: 'Depression/Anxiety',
  eatingDisorder: 'Eating Disorder',
  kidney: 'Kidney Disease',
  liver: 'Liver Disease',
  autoimmune: 'Autoimmune Disorder',
  cancer: 'Cancer'
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { leadId: providedLeadId, assessmentPath, formData, intakeData, recommendation } = req.body;

    if (!assessmentPath || !formData || !intakeData) {
      const missing = [];
      if (!assessmentPath) missing.push('assessmentPath');
      if (!formData) missing.push('formData');
      if (!intakeData) missing.push('intakeData');
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    }

    const { firstName, lastName, email, phone } = formData;

    // Resolve leadId — use provided ID or fall back to lookup by email
    let leadId = providedLeadId;
    if (!leadId && supabase && email) {
      const { data: existingLead } = await supabase
        .from('assessment_leads')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (existingLead) {
        leadId = existingLead.id;
        console.log('Resolved leadId by email lookup:', leadId);
      }
    }

    // Ensure storage bucket exists and is public
    if (supabase) {
      await supabase.storage.createBucket('assessment-pdfs', { public: true }).catch(() => {});
      await supabase.storage.updateBucket('assessment-pdfs', { public: true }).catch(() => {});
    }

    // 1. Update assessment_leads with intake data
    if (supabase && leadId) {
      // Store comprehensive intake data in medical_history JSONB
      const medicalHistoryData = {
        personalInfo: {
          dob: intakeData.dob || null,
          gender: intakeData.gender || null,
          preferredName: intakeData.preferredName || null,
          address: {
            street: intakeData.streetAddress || null,
            city: intakeData.city || null,
            state: intakeData.state || null,
            postalCode: intakeData.postalCode || null,
          },
          howHeardAboutUs: intakeData.howHeardAboutUs || null,
          howHeardOther: intakeData.howHeardOther || null,
          howHeardFriend: intakeData.howHeardFriend || null,
          isMinor: intakeData.isMinor || 'No',
          guardianName: intakeData.guardianName || null,
          guardianRelationship: intakeData.guardianRelationship || null,
        },
        healthcareProviders: {
          hasPCP: intakeData.hasPCP || null,
          pcpName: intakeData.pcpName || null,
          recentHospitalization: intakeData.recentHospitalization || null,
          hospitalizationReason: intakeData.hospitalizationReason || null,
        },
        conditions: intakeData.conditions || {},
        hrt: {
          onHRT: intakeData.onHRT || null,
          hrtDetails: intakeData.hrtDetails || null,
        },
      };

      // Upload signature image if present
      let signatureUrl = null;
      if (intakeData.signatureData && supabase) {
        try {
          const base64Data = intakeData.signatureData.replace(/^data:image\/png;base64,/, '');
          const sigBuffer = Buffer.from(base64Data, 'base64');
          const sigFileName = `${leadId || 'unknown'}/${Date.now()}-signature.png`;
          const { error: sigUploadErr } = await supabase.storage
            .from('assessment-pdfs')
            .upload(sigFileName, sigBuffer, { contentType: 'image/png', upsert: false });
          if (!sigUploadErr) {
            const { data: sigUrlData } = supabase.storage
              .from('assessment-pdfs')
              .getPublicUrl(sigFileName);
            signatureUrl = sigUrlData?.publicUrl || null;
          }
        } catch (sigErr) {
          console.error('Signature upload error:', sigErr);
        }
      }
      medicalHistoryData.signatureUrl = signatureUrl;

      // Upload photo ID if present
      let photoIdUrl = null;
      if (intakeData.photoIdData && supabase) {
        try {
          const photoBase64 = intakeData.photoIdData.replace(/^data:image\/\w+;base64,/, '');
          const photoBuffer = Buffer.from(photoBase64, 'base64');
          const photoContentType = intakeData.photoIdData.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
          const photoExt = photoContentType === 'image/png' ? 'png' : 'jpg';
          const photoFileName = `${leadId || 'unknown'}/${Date.now()}-photo-id.${photoExt}`;
          const { error: photoUploadErr } = await supabase.storage
            .from('assessment-pdfs')
            .upload(photoFileName, photoBuffer, { contentType: photoContentType, upsert: false });
          if (!photoUploadErr) {
            const { data: photoUrlData } = supabase.storage
              .from('assessment-pdfs')
              .getPublicUrl(photoFileName);
            photoIdUrl = photoUrlData?.publicUrl || null;
          }
        } catch (photoErr) {
          console.error('Photo ID upload error:', photoErr);
        }
      }
      medicalHistoryData.photoIdUrl = photoIdUrl;

      const updateData = {
        intake_completed_at: new Date().toISOString(),
        intake_status: 'completed',
        medical_history: medicalHistoryData,
        allergies: intakeData.hasAllergies === 'No' ? { none: true } : { text: intakeData.allergiesList || '' },
        emergency_contact_name: intakeData.emergencyContactName || null,
        emergency_contact_phone: intakeData.emergencyContactPhone || null,
        emergency_contact_relationship: intakeData.emergencyContactRelationship || null,
        current_medications_text: intakeData.onMedications === 'Yes' ? intakeData.currentMedications : null,
        known_allergies_text: intakeData.hasAllergies === 'Yes' ? intakeData.allergiesList : null,
        no_known_allergies: intakeData.hasAllergies === 'No',
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
        const filePrefix = leadId || email?.replace(/[^a-z0-9]/gi, '_') || 'unknown';
        const fileName = `${filePrefix}/${Date.now()}-assessment-${assessmentPath}.pdf`;
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
          if (leadId) {
            await supabase
              .from('assessment_leads')
              .update({ pdf_url: pdfUrl })
              .eq('id', leadId);
          }
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

      if (supabase && leadId) {
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

// Helper to format conditions for display — always shows all 11 conditions with Yes/No
function formatConditions(conditions) {
  const results = [];
  for (const [key, label] of Object.entries(CONDITION_LABELS)) {
    const data = conditions?.[key];
    if (data?.response === 'Yes') {
      let text = `${label}: Yes`;
      if (data.type) text += ` (${data.type})`;
      if (data.year) text += ` \u2014 diagnosed ${data.year}`;
      results.push(text);
    } else {
      results.push(`${label}: No`);
    }
  }
  return results;
}

// Generate PDF using pdf-lib — styled to match consent form PDFs
async function generateAssessmentPDF({ firstName, lastName, email, phone, assessmentPath, formData, intakeData, recommendation }) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 612;
  const pageHeight = 792;
  // Margins match consent forms (15mm ≈ 42pt)
  const leftMargin = 42;
  const rightMargin = 42;
  const contentWidth = pageWidth - leftMargin - rightMargin;
  const bottomMargin = 55;

  const white = rgb(1, 1, 1);
  const black = rgb(0, 0, 0);
  const grayColor = rgb(0.51, 0.51, 0.51);

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let yPos;

  const checkPageBreak = (needed = 20) => {
    if (yPos - needed < bottomMargin) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      yPos = pageHeight - 42;
    }
  };

  // Wrapped text helper
  const drawWrappedText = (text, options = {}) => {
    const size = options.size || 9;
    const f = options.bold ? fontBold : font;
    const color = options.color || black;
    const x = options.x || leftMargin;
    const maxWidth = options.maxWidth || (contentWidth - (x - leftMargin));
    const lineHeight = options.lineHeight || (size + 3);
    const words = (text || '').split(' ');
    let line = '';

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      const width = f.widthOfTextAtSize(testLine, size);
      if (width > maxWidth && line) {
        checkPageBreak(lineHeight);
        currentPage.drawText(line, { x, y: yPos, size, font: f, color });
        yPos -= lineHeight;
        line = word;
      } else {
        line = testLine;
      }
    }
    if (line) {
      checkPageBreak(lineHeight);
      currentPage.drawText(line, { x, y: yPos, size, font: f, color });
      yPos -= (options.spacingAfter || lineHeight);
    }
  };

  // ===== HEADER BAR (full-width black bar, matching consent forms) =====
  const headerBarHeight = 55;
  currentPage.drawRectangle({
    x: 0, y: pageHeight - headerBarHeight,
    width: pageWidth, height: headerBarHeight,
    color: black
  });

  // Title — left
  currentPage.drawText('RANGE MEDICAL', {
    x: leftMargin, y: pageHeight - 24, size: 16, font: fontBold, color: white
  });
  // Subtitle — left
  currentPage.drawText('Medical Intake Form', {
    x: leftMargin, y: pageHeight - 40, size: 9, font, color: white
  });

  // Date — right
  const dateStr = new Date().toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', month: 'long', day: 'numeric', year: 'numeric' });
  const dateLabel = `Document Date: ${dateStr}`;
  const dateLabelWidth = font.widthOfTextAtSize(dateLabel, 8);
  currentPage.drawText(dateLabel, {
    x: pageWidth - rightMargin - dateLabelWidth, y: pageHeight - 24, size: 8, font, color: white
  });
  // Address — right
  const addressText = '1901 Westcliff Dr, Suite 10, Newport Beach, CA 92660';
  const addressWidth = font.widthOfTextAtSize(addressText, 8);
  currentPage.drawText(addressText, {
    x: pageWidth - rightMargin - addressWidth, y: pageHeight - 40, size: 8, font, color: white
  });

  yPos = pageHeight - headerBarHeight - 14;

  // Section header helper (black bar with white text, matching consent forms)
  const addSectionHeader = (text) => {
    checkPageBreak(30);
    yPos -= 8;
    const barHeight = 16;
    currentPage.drawRectangle({
      x: leftMargin, y: yPos - 3,
      width: contentWidth, height: barHeight,
      color: black
    });
    currentPage.drawText(text.toUpperCase(), {
      x: leftMargin + 6, y: yPos + 1, size: 9, font: fontBold, color: white
    });
    yPos -= 18;
  };

  // Label-value pair (bold label, normal value on same line)
  const addLabelValue = (label, value) => {
    checkPageBreak(14);
    const valueStr = value || 'N/A';
    const labelWidth = fontBold.widthOfTextAtSize(label, 9);
    currentPage.drawText(label, {
      x: leftMargin, y: yPos, size: 9, font: fontBold, color: black
    });
    const availWidth = contentWidth - labelWidth - 4;
    const valueWidth = font.widthOfTextAtSize(valueStr, 9);
    if (valueWidth <= availWidth) {
      currentPage.drawText(valueStr, {
        x: leftMargin + labelWidth + 2, y: yPos, size: 9, font, color: black
      });
      yPos -= 14;
    } else {
      // Value wraps to next line(s)
      yPos -= 13;
      drawWrappedText(valueStr, { size: 9, x: leftMargin + 8, spacingAfter: 14 });
    }
  };

  // Simple text line
  const addTextLine = (text, options = {}) => {
    const size = options.size || 9;
    const f = options.bold ? fontBold : font;
    const color = options.color || black;
    checkPageBreak(size + 6);
    currentPage.drawText(text, {
      x: options.x || leftMargin, y: yPos, size, font: f, color
    });
    yPos -= (options.spacingAfter || 14);
  };

  // ===== PATIENT INFORMATION =====
  addSectionHeader('Patient Information');
  addLabelValue('Name: ', `${firstName} ${lastName}`);
  if (intakeData.preferredName) addLabelValue('Preferred Name: ', intakeData.preferredName);
  if (intakeData.dob) addLabelValue('Date of Birth: ', intakeData.dob);
  if (intakeData.gender) addLabelValue('Gender: ', intakeData.gender);
  addLabelValue('Email: ', email);
  addLabelValue('Phone: ', phone);
  if (intakeData.streetAddress) {
    addLabelValue('Address: ', `${intakeData.streetAddress}, ${intakeData.city}, ${intakeData.state} ${intakeData.postalCode}`);
  }
  if (intakeData.howHeardAboutUs) {
    let referral = intakeData.howHeardAboutUs;
    if (referral === 'Other' && intakeData.howHeardOther) referral = intakeData.howHeardOther;
    if (referral === 'Friend or Family Member' && intakeData.howHeardFriend) referral = `Friend/Family: ${intakeData.howHeardFriend}`;
    addLabelValue('Referral Source: ', referral);
  }
  if (intakeData.isMinor === 'Yes') {
    addLabelValue('Minor Patient: ', `Guardian: ${intakeData.guardianName} (${intakeData.guardianRelationship})`);
  }

  // ===== ASSESSMENT PATH & ANSWERS =====
  addSectionHeader('Assessment Path & Answers');
  addLabelValue('Path: ', assessmentPath === 'injury' ? 'Injury & Recovery' : 'Energy & Optimization');

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

    addLabelValue('Injury Type: ', injuryTypeLabels[formData.injuryType] || formData.injuryType || 'Not specified');
    addLabelValue('Location: ', locationLabels[formData.injuryLocation] || formData.injuryLocation || 'Not specified');
    addLabelValue('Duration: ', durationLabels[formData.injuryDuration] || formData.injuryDuration || 'Not specified');
    const goals = (formData.recoveryGoal || []).map(g => goalLabels[g] || g).join(', ');
    addLabelValue('Recovery Goals: ', goals || 'Not specified');
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
    addLabelValue('Symptoms: ', symptoms || 'Not specified');
    const goals = (formData.goals || []).map(g => goalLabels[g] || g).join(', ');
    addLabelValue('Goals: ', goals || 'Not specified');
  }

  // ===== HEALTHCARE PROVIDERS =====
  addSectionHeader('Healthcare Providers');
  addLabelValue('Primary Care Physician: ', `${intakeData.hasPCP || 'Not specified'}${intakeData.hasPCP === 'Yes' && intakeData.pcpName ? ` \u2014 ${intakeData.pcpName}` : ''}`);
  addLabelValue('Recent Hospitalization: ', `${intakeData.recentHospitalization || 'Not specified'}${intakeData.recentHospitalization === 'Yes' && intakeData.hospitalizationReason ? ` \u2014 ${intakeData.hospitalizationReason}` : ''}`);

  // ===== MEDICAL HISTORY =====
  addSectionHeader('Medical History');
  const conditionLines = formatConditions(intakeData.conditions);
  conditionLines.forEach(line => {
    drawWrappedText(line, { size: 9, spacingAfter: 12 });
  });

  // ===== MEDICATIONS & ALLERGIES =====
  addSectionHeader('Medications & Allergies');
  addLabelValue('On HRT: ', `${intakeData.onHRT || 'Not specified'}${intakeData.onHRT === 'Yes' && intakeData.hrtDetails ? ` \u2014 ${intakeData.hrtDetails}` : ''}`);
  if (intakeData.onMedications === 'No') {
    addLabelValue('Other Medications: ', 'None');
  } else if (intakeData.onMedications === 'Yes' && intakeData.currentMedications) {
    addLabelValue('Other Medications: ', intakeData.currentMedications);
  }
  if (intakeData.hasAllergies === 'No') {
    addLabelValue('Allergies: ', 'None');
  } else if (intakeData.hasAllergies === 'Yes' && intakeData.allergiesList) {
    addLabelValue('Allergies: ', intakeData.allergiesList);
  }

  // ===== EMERGENCY CONTACT =====
  addSectionHeader('Emergency Contact');
  addLabelValue('Name: ', intakeData.emergencyContactName || 'Not provided');
  addLabelValue('Phone: ', intakeData.emergencyContactPhone || 'Not provided');
  addLabelValue('Relationship: ', intakeData.emergencyContactRelationship || 'Not provided');

  // ===== ADDITIONAL NOTES =====
  if (intakeData.additionalNotes) {
    addSectionHeader('Additional Notes');
    drawWrappedText(intakeData.additionalNotes, { size: 9, spacingAfter: 14 });
  }

  // ===== PHOTO IDENTIFICATION =====
  if (intakeData.photoIdData) {
    addSectionHeader('Photo Identification');
    try {
      const photoBase64 = intakeData.photoIdData.replace(/^data:image\/\w+;base64,/, '');
      const photoBytes = Buffer.from(photoBase64, 'base64');
      const isPng = intakeData.photoIdData.startsWith('data:image/png');
      const photoImage = isPng
        ? await pdfDoc.embedPng(photoBytes)
        : await pdfDoc.embedJpg(photoBytes);
      const photoDims = photoImage.scale(1);
      // Scale to fit: max 250pt wide, max 180pt tall
      const maxPhotoWidth = 250;
      const maxPhotoHeight = 180;
      const photoScale = Math.min(maxPhotoWidth / photoDims.width, maxPhotoHeight / photoDims.height, 1);
      const photoWidth = photoDims.width * photoScale;
      const photoHeight = photoDims.height * photoScale;

      checkPageBreak(photoHeight + 10);
      currentPage.drawImage(photoImage, {
        x: leftMargin,
        y: yPos - photoHeight,
        width: photoWidth,
        height: photoHeight
      });
      yPos -= photoHeight + 8;
    } catch (photoErr) {
      console.error('Error embedding photo ID in PDF:', photoErr);
      addTextLine('[Photo ID on file]', { size: 9, color: grayColor });
    }
  }

  // ===== PATIENT CERTIFICATION & SIGNATURE =====
  addSectionHeader('Patient Certification & Signature');
  drawWrappedText(
    'I certify that the information provided in this medical intake form is true and accurate to the best of my knowledge. I understand that withholding or providing inaccurate information may affect my care and treatment at Range Medical.',
    { size: 8.5, spacingAfter: 16 }
  );
  addLabelValue('Signed by: ', `${firstName} ${lastName}`);
  addLabelValue('Date: ', dateStr);

  // Embed signature image
  if (intakeData.signatureData) {
    try {
      const base64Data = intakeData.signatureData.replace(/^data:image\/png;base64,/, '');
      const sigBytes = Buffer.from(base64Data, 'base64');
      const sigImage = await pdfDoc.embedPng(sigBytes);
      const sigDims = sigImage.scale(1);
      // Scale signature to fit: max 170pt wide, max 55pt tall
      const maxSigWidth = 170;
      const maxSigHeight = 55;
      const scale = Math.min(maxSigWidth / sigDims.width, maxSigHeight / sigDims.height, 1);
      const sigWidth = sigDims.width * scale;
      const sigHeight = sigDims.height * scale;

      checkPageBreak(sigHeight + 10);
      currentPage.drawImage(sigImage, {
        x: leftMargin,
        y: yPos - sigHeight,
        width: sigWidth,
        height: sigHeight
      });
      yPos -= sigHeight + 8;
    } catch (sigErr) {
      console.error('Error embedding signature in PDF:', sigErr);
      addTextLine('[Signature on file]', { size: 9, color: grayColor });
    }
  }

  // ===== FOOTERS (applied to all pages after content is complete) =====
  const pages = pdfDoc.getPages();
  const totalPages = pages.length;
  pages.forEach((page, i) => {
    // Clinic info — centered
    const footerLine1 = 'Range Medical | 1901 Westcliff Dr, Suite 10, Newport Beach, CA 92660 | (949) 997-3988';
    const f1Width = font.widthOfTextAtSize(footerLine1, 7);
    page.drawText(footerLine1, {
      x: (pageWidth - f1Width) / 2, y: 18, size: 7, font, color: grayColor
    });
    // Confidential — centered
    const footerLine2 = 'CONFIDENTIAL \u2014 Medical Intake Form';
    const f2Width = font.widthOfTextAtSize(footerLine2, 7);
    page.drawText(footerLine2, {
      x: (pageWidth - f2Width) / 2, y: 10, size: 7, font, color: grayColor
    });
    // Page number — right
    const pageNum = `Page ${i + 1} of ${totalPages}`;
    const pnWidth = font.widthOfTextAtSize(pageNum, 7);
    page.drawText(pageNum, {
      x: pageWidth - rightMargin - pnWidth, y: 10, size: 7, font, color: grayColor
    });
  });

  return await pdfDoc.save();
}

// Build GHL note with intake summary
function buildIntakeNote(assessmentPath, formData, intakeData, recommendation) {
  const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const lines = [];

  lines.push(`Medical Intake Completed — ${date}`);
  lines.push(`Path: ${assessmentPath === 'injury' ? 'Injury & Recovery' : 'Energy & Optimization'}`);
  lines.push('');

  // Personal info
  if (intakeData.dob) lines.push(`DOB: ${intakeData.dob}`);
  if (intakeData.gender) lines.push(`Gender: ${intakeData.gender}`);
  if (intakeData.streetAddress) {
    lines.push(`Address: ${intakeData.streetAddress}, ${intakeData.city}, ${intakeData.state} ${intakeData.postalCode}`);
  }
  if (intakeData.howHeardAboutUs) {
    let referral = intakeData.howHeardAboutUs;
    if (referral === 'Other' && intakeData.howHeardOther) referral = intakeData.howHeardOther;
    if (referral === 'Friend or Family Member' && intakeData.howHeardFriend) referral = `Friend/Family: ${intakeData.howHeardFriend}`;
    lines.push(`Referral: ${referral}`);
  }
  lines.push('');

  // Healthcare providers
  lines.push(`PCP: ${intakeData.hasPCP || 'N/A'}${intakeData.hasPCP === 'Yes' && intakeData.pcpName ? ` — ${intakeData.pcpName}` : ''}`);
  lines.push(`Recent Hospitalization: ${intakeData.recentHospitalization || 'N/A'}${intakeData.recentHospitalization === 'Yes' && intakeData.hospitalizationReason ? ` — ${intakeData.hospitalizationReason}` : ''}`);
  lines.push('');

  // Medical history conditions
  const conditionLines = formatConditions(intakeData.conditions);
  if (conditionLines.length > 0) {
    lines.push('Medical History:');
    conditionLines.forEach(line => lines.push(`  ${line}`));
    lines.push('');
  }

  // HRT
  lines.push(`On HRT: ${intakeData.onHRT || 'N/A'}`);
  if (intakeData.onHRT === 'Yes' && intakeData.hrtDetails) {
    lines.push(`  HRT Details: ${intakeData.hrtDetails}`);
  }

  // Medications
  if (intakeData.onMedications === 'No') {
    lines.push('Other Medications: None');
  } else if (intakeData.onMedications === 'Yes' && intakeData.currentMedications) {
    lines.push(`Other Medications: ${intakeData.currentMedications}`);
  }

  // Allergies
  if (intakeData.hasAllergies === 'No') {
    lines.push('Allergies: None');
  } else if (intakeData.hasAllergies === 'Yes' && intakeData.allergiesList) {
    lines.push(`Allergies: ${intakeData.allergiesList}`);
  }

  lines.push('');
  lines.push(`Emergency Contact: ${intakeData.emergencyContactName || 'N/A'} — ${intakeData.emergencyContactPhone || 'N/A'} (${intakeData.emergencyContactRelationship || 'N/A'})`);

  if (intakeData.additionalNotes) {
    lines.push('');
    lines.push(`Additional Notes: ${intakeData.additionalNotes}`);
  }

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

  // Build personal info section
  let personalHtml = '';
  if (intakeData.dob) personalHtml += `<tr><td style="padding: 4px 0; color: #737373;">DOB:</td><td style="padding: 4px 0; color: #171717;">${intakeData.dob}</td></tr>`;
  if (intakeData.gender) personalHtml += `<tr><td style="padding: 4px 0; color: #737373;">Gender:</td><td style="padding: 4px 0; color: #171717;">${intakeData.gender}</td></tr>`;
  if (intakeData.streetAddress) {
    personalHtml += `<tr><td style="padding: 4px 0; color: #737373;">Address:</td><td style="padding: 4px 0; color: #171717;">${intakeData.streetAddress}, ${intakeData.city}, ${intakeData.state} ${intakeData.postalCode}</td></tr>`;
  }
  if (intakeData.howHeardAboutUs) {
    let referral = intakeData.howHeardAboutUs;
    if (referral === 'Other' && intakeData.howHeardOther) referral = intakeData.howHeardOther;
    if (referral === 'Friend or Family Member' && intakeData.howHeardFriend) referral = `Friend/Family: ${intakeData.howHeardFriend}`;
    personalHtml += `<tr><td style="padding: 4px 0; color: #737373;">Referral:</td><td style="padding: 4px 0; color: #171717;">${referral}</td></tr>`;
  }
  if (intakeData.isMinor === 'Yes') {
    personalHtml += `<tr><td style="padding: 4px 0; color: #737373;">Guardian:</td><td style="padding: 4px 0; color: #171717;">${intakeData.guardianName} (${intakeData.guardianRelationship})</td></tr>`;
  }

  // Build healthcare providers section
  let providersHtml = '';
  providersHtml += `<tr><td style="padding: 4px 0; color: #737373;">PCP:</td><td style="padding: 4px 0; color: #171717;">${intakeData.hasPCP || 'N/A'}${intakeData.hasPCP === 'Yes' && intakeData.pcpName ? ` — ${intakeData.pcpName}` : ''}</td></tr>`;
  providersHtml += `<tr><td style="padding: 4px 0; color: #737373;">Hospitalization:</td><td style="padding: 4px 0; color: #171717;">${intakeData.recentHospitalization || 'N/A'}${intakeData.recentHospitalization === 'Yes' && intakeData.hospitalizationReason ? ` — ${intakeData.hospitalizationReason}` : ''}</td></tr>`;

  // Build medical history section
  let historyHtml = '';
  const conditionLines = formatConditions(intakeData.conditions);
  if (conditionLines.length > 0) {
    historyHtml += '<tr><td style="padding: 4px 0; color: #737373; vertical-align: top;">Conditions:</td><td style="padding: 4px 0; color: #171717;">';
    conditionLines.forEach(line => { historyHtml += `${line}<br/>`; });
    historyHtml += '</td></tr>';
  } else {
    historyHtml += '<tr><td style="padding: 4px 0; color: #737373;">Conditions:</td><td style="padding: 4px 0; color: #171717;">No conditions reported</td></tr>';
  }

  // Build medications & allergies section
  let medsHtml = '';
  medsHtml += `<tr><td style="padding: 4px 0; color: #737373;">On HRT:</td><td style="padding: 4px 0; color: #171717;">${intakeData.onHRT || 'N/A'}${intakeData.onHRT === 'Yes' && intakeData.hrtDetails ? ` — ${intakeData.hrtDetails}` : ''}</td></tr>`;
  if (intakeData.onMedications === 'No') {
    medsHtml += '<tr><td style="padding: 4px 0; color: #737373;">Medications:</td><td style="padding: 4px 0; color: #171717;">None</td></tr>';
  } else if (intakeData.onMedications === 'Yes' && intakeData.currentMedications) {
    medsHtml += `<tr><td style="padding: 4px 0; color: #737373; vertical-align: top;">Medications:</td><td style="padding: 4px 0; color: #171717;">${intakeData.currentMedications}</td></tr>`;
  }
  if (intakeData.hasAllergies === 'No') {
    medsHtml += '<tr><td style="padding: 4px 0; color: #737373;">Allergies:</td><td style="padding: 4px 0; color: #171717;">None</td></tr>';
  } else if (intakeData.hasAllergies === 'Yes' && intakeData.allergiesList) {
    medsHtml += `<tr><td style="padding: 4px 0; color: #737373;">Allergies:</td><td style="padding: 4px 0; color: #171717;">${intakeData.allergiesList}</td></tr>`;
  }

  // Emergency contact
  let emergencyHtml = `<tr><td style="padding: 4px 0; color: #737373;">Emergency Contact:</td><td style="padding: 4px 0; color: #171717;">${intakeData.emergencyContactName || 'N/A'} — ${intakeData.emergencyContactPhone || 'N/A'} (${intakeData.emergencyContactRelationship || 'N/A'})</td></tr>`;

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
      <tr><td style="padding: 4px 0; color: #737373;">Injury Type:</td><td style="padding: 4px 0; color: #171717; font-weight: 500;">${injuryTypeLabels[formData.injuryType] || 'Not specified'}</td></tr>
      <tr><td style="padding: 4px 0; color: #737373;">Location:</td><td style="padding: 4px 0; color: #171717; font-weight: 500;">${locationLabels[formData.injuryLocation] || 'Not specified'}</td></tr>
      <tr><td style="padding: 4px 0; color: #737373;">Duration:</td><td style="padding: 4px 0; color: #171717; font-weight: 500;">${durationLabels[formData.injuryDuration] || 'Not specified'}</td></tr>
      <tr><td style="padding: 4px 0; color: #737373;">Recovery Goals:</td><td style="padding: 4px 0; color: #171717; font-weight: 500;">${(formData.recoveryGoal || []).map(g => goalLabels[g] || g).join(', ') || 'Not specified'}</td></tr>
      <tr><td style="padding: 4px 0; color: #737373;">Recommended:</td><td style="padding: 4px 0; color: #171717; font-weight: 500;">BPC-157 + TB-4 Protocol</td></tr>
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
      <tr><td style="padding: 4px 0; color: #737373;">Symptoms:</td><td style="padding: 4px 0; color: #171717; font-weight: 500;">${(formData.symptoms || []).map(s => symptomLabels[s] || s).join(', ') || 'Not specified'}</td></tr>
      <tr><td style="padding: 4px 0; color: #737373;">Goals:</td><td style="padding: 4px 0; color: #171717; font-weight: 500;">${(formData.goals || []).map(g => goalLabels[g] || g).join(', ') || 'Not specified'}</td></tr>
      <tr><td style="padding: 4px 0; color: #737373;">Recommended Panel:</td><td style="padding: 4px 0; color: #171717; font-weight: 500;">${recommendation?.panel === 'elite' ? 'Elite Panel ($750)' : 'Essential Panel ($350)'}</td></tr>
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
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px;">
                <tr><td style="padding: 4px 0; color: #737373; width: 120px;">Name:</td><td style="padding: 4px 0; color: #171717; font-weight: 600;">${firstName} ${lastName}</td></tr>
                <tr><td style="padding: 4px 0; color: #737373;">Email:</td><td style="padding: 4px 0;"><a href="mailto:${email}" style="color: #171717;">${email}</a></td></tr>
                <tr><td style="padding: 4px 0; color: #737373;">Phone:</td><td style="padding: 4px 0;"><a href="tel:${phone}" style="color: #171717;">${phone}</a></td></tr>
                ${personalHtml}
              </table>
            </td>
          </tr>

          <tr><td style="padding: 0 32px;"><hr style="border: none; border-top: 1px solid #e5e5e5; margin: 0;"></td></tr>

          <!-- Assessment Details -->
          <tr>
            <td style="padding: 24px 32px;">
              <h2 style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #737373; text-transform: uppercase; letter-spacing: 0.05em;">Assessment Details</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px;">
                ${detailsHtml}
              </table>
            </td>
          </tr>

          <tr><td style="padding: 0 32px;"><hr style="border: none; border-top: 1px solid #e5e5e5; margin: 0;"></td></tr>

          <!-- Healthcare Providers -->
          <tr>
            <td style="padding: 24px 32px;">
              <h2 style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #737373; text-transform: uppercase; letter-spacing: 0.05em;">Healthcare Providers</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px;">
                ${providersHtml}
              </table>
            </td>
          </tr>

          <tr><td style="padding: 0 32px;"><hr style="border: none; border-top: 1px solid #e5e5e5; margin: 0;"></td></tr>

          <!-- Medical History -->
          <tr>
            <td style="padding: 24px 32px;">
              <h2 style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #737373; text-transform: uppercase; letter-spacing: 0.05em;">Medical History</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px;">
                ${historyHtml}
              </table>
            </td>
          </tr>

          <tr><td style="padding: 0 32px;"><hr style="border: none; border-top: 1px solid #e5e5e5; margin: 0;"></td></tr>

          <!-- Medications & Allergies -->
          <tr>
            <td style="padding: 24px 32px;">
              <h2 style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #737373; text-transform: uppercase; letter-spacing: 0.05em;">Medications & Allergies</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px;">
                ${medsHtml}
              </table>
            </td>
          </tr>

          <tr><td style="padding: 0 32px;"><hr style="border: none; border-top: 1px solid #e5e5e5; margin: 0;"></td></tr>

          <!-- Emergency Contact -->
          <tr>
            <td style="padding: 24px 32px;">
              <h2 style="margin: 0 0 16px; font-size: 14px; font-weight: 600; color: #737373; text-transform: uppercase; letter-spacing: 0.05em;">Emergency Contact</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 14px;">
                ${emergencyHtml}
              </table>
            </td>
          </tr>

          ${intakeData.additionalNotes ? `
          <tr>
            <td style="padding: 0 32px 24px;">
              <div style="background: #fafafa; border-radius: 8px; padding: 16px;">
                <h3 style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #737373; text-transform: uppercase;">Additional Notes</h3>
                <p style="margin: 0; font-size: 14px; color: #525252; line-height: 1.6;">${intakeData.additionalNotes}</p>
              </div>
            </td>
          </tr>
          ` : ''}

          ${pdfUrl ? `
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
    to: 'intake@range-medical.com',
    subject: `Assessment Complete: ${firstName} ${lastName} — ${pathName}`,
    html: emailHtml
  });

  if (error) {
    console.error('Consolidated email error:', error);
    throw error;
  }
}
