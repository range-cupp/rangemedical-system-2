// pages/api/consent-to-ghl.js
// Syncs consent form data to GoHighLevel - finds contact by phone, updates demographics and adds consent info

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
    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      address,
      city,
      state,
      zip,
      consentType,
      consentDate,
      customFieldKey,
      customFieldValue,
      tags,
      signatureUrl,
      pdfUrl,
      healthScreening,
      intakeData
    } = req.body;

    console.log(`📝 Processing ${consentType || 'consent'} form for: ${firstName} ${lastName}`);

    // Format phone number for GHL (remove non-digits, ensure +1 prefix)
    let formattedPhone = phone?.replace(/\D/g, '');
    if (formattedPhone && formattedPhone.length === 10) {
      formattedPhone = '+1' + formattedPhone;
    } else if (formattedPhone && formattedPhone.length === 11 && formattedPhone.startsWith('1')) {
      formattedPhone = '+' + formattedPhone;
    }

    // ============================================
    // FIND EXISTING CONTACT - PRIORITIZE PHONE
    // ============================================
    let contactId = null;
    
    // First, try to find by phone number (most reliable)
    if (formattedPhone) {
      console.log('🔍 Searching for contact by phone:', formattedPhone);
      
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
            'Content-Type': 'application/json'
          }
        }
      );

      if (phoneSearchResponse.ok) {
        const phoneSearchData = await phoneSearchResponse.json();
        if (phoneSearchData.contacts && phoneSearchData.contacts.length > 0) {
          contactId = phoneSearchData.contacts[0].id;
          console.log('✅ Found contact by phone:', contactId);
        }
      }
    }

    // If not found by phone, try email
    if (!contactId && email) {
      console.log('🔍 Searching for contact by email:', email);
      
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
            'Content-Type': 'application/json'
          }
        }
      );

      if (emailSearchResponse.ok) {
        const emailSearchData = await emailSearchResponse.json();
        if (emailSearchData.contacts && emailSearchData.contacts.length > 0) {
          contactId = emailSearchData.contacts[0].id;
          console.log('✅ Found contact by email:', contactId);
        }
      }
    }

    // ============================================
    // BUILD CUSTOM FIELDS
    // ============================================
    const customFields = [];
    
    // Main consent status field
    if (customFieldKey && customFieldValue) {
      customFields.push({
        key: customFieldKey,
        field_value: customFieldValue
      });
    }
    
    // Signature URL
    if (signatureUrl) {
      customFields.push({
        key: `${consentType}_signature_url`,
        field_value: signatureUrl
      });
    }
    
    // PDF URL
    if (pdfUrl) {
      customFields.push({
        key: `${consentType}_pdf_url`,
        field_value: pdfUrl
      });
    }

    // Consent date
    if (consentDate) {
      customFields.push({
        key: `${consentType}_date`,
        field_value: consentDate
      });
    }

    // ============================================
    // BUILD CONTACT PAYLOAD
    // ============================================
    const contactPayload = {
      tags: tags || []
    };

    // Add custom fields if any
    if (customFields.length > 0) {
      contactPayload.customFields = customFields;
    }

    // ALWAYS update demographics when provided
    if (firstName) contactPayload.firstName = firstName;
    if (lastName) contactPayload.lastName = lastName;
    if (email) contactPayload.email = email;
    if (formattedPhone) contactPayload.phone = formattedPhone;

    // Address fields (if provided)
    if (address) contactPayload.address1 = address;
    if (city) contactPayload.city = city;
    if (state) contactPayload.state = state;
    if (zip) contactPayload.postalCode = zip;

    // Date of Birth - format for GHL (YYYY-MM-DD)
    if (dateOfBirth) {
      let dobFormatted = dateOfBirth;
      // Handle MM/DD/YYYY format
      if (dateOfBirth.includes('/')) {
        const [month, day, year] = dateOfBirth.split('/');
        dobFormatted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      contactPayload.dateOfBirth = dobFormatted;
    }

    console.log('📤 Payload to GHL:', JSON.stringify({
      ...contactPayload,
      customFields: customFields.length + ' fields'
    }));

    // ============================================
    // CREATE OR UPDATE CONTACT
    // ============================================
    let response;
    let finalContactId;
    
    if (contactId) {
      // UPDATE existing contact - DO NOT include locationId
      console.log('📝 Updating existing contact:', contactId);
      response = await fetch(
        `https://services.leadconnectorhq.com/contacts/${contactId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Version': '2021-07-28',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(contactPayload)
        }
      );
      finalContactId = contactId;
    } else {
      // CREATE new contact - include locationId only for create
      console.log('➕ Creating new contact');
      const createPayload = {
        ...contactPayload,
        locationId: GHL_LOCATION_ID
      };
      response = await fetch(
        'https://services.leadconnectorhq.com/contacts/',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Version': '2021-07-28',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(createPayload)
        }
      );
    }

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ GHL API Error:', result);
      return res.status(response.status).json({ 
        error: 'GHL sync failed', 
        details: result 
      });
    }

    // Get the contact ID from response (for new contacts)
    if (!finalContactId) {
      finalContactId = result.contact?.id;
    }
    console.log('✅ Contact synced:', finalContactId, contactId ? '(updated)' : '(created)');

    // ============================================
    // ADD NOTE TO CONTACT
    // ============================================
    const consentNames = {
      'blood-draw': 'Blood Draw Consent',
      'blood_draw': 'Blood Draw Consent',
      'hrt': 'HRT Consent',
      'peptide': 'Peptide Therapy Consent',
      'hbot': 'HBOT Consent',
      'iv': 'IV & Injection Consent',
      'iv-injection': 'IV & Injection Consent',
      'iv_injection': 'IV & Injection Consent',
      'weight-loss': 'Weight Loss Program Consent',
      'weight_loss': 'Weight Loss Program Consent',
      'hipaa': 'HIPAA Acknowledgment',
      'red-light': 'Red Light Therapy Consent',
      'red_light': 'Red Light Therapy Consent',
      'prp': 'PRP Consent',
      'testosterone-pellet': 'Testosterone Pellet Consent',
      'testosterone_pellet': 'Testosterone Pellet Consent',
      'trt-fertility': 'TRT Fertility Waiver',
      'trt_fertility': 'TRT Fertility Waiver',
      'exosome': 'Exosome IV Consent',
      'exosome-iv': 'Exosome IV Consent',
      'exosome_iv': 'Exosome IV Consent'
    };
    
    const consentName = consentNames[consentType] || `${consentType} Consent`;
    
    let noteContent = `✅ ${consentName.toUpperCase()} SIGNED\n`;
    noteContent += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    noteContent += `Date: ${consentDate || new Date().toLocaleDateString()}\n`;
    noteContent += `Patient: ${firstName} ${lastName}\n`;
    noteContent += `Email: ${email || 'Not provided'}\n`;
    noteContent += `Phone: ${phone || 'Not provided'}\n`;
    
    if (dateOfBirth) {
      noteContent += `DOB: ${dateOfBirth}\n`;
    }
    
    if (pdfUrl) {
      noteContent += `\n📄 PDF: ${pdfUrl}\n`;
    }
    
    if (signatureUrl) {
      noteContent += `✍️ Signature: ${signatureUrl}\n`;
    }

    // Add health screening info for IV consent (G6PD alerts)
    if (healthScreening) {
      if (healthScreening.g6pdCritical) {
        noteContent += `\n🚨 CRITICAL ALERT: G6PD Deficiency detected!\n`;
        if (healthScreening.gettingMB) noteContent += `- Getting Methylene Blue: YES\n`;
        if (healthScreening.gettingVC) noteContent += `- Getting High Dose Vitamin C: YES\n`;
        noteContent += `⚠️ LAB TESTING REQUIRED BEFORE TREATMENT\n`;
      }
      if (healthScreening.yesAnswers && healthScreening.yesAnswers.length > 0) {
        noteContent += `\n⚠️ Health screening flags:\n`;
        healthScreening.yesAnswers.forEach(answer => {
          noteContent += `- ${answer}\n`;
        });
      }
    }

    // Add intake data if provided
    if (intakeData) {
      noteContent += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      noteContent += `ADDITIONAL INFORMATION:\n`;
      
      if (intakeData.howHeardAboutUs) {
        noteContent += `How heard about us: ${intakeData.howHeardAboutUs}\n`;
      }
      if (intakeData.whatBringsYou) {
        noteContent += `What brings them in: ${intakeData.whatBringsYou}\n`;
      }
      if (intakeData.hasPCP === 'Yes') {
        noteContent += `Has PCP: Yes - ${intakeData.pcpName || 'Name not provided'}\n`;
      }
      if (intakeData.recentHospitalization === 'Yes') {
        noteContent += `Recent hospitalization: Yes\n`;
        noteContent += `  Reason: ${intakeData.hospitalizationReason || 'Not specified'}\n`;
      }
      if (intakeData.conditions && intakeData.conditions !== 'None') {
        noteContent += `Medical conditions: ${intakeData.conditions}\n`;
      }
      if (intakeData.onHRT === 'Yes') {
        noteContent += `Currently on HRT: Yes - ${intakeData.hrtDetails || 'Details not provided'}\n`;
      }
      if (intakeData.onMedications === 'Yes') {
        noteContent += `On medications: Yes - ${intakeData.currentMedications || 'Not listed'}\n`;
      }
      if (intakeData.hasAllergies === 'Yes') {
        noteContent += `Has allergies: Yes - ${intakeData.allergies || 'Not listed'}\n`;
      }
    }

    // Add note to contact
    if (finalContactId) {
      try {
        const noteResponse = await fetch(
          `https://services.leadconnectorhq.com/contacts/${finalContactId}/notes`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${GHL_API_KEY}`,
              'Version': '2021-07-28',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              body: noteContent,
              userId: null
            })
          }
        );
        
        if (!noteResponse.ok) {
          const noteError = await noteResponse.json();
          console.error('⚠️ Failed to add note:', noteError);
        } else {
          console.log('✅ Note added successfully');
        }
      } catch (noteError) {
        console.error('⚠️ Failed to add note:', noteError);
      }
    }

    // ============================================
    // REMOVE PENDING TAG IF EXISTS
    // ============================================
    try {
      const pendingTag = `${consentType}-pending`;
      const contactResponse = await fetch(
        `https://services.leadconnectorhq.com/contacts/${finalContactId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Version': '2021-07-28'
          }
        }
      );
      
      if (contactResponse.ok) {
        const contactData = await contactResponse.json();
        const currentTags = contactData.contact?.tags || [];
        const updatedTags = currentTags.filter(tag => tag !== pendingTag);
        
        if (updatedTags.length !== currentTags.length) {
          await fetch(
            `https://services.leadconnectorhq.com/contacts/${finalContactId}`,
            {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${GHL_API_KEY}`,
                'Version': '2021-07-28',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ tags: updatedTags })
            }
          );
          console.log('✅ Removed pending tag:', pendingTag);
        }
      }
    } catch (tagError) {
      console.error('⚠️ Failed to remove pending tag:', tagError);
    }

    // ============================================
    // SEND EMAIL NOTIFICATION VIA RESEND
    // ============================================
    if (RESEND_API_KEY) {
      try {
        console.log('📧 Sending consent email notification via Resend...');

        const pstDate = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles', dateStyle: 'long' });
        const pstTime = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles', timeStyle: 'short' });

        // Build health screening HTML
        let healthHtml = '';
        if (healthScreening) {
          if (healthScreening.g6pdCritical) {
            healthHtml += `
            <div style="background: #fef2f2; padding: 12px; border-left: 4px solid #dc2626; margin: 10px 0;">
              <strong>🚨 CRITICAL: G6PD Deficiency Detected</strong><br>
              ${healthScreening.gettingMB ? '<div>- Getting Methylene Blue: YES</div>' : ''}
              ${healthScreening.gettingVC ? '<div>- Getting High Dose Vitamin C: YES</div>' : ''}
              <div style="margin-top: 6px; font-weight: bold;">⚠️ LAB TESTING REQUIRED BEFORE TREATMENT</div>
            </div>`;
          }
          if (healthScreening.yesAnswers && healthScreening.yesAnswers.length > 0) {
            healthHtml += `
            <div style="background: #fffbcc; padding: 12px; border-left: 4px solid #f0c000; margin: 10px 0;">
              <strong>⚠️ Health Screening Flags:</strong>
              <ul style="margin: 5px 0 0 20px;">${healthScreening.yesAnswers.map(a => `<li>${a}</li>`).join('')}</ul>
            </div>`;
          }
        }

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
    .btn { display: inline-block; background: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 5px 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">✅ Consent Signed</h1>
      <p style="margin: 5px 0 0 0; font-size: 18px;">${consentName}</p>
    </div>

    <div class="section">
      <div class="section-title">Patient Information</div>
      <div class="field"><span class="label">Name:</span> <span class="value">${firstName} ${lastName}</span></div>
      <div class="field"><span class="label">Email:</span> <span class="value">${email || 'N/A'}</span></div>
      <div class="field"><span class="label">Phone:</span> <span class="value">${phone || 'N/A'}</span></div>
      <div class="field"><span class="label">DOB:</span> <span class="value">${dateOfBirth || 'N/A'}</span></div>
    </div>

    ${healthHtml}

    ${(pdfUrl || signatureUrl) ? `
    <div class="section">
      <div class="section-title">Documents</div>
      ${pdfUrl ? `<div class="field"><a href="${pdfUrl}" style="color: #0066cc;">📄 View Consent PDF</a></div>` : ''}
      ${signatureUrl ? `<div class="field"><a href="${signatureUrl}" style="color: #0066cc;">✍️ View Signature</a></div>` : ''}
    </div>
    ` : ''}

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

        const emailPayload = {
          from: 'Range Medical <notifications@range-medical.com>',
          to: 'intake@range-medical.com',
          subject: `✅ Consent Signed: ${consentName} — ${firstName} ${lastName}`,
          html: emailHtml
        };

        // Fetch and attach consent PDF
        if (pdfUrl) {
          try {
            console.log('📥 Fetching consent PDF for attachment...');
            const pdfResponse = await fetch(pdfUrl);
            if (pdfResponse.ok) {
              const pdfBuffer = await pdfResponse.arrayBuffer();
              const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');
              emailPayload.attachments = [
                {
                  filename: `consent-${consentType}-${lastName}-${firstName}.pdf`,
                  content: pdfBase64
                }
              ];
              console.log('📎 PDF attachment added to consent email');
            } else {
              console.log('⚠️ Could not fetch consent PDF:', pdfResponse.status);
            }
          } catch (pdfError) {
            console.log('⚠️ Error fetching consent PDF for attachment:', pdfError.message);
          }
        }

        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(emailPayload)
        });

        const emailResult = await emailResponse.json();

        if (emailResponse.ok) {
          console.log('✅ Consent email sent successfully:', emailResult.id);
        } else {
          console.error('❌ Consent email failed:', emailResult);
        }
      } catch (emailError) {
        console.error('📧 Email error (non-blocking):', emailError);
        // Don't fail the consent flow if email fails
      }
    } else {
      console.log('⚠️ RESEND_API_KEY not configured - skipping consent email');
    }

    console.log('✅ GHL sync complete for:', finalContactId);
    
    return res.status(200).json({ 
      success: true, 
      contactId: finalContactId,
      action: contactId ? 'updated' : 'created'
    });

  } catch (error) {
    console.error('❌ GHL sync error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
}
