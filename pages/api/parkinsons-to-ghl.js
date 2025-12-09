// /pages/api/parkinsons-to-ghl.js
// API endpoint to sync Parkinson's symptom assessment with GoHighLevel

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      assessmentDate,
      gender,
      assessmentType,
      treatmentType,
      scores,
      responses
    } = req.body;

    // Get environment variables
    const GHL_API_KEY = process.env.GHL_API_KEY;
    const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

    if (!GHL_API_KEY || !GHL_LOCATION_ID) {
      console.error('Missing GHL credentials');
      return res.status(500).json({
        success: false,
        error: 'Server configuration error. Missing GHL credentials.'
      });
    }

    // Format phone number for GHL (should be +1XXXXXXXXXX)
    let formattedPhone = phone || '';
    formattedPhone = formattedPhone.replace(/\D/g, ''); // Remove non-digits
    if (formattedPhone.length === 10) {
      formattedPhone = '+1' + formattedPhone;
    } else if (formattedPhone.length === 11 && formattedPhone.startsWith('1')) {
      formattedPhone = '+' + formattedPhone;
    }

    console.log('📤 Processing Parkinson\'s assessment for:', `${firstName} ${lastName}`);

    // Step 1: Search for existing contact by email
    let contactId = null;

    try {
      const searchResponse = await fetch(
        `https://services.leadconnectorhq.com/contacts/search/duplicate?locationId=${GHL_LOCATION_ID}&email=${encodeURIComponent(email)}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Version': '2021-07-28',
            'Content-Type': 'application/json'
          }
        }
      );

      if (searchResponse.ok) {
        const searchResult = await searchResponse.json();
        if (searchResult.contact?.id) {
          contactId = searchResult.contact.id;
          console.log('✅ Found existing contact:', contactId);
        }
      }
    } catch (searchError) {
      console.warn('⚠️ Contact search failed:', searchError.message);
    }

    // Step 2: Build contact data
    const contactData = {
      firstName: firstName || '',
      lastName: lastName || '',
      email: email || '',
      phone: formattedPhone,
      dateOfBirth: dateOfBirth || '',
      source: 'Parkinson\'s Symptom Assessment',
      tags: ['parkinsons-assessment', 'exosome-therapy'],
      customFields: [
        {
          key: 'parkinsons_assessment',
          field_value: 'Complete'
        },
        {
          key: 'parkinsons_total_score',
          field_value: String(scores.total)
        },
        {
          key: 'parkinsons_motor_score',
          field_value: String(scores.motor)
        },
        {
          key: 'parkinsons_cognitive_score',
          field_value: String(scores.cognitive)
        },
        {
          key: 'parkinsons_function_score',
          field_value: String(scores.function)
        },
        {
          key: 'last_assessment_date',
          field_value: assessmentDate
        }
      ]
    };

    // Step 3: Create or update contact
    let contactResponse;

    if (contactId) {
      // Update existing contact
      console.log('Updating existing GHL contact:', contactId);

      contactResponse = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(contactData)
      });
    } else {
      // Create new contact
      console.log('Creating new GHL contact');

      contactData.locationId = GHL_LOCATION_ID;

      contactResponse = await fetch('https://services.leadconnectorhq.com/contacts/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GHL_API_KEY}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(contactData)
      });
    }

    if (!contactResponse.ok) {
      const errorText = await contactResponse.text();
      console.error('GHL API error:', contactResponse.status, errorText);
      throw new Error(`GoHighLevel API error: ${contactResponse.status} - ${errorText}`);
    }

    const contactResult = await contactResponse.json();
    contactId = contactId || contactResult.contact?.id;

    console.log('✅ Contact saved:', contactId);

    // Step 4: Add detailed note with assessment results
    if (contactId) {
      try {
        console.log('📝 Adding assessment note to contact...');

        // Build symptom breakdown
        const symptomLabels = {
          tremor: 'Tremor/Shaking',
          stiffness: 'Muscle Stiffness',
          slowness: 'Slowness of Movement',
          balance: 'Balance & Stability',
          walking: 'Walking Difficulty',
          freezing: 'Freezing Episodes',
          fine_motor: 'Fine Motor Control',
          posture: 'Posture Changes',
          mental_clarity: 'Mental Clarity',
          memory: 'Memory',
          depression: 'Mood/Depression',
          anxiety: 'Anxiety',
          apathy: 'Apathy/Motivation',
          sleep_quality: 'Sleep Quality',
          fatigue: 'Fatigue/Energy',
          speech: 'Speech Clarity',
          swallowing: 'Swallowing',
          constipation: 'Digestive Issues',
          pain: 'Pain Level',
          daily_activities: 'Daily Activities',
          quality_of_life: 'Quality of Life'
        };

        let symptomBreakdown = '';
        for (const [key, label] of Object.entries(symptomLabels)) {
          const value = responses[key];
          if (value !== undefined) {
            symptomBreakdown += `  • ${label}: ${value === 'NA' ? 'N/A' : value + '/10'}\n`;
          }
        }

        const noteBody = `🧠 PARKINSON'S SYMPTOM ASSESSMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Patient: ${firstName} ${lastName}
Email: ${email}
Phone: ${formattedPhone || 'Not provided'}
Gender: ${gender}
Assessment Date: ${assessmentDate}
Treatment Type: Exosome IV Therapy

📊 SCORES SUMMARY
─────────────────────────────
  Total Score: ${scores.total}/100
  Motor Symptoms: ${scores.motor}/10
  Cognitive & Mood: ${scores.cognitive}/10
  Sleep, Energy & Function: ${scores.function}/10

📋 SYMPTOM BREAKDOWN
─────────────────────────────
${symptomBreakdown}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Submitted: ${new Date().toLocaleString()}`;

        await fetch(
          `https://services.leadconnectorhq.com/contacts/${contactId}/notes`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${GHL_API_KEY}`,
              'Version': '2021-07-28',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              body: noteBody
            })
          }
        );

        console.log('✅ Assessment note added');
      } catch (noteError) {
        console.warn('⚠️ Could not add note:', noteError.message);
      }
    }

    // Step 5: Add tags
    if (contactId) {
      try {
        await fetch(
          `https://services.leadconnectorhq.com/contacts/${contactId}/tags`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${GHL_API_KEY}`,
              'Version': '2021-07-28',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              tags: ['parkinsons-assessment', 'exosome-therapy', `assessment-${assessmentDate}`]
            })
          }
        );
        console.log('✅ Tags added');
      } catch (tagError) {
        console.warn('⚠️ Could not add tags:', tagError.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: contactId ? 'Contact updated in GoHighLevel' : 'Contact created in GoHighLevel',
      contactId: contactId,
      data: {
        name: `${firstName} ${lastName}`,
        email: email,
        scores: scores
      }
    });

  } catch (error) {
    console.error('❌ Parkinson\'s to GHL error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Unknown error occurred'
    });
  }
}
