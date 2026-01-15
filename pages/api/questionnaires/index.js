// pages/api/questionnaires/index.js
// Save symptom questionnaire submissions to Supabase

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://teivfptpozltpqwahgdl.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // GET - Retrieve questionnaires (for provider dashboard)
    if (req.method === 'GET') {
        try {
            const { email, limit = 50 } = req.query;
            
            let query = supabase
                .from('questionnaires')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(parseInt(limit));

            if (email) {
                query = query.eq('email', email);
            }

            const { data, error } = await query;

            if (error) throw error;

            return res.status(200).json({ success: true, data });
        } catch (error) {
            console.error('Error fetching questionnaires:', error);
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    // POST - Save new questionnaire
    if (req.method === 'POST') {
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
                submissionDate,
                ...responses
            } = req.body;

            // Calculate overall score from section averages
            let overallScore = null;
            if (scores) {
                const sectionAverages = Object.values(scores)
                    .filter(s => s.average !== undefined)
                    .map(s => s.average);
                if (sectionAverages.length > 0) {
                    overallScore = sectionAverages.reduce((a, b) => a + b, 0) / sectionAverages.length;
                }
            }

            const record = {
                first_name: firstName,
                last_name: lastName,
                email: email,
                phone: phone || null,
                date_of_birth: dob || null,
                sex: sex,
                goals: goals || null,
                scores: scores,
                responses: responses,
                overall_score: overallScore,
                pdf_url: pdfUrl,
                submitted_at: submissionDate || new Date().toISOString(),
                created_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('questionnaires')
                .insert([record])
                .select()
                .single();

            if (error) throw error;

            // Optionally sync to GHL
            try {
                await syncToGHL({
                    firstName,
                    lastName,
                    email,
                    phone,
                    scores,
                    overallScore,
                    pdfUrl
                });
            } catch (ghlError) {
                console.log('GHL sync skipped:', ghlError.message);
            }

            return res.status(201).json({ 
                success: true, 
                data,
                message: 'Questionnaire saved successfully'
            });

        } catch (error) {
            console.error('Error saving questionnaire:', error);
            return res.status(500).json({ success: false, error: error.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

// Sync questionnaire to GoHighLevel
async function syncToGHL({ firstName, lastName, email, phone, scores, overallScore, pdfUrl }) {
    const GHL_API_KEY = process.env.GHL_API_KEY || 'pit-3077d6b0-6f08-4cb6-b74e-be7dd765e91d';
    const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID || 'WICdvbXmTjQORW6GiHWW';

    // Search for existing contact
    const searchRes = await fetch(
        `https://services.leadconnectorhq.com/contacts/search/duplicate?locationId=${GHL_LOCATION_ID}&email=${encodeURIComponent(email)}`,
        {
            headers: {
                'Authorization': `Bearer ${GHL_API_KEY}`,
                'Version': '2021-07-28'
            }
        }
    );

    const searchData = await searchRes.json();
    let contactId = searchData.contact?.id;

    // Create contact if doesn't exist
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
                phone: phone || undefined
            })
        });
        const createData = await createRes.json();
        contactId = createData.contact?.id;
    }

    if (!contactId) return;

    // Build score summary for note
    let scoreSummary = '';
    if (scores) {
        Object.entries(scores).forEach(([key, section]) => {
            if (section.average !== undefined) {
                const status = section.average >= 7 ? '🟢' : section.average >= 4 ? '🟡' : '🔴';
                scoreSummary += `${status} ${section.name}: ${section.average.toFixed(1)}/10\n`;
            }
        });
    }

    // Add note with scores and PDF link
    const noteBody = `📋 SYMPTOM QUESTIONNAIRE SUBMITTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 SECTION SCORES:
${scoreSummary}
📈 Overall Score: ${overallScore ? overallScore.toFixed(1) : 'N/A'}/10

📄 PDF Report:
${pdfUrl}

Submitted: ${new Date().toLocaleString()}`;

    await fetch('https://services.leadconnectorhq.com/contacts/' + contactId + '/notes', {
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

    // Add tag
    await fetch('https://services.leadconnectorhq.com/contacts/' + contactId + '/tags', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GHL_API_KEY}`,
            'Version': '2021-07-28',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            tags: ['symptom-questionnaire-completed']
        })
    });
}
