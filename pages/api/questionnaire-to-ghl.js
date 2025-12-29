// pages/api/questionnaire-to-ghl.js
// Syncs symptom questionnaire submissions to GoHighLevel
// Matches the same pattern as consent-to-ghl.js

export default async function handler(req, res) {
    // CORS headers
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
            dob,
            sex,
            goals,
            scores,
            pdfUrl,
            submissionDate
        } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !email) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields: firstName, lastName, email' 
            });
        }

        const GHL_API_KEY = process.env.GHL_API_KEY || 'pit-3077d6b0-6f08-4cb6-b74e-be7dd765e91d';
        const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID || 'WICdvbXmTjQORW6GiHWW';

        // ============================================
        // STEP 1: Search for existing contact by email
        // ============================================
        let contactId = null;

        const searchRes = await fetch(
            `https://services.leadconnectorhq.com/contacts/search/duplicate?locationId=${GHL_LOCATION_ID}&email=${encodeURIComponent(email)}`,
            {
                headers: {
                    'Authorization': `Bearer ${GHL_API_KEY}`,
                    'Version': '2021-07-28'
                }
            }
        );

        if (searchRes.ok) {
            const searchData = await searchRes.json();
            contactId = searchData.contact?.id;
            console.log('Found existing contact:', contactId);
        }

        // ============================================
        // STEP 2: Create contact if doesn't exist
        // ============================================
        if (!contactId) {
            const createRes = await fetch('https://services.leadconnectorhq.com/contacts/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${GHL_API_KEY}`,
                    'Version': '2021-07-28',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    locationId: GHL_LOCATION_ID,
                    firstName,
                    lastName,
                    email,
                    phone: phone || undefined,
                    dateOfBirth: dob || undefined
                })
            });

            if (createRes.ok) {
                const createData = await createRes.json();
                contactId = createData.contact?.id;
                console.log('Created new contact:', contactId);
            } else {
                const errorText = await createRes.text();
                console.error('Failed to create contact:', errorText);
            }
        }

        if (!contactId) {
            return res.status(500).json({ 
                success: false, 
                error: 'Could not find or create contact in GHL' 
            });
        }

        // ============================================
        // STEP 3: Build the note with scores
        // ============================================
        let scoreSummary = '';
        let overallScore = null;
        const sectionAverages = [];

        if (scores) {
            Object.entries(scores).forEach(([key, section]) => {
                if (section.average !== undefined) {
                    sectionAverages.push(section.average);
                    const status = section.average >= 7 ? '🟢 OPTIMAL' : section.average >= 4 ? '🟡 MONITOR' : '🔴 ATTENTION';
                    scoreSummary += `${section.name}: ${section.average.toFixed(1)}/10 ${status}\n`;
                }
            });

            if (sectionAverages.length > 0) {
                overallScore = sectionAverages.reduce((a, b) => a + b, 0) / sectionAverages.length;
            }
        }

        const overallStatus = overallScore >= 7 ? '🟢 OPTIMAL' : overallScore >= 4 ? '🟡 MONITOR' : '🔴 ATTENTION';

        const noteBody = `📋 SYMPTOM QUESTIONNAIRE COMPLETED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Patient: ${firstName} ${lastName}
Email: ${email}
Phone: ${phone || 'N/A'}
Sex: ${sex ? sex.charAt(0).toUpperCase() + sex.slice(1) : 'N/A'}
DOB: ${dob || 'N/A'}
Submission Date: ${submissionDate ? new Date(submissionDate).toLocaleString() : new Date().toLocaleString()}

📊 SECTION SCORES:
─────────────────────────────
${scoreSummary || 'No scores available'}
📈 OVERALL SCORE: ${overallScore ? overallScore.toFixed(1) + '/10' : 'N/A'} ${overallScore ? overallStatus : ''}

🎯 PATIENT GOALS:
─────────────────────────────
${goals || 'None specified'}

📄 DOCUMENTS:
─────────────────────────────
📑 Symptom Questionnaire PDF:
${pdfUrl || 'No PDF available'}`;

        // ============================================
        // STEP 4: Add note to contact
        // ============================================
        const noteRes = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/notes`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GHL_API_KEY}`,
                'Version': '2021-07-28',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                body: noteBody
            })
        });

        if (!noteRes.ok) {
            const noteError = await noteRes.text();
            console.error('Failed to add note:', noteError);
        } else {
            console.log('Note added successfully');
        }

        // ============================================
        // STEP 5: Add tags
        // ============================================
        const tags = ['symptom-questionnaire-completed'];
        
        // Add score-based tags
        if (overallScore !== null) {
            if (overallScore < 4) {
                tags.push('questionnaire-needs-attention');
            } else if (overallScore < 7) {
                tags.push('questionnaire-monitor');
            } else {
                tags.push('questionnaire-optimal');
            }
        }

        const tagRes = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/tags`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GHL_API_KEY}`,
                'Version': '2021-07-28',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ tags })
        });

        if (!tagRes.ok) {
            const tagError = await tagRes.text();
            console.error('Failed to add tags:', tagError);
        } else {
            console.log('Tags added:', tags);
        }

        // ============================================
        // STEP 6: Update custom field (optional)
        // ============================================
        // You can add a custom field in GHL called "symptom_questionnaire_score"
        // and uncomment this section to update it
        /*
        const updateRes = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${GHL_API_KEY}`,
                'Version': '2021-07-28',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                customFields: [
                    {
                        key: 'symptom_questionnaire_score',
                        value: overallScore ? overallScore.toFixed(1) : ''
                    },
                    {
                        key: 'symptom_questionnaire_date',
                        value: new Date().toISOString().split('T')[0]
                    }
                ]
            })
        });
        */

        return res.status(200).json({
            success: true,
            contactId,
            message: 'Questionnaire synced to GHL successfully',
            tags
        });

    } catch (error) {
        console.error('GHL sync error:', error);
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
}
