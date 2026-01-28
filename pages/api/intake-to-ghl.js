// pages/api/intake-to-ghl.js
// Syncs intake form data to GoHighLevel - creates/updates contact
// FIXED: Handles flat data structure from frontend (not nested in intakeData)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const GHL_API_KEY = process.env.GHL_API_KEY;
  const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!GHL_API_KEY || !GHL_LOCATION_ID) {
    console.error('Missing GHL credentials');
    return res.status(500).json({ error: 'GHL configuration missing' });
  }

  try {
    console.log('=== INTAKE TO GHL API CALLED ===');
    console.log('Request body keys:', Object.keys(req.body));
    
    // The frontend sends data FLAT (not nested in intakeData)
    const data = req.body;
    
    // Extract all fields - frontend sends them flat
    const firstName = data.firstName;
    const lastName = data.lastName;
    const email = data.email;
    const phone = data.phone;
    const dateOfBirth = data.dateOfBirth;
    const gender = data.gender;
    const address = data.streetAddress;
    const city = data.city;
    const state = data.state;
    const zip = data.postalCode;
    
    // Health concerns - FLAT from frontend
    const injured = data.injured;
    const injuryDescription = data.injuryDescription;
    const injuryLocation = data.injuryLocation;
    const injuryDate = data.injuryDate;
    const interestedInOptimization = data.interestedInOptimization;
    const symptoms = data.symptoms || [];
    const symptomFollowups = data.symptomFollowups || {};
    const symptomDuration = data.symptomDuration;
    const additionalNotes = data.additionalNotes;
    
    // How heard about us
    const howHeard = data.howHeardAboutUs;
    
    // Healthcare providers
    const hasPCP = data.hasPCP;
    const pcpName = data.pcpName;
    const recentHospitalization = data.recentHospitalization;
    const hospitalizationReason = data.hospitalizationReason;
    
    // Medical history
    const medicalHistory = data.medicalHistory || {};
    
    // Medications
    const onHRT = data.onHRT;
    const hrtDetails = data.hrtDetails;
    const onMedications = data.onMedications;
    const currentMedications = data.currentMedications;
    const hasAllergies = data.hasAllergies;
    const allergies = data.allergies;
    
    // Minor/Guardian
    const isMinor = data.isMinor;
    const guardianName = data.guardianName;
    const guardianRelationship = data.guardianRelationship;

    console.log('Parsed data - injured:', injured);
    console.log('Parsed data - interestedInOptimization:', interestedInOptimization);
    console.log('Parsed data - symptoms:', symptoms);
    console.log('Parsed data - medicalHistory keys:', Object.keys(medicalHistory));

    // Format phone number for GHL (E.164 format: +1XXXXXXXXXX)
    let formattedPhone = null;
    if (phone) {
      const digits = phone.replace(/\D/g, '');
      if (digits.length === 10) {
        formattedPhone = '+1' + digits;
      } else if (digits.length === 11 && digits.startsWith('1')) {
        formattedPhone = '+' + digits;
      }
    }

    console.log('Formatted phone:', formattedPhone);

    // ============================================
    // SEARCH FOR EXISTING CONTACT
    // ============================================
    let contactId = null;
    
    // Search by phone first
    if (formattedPhone) {
      console.log('Searching for contact by phone:', formattedPhone);
      const phoneSearchParams = new URLSearchParams({
        locationId: GHL_LOCATION_ID,
        query: formattedPhone
      });

      const phoneSearchResponse = await fetch(
        `https://services.leadconnectorhq.com/contacts/?${phoneSearchParams}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Version': '2021-07-28',
            'Accept': 'application/json'
          }
        }
      );

      if (phoneSearchResponse.ok) {
        const phoneSearchData = await phoneSearchResponse.json();
        if (phoneSearchData.contacts && phoneSearchData.contacts.length > 0) {
          contactId = phoneSearchData.contacts[0].id;
          console.log('Found existing contact by phone:', contactId);
        }
      }
    }
    
    // If not found by phone, search by email
    if (!contactId && email) {
      console.log('Searching for contact by email:', email);
      const emailSearchParams = new URLSearchParams({
        locationId: GHL_LOCATION_ID,
        query: email
      });

      const emailSearchResponse = await fetch(
        `https://services.leadconnectorhq.com/contacts/?${emailSearchParams}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Version': '2021-07-28',
            'Accept': 'application/json'
          }
        }
      );

      if (emailSearchResponse.ok) {
        const emailSearchData = await emailSearchResponse.json();
        if (emailSearchData.contacts && emailSearchData.contacts.length > 0) {
          contactId = emailSearchData.contacts[0].id;
          console.log('Found existing contact by email:', contactId);
        }
      }
    }

    // ============================================
    // BUILD COMPREHENSIVE NOTES
    // ============================================
    const now = new Date();
    const pstDate = now.toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles' });
    const pstTime = now.toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles', hour: '2-digit', minute: '2-digit' });
    
    let notes = `══════════════════════════════════════\n`;
    notes += `   MEDICAL INTAKE FORM SUBMITTED\n`;
    notes += `══════════════════════════════════════\n\n`;
    notes += `📅 Date: ${pstDate} at ${pstTime} PST\n`;
    notes += `👤 Patient: ${firstName} ${lastName}\n`;
    notes += `📧 Email: ${email || 'N/A'}\n`;
    notes += `📱 Phone: ${phone || 'N/A'}\n`;
    notes += `🎂 DOB: ${dateOfBirth || 'N/A'}\n`;
    if (gender) notes += `⚥ Gender: ${gender}\n`;
    
    // ============================================
    // MINOR / GUARDIAN INFO
    // ============================================
    if (isMinor === 'Yes') {
      notes += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      notes += `👶 MINOR PATIENT\n`;
      if (guardianName) notes += `   Guardian: ${guardianName}\n`;
      if (guardianRelationship) notes += `   Relationship: ${guardianRelationship}\n`;
    }
    
    // ============================================
    // DECISION TREE - INJURY (Door 1)
    // ============================================
    if (injured === 'Yes') {
      notes += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      notes += `🩹 INJURY:\n`;
      if (injuryDescription) notes += `   What: ${injuryDescription}\n`;
      if (injuryLocation) notes += `   Where: ${injuryLocation}\n`;
      if (injuryDate) notes += `   When: ${injuryDate}\n`;
    }
    
    // ============================================
    // DECISION TREE - OPTIMIZATION (Door 2)
    // ============================================
    if (interestedInOptimization === 'Yes') {
      notes += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      notes += `⚡ ENERGY & OPTIMIZATION:\n`;
      
      // List symptoms
      if (symptoms && symptoms.length > 0) {
        notes += `\n   Symptoms reported:\n`;
        symptoms.forEach(symptom => {
          notes += `   • ${symptom}\n`;
        });
      }
      
      // Symptom follow-ups with details
      if (symptomFollowups && Object.keys(symptomFollowups).length > 0) {
        notes += `\n   Follow-up details:\n`;
        
        if (symptomFollowups.brainFog) notes += `   • Brain fog affects work/tasks: ${symptomFollowups.brainFog}\n`;
        if (symptomFollowups.fatigue) notes += `   • Energy lowest: ${symptomFollowups.fatigue}\n`;
        if (symptomFollowups.sleep) notes += `   • Main sleep issue: ${symptomFollowups.sleep}\n`;
        if (symptomFollowups.weight) notes += `   • Diet/exercise helped: ${symptomFollowups.weight}\n`;
        if (symptomFollowups.libido) notes += `   • Hormone levels checked: ${symptomFollowups.libido}\n`;
        if (symptomFollowups.mood) notes += `   • Mood changes: ${symptomFollowups.mood}\n`;
        if (symptomFollowups.recovery) notes += `   • Soreness duration: ${symptomFollowups.recovery}\n`;
        if (symptomFollowups.muscle) notes += `   • Muscle loss with exercise: ${symptomFollowups.muscle}\n`;
        if (symptomFollowups.hair) notes += `   • Hair thinning location: ${symptomFollowups.hair}\n`;
      }
      
      // Duration
      if (symptomDuration) {
        notes += `\n   Duration: ${symptomDuration}\n`;
      }
    }
    
    // ============================================
    // ADDITIONAL NOTES
    // ============================================
    if (additionalNotes) {
      notes += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      notes += `📝 ADDITIONAL NOTES:\n`;
      notes += `   ${additionalNotes}\n`;
    }
    
    // ============================================
    // HOW HEARD ABOUT US
    // ============================================
    if (howHeard) {
      notes += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      notes += `📣 HOW HEARD ABOUT US:\n`;
      notes += `   ${howHeard}\n`;
    }
    
    // ============================================
    // HEALTHCARE PROVIDERS
    // ============================================
    notes += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    notes += `👨‍⚕️ HEALTHCARE PROVIDERS:\n`;
    notes += `   Has PCP: ${hasPCP || 'N/A'}\n`;
    if (hasPCP === 'Yes' && pcpName) {
      notes += `   PCP Name: ${pcpName}\n`;
    }
    notes += `   Recent Hospitalization: ${recentHospitalization || 'N/A'}\n`;
    if (recentHospitalization === 'Yes' && hospitalizationReason) {
      notes += `   Reason: ${hospitalizationReason}\n`;
    }
    
    // ============================================
    // MEDICAL HISTORY
    // ============================================
    if (medicalHistory && Object.keys(medicalHistory).length > 0) {
      notes += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      notes += `🏥 MEDICAL HISTORY:\n`;
      
      const conditionOrder = [
        { key: 'hypertension', label: 'High Blood Pressure' },
        { key: 'highCholesterol', label: 'High Cholesterol' },
        { key: 'heartDisease', label: 'Heart Disease' },
        { key: 'diabetes', label: 'Diabetes' },
        { key: 'thyroid', label: 'Thyroid Disorder' },
        { key: 'depression', label: 'Depression/Anxiety' },
        { key: 'eatingDisorder', label: 'Eating Disorder' },
        { key: 'kidney', label: 'Kidney Disease' },
        { key: 'liver', label: 'Liver Disease' },
        { key: 'autoimmune', label: 'Autoimmune Disorder' },
        { key: 'cancer', label: 'Cancer' }
      ];
      
      conditionOrder.forEach(({ key, label }) => {
        const condition = medicalHistory[key];
        if (condition && condition.response) {
          let line = `   • ${label}: ${condition.response}`;
          if (condition.response === 'Yes') {
            if (condition.type) line += ` (Type: ${condition.type})`;
            if (condition.year) line += ` (Year: ${condition.year})`;
          }
          notes += line + '\n';
        }
      });
    }
    
    // ============================================
    // MEDICATIONS & ALLERGIES
    // ============================================
    notes += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    notes += `💊 MEDICATIONS & ALLERGIES:\n`;
    
    notes += `   Currently on HRT: ${onHRT || 'N/A'}\n`;
    if (onHRT === 'Yes' && hrtDetails) {
      notes += `   HRT Details: ${hrtDetails}\n`;
    }
    
    notes += `   On Other Medications: ${onMedications || 'N/A'}\n`;
    if (onMedications === 'Yes' && currentMedications) {
      notes += `   Medications: ${currentMedications}\n`;
    }
    
    notes += `   Has Allergies: ${hasAllergies || 'N/A'}\n`;
    if (hasAllergies === 'Yes' && allergies) {
      notes += `   Allergies: ${allergies}\n`;
    }

    console.log('Built notes length:', notes.length);

    // ============================================
    // BUILD CONTACT PAYLOAD WITH CUSTOM FIELD
    // ============================================
    const contactPayload = {
      locationId: GHL_LOCATION_ID,
      // Set the Medical Intake Form custom field to checked
      customFields: [
        {
          key: 'contact.medical_intake_form',
          field_value: true
        }
      ]
    };
    
    if (firstName) contactPayload.firstName = firstName;
    if (lastName) contactPayload.lastName = lastName;
    if (email) contactPayload.email = email;
    if (formattedPhone) contactPayload.phone = formattedPhone;
    if (address) contactPayload.address1 = address;
    if (city) contactPayload.city = city;
    if (state) contactPayload.state = state;
    if (zip) contactPayload.postalCode = zip;

    // Format DOB for GHL (YYYY-MM-DD)
    if (dateOfBirth) {
      let dobFormatted = dateOfBirth;
      if (dateOfBirth.includes('/')) {
        const parts = dateOfBirth.split('/');
        if (parts.length === 3) {
          const [month, day, year] = parts;
          dobFormatted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }
      contactPayload.dateOfBirth = dobFormatted;
    }

    console.log('Contact payload:', JSON.stringify(contactPayload, null, 2));

    // ============================================
    // CREATE OR UPDATE CONTACT
    // ============================================
    let response;
    let finalContactId = contactId;
    
    if (contactId) {
      // Update existing contact
      const updatePayload = { ...contactPayload };
      delete updatePayload.locationId;
      
      console.log('Updating existing contact:', contactId);
      
      response = await fetch(
        `https://services.leadconnectorhq.com/contacts/${contactId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Version': '2021-07-28',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatePayload)
        }
      );
    } else {
      // Create new contact
      console.log('Creating new contact');
      response = await fetch(
        'https://services.leadconnectorhq.com/contacts/',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Version': '2021-07-28',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(contactPayload)
        }
      );
    }

    const responseText = await response.text();
    console.log('GHL Response status:', response.status);
    console.log('GHL Response body:', responseText);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse GHL response:', responseText);
      return res.status(500).json({ 
        error: 'Invalid GHL response', 
        details: responseText 
      });
    }

    if (!response.ok) {
      console.error('GHL API Error:', result);
      return res.status(response.status).json({ 
        error: 'GHL sync failed', 
        details: result 
      });
    }

    // Get contact ID from response if we created a new one
    if (!finalContactId && result.contact?.id) {
      finalContactId = result.contact.id;
    }

    // ============================================
    // ADD NOTE TO CONTACT
    // ============================================
    if (finalContactId) {
      console.log('Adding note to contact:', finalContactId);
      
      const noteResponse = await fetch(
        `https://services.leadconnectorhq.com/contacts/${finalContactId}/notes`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Version': '2021-07-28',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ body: notes })
        }
      );
      
      const noteText = await noteResponse.text();
      console.log('Note response status:', noteResponse.status);
      
      if (noteResponse.ok) {
        console.log('✅ Note added successfully');
      } else {
        console.error('❌ Failed to add note:', noteText);
      }
    }

    // ============================================
    // ADD TAGS BASED ON INTAKE DATA
    // ============================================
    const tags = ['intake-submitted'];
    
    if (injured === 'Yes') {
      tags.push('injury-recovery');
    }
    if (interestedInOptimization === 'Yes') {
      tags.push('optimization-interest');
    }
    if (isMinor === 'Yes') {
      tags.push('minor-patient');
    }

    if (finalContactId) {
      try {
        await fetch(
          `https://services.leadconnectorhq.com/contacts/${finalContactId}/tags`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${GHL_API_KEY}`,
              'Version': '2021-07-28',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ tags })
          }
        );
        console.log('✅ Tags added:', tags);
      } catch (tagError) {
        console.error('Tag error:', tagError);
      }
    }

    // ============================================
    // SEND EMAIL NOTIFICATION VIA RESEND
    // ============================================
    if (RESEND_API_KEY) {
      try {
        console.log('Sending email notification via Resend...');
        
        // Build HTML email
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #000; color: #fff; padding: 20px; text-align: center; }
    .section { margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 8px; }
    .section-title { font-weight: bold; color: #000; margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 5px; }
    .field { margin: 8px 0; }
    .label { font-weight: 600; color: #555; }
    .value { color: #000; }
    .highlight { background: #fffbcc; padding: 10px; border-left: 4px solid #f0c000; margin: 10px 0; }
    .injury-box { background: #fef2f2; padding: 10px; border-left: 4px solid #dc2626; margin: 10px 0; }
    .optimization-box { background: #f0f9ff; padding: 10px; border-left: 4px solid #0284c7; margin: 10px 0; }
    .btn { display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 5px 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">📋 New Medical Intake</h1>
    </div>
    
    <div class="section">
      <div class="section-title">Patient Information</div>
      <div class="field"><span class="label">Name:</span> <span class="value">${firstName} ${lastName}</span></div>
      <div class="field"><span class="label">Email:</span> <span class="value">${email || 'N/A'}</span></div>
      <div class="field"><span class="label">Phone:</span> <span class="value">${phone || 'N/A'}</span></div>
      <div class="field"><span class="label">DOB:</span> <span class="value">${dateOfBirth || 'N/A'}</span></div>
      ${gender ? `<div class="field"><span class="label">Gender:</span> <span class="value">${gender}</span></div>` : ''}
    </div>
    
    ${isMinor === 'Yes' ? `
    <div class="highlight">
      <strong>👶 Minor Patient</strong><br>
      Guardian: ${guardianName || 'N/A'} (${guardianRelationship || 'N/A'})
    </div>
    ` : ''}
    
    ${injured === 'Yes' ? `
    <div class="injury-box">
      <div class="section-title">🩹 Injury</div>
      <div class="field"><span class="label">What:</span> <span class="value">${injuryDescription || 'N/A'}</span></div>
      <div class="field"><span class="label">Where:</span> <span class="value">${injuryLocation || 'N/A'}</span></div>
      <div class="field"><span class="label">When:</span> <span class="value">${injuryDate || 'N/A'}</span></div>
    </div>
    ` : ''}
    
    ${interestedInOptimization === 'Yes' ? `
    <div class="optimization-box">
      <div class="section-title">⚡ Energy & Optimization</div>
      ${symptoms && symptoms.length > 0 ? `
        <div class="field"><span class="label">Symptoms:</span></div>
        <ul style="margin: 5px 0 10px 20px;">
          ${symptoms.map(s => `<li>${s}</li>`).join('')}
        </ul>
      ` : ''}
      ${symptomDuration ? `<div class="field"><span class="label">Duration:</span> <span class="value">${symptomDuration}</span></div>` : ''}
    </div>
    ` : ''}
    
    ${additionalNotes ? `
    <div class="section">
      <div class="section-title">📝 Additional Notes</div>
      <p>${additionalNotes}</p>
    </div>
    ` : ''}
    
    ${howHeard ? `
    <div class="section">
      <div class="section-title">📣 How They Heard About Us</div>
      <p>${howHeard}</p>
    </div>
    ` : ''}
    
    <div class="section">
      <div class="section-title">💊 Medications</div>
      <div class="field"><span class="label">On HRT:</span> <span class="value">${onHRT || 'N/A'}</span></div>
      ${onHRT === 'Yes' && hrtDetails ? `<div class="field"><span class="label">HRT Details:</span> <span class="value">${hrtDetails}</span></div>` : ''}
      <div class="field"><span class="label">Other Medications:</span> <span class="value">${onMedications || 'N/A'}</span></div>
      ${onMedications === 'Yes' && currentMedications ? `<div class="field"><span class="label">List:</span> <span class="value">${currentMedications}</span></div>` : ''}
      <div class="field"><span class="label">Allergies:</span> <span class="value">${hasAllergies || 'N/A'}</span></div>
      ${hasAllergies === 'Yes' && allergies ? `<div class="field"><span class="label">List:</span> <span class="value">${allergies}</span></div>` : ''}
    </div>
    
    <div style="text-align: center; margin-top: 20px;">
      <a href="tel:${phone?.replace(/\D/g, '')}" class="btn">📞 Call Patient</a>
      ${finalContactId ? `<a href="https://app.gohighlevel.com/contacts/detail/${finalContactId}" class="btn">View in GHL</a>` : ''}
    </div>
    
    <p style="text-align: center; color: #888; font-size: 12px; margin-top: 30px;">
      Submitted: ${pstDate} at ${pstTime} PST
    </p>
  </div>
</body>
</html>`;

        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Range Medical <onboarding@resend.dev>',
            to: 'intake@range-medical.com',
            subject: `📋 New Medical Intake: ${firstName} ${lastName}`,
            html: emailHtml
          })
        });

        const emailResult = await emailResponse.json();
        
        if (emailResponse.ok) {
          console.log('✅ Email sent successfully:', emailResult.id);
        } else {
          console.error('❌ Email failed:', emailResult);
        }
      } catch (emailError) {
        console.error('Email error:', emailError);
        // Don't fail the whole request if email fails
      }
    } else {
      console.log('⚠️ RESEND_API_KEY not configured - skipping email');
    }

    console.log('✅ GHL sync complete:', finalContactId);
    
    return res.status(200).json({ 
      success: true, 
      contactId: finalContactId,
      action: contactId ? 'updated' : 'created',
      tags
    });

  } catch (error) {
    console.error('GHL sync error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
}
