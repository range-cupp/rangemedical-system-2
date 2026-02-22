// pages/api/quiz-to-ghl.js
// Deploy to rangemedical-system-2.vercel.app

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const GHL_API_KEY = process.env.GHL_API_KEY;
    const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

    try {
        const {
            name,
            phone,
            email,
            gender,
            recommended_panel,
            note
        } = req.body;

        // Split name into first and last
        const nameParts = name.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Step 1: Search for existing contact
        console.log('Searching for existing contact:', email);
        const searchResponse = await fetch(
            `https://services.leadconnectorhq.com/contacts/search/duplicate?locationId=${GHL_LOCATION_ID}&email=${encodeURIComponent(email)}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${GHL_API_KEY}`,
                    'Version': '2021-07-28',
                    'Accept': 'application/json'
                }
            }
        );

        let contactId;
        const searchData = await searchResponse.json();
        
        if (searchData.contact && searchData.contact.id) {
            // Existing contact found
            contactId = searchData.contact.id;
            console.log('Found existing contact:', contactId);

            // Update contact with new tags
            await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${GHL_API_KEY}`,
                    'Version': '2021-07-28',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    phone,
                    email,
                    tags: ['quiz-lead', 'discount-50', `quiz-${recommended_panel}`]
                })
            });
        } else {
            // Create new contact
            console.log('Creating new contact');
            const createResponse = await fetch('https://services.leadconnectorhq.com/contacts/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${GHL_API_KEY}`,
                    'Version': '2021-07-28',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    locationId: GHL_LOCATION_ID,
                    firstName,
                    lastName,
                    phone,
                    email,
                    gender: gender === 'male' ? 'male' : 'female',
                    source: 'Symptom Quiz',
                    tags: ['quiz-lead', 'discount-50', `quiz-${recommended_panel}`]
                })
            });

            const createData = await createResponse.json();
            
            if (!createResponse.ok) {
                console.error('Failed to create contact:', createData);
                throw new Error(`Failed to create contact: ${JSON.stringify(createData)}`);
            }

            contactId = createData.contact?.id;
            console.log('Created new contact:', contactId);
        }

        if (!contactId) {
            throw new Error('Could not get or create contact ID');
        }

        // Step 2: Add note to contact
        console.log('Adding note to contact:', contactId);
        const noteResponse = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/notes`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GHL_API_KEY}`,
                'Version': '2021-07-28',
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                body: note
            })
        });

        if (!noteResponse.ok) {
            const noteError = await noteResponse.json();
            console.error('Failed to add note:', noteError);
        } else {
            console.log('Note added successfully');
        }

        return res.status(200).json({
            success: true,
            contactId,
            message: 'Quiz response synced to GoHighLevel'
        });

    } catch (error) {
        console.error('Error in quiz-to-ghl:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
