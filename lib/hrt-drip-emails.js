// /lib/hrt-drip-emails.js
// HRT Onboarding email + SMS sequence
// Sent via Resend when staff clicks "Start Onboarding" on an HRT protocol
// Range Medical

// ================================================================
// SHARED EMAIL WRAPPER
// ================================================================
function wrapEmail(subtitle, bodyContent) {
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f5f5f5;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; max-width: 600px;">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #000000; padding: 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: 0.1em;">RANGE MEDICAL</h1>
                            <p style="margin: 10px 0 0; color: #a3a3a3; font-size: 14px;">${subtitle}</p>
                        </td>
                    </tr>
                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            ${bodyContent}
                        </td>
                    </tr>
                    <!-- Dashboard Link -->
                    <tr>
                        <td style="padding: 0 30px 20px; text-align: center;">
                            <a href="{{portal_link}}" style="display: inline-block; padding: 12px 28px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 600;">View Your HRT Dashboard</a>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #fafafa; padding: 30px; text-align: center; border-top: 2px solid #e5e5e5;">
                            <p style="margin: 0 0 10px; color: #737373; font-size: 13px;">Questions? We're here to help.</p>
                            <p style="margin: 0; color: #000000; font-size: 15px; font-weight: 600;">(949) 997-3988</p>
                            <p style="margin: 15px 0 0; color: #a3a3a3; font-size: 12px;">Range Medical &#8226; 1901 Westcliff Dr, Suite 10, Newport Beach, CA</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

// ================================================================
// EMAIL 1: WELCOME (Day 0) — Universal
// ================================================================
const WELCOME_EMAIL_HTML = wrapEmail('Hormone Optimization Program', `
<h2 style="margin: 0 0 20px; color: #000000; font-size: 22px; font-weight: 600;">Welcome to Your HRT Program, {{contact.first_name}}!</h2>

<p style="margin: 0 0 20px; color: #404040; font-size: 15px; line-height: 1.7;">We're excited to have you on board. You've taken an important step toward optimizing your health, energy, and quality of life. Over the next few weeks, we'll send you everything you need to feel confident and supported throughout your program.</p>

<p style="margin: 0 0 20px; color: #404040; font-size: 15px; line-height: 1.7;">Here's what you can expect from us:</p>

<!-- What's Coming -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0;">
    <tr>
        <td style="background-color: #fafafa; padding: 15px 20px; border-left: 3px solid #000000;">
            &#128233; <strong>Tomorrow:</strong> Your injection guide (personalized to your setup)
        </td>
    </tr>
    <tr><td style="height: 10px;"></td></tr>
    <tr>
        <td style="background-color: #fafafa; padding: 15px 20px; border-left: 3px solid #000000;">
            &#128172; <strong>Week 1:</strong> A check-in to see how things are going
        </td>
    </tr>
    <tr><td style="height: 10px;"></td></tr>
    <tr>
        <td style="background-color: #fafafa; padding: 15px 20px; border-left: 3px solid #000000;">
            &#128137; <strong>Week 4:</strong> Time to book your included Range IV
        </td>
    </tr>
    <tr><td style="height: 10px;"></td></tr>
    <tr>
        <td style="background-color: #fafafa; padding: 15px 20px; border-left: 3px solid #000000;">
            &#129656; <strong>Week 8:</strong> Follow-up lab work to check your levels
        </td>
    </tr>
</table>

<!-- Range IV Benefit -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 30px 0;">
    <tr>
        <td style="background-color: #000000; padding: 25px;">
            <h3 style="margin: 0 0 15px; color: #ffffff; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">&#127881; Your Monthly Range IV</h3>
            <p style="margin: 0 0 15px; color: #ffffff; font-size: 15px; line-height: 1.7;">Your HRT membership includes a <strong>custom Range IV every month</strong> &#8212; a $225 value included with your program.</p>
            <p style="margin: 0; color: #e5e5e5; font-size: 14px; line-height: 1.7;">This IV supports hydration, energy, and recovery. You're eligible right away, so call us or reply to this email to schedule your first one!</p>
        </td>
    </tr>
</table>

<!-- Medication Info -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0;">
    <tr>
        <td style="border: 2px solid #000000; padding: 25px;">
            <h3 style="margin: 0 0 15px; color: #000000; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Your Protocol</h3>
            <p style="margin: 0 0 10px; color: #404040; font-size: 15px; line-height: 1.7;"><strong>Medication:</strong> {{medication}}</p>
            <p style="margin: 0 0 10px; color: #404040; font-size: 15px; line-height: 1.7;"><strong>Dose:</strong> {{dose}}</p>
            <p style="margin: 0; color: #404040; font-size: 15px; line-height: 1.7;"><strong>Schedule:</strong> {{schedule}}</p>
        </td>
    </tr>
</table>

<p style="margin: 20px 0 0; color: #404040; font-size: 15px; line-height: 1.7;"><strong>Coming tomorrow:</strong> Your personalized injection guide to get you started with confidence.</p>
`);


// ================================================================
// EMAIL 2a: IN-CLINIC SCHEDULE (Day 1) — In-clinic path
// ================================================================
const INCLINIC_SCHEDULE_HTML = wrapEmail('Hormone Optimization Program', `
<h2 style="margin: 0 0 20px; color: #000000; font-size: 22px; font-weight: 600;">Your Injection Schedule at Range Medical</h2>

<p style="margin: 0 0 20px; color: #404040; font-size: 15px; line-height: 1.7;">Hi {{contact.first_name}}, you'll be coming into Range Medical for your injections. Here's everything you need to know about your visits.</p>

<!-- Schedule -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 30px 0;">
    <tr>
        <td style="background-color: #000000; padding: 25px;">
            <h3 style="margin: 0 0 15px; color: #ffffff; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">&#128197; Your Schedule</h3>
            <p style="margin: 0 0 10px; color: #ffffff; font-size: 15px; line-height: 1.7;"><strong>Injection Days:</strong> {{schedule}}</p>
            <p style="margin: 0; color: #e5e5e5; font-size: 14px; line-height: 1.7;">Walk-ins are welcome during clinic hours. No appointment needed.</p>
        </td>
    </tr>
</table>

<!-- What to Expect -->
<h3 style="margin: 30px 0 15px; color: #000000; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">What to Expect</h3>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
        <td style="background-color: #fafafa; padding: 15px 20px; border-left: 3px solid #000000;">
            &#10003; Each visit takes about 5&#8211;10 minutes
        </td>
    </tr>
    <tr><td style="height: 10px;"></td></tr>
    <tr>
        <td style="background-color: #fafafa; padding: 15px 20px; border-left: 3px solid #000000;">
            &#10003; Our staff handles the injection &#8212; you just show up
        </td>
    </tr>
    <tr><td style="height: 10px;"></td></tr>
    <tr>
        <td style="background-color: #fafafa; padding: 15px 20px; border-left: 3px solid #000000;">
            &#10003; Injection site will rotate between visits
        </td>
    </tr>
    <tr><td style="height: 10px;"></td></tr>
    <tr>
        <td style="background-color: #fafafa; padding: 15px 20px; border-left: 3px solid #000000;">
            &#10003; Let us know if you have any questions during your visit
        </td>
    </tr>
</table>

<!-- Tips -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 30px 0;">
    <tr>
        <td style="border: 2px solid #000000; padding: 25px;">
            <h4 style="margin: 0 0 15px; color: #000000; font-size: 14px; font-weight: 700; text-transform: uppercase;">&#128161; Tips for Your Visits</h4>
            <p style="margin: 0 0 10px; color: #404040; font-size: 14px; line-height: 1.7;">&#8226; Stay hydrated before your visit</p>
            <p style="margin: 0 0 10px; color: #404040; font-size: 14px; line-height: 1.7;">&#8226; Wear comfortable clothing with easy access to your upper arm or glute</p>
            <p style="margin: 0; color: #404040; font-size: 14px; line-height: 1.7;">&#8226; Try to come at consistent times for best results</p>
        </td>
    </tr>
</table>

<p style="margin: 20px 0 0; color: #404040; font-size: 15px; line-height: 1.7;">Consistency is key with HRT. Keeping a regular schedule helps maintain stable hormone levels and gives you the best results.</p>
`);


// ================================================================
// EMAIL 2b: IM PRE-FILLED SYRINGE GUIDE (Day 1) — Take-home IM + Pre-filled
// ================================================================
const IM_PREFILLED_HTML = wrapEmail('Hormone Optimization Program', `
<h2 style="margin: 0 0 20px; color: #000000; font-size: 22px; font-weight: 600;">How to Self-Inject: Pre-Filled Syringe</h2>

<p style="margin: 0 0 20px; color: #404040; font-size: 15px; line-height: 1.7;">Hi {{contact.first_name}}, your medication comes in pre-filled syringes, which makes the process simple and straightforward. Here's your step-by-step guide.</p>

<!-- Before You Start -->
<h3 style="margin: 30px 0 15px; color: #000000; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Before You Start</h3>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
        <td style="background-color: #fafafa; padding: 15px 20px; border-left: 3px solid #000000;">
            &#10003; Wash your hands thoroughly with soap and water
        </td>
    </tr>
    <tr><td style="height: 10px;"></td></tr>
    <tr>
        <td style="background-color: #fafafa; padding: 15px 20px; border-left: 3px solid #000000;">
            &#10003; Gather your pre-filled syringe + alcohol swab
        </td>
    </tr>
    <tr><td style="height: 10px;"></td></tr>
    <tr>
        <td style="background-color: #fafafa; padding: 15px 20px; border-left: 3px solid #000000;">
            &#10003; Let the syringe reach room temperature (5&#8211;10 min out of the fridge)
        </td>
    </tr>
</table>

<!-- Step by Step -->
<h3 style="margin: 30px 0 15px; color: #000000; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Step-by-Step Injection Guide</h3>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0;">
    <tr>
        <td style="border: 2px solid #000000; padding: 25px;">
            <p style="margin: 0 0 15px; color: #404040; font-size: 15px; line-height: 1.7;"><strong>Step 1:</strong> Choose your injection site &#8212; outer thigh (vastus lateralis) or upper glute. Alternate sides each injection.</p>
            <p style="margin: 0 0 15px; color: #404040; font-size: 15px; line-height: 1.7;"><strong>Step 2:</strong> Clean the injection site with an alcohol swab and let it dry.</p>
            <p style="margin: 0 0 15px; color: #404040; font-size: 15px; line-height: 1.7;"><strong>Step 3:</strong> Remove the needle cap. Hold the syringe like a dart.</p>
            <p style="margin: 0 0 15px; color: #404040; font-size: 15px; line-height: 1.7;"><strong>Step 4:</strong> Insert the needle at a 90-degree angle in one smooth motion.</p>
            <p style="margin: 0 0 15px; color: #404040; font-size: 15px; line-height: 1.7;"><strong>Step 5:</strong> Push the plunger slowly and steadily until fully depressed.</p>
            <p style="margin: 0; color: #404040; font-size: 15px; line-height: 1.7;"><strong>Step 6:</strong> Withdraw the needle and apply light pressure with a clean cotton ball or gauze. Do not rub.</p>
        </td>
    </tr>
</table>

<!-- Schedule Reminder -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 30px 0;">
    <tr>
        <td style="background-color: #000000; padding: 25px;">
            <h3 style="margin: 0 0 15px; color: #ffffff; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">&#128197; Your Injection Schedule</h3>
            <p style="margin: 0 0 10px; color: #ffffff; font-size: 15px; line-height: 1.7;"><strong>Days:</strong> {{schedule}}</p>
            <p style="margin: 0 0 10px; color: #ffffff; font-size: 15px; line-height: 1.7;"><strong>Dose:</strong> {{dose}} per injection</p>
            <p style="margin: 0; color: #e5e5e5; font-size: 14px; line-height: 1.7;">Try to inject at the same time each day for the most consistent results.</p>
        </td>
    </tr>
</table>

<!-- Safety -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0;">
    <tr>
        <td style="background-color: #fafafa; border: 1px solid #e5e5e5; padding: 25px;">
            <h4 style="margin: 0 0 15px; color: #000000; font-size: 14px; font-weight: 700; text-transform: uppercase;">&#9888;&#65039; Important Reminders</h4>
            <p style="margin: 0 0 10px; color: #404040; font-size: 14px; line-height: 1.7;">&#8226; Store pre-filled syringes in the refrigerator</p>
            <p style="margin: 0 0 10px; color: #404040; font-size: 14px; line-height: 1.7;">&#8226; Never reuse a syringe &#8212; dispose in a sharps container</p>
            <p style="margin: 0 0 10px; color: #404040; font-size: 14px; line-height: 1.7;">&#8226; Mild soreness or redness at the injection site is normal</p>
            <p style="margin: 0; color: #404040; font-size: 14px; line-height: 1.7;">&#8226; Contact us if you notice significant swelling, pain, or signs of infection</p>
        </td>
    </tr>
</table>

<p style="margin: 20px 0 0; color: #404040; font-size: 15px; line-height: 1.7;">It's completely normal to feel nervous about your first injection. It gets easier quickly. If you'd like a walkthrough, come by the clinic and we'll guide you through it in person.</p>
`);


// ================================================================
// EMAIL 2c: IM VIAL GUIDE (Day 1) — Take-home IM + Vial
// ================================================================
const IM_VIAL_HTML = wrapEmail('Hormone Optimization Program', `
<h2 style="margin: 0 0 20px; color: #000000; font-size: 22px; font-weight: 600;">How to Self-Inject: Drawing from a Vial</h2>

<p style="margin: 0 0 20px; color: #404040; font-size: 15px; line-height: 1.7;">Hi {{contact.first_name}}, your medication comes in a multi-dose vial. This guide walks you through the full process of drawing your dose and injecting safely.</p>

<!-- Supplies -->
<h3 style="margin: 30px 0 15px; color: #000000; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">What You'll Need</h3>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
        <td style="background-color: #fafafa; padding: 15px 20px; border-left: 3px solid #000000;">
            &#10003; Your medication vial
        </td>
    </tr>
    <tr><td style="height: 10px;"></td></tr>
    <tr>
        <td style="background-color: #fafafa; padding: 15px 20px; border-left: 3px solid #000000;">
            &#10003; Drawing needle (18g) + injection needle (25g)
        </td>
    </tr>
    <tr><td style="height: 10px;"></td></tr>
    <tr>
        <td style="background-color: #fafafa; padding: 15px 20px; border-left: 3px solid #000000;">
            &#10003; Syringe (1mL or 3mL)
        </td>
    </tr>
    <tr><td style="height: 10px;"></td></tr>
    <tr>
        <td style="background-color: #fafafa; padding: 15px 20px; border-left: 3px solid #000000;">
            &#10003; Alcohol swabs + sharps container
        </td>
    </tr>
</table>

<!-- Drawing Steps -->
<h3 style="margin: 30px 0 15px; color: #000000; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Drawing Your Dose</h3>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0;">
    <tr>
        <td style="border: 2px solid #000000; padding: 25px;">
            <p style="margin: 0 0 15px; color: #404040; font-size: 15px; line-height: 1.7;"><strong>Step 1:</strong> Wash your hands thoroughly. Clean the vial rubber stopper with an alcohol swab.</p>
            <p style="margin: 0 0 15px; color: #404040; font-size: 15px; line-height: 1.7;"><strong>Step 2:</strong> Attach the drawing needle (18g) to the syringe. Pull back the plunger to your dose volume ({{dose}}) to fill with air.</p>
            <p style="margin: 0 0 15px; color: #404040; font-size: 15px; line-height: 1.7;"><strong>Step 3:</strong> Insert the needle into the vial and push in the air. This equalizes pressure and makes drawing easier.</p>
            <p style="margin: 0 0 15px; color: #404040; font-size: 15px; line-height: 1.7;"><strong>Step 4:</strong> Turn the vial upside down. Pull back the plunger slowly to your exact dose. Tap out any air bubbles.</p>
            <p style="margin: 0; color: #404040; font-size: 15px; line-height: 1.7;"><strong>Step 5:</strong> Remove from vial. Swap the drawing needle for the injection needle (25g).</p>
        </td>
    </tr>
</table>

<!-- Injection Steps -->
<h3 style="margin: 30px 0 15px; color: #000000; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Injecting</h3>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0;">
    <tr>
        <td style="border: 2px solid #000000; padding: 25px;">
            <p style="margin: 0 0 15px; color: #404040; font-size: 15px; line-height: 1.7;"><strong>Step 6:</strong> Choose your injection site &#8212; outer thigh (vastus lateralis) or upper glute. Alternate sides each injection.</p>
            <p style="margin: 0 0 15px; color: #404040; font-size: 15px; line-height: 1.7;"><strong>Step 7:</strong> Clean the site with an alcohol swab and let it dry.</p>
            <p style="margin: 0 0 15px; color: #404040; font-size: 15px; line-height: 1.7;"><strong>Step 8:</strong> Insert the needle at a 90-degree angle in one smooth motion.</p>
            <p style="margin: 0 0 15px; color: #404040; font-size: 15px; line-height: 1.7;"><strong>Step 9:</strong> Push the plunger slowly and steadily until fully depressed.</p>
            <p style="margin: 0; color: #404040; font-size: 15px; line-height: 1.7;"><strong>Step 10:</strong> Withdraw the needle and apply light pressure with gauze. Do not rub.</p>
        </td>
    </tr>
</table>

<!-- Schedule + Storage -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 30px 0;">
    <tr>
        <td style="background-color: #000000; padding: 25px;">
            <h3 style="margin: 0 0 15px; color: #ffffff; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">&#128197; Your Injection Schedule</h3>
            <p style="margin: 0 0 10px; color: #ffffff; font-size: 15px; line-height: 1.7;"><strong>Days:</strong> {{schedule}}</p>
            <p style="margin: 0 0 10px; color: #ffffff; font-size: 15px; line-height: 1.7;"><strong>Dose:</strong> {{dose}} per injection</p>
            <p style="margin: 0; color: #e5e5e5; font-size: 14px; line-height: 1.7;">Try to inject at the same time each day for the most consistent results.</p>
        </td>
    </tr>
</table>

<!-- Safety -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0;">
    <tr>
        <td style="background-color: #fafafa; border: 1px solid #e5e5e5; padding: 25px;">
            <h4 style="margin: 0 0 15px; color: #000000; font-size: 14px; font-weight: 700; text-transform: uppercase;">&#9888;&#65039; Important Reminders</h4>
            <p style="margin: 0 0 10px; color: #404040; font-size: 14px; line-height: 1.7;">&#8226; Store your vial at room temperature, away from direct sunlight</p>
            <p style="margin: 0 0 10px; color: #404040; font-size: 14px; line-height: 1.7;">&#8226; Always use a fresh needle &#8212; never reuse needles or syringes</p>
            <p style="margin: 0 0 10px; color: #404040; font-size: 14px; line-height: 1.7;">&#8226; Dispose of used needles in your sharps container</p>
            <p style="margin: 0 0 10px; color: #404040; font-size: 14px; line-height: 1.7;">&#8226; Mild soreness or redness at the injection site is normal</p>
            <p style="margin: 0; color: #404040; font-size: 14px; line-height: 1.7;">&#8226; Contact us if you notice significant swelling, pain, or signs of infection</p>
        </td>
    </tr>
</table>

<p style="margin: 20px 0 0; color: #404040; font-size: 15px; line-height: 1.7;">It's completely normal to feel nervous about your first injection. It gets easier quickly. If you'd like a walkthrough, come by the clinic and we'll guide you through it in person.</p>
`);


// ================================================================
// EMAIL 2d: SUBQ DAILY GUIDE (Day 1) — Take-home SubQ
// ================================================================
const SUBQ_GUIDE_HTML = wrapEmail('Hormone Optimization Program', `
<h2 style="margin: 0 0 20px; color: #000000; font-size: 22px; font-weight: 600;">Your Daily SubQ Injection Guide</h2>

<p style="margin: 0 0 20px; color: #404040; font-size: 15px; line-height: 1.7;">Hi {{contact.first_name}}, subcutaneous (SubQ) injections are quick, easy, and virtually painless. This guide will walk you through the process step by step.</p>

<!-- What is SubQ -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 30px 0;">
    <tr>
        <td style="border: 2px solid #000000; padding: 25px;">
            <h3 style="margin: 0 0 15px; color: #000000; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">What is a SubQ Injection?</h3>
            <p style="margin: 0; color: #404040; font-size: 15px; line-height: 1.7;">SubQ injections go into the fatty tissue just under the skin &#8212; not into the muscle. They use a smaller needle, hurt less, and are easy to do at home. Most patients prefer SubQ because it becomes second nature very quickly.</p>
        </td>
    </tr>
</table>

<!-- Before You Start -->
<h3 style="margin: 30px 0 15px; color: #000000; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Before You Start</h3>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
        <td style="background-color: #fafafa; padding: 15px 20px; border-left: 3px solid #000000;">
            &#10003; Wash your hands thoroughly with soap and water
        </td>
    </tr>
    <tr><td style="height: 10px;"></td></tr>
    <tr>
        <td style="background-color: #fafafa; padding: 15px 20px; border-left: 3px solid #000000;">
            &#10003; Gather your syringe, alcohol swab, and sharps container
        </td>
    </tr>
    <tr><td style="height: 10px;"></td></tr>
    <tr>
        <td style="background-color: #fafafa; padding: 15px 20px; border-left: 3px solid #000000;">
            &#10003; If using a pre-filled syringe, let it reach room temperature (5&#8211;10 min)
        </td>
    </tr>
</table>

<!-- Step by Step -->
<h3 style="margin: 30px 0 15px; color: #000000; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Step-by-Step Guide</h3>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0;">
    <tr>
        <td style="border: 2px solid #000000; padding: 25px;">
            <p style="margin: 0 0 15px; color: #404040; font-size: 15px; line-height: 1.7;"><strong>Step 1:</strong> Choose your injection site &#8212; lower abdomen (1&#8211;2 inches from the navel) or outer thigh. Rotate sites daily.</p>
            <p style="margin: 0 0 15px; color: #404040; font-size: 15px; line-height: 1.7;"><strong>Step 2:</strong> Clean the injection site with an alcohol swab and let it air dry.</p>
            <p style="margin: 0 0 15px; color: #404040; font-size: 15px; line-height: 1.7;"><strong>Step 3:</strong> Pinch a fold of skin between your thumb and forefinger.</p>
            <p style="margin: 0 0 15px; color: #404040; font-size: 15px; line-height: 1.7;"><strong>Step 4:</strong> Insert the needle at a 45-degree angle into the pinched skin fold.</p>
            <p style="margin: 0 0 15px; color: #404040; font-size: 15px; line-height: 1.7;"><strong>Step 5:</strong> Release the skin fold. Push the plunger slowly and steadily.</p>
            <p style="margin: 0; color: #404040; font-size: 15px; line-height: 1.7;"><strong>Step 6:</strong> Withdraw the needle and apply light pressure with gauze. Do not rub.</p>
        </td>
    </tr>
</table>

<!-- Schedule -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 30px 0;">
    <tr>
        <td style="background-color: #000000; padding: 25px;">
            <h3 style="margin: 0 0 15px; color: #ffffff; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">&#128197; Your Injection Schedule</h3>
            <p style="margin: 0 0 10px; color: #ffffff; font-size: 15px; line-height: 1.7;"><strong>Frequency:</strong> {{schedule}}</p>
            <p style="margin: 0 0 10px; color: #ffffff; font-size: 15px; line-height: 1.7;"><strong>Dose:</strong> {{dose}} per injection</p>
            <p style="margin: 0; color: #e5e5e5; font-size: 14px; line-height: 1.7;">Pick a consistent time each day &#8212; morning works great for most people.</p>
        </td>
    </tr>
</table>

<!-- Safety -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0;">
    <tr>
        <td style="background-color: #fafafa; border: 1px solid #e5e5e5; padding: 25px;">
            <h4 style="margin: 0 0 15px; color: #000000; font-size: 14px; font-weight: 700; text-transform: uppercase;">&#9888;&#65039; Important Reminders</h4>
            <p style="margin: 0 0 10px; color: #404040; font-size: 14px; line-height: 1.7;">&#8226; Never inject into bruised, scarred, or irritated skin</p>
            <p style="margin: 0 0 10px; color: #404040; font-size: 14px; line-height: 1.7;">&#8226; Rotate injection sites to prevent tissue irritation</p>
            <p style="margin: 0 0 10px; color: #404040; font-size: 14px; line-height: 1.7;">&#8226; Never reuse a syringe &#8212; dispose in a sharps container</p>
            <p style="margin: 0; color: #404040; font-size: 14px; line-height: 1.7;">&#8226; Small bruises or slight redness are normal and resolve quickly</p>
        </td>
    </tr>
</table>

<p style="margin: 20px 0 0; color: #404040; font-size: 15px; line-height: 1.7;">SubQ injections are the easiest self-injection method &#8212; most patients get comfortable after just 2&#8211;3 injections. If you'd like a hands-on walkthrough, come by the clinic and we'll guide you through it.</p>
`);


// ================================================================
// EMAIL 3: WEEK 1 CHECK-IN (Day 7) — Universal
// ================================================================
const WEEK1_CHECKIN_HTML = wrapEmail('Hormone Optimization Program', `
<h2 style="margin: 0 0 20px; color: #000000; font-size: 22px; font-weight: 600;">How's Your First Week Going, {{contact.first_name}}?</h2>

<p style="margin: 0 0 20px; color: #404040; font-size: 15px; line-height: 1.7;">You've been on your HRT program for a week now. We want to check in and make sure everything is going smoothly.</p>

<!-- Common First Week -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 30px 0;">
    <tr>
        <td style="border-left: 4px solid #000000; padding-left: 20px;">
            <h3 style="margin: 0 0 15px; color: #000000; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">What's Normal in Week 1</h3>
            <p style="margin: 0; color: #404040; font-size: 15px; line-height: 1.7;">It's early days, and your body is still adjusting. Here's what many patients experience:</p>
        </td>
    </tr>
</table>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
        <td style="background-color: #fafafa; padding: 15px 20px; border-left: 3px solid #000000;">
            &#10003; Mild soreness at injection sites &#8212; completely normal
        </td>
    </tr>
    <tr><td style="height: 10px;"></td></tr>
    <tr>
        <td style="background-color: #fafafa; padding: 15px 20px; border-left: 3px solid #000000;">
            &#10003; Slight mood or energy changes as hormones begin to adjust
        </td>
    </tr>
    <tr><td style="height: 10px;"></td></tr>
    <tr>
        <td style="background-color: #fafafa; padding: 15px 20px; border-left: 3px solid #000000;">
            &#10003; Feeling more or less hungry than usual
        </td>
    </tr>
    <tr><td style="height: 10px;"></td></tr>
    <tr>
        <td style="background-color: #fafafa; padding: 15px 20px; border-left: 3px solid #000000;">
            &#10003; Changes in sleep patterns
        </td>
    </tr>
</table>

<!-- When to Reach Out -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 30px 0;">
    <tr>
        <td style="background-color: #000000; padding: 25px;">
            <h4 style="margin: 0 0 15px; color: #ffffff; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">&#9888;&#65039; Reach Out if You Experience</h4>
            <p style="margin: 0 0 10px; color: #e5e5e5; font-size: 14px; line-height: 1.8;">&#8226; Significant swelling or redness at injection sites</p>
            <p style="margin: 0 0 10px; color: #e5e5e5; font-size: 14px; line-height: 1.8;">&#8226; Persistent headaches or dizziness</p>
            <p style="margin: 0 0 10px; color: #e5e5e5; font-size: 14px; line-height: 1.8;">&#8226; Difficulty with your injections or any questions about technique</p>
            <p style="margin: 0; color: #e5e5e5; font-size: 14px; line-height: 1.8;">&#8226; Any symptoms that concern you</p>
        </td>
    </tr>
</table>

<!-- Timeline -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0;">
    <tr>
        <td style="border: 2px solid #000000; padding: 25px;">
            <h4 style="margin: 0 0 15px; color: #000000; font-size: 14px; font-weight: 700; text-transform: uppercase;">&#128200; When to Expect Results</h4>
            <p style="margin: 0 0 10px; color: #404040; font-size: 14px; line-height: 1.7;"><strong>Weeks 2&#8211;4:</strong> Improved energy, mood, and sleep quality</p>
            <p style="margin: 0 0 10px; color: #404040; font-size: 14px; line-height: 1.7;"><strong>Weeks 4&#8211;8:</strong> Body composition changes, improved libido, mental clarity</p>
            <p style="margin: 0; color: #404040; font-size: 14px; line-height: 1.7;"><strong>Week 8:</strong> Follow-up labs to optimize your levels</p>
        </td>
    </tr>
</table>

<p style="margin: 20px 0 0; color: #404040; font-size: 15px; line-height: 1.7;">You're doing great. Stay consistent with your injections and don't hesitate to reach out with any questions &#8212; that's what we're here for.</p>
`);


// ================================================================
// EMAIL 4: MONTH 1 IV REMINDER (Day 28) — Universal
// ================================================================
const MONTH1_IV_REMINDER_HTML = wrapEmail('Hormone Optimization Program', `
<h2 style="margin: 0 0 20px; color: #000000; font-size: 22px; font-weight: 600;">Time to Book Your Range IV, {{contact.first_name}}!</h2>

<p style="margin: 0 0 20px; color: #404040; font-size: 15px; line-height: 1.7;">You've been on your HRT program for a month now &#8212; great job staying consistent! As a reminder, your membership includes a <strong>custom Range IV every month</strong>.</p>

<!-- IV Benefits -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 30px 0;">
    <tr>
        <td style="background-color: #000000; padding: 25px;">
            <h3 style="margin: 0 0 15px; color: #ffffff; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">&#128137; Your Monthly Range IV ($225 Value)</h3>
            <p style="margin: 0 0 15px; color: #ffffff; font-size: 15px; line-height: 1.7;">The Range IV is a custom blend designed to support your HRT program with:</p>
            <p style="margin: 0 0 10px; color: #e5e5e5; font-size: 14px; line-height: 1.8;">&#8226; Hydration and electrolyte support</p>
            <p style="margin: 0 0 10px; color: #e5e5e5; font-size: 14px; line-height: 1.8;">&#8226; B vitamins for energy and metabolism</p>
            <p style="margin: 0 0 10px; color: #e5e5e5; font-size: 14px; line-height: 1.8;">&#8226; Amino acids for recovery</p>
            <p style="margin: 0; color: #e5e5e5; font-size: 14px; line-height: 1.8;">&#8226; Antioxidants for overall wellness</p>
        </td>
    </tr>
</table>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0;">
    <tr>
        <td style="border: 2px solid #000000; padding: 25px; text-align: center;">
            <p style="margin: 0 0 15px; color: #404040; font-size: 15px; line-height: 1.7;">Ready to schedule your Range IV?</p>
            <p style="margin: 0; color: #000000; font-size: 18px; font-weight: 600;">Call us at (949) 997-3988</p>
            <p style="margin: 10px 0 0; color: #737373; font-size: 13px;">or reply to this email</p>
        </td>
    </tr>
</table>

<p style="margin: 20px 0 0; color: #404040; font-size: 15px; line-height: 1.7;">IV sessions take about 30&#8211;45 minutes and can be done during a regular visit. Many patients pair it with their injection appointment for convenience.</p>
`);


// ================================================================
// EMAIL 5: PRE-LAB HEADS UP (Day 42) — Universal
// ================================================================
const PRELAB_HEADSUP_HTML = wrapEmail('Hormone Optimization Program', `
<h2 style="margin: 0 0 20px; color: #000000; font-size: 22px; font-weight: 600;">Your Follow-Up Labs Are Coming Up, {{contact.first_name}}</h2>

<p style="margin: 0 0 20px; color: #404040; font-size: 15px; line-height: 1.7;">You're about 6 weeks into your HRT program &#8212; which means your 8-week follow-up blood draw is coming up in about 2 weeks.</p>

<!-- Why Labs Matter -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 30px 0;">
    <tr>
        <td style="border-left: 4px solid #000000; padding-left: 20px;">
            <h3 style="margin: 0 0 15px; color: #000000; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Why Follow-Up Labs Matter</h3>
            <p style="margin: 0; color: #404040; font-size: 15px; line-height: 1.7;">Your follow-up labs let us check your hormone levels and make sure everything is dialed in. Based on the results, your provider may adjust your dose to optimize your outcomes.</p>
        </td>
    </tr>
</table>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr>
        <td style="background-color: #fafafa; padding: 15px 20px; border-left: 3px solid #000000;">
            &#129656; Follow-up labs are <strong>included</strong> with your HRT membership
        </td>
    </tr>
    <tr><td style="height: 10px;"></td></tr>
    <tr>
        <td style="background-color: #fafafa; padding: 15px 20px; border-left: 3px solid #000000;">
            &#128197; We'll send you a reminder to schedule when it's time
        </td>
    </tr>
    <tr><td style="height: 10px;"></td></tr>
    <tr>
        <td style="background-color: #fafafa; padding: 15px 20px; border-left: 3px solid #000000;">
            &#128336; Blood draws are quick &#8212; about 5&#8211;10 minutes
        </td>
    </tr>
</table>

<!-- Prep Instructions -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 30px 0;">
    <tr>
        <td style="background-color: #000000; padding: 25px;">
            <h4 style="margin: 0 0 15px; color: #ffffff; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">&#128203; Lab Prep Instructions</h4>
            <p style="margin: 0 0 10px; color: #e5e5e5; font-size: 14px; line-height: 1.8;">&#8226; Fast for 8&#8211;12 hours before your blood draw (water is fine)</p>
            <p style="margin: 0 0 10px; color: #e5e5e5; font-size: 14px; line-height: 1.8;">&#8226; Schedule your draw for the morning for best results</p>
            <p style="margin: 0; color: #e5e5e5; font-size: 14px; line-height: 1.8;">&#8226; Take your injection as normal unless your provider says otherwise</p>
        </td>
    </tr>
</table>

<p style="margin: 20px 0 0; color: #404040; font-size: 15px; line-height: 1.7;">No action needed right now &#8212; just a heads up so you can plan ahead. We'll reach out again when it's time to schedule.</p>
`);


// ================================================================
// EMAIL 6: BOOK FOLLOW-UP LABS (Day 56) — Universal
// ================================================================
const BOOK_LABS_HTML = wrapEmail('Hormone Optimization Program', `
<h2 style="margin: 0 0 20px; color: #000000; font-size: 22px; font-weight: 600;">Time to Book Your Follow-Up Blood Draw, {{contact.first_name}}</h2>

<p style="margin: 0 0 20px; color: #404040; font-size: 15px; line-height: 1.7;">You're 8 weeks into your HRT program &#8212; it's time for your follow-up labs! This blood draw lets us check your levels and fine-tune your protocol for the best results.</p>

<!-- CTA -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 30px 0;">
    <tr>
        <td style="background-color: #000000; padding: 30px; text-align: center;">
            <h3 style="margin: 0 0 15px; color: #ffffff; font-size: 18px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Schedule Your Blood Draw</h3>
            <p style="margin: 0 0 20px; color: #e5e5e5; font-size: 15px; line-height: 1.7;">Follow-up labs are included with your membership &#8212; no extra cost.</p>
            <p style="margin: 0; color: #ffffff; font-size: 18px; font-weight: 600;">Call (949) 997-3988</p>
            <p style="margin: 10px 0 0; color: #a3a3a3; font-size: 13px;">or reply to this email to schedule</p>
        </td>
    </tr>
</table>

<!-- Reminders -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0;">
    <tr>
        <td style="border: 2px solid #000000; padding: 25px;">
            <h4 style="margin: 0 0 15px; color: #000000; font-size: 14px; font-weight: 700; text-transform: uppercase;">&#128203; Quick Reminders</h4>
            <p style="margin: 0 0 10px; color: #404040; font-size: 14px; line-height: 1.7;">&#8226; Fast for 8&#8211;12 hours before your draw (water is okay)</p>
            <p style="margin: 0 0 10px; color: #404040; font-size: 14px; line-height: 1.7;">&#8226; Morning appointments are preferred</p>
            <p style="margin: 0 0 10px; color: #404040; font-size: 14px; line-height: 1.7;">&#8226; Results typically available within 5&#8211;7 business days</p>
            <p style="margin: 0; color: #404040; font-size: 14px; line-height: 1.7;">&#8226; Your provider will review results and discuss any adjustments</p>
        </td>
    </tr>
</table>

<!-- What Happens Next -->
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 30px 0;">
    <tr>
        <td style="border-left: 4px solid #000000; padding-left: 20px;">
            <h3 style="margin: 0 0 15px; color: #000000; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">What Happens After Your Labs</h3>
            <p style="margin: 0 0 10px; color: #404040; font-size: 15px; line-height: 1.7;">Once your results are in, your provider will review them and reach out to discuss:</p>
            <p style="margin: 0 0 10px; color: #404040; font-size: 15px; line-height: 1.7;">&#8226; Whether your current dose is optimal</p>
            <p style="margin: 0 0 10px; color: #404040; font-size: 15px; line-height: 1.7;">&#8226; Any adjustments to improve your results</p>
            <p style="margin: 0; color: #404040; font-size: 15px; line-height: 1.7;">&#8226; Your next quarterly lab schedule</p>
        </td>
    </tr>
</table>

<p style="margin: 20px 0 0; color: #404040; font-size: 15px; line-height: 1.7;">After this, follow-up labs will be every 12 weeks (quarterly) to keep your levels optimized.</p>
`);


// ================================================================
// RECURRING: MONTHLY IV REMINDER — After day 60, every 30 days
// ================================================================
const RECURRING_IV_REMINDER_HTML = wrapEmail('Hormone Optimization Program', `
<h2 style="margin: 0 0 20px; color: #000000; font-size: 22px; font-weight: 600;">Your Monthly Range IV Is Ready, {{contact.first_name}}</h2>

<p style="margin: 0 0 20px; color: #404040; font-size: 15px; line-height: 1.7;">Just a friendly reminder &#8212; your monthly Range IV is included with your HRT membership. Have you booked this month's session yet?</p>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 30px 0;">
    <tr>
        <td style="background-color: #000000; padding: 25px;">
            <h3 style="margin: 0 0 15px; color: #ffffff; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">&#128137; Monthly Range IV ($225 Value)</h3>
            <p style="margin: 0 0 15px; color: #ffffff; font-size: 15px; line-height: 1.7;">Stay hydrated, energized, and support your HRT results with your included monthly IV.</p>
            <p style="margin: 0; color: #e5e5e5; font-size: 14px; line-height: 1.7;">Sessions take about 30&#8211;45 minutes. Call us or reply to this email to schedule.</p>
        </td>
    </tr>
</table>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0;">
    <tr>
        <td style="border: 2px solid #000000; padding: 25px; text-align: center;">
            <p style="margin: 0; color: #000000; font-size: 18px; font-weight: 600;">(949) 997-3988</p>
            <p style="margin: 10px 0 0; color: #737373; font-size: 13px;">or reply to this email to schedule</p>
        </td>
    </tr>
</table>
`);


// ================================================================
// RECURRING: QUARTERLY LAB REMINDER — After day 140, every 84 days
// ================================================================
const RECURRING_LAB_REMINDER_HTML = wrapEmail('Hormone Optimization Program', `
<h2 style="margin: 0 0 20px; color: #000000; font-size: 22px; font-weight: 600;">Quarterly Lab Reminder, {{contact.first_name}}</h2>

<p style="margin: 0 0 20px; color: #404040; font-size: 15px; line-height: 1.7;">It's time for your quarterly follow-up labs. Regular monitoring helps us keep your hormone levels optimized and ensures you're getting the best results from your program.</p>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 30px 0;">
    <tr>
        <td style="background-color: #000000; padding: 25px;">
            <h3 style="margin: 0 0 15px; color: #ffffff; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">&#129656; Schedule Your Quarterly Labs</h3>
            <p style="margin: 0 0 15px; color: #ffffff; font-size: 15px; line-height: 1.7;">Follow-up labs are included with your HRT membership &#8212; no extra cost.</p>
            <p style="margin: 0 0 10px; color: #e5e5e5; font-size: 14px; line-height: 1.8;">&#8226; Fast for 8&#8211;12 hours before (water is fine)</p>
            <p style="margin: 0 0 10px; color: #e5e5e5; font-size: 14px; line-height: 1.8;">&#8226; Morning appointments recommended</p>
            <p style="margin: 0; color: #e5e5e5; font-size: 14px; line-height: 1.8;">&#8226; Quick 5&#8211;10 minute blood draw</p>
        </td>
    </tr>
</table>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0;">
    <tr>
        <td style="border: 2px solid #000000; padding: 25px; text-align: center;">
            <p style="margin: 0 0 15px; color: #404040; font-size: 15px;">Call or reply to schedule your blood draw:</p>
            <p style="margin: 0; color: #000000; font-size: 18px; font-weight: 600;">(949) 997-3988</p>
        </td>
    </tr>
</table>

<p style="margin: 20px 0 0; color: #404040; font-size: 15px; line-height: 1.7;">Keeping up with quarterly labs is important &#8212; it helps us catch any changes early and keep your protocol dialed in.</p>
`);


// ================================================================
// ONBOARDING SEQUENCE (Steps 0-5)
// ================================================================
const HRT_ONBOARDING_SEQUENCE = [
  {
    stepId: 'welcome',
    day: 0,
    subject: 'Welcome to Your HRT Program at Range Medical',
    html: WELCOME_EMAIL_HTML,
    smsText: 'Hey {{contact.first_name}}! Welcome to your HRT program at Range Medical. Check your email for everything you need to get started — including info about your monthly Range IV ($225 value, included). View your dashboard: {{portal_link}}'
  },
  {
    stepId: 'injection_training',
    day: 1,
    subject: null, // Set by getInjectionTrainingEmail()
    html: null,    // Set by getInjectionTrainingEmail()
    smsText: 'Hey {{contact.first_name}}, we just sent your injection guide to your email — check it out when you get a chance. Your full guide is always available here: {{portal_link}}',
    conditional: true
  },
  {
    stepId: 'week1_checkin',
    day: 7,
    subject: "How's Your First Week Going?",
    html: WEEK1_CHECKIN_HTML,
    smsText: 'Hi {{contact.first_name}}, how did your first week on HRT go? Any questions about your injections or how you\'re feeling? We\'re here to help — just reply or call (949) 997-3988. Your dashboard: {{portal_link}}'
  },
  {
    stepId: 'month1_iv',
    day: 28,
    subject: 'Time to Book Your Monthly Range IV',
    html: MONTH1_IV_REMINDER_HTML,
    smsText: 'Hey {{contact.first_name}}! Your monthly Range IV is included with your HRT membership ($225 value). Book it here: {{portal_link}} or call (949) 997-3988'
  },
  {
    stepId: 'prelab_headsup',
    day: 42,
    subject: 'Your Follow-Up Labs Are Coming Up',
    html: PRELAB_HEADSUP_HTML,
    smsText: 'Heads up {{contact.first_name}} — your 8-week follow-up labs are coming up in about 2 weeks. Check your lab timeline: {{portal_link}}'
  },
  {
    stepId: 'book_labs',
    day: 56,
    subject: 'Time to Book Your Follow-Up Blood Draw',
    html: BOOK_LABS_HTML,
    smsText: 'Hi {{contact.first_name}}, it\'s time for your 8-week follow-up labs! Book your blood draw here: {{portal_link}} or call (949) 997-3988'
  }
];


// ================================================================
// RECURRING REMINDERS (after initial sequence)
// ================================================================
const RECURRING_REMINDERS = [
  {
    type: 'iv_reminder',
    intervalDays: 30,
    startAfterDay: 60,
    subject: 'Your Monthly Range IV Is Ready',
    html: RECURRING_IV_REMINDER_HTML,
    smsText: 'Hey {{contact.first_name}}! Friendly reminder — your monthly Range IV is included with your HRT membership. Book here: {{portal_link}} or call (949) 997-3988'
  },
  {
    type: 'lab_reminder',
    intervalDays: 84,
    startAfterDay: 140,
    subject: 'Time for Your Quarterly Labs',
    html: RECURRING_LAB_REMINDER_HTML,
    smsText: 'Hi {{contact.first_name}}, it\'s time for your quarterly follow-up labs (included with your membership). Book here: {{portal_link}} or call (949) 997-3988'
  }
];


// ================================================================
// BRANCHING: Day 1 injection training email
// ================================================================
/**
 * Get the correct Day 1 injection training email based on protocol config.
 *
 * @param {Object} protocol - Protocol record with delivery_method, injection_method, supply_type
 * @returns {{ subject: string, html: string }}
 */
function getInjectionTrainingEmail(protocol) {
  const deliveryMethod = protocol.delivery_method;
  const injectionMethod = protocol.injection_method;
  const supplyType = protocol.supply_type || '';

  // In-clinic — schedule confirmation only
  if (deliveryMethod === 'in_clinic') {
    return {
      subject: 'Your Injection Schedule at Range Medical',
      html: INCLINIC_SCHEDULE_HTML
    };
  }

  // Take-home SubQ
  if (injectionMethod === 'subq') {
    return {
      subject: 'Your Daily SubQ Injection Guide',
      html: SUBQ_GUIDE_HTML
    };
  }

  // Take-home IM — pre-filled vs vial
  if (supplyType.includes('prefilled')) {
    return {
      subject: 'How to Self-Inject: Pre-Filled Syringe',
      html: IM_PREFILLED_HTML
    };
  }

  // Default: IM vial
  return {
    subject: 'How to Self-Inject: Drawing from a Vial',
    html: IM_VIAL_HTML
  };
}


// ================================================================
// PERSONALIZATION
// ================================================================
/**
 * Replace placeholders in email HTML or SMS text.
 *
 * @param {string} text - HTML or SMS text with placeholders
 * @param {Object} protocol - Protocol record
 * @param {Object} patient - Patient record (first_name, name, etc.)
 * @returns {string}
 */
function personalizeHRTEmail(text, protocol, patient) {
  const firstName = patient.first_name || (patient.name ? patient.name.split(' ')[0] : null) || 'there';
  const medication = protocol.medication || protocol.program_name || 'your prescribed medication';
  const dose = protocol.dose || protocol.selected_dose || protocol.dose_per_injection || '';

  // Build schedule string from protocol data
  let schedule = '';
  if (protocol.scheduled_days && Array.isArray(protocol.scheduled_days) && protocol.scheduled_days.length > 0) {
    // Format: "Monday & Thursday" or "Tuesday & Friday"
    const dayNames = protocol.scheduled_days.map(d =>
      d.charAt(0).toUpperCase() + d.slice(1)
    );
    schedule = dayNames.join(' & ');
  } else if (protocol.frequency) {
    schedule = protocol.frequency;
  } else if (protocol.injection_method === 'subq') {
    schedule = 'Daily';
  } else {
    schedule = '2x per week';
  }

  // Build portal link
  const portalLink = protocol.access_token
    ? `https://www.range-medical.com/hrt/${protocol.access_token}`
    : '#';

  return text
    .replace(/\{\{contact\.first_name\}\}/g, firstName)
    .replace(/\{\{medication\}\}/g, medication)
    .replace(/\{\{dose\}\}/g, dose)
    .replace(/\{\{schedule\}\}/g, schedule)
    .replace(/\{\{portal_link\}\}/g, portalLink);
}


module.exports = {
  HRT_ONBOARDING_SEQUENCE,
  RECURRING_REMINDERS,
  getInjectionTrainingEmail,
  personalizeHRTEmail
};
