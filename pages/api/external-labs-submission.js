// /pages/api/external-labs-submission.js
// Handles external lab submissions from booking page
// Uploads contact to GHL with note containing lab file links
// Sends email notification to clinic

const GHL_API_KEY = process.env.GHL_API_KEY || 'pit-3077d6b0-6f08-4cb6-b74e-be7dd765e91d';
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID || 'WICdvbXmTjQORW6GiHWW';
const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || 'info@range-medical.com';

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
        const { firstName, lastName, email, phone, labFiles, source, method } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !email || !phone) {
            return res.status(400).json({ 
                error: 'First name, last name, email, and phone are required',
                required: ['firstName', 'lastName', 'email', 'phone']
            });
        }

        // For upload method, require files
        if (method === 'upload' && (!labFiles || labFiles.length === 0)) {
            return res.status(400).json({ error: 'At least one lab file is required' });
        }

        const isEmailMethod = method === 'email' || (!labFiles || labFiles.length === 0);

        // Build full name for display
        const fullName = `${firstName} ${lastName}`.trim();

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
            tags: isEmailMethod 
                ? ['external-labs-pending', 'waiting-for-email-labs', 'needs-lab-review']
                : ['external-labs-submitted', 'needs-lab-review']
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
        // 3. ADD NOTE WITH LAB FILE LINKS OR EMAIL NOTICE
        // ============================================
        const currentDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        let noteBody;

        if (isEmailMethod) {
            // Email method - waiting for labs via email
            noteBody = `📋 EXTERNAL LABS - WAITING FOR EMAIL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Patient: ${fullName}
Email: ${email}
Phone: ${phone}
Submitted: ${currentDate}
Source: ${source || 'Book Page'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 METHOD: EMAIL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Patient chose to email their labs.
Expected subject line: "Lab Results - ${fullName}"
Email to: info@range-medical.com

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏳ ACTION REQUIRED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Watch for incoming email with labs.
If no email received within 2 days, follow up with patient.`;

        } else {
            // Upload method - files attached
            const fileLinks = labFiles.map((file, index) => 
                `📄 File ${index + 1}: ${file.name}\n   ${file.url}`
            ).join('\n\n');

            noteBody = `📋 EXTERNAL LABS SUBMITTED FOR REVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Patient: ${fullName}
Email: ${email}
Phone: ${phone}
Submitted: ${currentDate}
Source: ${source || 'Book Page'}

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
        }

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
        } else {
            console.log('✅ Note added to GHL contact');
        }

        // ============================================
        // 4. CREATE TASK FOR FOLLOW-UP
        // ============================================
        try {
            const taskTitle = isEmailMethod 
                ? `📧 Waiting for Labs via Email - ${fullName}`
                : `📋 Review External Labs - ${fullName}`;
            
            const taskDescription = isEmailMethod
                ? `Patient chose to email labs.\n\nName: ${fullName}\nEmail: ${email}\nPhone: ${phone}\n\nWatch for email with subject: "Lab Results - ${fullName}"\n\nIf no email received within 2 days, follow up with patient.`
                : `New lab submission from ${fullName} (${email})\n\nPhone: ${phone}\nFiles: ${labFiles.length}\n\nReview labs and contact patient within 1-2 business days.`;

            await fetch(`https://services.leadconnectorhq.com/contacts/${contactId}/tasks`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${GHL_API_KEY}`,
                    'Version': '2021-07-28',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    title: taskTitle,
                    description: taskDescription,
                    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
                    status: 'incompleted'
                })
            });
            console.log('✅ Task created for lab review');
        } catch (taskError) {
            console.error('Task creation error:', taskError);
        }

        // ============================================
        // 5. RETURN SUCCESS
        // ============================================
        return res.status(200).json({
            success: true,
            message: isEmailMethod ? 'Contact created - waiting for email' : 'Labs submitted successfully',
            contactId,
            isNewContact,
            method: isEmailMethod ? 'email' : 'upload',
            filesUploaded: labFiles ? labFiles.length : 0
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
