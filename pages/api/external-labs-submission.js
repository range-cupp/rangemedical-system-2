// /pages/api/external-labs-submission.js
// Handles external lab submissions from TRT transfer landing page
// Uploads contact to GHL with note containing lab file links

const GHL_API_KEY = process.env.GHL_API_KEY || 'pit-3077d6b0-6f08-4cb6-b74e-be7dd765e91d';
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID || 'WICdvbXmTjQORW6GiHWW';

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
        const { name, email, phone, labFiles, source } = req.body;

        // Validate required fields
        if (!name || !email || !phone) {
            return res.status(400).json({ error: 'Name, email, and phone are required' });
        }

        if (!labFiles || labFiles.length === 0) {
            return res.status(400).json({ error: 'At least one lab file is required' });
        }

        // Parse name
        const nameParts = name.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        // Format phone
        let formattedPhone = phone.replace(/\D/g, '');
        if (formattedPhone.length === 10) {
            formattedPhone = '+1' + formattedPhone;
        } else if (formattedPhone.length === 11 && formattedPhone.startsWith('1')) {
            formattedPhone = '+' + formattedPhone;
        }

        // ============================================
        // 1. SEARCH FOR EXISTING CONTACT
        // ============================================
        const searchUrl = `https://services.leadconnectorhq.com/contacts/search/duplicate?locationId=${GHL_LOCATION_ID}&email=${encodeURIComponent(email)}`;
        
        const searchResponse = await fetch(searchUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${GHL_API_KEY}`,
                'Version': '2021-07-28',
                'Accept': 'application/json'
            }
        });

        const searchData = await searchResponse.json();
        let contactId = searchData.contact?.id;
        let isNewContact = !contactId;

        // ============================================
        // 2. CREATE OR UPDATE CONTACT
        // ============================================
        const contactData = {
            firstName,
            lastName,
            email,
            phone: formattedPhone || undefined,
            source: source || 'External Labs Submission',
            tags: ['external-labs-submitted', 'trt-transfer-interest']
        };

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

        const contactResult = await contactResponse.json();
        
        if (!contactResponse.ok) {
            console.error('GHL contact error:', contactResult);
            return res.status(400).json({ 
                success: false, 
                error: 'Failed to create/update contact',
                details: contactResult 
            });
        }

        contactId = contactResult.contact?.id || contactId;

        // ============================================
        // 3. ADD NOTE WITH LAB FILE LINKS
        // ============================================
        const currentDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Build file links section
        const fileLinks = labFiles.map((file, index) => 
            `📄 File ${index + 1}: ${file.name}\n   ${file.url}`
        ).join('\n\n');

        const noteBody = `📋 EXTERNAL LABS SUBMITTED FOR REVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Patient: ${name}
Email: ${email}
Phone: ${phone}
Submitted: ${currentDate}
Source: ${source || 'TRT Transfer Landing Page'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📁 LAB FILES (${labFiles.length} file${labFiles.length > 1 ? 's' : ''})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${fileLinks}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏳ ACTION REQUIRED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Review labs and determine if:
✓ Labs are comprehensive enough to proceed
✓ Additional markers are needed
✓ Patient can schedule provider consultation

Contact patient within 1-2 business days.`;

        const noteResponse = await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/notes`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GHL_API_KEY}`,
                'Version': '2021-07-28',
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                body: noteBody
            })
        });

        if (!noteResponse.ok) {
            const noteError = await noteResponse.json();
            console.error('GHL note error:', noteError);
            // Don't fail the whole request if note fails
        } else {
            console.log('✅ Note added to GHL contact');
        }

        // ============================================
        // 4. RETURN SUCCESS
        // ============================================
        return res.status(200).json({
            success: true,
            message: 'Labs submitted successfully',
            contactId,
            isNewContact,
            filesUploaded: labFiles.length
        });

    } catch (error) {
        console.error('External labs submission error:', error);
        return res.status(500).json({
            success: false,
            error: 'Server error',
            message: error.message
        });
    }
}
