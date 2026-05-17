export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  try {
    const data = req.body;

    const firstName = data.firstName ? String(data.firstName).trim() : '';
    const lastName = data.lastName ? String(data.lastName).trim() : '';
    const email = data.email ? String(data.email).trim().replace(/\.+$/, '') : '';
    const phone = data.phone || '';
    const dateOfBirth = data.dateOfBirth || '';
    const gender = data.gender || '';

    const injured = data.injured;
    const injuryDescription = data.injuryDescription;
    const injuryLocation = data.injuryLocation;
    const injuryDate = data.injuryDate;
    const interestedInOptimization = data.interestedInOptimization;
    const symptoms = data.symptoms || [];
    const symptomFollowups = data.symptomFollowups || {};
    const symptomDuration = data.symptomDuration;
    const additionalNotes = data.additionalNotes;
    const howHeard = data.howHeardAboutUs;

    const hasPCP = data.hasPCP;
    const pcpName = data.pcpName;
    const recentHospitalization = data.recentHospitalization;
    const hospitalizationReason = data.hospitalizationReason;

    const onHRT = data.onHRT;
    const hrtDetails = data.hrtDetails;
    const onMedications = data.onMedications;
    const currentMedications = data.currentMedications;
    const hasAllergies = data.hasAllergies;
    const allergies = data.allergies;

    const isMinor = data.isMinor;
    const guardianName = data.guardianName;
    const guardianRelationship = data.guardianRelationship;

    const photoIdUrl = data.photoIdUrl;
    const pdfUrl = data.pdfUrl;

    if (!RESEND_API_KEY) {
      console.log('RESEND_API_KEY not configured — skipping email');
      return res.status(200).json({ success: true, email: false });
    }

    const now = new Date();
    const pstDate = now.toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles' });
    const pstTime = now.toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles', hour: '2-digit', minute: '2-digit' });

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
      <h1 style="margin: 0;">New Medical Intake</h1>
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
      <strong>Minor Patient</strong><br>
      Guardian: ${guardianName || 'N/A'} (${guardianRelationship || 'N/A'})
    </div>
    ` : ''}

    ${injured === 'Yes' ? `
    <div class="injury-box">
      <div class="section-title">Injury</div>
      <div class="field"><span class="label">What:</span> <span class="value">${injuryDescription || 'N/A'}</span></div>
      <div class="field"><span class="label">Where:</span> <span class="value">${injuryLocation || 'N/A'}</span></div>
      <div class="field"><span class="label">When:</span> <span class="value">${injuryDate || 'N/A'}</span></div>
    </div>
    ` : ''}

    ${interestedInOptimization === 'Yes' ? `
    <div class="optimization-box">
      <div class="section-title">Energy & Optimization</div>
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
      <div class="section-title">Additional Notes</div>
      <p>${additionalNotes}</p>
    </div>
    ` : ''}

    ${howHeard ? `
    <div class="section">
      <div class="section-title">How They Heard About Us</div>
      <p>${howHeard}</p>
    </div>
    ` : ''}

    <div class="section">
      <div class="section-title">Medications</div>
      <div class="field"><span class="label">On HRT:</span> <span class="value">${onHRT || 'N/A'}</span></div>
      ${onHRT === 'Yes' && hrtDetails ? `<div class="field"><span class="label">HRT Details:</span> <span class="value">${hrtDetails}</span></div>` : ''}
      <div class="field"><span class="label">Other Medications:</span> <span class="value">${onMedications || 'N/A'}</span></div>
      ${onMedications === 'Yes' && currentMedications ? `<div class="field"><span class="label">List:</span> <span class="value">${currentMedications}</span></div>` : ''}
      <div class="field"><span class="label">Allergies:</span> <span class="value">${hasAllergies || 'N/A'}</span></div>
      ${hasAllergies === 'Yes' && allergies ? `<div class="field"><span class="label">List:</span> <span class="value">${allergies}</span></div>` : ''}
    </div>

    <div class="section">
      <div class="section-title">Healthcare</div>
      <div class="field"><span class="label">Has PCP:</span> <span class="value">${hasPCP || 'N/A'}</span></div>
      ${hasPCP === 'Yes' && pcpName ? `<div class="field"><span class="label">PCP:</span> <span class="value">${pcpName}</span></div>` : ''}
      <div class="field"><span class="label">Recent Hospitalization:</span> <span class="value">${recentHospitalization || 'N/A'}</span></div>
      ${recentHospitalization === 'Yes' && hospitalizationReason ? `<div class="field"><span class="label">Reason:</span> <span class="value">${hospitalizationReason}</span></div>` : ''}
    </div>

    ${(pdfUrl || photoIdUrl) ? `
    <div class="section">
      <div class="section-title">Documents</div>
      ${pdfUrl ? `<div class="field"><a href="${pdfUrl}" style="color: #0066cc;">View Intake PDF</a></div>` : ''}
      ${photoIdUrl ? `<div class="field"><a href="${photoIdUrl}" style="color: #0066cc;">View Photo ID</a></div>` : ''}
    </div>
    ` : ''}

    <div style="text-align: center; margin-top: 20px;">
      <a href="tel:${phone?.replace(/\D/g, '')}" class="btn">Call Patient</a>
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
      subject: `New Medical Intake: ${firstName} ${lastName}`,
      html: emailHtml
    };

    if (pdfUrl) {
      try {
        const pdfResponse = await fetch(pdfUrl);
        if (pdfResponse.ok) {
          const pdfBuffer = await pdfResponse.arrayBuffer();
          const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');
          emailPayload.attachments = [
            {
              filename: `intake-${lastName}-${firstName}.pdf`,
              content: pdfBase64
            }
          ];
        }
      } catch (pdfError) {
        console.log('Could not attach PDF:', pdfError.message);
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
      console.log('Intake email sent:', emailResult.id);
    } else {
      console.error('Intake email failed:', emailResult);
    }

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Intake notification error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
