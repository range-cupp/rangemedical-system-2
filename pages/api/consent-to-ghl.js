// pages/api/consent-to-ghl.js
// Syncs consent form data to GoHighLevel - finds contact by phone, updates demographics and adds consent info

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const GHL_API_KEY = process.env.GHL_API_KEY;
  const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

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
      healthScreening, // For IV consent G6PD alerts
      intakeData // Additional data from forms
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
    // BUILD CONTACT PAYLOAD WITH DEMOGRAPHICS
    // ============================================
    const contactPayload = {
      locationId: GHL_LOCATION_ID,
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

    // Address fields (if provided - some consent forms may include these)
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
    
    if (contactId) {
      // UPDATE existing contact
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
    } else {
      // CREATE new contact
      console.log('➕ Creating new contact');
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

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ GHL API Error:', result);
      return res.status(response.status).json({ 
        error: 'GHL sync failed', 
        details: result 
      });
    }

    // Get the contact ID from response
    const finalContactId = contactId || result.contact?.id;
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
    
    let noteContent = `${consentName.toUpperCase()} SIGNED\n`;
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

    // Add intake data if provided (for forms with additional info)
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
              userId: null // System note
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
        // Don't fail the whole request for note errors
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
