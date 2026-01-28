// pages/api/intake-to-ghl.js
// Syncs intake form data to GoHighLevel - creates/updates contact
// Updated: Added decision tree fields (minor, optimization, symptoms)

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
    console.log('=== INTAKE TO GHL API CALLED ===');
    
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
      signatureUrl,
      pdfUrl,
      photoIdUrl,
      intakeData
    } = req.body;

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

    console.log('Input phone:', phone);
    console.log('Formatted phone:', formattedPhone);

    // First, try to find existing contact by phone (most common for SMS-sent forms)
    let contactId = null;
    
    // Search by phone first (since forms are often sent via SMS)
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

    // Build notes from intake data
    let notes = `══════════════════════════════════════\n`;
    notes += `   MEDICAL INTAKE FORM SUBMITTED\n`;
    notes += `══════════════════════════════════════\n\n`;
    notes += `Date: ${new Date().toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles' })}\n`;
    notes += `Patient: ${firstName} ${lastName}\n`;
    notes += `Email: ${email || 'N/A'}\n`;
    notes += `Phone: ${phone || 'N/A'}\n`;
    notes += `DOB: ${dateOfBirth || 'N/A'}\n`;
    
    if (intakeData) {
      // ============================================
      // MINOR / GUARDIAN INFO
      // ============================================
      if (intakeData.isMinor === 'Yes') {
        notes += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        notes += `👶 MINOR PATIENT\n`;
        if (intakeData.guardianName) notes += `Guardian: ${intakeData.guardianName}\n`;
        if (intakeData.guardianRelationship) notes += `Relationship: ${intakeData.guardianRelationship}\n`;
      }
      
      // ============================================
      // DECISION TREE - INJURY (Door 1)
      // ============================================
      if (intakeData.injured === 'Yes') {
        notes += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        notes += `🩹 INJURY:\n`;
        if (intakeData.injuryDescription) notes += `What: ${intakeData.injuryDescription}\n`;
        if (intakeData.injuryLocation) notes += `Where: ${intakeData.injuryLocation}\n`;
        if (intakeData.injuryDate) notes += `When: ${intakeData.injuryDate}\n`;
      }
      
      // ============================================
      // DECISION TREE - OPTIMIZATION (Door 2)
      // ============================================
      if (intakeData.interestedInOptimization === 'Yes') {
        notes += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        notes += `⚡ ENERGY & OPTIMIZATION:\n`;
        
        // List symptoms
        if (intakeData.symptoms && intakeData.symptoms.length > 0) {
          notes += `\nSymptoms reported:\n`;
          intakeData.symptoms.forEach(symptom => {
            notes += `• ${symptom}\n`;
          });
        }
        
        // Symptom follow-ups with details
        if (intakeData.symptomFollowups) {
          const followups = intakeData.symptomFollowups;
          notes += `\nFollow-up details:\n`;
          
          if (followups.brainFog) notes += `• Brain fog affects work/daily tasks: ${followups.brainFog}\n`;
          if (followups.fatigue) notes += `• Energy lowest: ${followups.fatigue}\n`;
          if (followups.sleep) notes += `• Main sleep issue: ${followups.sleep}\n`;
          if (followups.weight) notes += `• Diet/exercise helped: ${followups.weight}\n`;
          if (followups.libido) notes += `• Hormone levels checked: ${followups.libido}\n`;
          if (followups.mood) notes += `• Mood changes: ${followups.mood}\n`;
          if (followups.recovery) notes += `• Soreness duration: ${followups.recovery}\n`;
          if (followups.muscle) notes += `• Muscle loss with exercise: ${followups.muscle}\n`;
          if (followups.hair) notes += `• Hair thinning location: ${followups.hair}\n`;
        }
        
        // Duration
        if (intakeData.symptomDuration) {
          notes += `\nSymptom duration: ${intakeData.symptomDuration}\n`;
        }
      }
      
      // Legacy field (if not using new decision tree)
      if (intakeData.whatBringsYou && intakeData.injured !== 'Yes' && intakeData.interestedInOptimization !== 'Yes') {
        notes += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        notes += `CHIEF COMPLAINT:\n`;
        notes += `${intakeData.whatBringsYou}\n`;
      }
      
      // ============================================
      // ADDITIONAL NOTES
      // ============================================
      if (intakeData.additionalNotes) {
        notes += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        notes += `📝 ADDITIONAL NOTES:\n`;
        notes += `${intakeData.additionalNotes}\n`;
      }
      
      // ============================================
      // MEDICAL HISTORY
      // ============================================
      if (intakeData.medicalHistory) {
        notes += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        notes += `MEDICAL HISTORY:\n`;
        const conditionOrder = [
          'hypertension', 'highCholesterol', 'heartDisease', 
          'diabetes', 'thyroid', 'depression', 
          'kidney', 'liver', 'autoimmune', 'cancer'
        ];
        conditionOrder.forEach(key => {
          const condition = intakeData.medicalHistory[key];
          if (condition) {
            let line = `• ${condition.label}: ${condition.response || 'Not answered'}`;
            if (condition.response === 'Yes') {
              if (condition.type) line += ` (Type: ${condition.type})`;
              if (condition.year) line += ` (Diagnosed: ${condition.year})`;
            }
            notes += line + '\n';
          }
        });
      }
      
      // ============================================
      // MEDICATIONS & ALLERGIES
      // ============================================
      notes += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      notes += `MEDICATIONS & ALLERGIES:\n`;
      notes += `On HRT: ${intakeData.onHRT || 'N/A'}\n`;
      if (intakeData.onHRT === 'Yes' && intakeData.hrtDetails) {
        notes += `HRT Details: ${intakeData.hrtDetails}\n`;
      }
      
      notes += `On Other Medications: ${intakeData.onMedications || 'N/A'}\n`;
      if (intakeData.onMedications === 'Yes' && intakeData.currentMedications) {
        notes += `Medications: ${intakeData.currentMedications}\n`;
      }
      
      notes += `Has Allergies: ${intakeData.hasAllergies || 'N/A'}\n`;
      if (intakeData.hasAllergies === 'Yes' && intakeData.allergies) {
        notes += `Allergies: ${intakeData.allergies}\n`;
      }
    }
    
    // ============================================
    // DOCUMENTS
    // ============================================
    notes += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    notes += `DOCUMENTS:\n`;
    if (pdfUrl) notes += `PDF: ${pdfUrl}\n`;
    if (photoIdUrl) notes += `Photo ID: ${photoIdUrl}\n`;
    if (signatureUrl) notes += `Signature: ${signatureUrl}\n`;

    // Build MINIMAL contact payload - only include fields with values
    const contactPayload = {
      locationId: GHL_LOCATION_ID
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

    let response;
    let finalContactId = contactId;
    
    if (contactId) {
      // Update existing contact - remove locationId (GHL doesn't allow it on updates)
      const updatePayload = { ...contactPayload };
      delete updatePayload.locationId;
      
      console.log('Updating existing contact:', contactId);
      console.log('Update payload:', JSON.stringify(updatePayload, null, 2));
      
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

    // Add note to contact
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
      console.log('Note response:', noteText);
      
      if (noteResponse.ok) {
        console.log('✅ Note added successfully');
      } else {
        console.error('❌ Failed to add note');
      }
    }

    // Build tags based on intake data
    const tags = ['intake-submitted'];
    
    if (intakeData) {
      if (intakeData.injured === 'Yes') {
        tags.push('injury-recovery');
      }
      if (intakeData.interestedInOptimization === 'Yes') {
        tags.push('optimization-interest');
      }
      if (intakeData.isMinor === 'Yes') {
        tags.push('minor-patient');
      }
    }

    // Add tags
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
