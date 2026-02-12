// /lib/wl-drip-emails.js
// Weight Loss drip email sequence - 4 emails sent over 4 days
// Sent via Resend when a new weight loss protocol is created
// Range Medical

// Sequence: Day 0 welcome, Day 1 nutrition, Day 2 side effects, Day 3 exercise/supplements

const EMAIL_1_HTML = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Weight Loss Journey Starts Here</title>
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
                            <p style="margin: 10px 0 0; color: #a3a3a3; font-size: 14px;">Weight Loss Program</p>
                        </td>
                    </tr>

                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px; color: #000000; font-size: 22px; font-weight: 600;">Welcome to Your Weight Loss Journey, {{contact.first_name}}!</h2>

                            <p style="margin: 0 0 20px; color: #404040; font-size: 15px; line-height: 1.7;">We're excited to support you on this journey. Over the next week, we'll send you everything you need to know about your medication, nutrition, managing side effects, and getting the best results.</p>

                            <p style="margin: 0 0 20px; color: #404040; font-size: 15px; line-height: 1.7;">Let's start with understanding how your medication works.</p>

                            <!-- Section: How It Works -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 30px 0;">
                                <tr>
                                    <td style="border-left: 4px solid #000000; padding-left: 20px;">
                                        <h3 style="margin: 0 0 15px; color: #000000; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">How Your Medication Helps</h3>
                                        <p style="margin: 0; color: #404040; font-size: 15px; line-height: 1.7;">These medications work by changing how your body handles hunger and digestion. They help you:</p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Benefits List -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0;">
                                <tr>
                                    <td style="background-color: #fafafa; padding: 15px 20px; border-left: 3px solid #000000; margin-bottom: 10px;">
                                        &#10003; Feel full faster
                                    </td>
                                </tr>
                                <tr><td style="height: 10px;"></td></tr>
                                <tr>
                                    <td style="background-color: #fafafa; padding: 15px 20px; border-left: 3px solid #000000;">
                                        &#10003; Stay full longer
                                    </td>
                                </tr>
                                <tr><td style="height: 10px;"></td></tr>
                                <tr>
                                    <td style="background-color: #fafafa; padding: 15px 20px; border-left: 3px solid #000000;">
                                        &#10003; Have fewer cravings
                                    </td>
                                </tr>
                                <tr><td style="height: 10px;"></td></tr>
                                <tr>
                                    <td style="background-color: #fafafa; padding: 15px 20px; border-left: 3px solid #000000;">
                                        &#10003; Eat less without trying as hard
                                    </td>
                                </tr>
                            </table>

                            <!-- What to Expect -->
                            <h3 style="margin: 30px 0 15px; color: #000000; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">What to Expect</h3>

                            <p style="margin: 0 0 15px; color: #404040; font-size: 15px; line-height: 1.7;">Many people experience stomach-related side effects in the first few weeks. <strong>This is normal</strong> and usually gets better as your body adjusts.</p>

                            <p style="margin: 0 0 15px; color: #404040; font-size: 15px; line-height: 1.7;"><strong>Common side effects include:</strong> Nausea, constipation, diarrhea, bloating, and indigestion.</p>

                            <p style="margin: 0 0 20px; color: #404040; font-size: 15px; line-height: 1.7;">Don't worry&#8212;we'll send you specific tips for managing each of these in a few days.</p>

                            <!-- Safety Alert -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 30px 0;">
                                <tr>
                                    <td style="background-color: #000000; padding: 25px;">
                                        <h4 style="margin: 0 0 15px; color: #ffffff; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">&#9888;&#65039; When to Contact Us</h4>
                                        <p style="margin: 0; color: #ffffff; font-size: 14px; line-height: 1.7;">Call us or get medical help right away if you have:</p>
                                        <p style="margin: 10px 0 0; color: #e5e5e5; font-size: 14px; line-height: 1.8;">
                                            &#8226; Strong stomach pain that doesn't go away<br>
                                            &#8226; Yellow skin or eyes, dark urine<br>
                                            &#8226; Vomiting or diarrhea that won't stop
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Closing -->
                            <p style="margin: 20px 0 0; color: #404040; font-size: 15px; line-height: 1.7;">Every person is different&#8212;some lose more weight, some less. You'll get the best results when you combine your medication with healthy eating and regular movement.</p>

                            <p style="margin: 20px 0 0; color: #404040; font-size: 15px; line-height: 1.7;"><strong>Coming next:</strong> Essential nutrition tips to maximize your results.</p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #fafafa; padding: 30px; text-align: center; border-top: 2px solid #e5e5e5;">
                            <p style="margin: 0 0 10px; color: #737373; font-size: 13px;">Questions? We're here to help.</p>
                            <p style="margin: 0; color: #000000; font-size: 15px; font-weight: 600;">(949) 997-3988</p>
                            <p style="margin: 15px 0 0; color: #a3a3a3; font-size: 12px;">Range Medical &#8226; Newport Beach, CA</p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

const EMAIL_2_HTML = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fuel Your Weight Loss: What to Eat</title>
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
                            <p style="margin: 10px 0 0; color: #a3a3a3; font-size: 14px;">Weight Loss Program &#8226; Part 2 of 4</p>
                        </td>
                    </tr>

                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px; color: #000000; font-size: 22px; font-weight: 600;">Fuel Your Weight Loss, {{contact.first_name}}</h2>

                            <p style="margin: 0 0 20px; color: #404040; font-size: 15px; line-height: 1.7;">Since you're eating less while on your medication, it's important to make every bite count. Here's how to get the nutrients your body needs.</p>

                            <!-- Essential Nutrients -->
                            <h3 style="margin: 30px 0 15px; color: #000000; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Essential Nutrients to Focus On</h3>

                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td width="50%" style="padding: 10px 10px 10px 0; vertical-align: top;">
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fafafa; border: 1px solid #e5e5e5;">
                                            <tr>
                                                <td style="padding: 20px; text-align: center;">
                                                    <p style="margin: 0 0 10px; font-size: 28px;">&#127806;</p>
                                                    <p style="margin: 0 0 5px; color: #000000; font-size: 13px; font-weight: 700; text-transform: uppercase;">Fiber</p>
                                                    <p style="margin: 0; color: #737373; font-size: 12px; line-height: 1.5;">Oats, vegetables, fruits, nuts</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td width="50%" style="padding: 10px 0 10px 10px; vertical-align: top;">
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fafafa; border: 1px solid #e5e5e5;">
                                            <tr>
                                                <td style="padding: 20px; text-align: center;">
                                                    <p style="margin: 0 0 10px; font-size: 28px;">&#129385;</p>
                                                    <p style="margin: 0 0 5px; color: #000000; font-size: 13px; font-weight: 700; text-transform: uppercase;">Protein</p>
                                                    <p style="margin: 0; color: #737373; font-size: 12px; line-height: 1.5;">Chicken, fish, eggs, beans</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td width="50%" style="padding: 10px 10px 10px 0; vertical-align: top;">
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fafafa; border: 1px solid #e5e5e5;">
                                            <tr>
                                                <td style="padding: 20px; text-align: center;">
                                                    <p style="margin: 0 0 10px; font-size: 28px;">&#129472;</p>
                                                    <p style="margin: 0 0 5px; color: #000000; font-size: 13px; font-weight: 700; text-transform: uppercase;">Calcium</p>
                                                    <p style="margin: 0; color: #737373; font-size: 12px; line-height: 1.5;">Dairy, sardines, leafy greens</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td width="50%" style="padding: 10px 0 10px 10px; vertical-align: top;">
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fafafa; border: 1px solid #e5e5e5;">
                                            <tr>
                                                <td style="padding: 20px; text-align: center;">
                                                    <p style="margin: 0 0 10px; font-size: 28px;">&#128031;</p>
                                                    <p style="margin: 0 0 5px; color: #000000; font-size: 13px; font-weight: 700; text-transform: uppercase;">Vitamin D</p>
                                                    <p style="margin: 0; color: #737373; font-size: 12px; line-height: 1.5;">Fatty fish, eggs, mushrooms</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                            <!-- Protein Section -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 30px 0;">
                                <tr>
                                    <td style="border: 2px solid #000000; padding: 25px;">
                                        <h3 style="margin: 0 0 15px; color: #000000; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">&#129385; Protein is Key</h3>
                                        <p style="margin: 0 0 15px; color: #404040; font-size: 15px; line-height: 1.7;">Protein helps you maintain muscle while losing fat, stay full longer, and support your metabolism.</p>
                                        <p style="margin: 0; color: #404040; font-size: 15px; line-height: 1.7;"><strong>Try to include protein with every meal.</strong></p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Protein Sources -->
                            <h4 style="margin: 25px 0 15px; color: #000000; font-size: 14px; font-weight: 700; text-transform: uppercase;">Top Protein Sources</h4>

                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fafafa; border: 1px solid #e5e5e5;">
                                <tr>
                                    <td style="padding: 15px 20px; border-bottom: 1px solid #e5e5e5;">
                                        <strong>&#129411; Lean Turkey</strong> &#8212; 26g per 3 oz
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 15px 20px; border-bottom: 1px solid #e5e5e5;">
                                        <strong>&#127831; Chicken Breast</strong> &#8212; 25g per 3 oz
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 15px 20px; border-bottom: 1px solid #e5e5e5;">
                                        <strong>&#128031; Fish</strong> &#8212; 22g per 3 oz
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 15px 20px; border-bottom: 1px solid #e5e5e5;">
                                        <strong>&#129370; Eggs</strong> &#8212; 6g per egg
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 15px 20px; border-bottom: 1px solid #e5e5e5;">
                                        <strong>&#129752; Lentils</strong> &#8212; 18g per cup cooked
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 15px 20px;">
                                        <strong>&#129371; Greek Yogurt</strong> &#8212; 15g per cup
                                    </td>
                                </tr>
                            </table>

                            <!-- Pro Tip -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 30px 0;">
                                <tr>
                                    <td style="background-color: #000000; padding: 20px;">
                                        <p style="margin: 0; color: #ffffff; font-size: 14px; line-height: 1.7;"><strong>&#128161; Pro Tip:</strong> If it's hard to eat enough protein, a protein shake can help fill the gap. Talk to us about recommendations.</p>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 20px 0 0; color: #404040; font-size: 15px; line-height: 1.7;"><strong>Coming next:</strong> How to manage common side effects so you can feel your best.</p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #fafafa; padding: 30px; text-align: center; border-top: 2px solid #e5e5e5;">
                            <p style="margin: 0 0 10px; color: #737373; font-size: 13px;">Questions? We're here to help.</p>
                            <p style="margin: 0; color: #000000; font-size: 15px; font-weight: 600;">(949) 997-3988</p>
                            <p style="margin: 15px 0 0; color: #a3a3a3; font-size: 12px;">Range Medical &#8226; Newport Beach, CA</p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

const EMAIL_3_HTML = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Feeling Nauseous? Here's What Helps</title>
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
                            <p style="margin: 10px 0 0; color: #a3a3a3; font-size: 14px;">Weight Loss Program &#8226; Part 3 of 4</p>
                        </td>
                    </tr>

                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px; color: #000000; font-size: 22px; font-weight: 600;">Managing Side Effects, {{contact.first_name}}</h2>

                            <p style="margin: 0 0 20px; color: #404040; font-size: 15px; line-height: 1.7;">Side effects are common when starting your medication&#8212;but they don't have to slow you down. Here are proven strategies to help you feel better.</p>

                            <!-- General Tips -->
                            <h3 style="margin: 30px 0 15px; color: #000000; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">General Eating Tips</h3>

                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td style="background-color: #fafafa; padding: 15px 20px; border-left: 3px solid #000000; margin-bottom: 8px;">
                                        Eat slowly and chew each bite thoroughly
                                    </td>
                                </tr>
                                <tr><td style="height: 8px;"></td></tr>
                                <tr>
                                    <td style="background-color: #fafafa; padding: 15px 20px; border-left: 3px solid #000000;">
                                        Eat smaller, more frequent meals (every 3-4 hours)
                                    </td>
                                </tr>
                                <tr><td style="height: 8px;"></td></tr>
                                <tr>
                                    <td style="background-color: #fafafa; padding: 15px 20px; border-left: 3px solid #000000;">
                                        Stop eating when you feel full&#8212;don't push it
                                    </td>
                                </tr>
                                <tr><td style="height: 8px;"></td></tr>
                                <tr>
                                    <td style="background-color: #fafafa; padding: 15px 20px; border-left: 3px solid #000000;">
                                        Avoid lying down for 2 hours after eating
                                    </td>
                                </tr>
                                <tr><td style="height: 8px;"></td></tr>
                                <tr>
                                    <td style="background-color: #fafafa; padding: 15px 20px; border-left: 3px solid #000000;">
                                        Eat your last meal at least 2 hours before bed
                                    </td>
                                </tr>
                            </table>

                            <!-- Nausea -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 30px 0;">
                                <tr>
                                    <td style="border: 2px solid #000000; padding: 25px;">
                                        <h4 style="margin: 0 0 15px; color: #000000; font-size: 14px; font-weight: 700; text-transform: uppercase;">&#128560; Nausea (Upset Stomach)</h4>
                                        <p style="margin: 0 0 10px; color: #404040; font-size: 14px; line-height: 1.7;">&#8226; Don't skip breakfast</p>
                                        <p style="margin: 0 0 10px; color: #404040; font-size: 14px; line-height: 1.7;">&#8226; Limit high-fat and high-fiber foods in the first few days</p>
                                        <p style="margin: 0 0 10px; color: #404040; font-size: 14px; line-height: 1.7;">&#8226; Drink beverages 30-60 minutes before or after meals (not during)</p>
                                        <p style="margin: 0 0 10px; color: #404040; font-size: 14px; line-height: 1.7;">&#8226; Try apple slices, plain crackers, or ginger/mint tea</p>
                                        <p style="margin: 0; color: #404040; font-size: 14px; line-height: 1.7;">&#8226; Avoid greasy and fried foods</p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Constipation -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0;">
                                <tr>
                                    <td style="background-color: #fafafa; border: 1px solid #e5e5e5; padding: 25px;">
                                        <h4 style="margin: 0 0 15px; color: #000000; font-size: 14px; font-weight: 700; text-transform: uppercase;">&#128701; Constipation</h4>
                                        <p style="margin: 0 0 10px; color: #404040; font-size: 14px; line-height: 1.7;">&#8226; Gradually add more high-fiber foods (25-38g/day)</p>
                                        <p style="margin: 0; color: #404040; font-size: 14px; line-height: 1.7;">&#8226; Drink 1.5-2 liters (51-68 oz) of water daily</p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Diarrhea -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0;">
                                <tr>
                                    <td style="background-color: #fafafa; border: 1px solid #e5e5e5; padding: 25px;">
                                        <h4 style="margin: 0 0 15px; color: #000000; font-size: 14px; font-weight: 700; text-transform: uppercase;">&#128167; Diarrhea</h4>
                                        <p style="margin: 0 0 10px; color: #404040; font-size: 14px; line-height: 1.7;">&#8226; Temporarily reduce fiber&#8212;eat easy-to-digest foods (rice, chicken broth, cooked carrots)</p>
                                        <p style="margin: 0 0 10px; color: #404040; font-size: 14px; line-height: 1.7;">&#8226; Avoid coffee and alcohol</p>
                                        <p style="margin: 0; color: #404040; font-size: 14px; line-height: 1.7;">&#8226; Reduce sugar alcohols (sorbitol, mannitol, xylitol)</p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Bloating -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0;">
                                <tr>
                                    <td style="background-color: #fafafa; border: 1px solid #e5e5e5; padding: 25px;">
                                        <h4 style="margin: 0 0 15px; color: #000000; font-size: 14px; font-weight: 700; text-transform: uppercase;">&#127880; Bloating &amp; Gas</h4>
                                        <p style="margin: 0 0 10px; color: #404040; font-size: 14px; line-height: 1.7;">&#8226; Avoid greasy and fried foods</p>
                                        <p style="margin: 0 0 10px; color: #404040; font-size: 14px; line-height: 1.7;">&#8226; Try herbal teas (chamomile, ginger, peppermint)</p>
                                        <p style="margin: 0 0 10px; color: #404040; font-size: 14px; line-height: 1.7;">&#8226; Avoid carbonated drinks</p>
                                        <p style="margin: 0; color: #404040; font-size: 14px; line-height: 1.7;">&#8226; Limit gas-causing foods (beans, broccoli, cabbage, onions)</p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Pro Tip -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 30px 0;">
                                <tr>
                                    <td style="background-color: #000000; padding: 20px;">
                                        <p style="margin: 0; color: #ffffff; font-size: 14px; line-height: 1.7;"><strong>&#128161; Remember:</strong> Side effects usually improve as your body adjusts. If they persist or become severe, contact us&#8212;we can help.</p>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 20px 0 0; color: #404040; font-size: 15px; line-height: 1.7;"><strong>Coming next:</strong> Exercise tips and your included supplements to maximize your results.</p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #fafafa; padding: 30px; text-align: center; border-top: 2px solid #e5e5e5;">
                            <p style="margin: 0 0 10px; color: #737373; font-size: 13px;">Questions? We're here to help.</p>
                            <p style="margin: 0; color: #000000; font-size: 15px; font-weight: 600;">(949) 997-3988</p>
                            <p style="margin: 15px 0 0; color: #a3a3a3; font-size: 12px;">Range Medical &#8226; Newport Beach, CA</p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

const EMAIL_4_HTML = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Final Piece: Exercise & Supplements</title>
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
                            <p style="margin: 10px 0 0; color: #a3a3a3; font-size: 14px;">Weight Loss Program &#8226; Part 4 of 4</p>
                        </td>
                    </tr>

                    <!-- Main Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px; color: #000000; font-size: 22px; font-weight: 600;">Maximize Your Results, {{contact.first_name}}</h2>

                            <p style="margin: 0 0 20px; color: #404040; font-size: 15px; line-height: 1.7;">You've learned about your medication, nutrition, and managing side effects. Now let's talk about exercise and your included supplements to help you get the best possible results.</p>

                            <!-- Exercise Section -->
                            <h3 style="margin: 30px 0 15px; color: #000000; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">&#128170; Physical Activity</h3>

                            <p style="margin: 0 0 20px; color: #404040; font-size: 15px; line-height: 1.7;">Exercise helps preserve muscle mass while you lose fat, and supports healthy digestion.</p>

                            <!-- Cardio -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0;">
                                <tr>
                                    <td style="background-color: #fafafa; border: 1px solid #e5e5e5; padding: 25px;">
                                        <h4 style="margin: 0 0 15px; color: #000000; font-size: 14px; font-weight: 700; text-transform: uppercase;">&#127939; Aerobic Exercise (Cardio)</h4>
                                        <p style="margin: 0 0 10px; color: #404040; font-size: 14px; line-height: 1.7;"><strong>Goal:</strong> 150 minutes per week, split across 5+ days</p>
                                        <p style="margin: 0; color: #404040; font-size: 14px; line-height: 1.7;"><strong>Examples:</strong> Brisk walking, biking, swimming, dancing, hiking</p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Strength -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0;">
                                <tr>
                                    <td style="background-color: #fafafa; border: 1px solid #e5e5e5; padding: 25px;">
                                        <h4 style="margin: 0 0 15px; color: #000000; font-size: 14px; font-weight: 700; text-transform: uppercase;">&#127947;&#65039; Resistance Training (Strength)</h4>
                                        <p style="margin: 0 0 10px; color: #404040; font-size: 14px; line-height: 1.7;"><strong>Goal:</strong> 3 sessions per week (with rest days between)</p>
                                        <p style="margin: 0; color: #404040; font-size: 14px; line-height: 1.7;"><strong>Format:</strong> 8-10 exercises, 8-12 reps, 2+ sets each</p>
                                    </td>
                                </tr>
                            </table>

                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0;">
                                <tr>
                                    <td style="border: 2px solid #000000; padding: 20px;">
                                        <p style="margin: 0; color: #404040; font-size: 14px; line-height: 1.7;"><strong>&#9889; Important:</strong> You may feel more tired than usual on your medication. Listen to your body and adjust as needed&#8212;it's okay to start slow and build up.</p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Supplements Section -->
                            <h3 style="margin: 40px 0 15px; color: #000000; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">&#128138; Your Supplement Support</h3>

                            <p style="margin: 0 0 20px; color: #404040; font-size: 15px; line-height: 1.7;">Since you're eating less, supplements help fill nutritional gaps and keep your body healthy during weight loss.</p>

                            <!-- Included in Program -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0;">
                                <tr>
                                    <td style="background-color: #000000; padding: 20px;">
                                        <h4 style="margin: 0 0 15px; color: #ffffff; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">&#10003; Included in Your Program</h4>
                                        <p style="margin: 0 0 10px; color: #ffffff; font-size: 14px; line-height: 1.7;"><strong>Multivitamin</strong> &#8212; Covers essential vitamins and minerals your body needs when eating less</p>
                                        <p style="margin: 0; color: #ffffff; font-size: 14px; line-height: 1.7;"><strong>Vitamin D</strong> &#8212; Supports bone health, immune function, and energy levels</p>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin: 20px 0 15px; color: #404040; font-size: 14px; font-weight: 600;">Additional supplements you may consider (talk to your provider):</p>

                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td style="padding: 15px 20px; border-bottom: 1px solid #e5e5e5; background-color: #fafafa;">
                                        <strong>Calcium</strong> &#8212; Supports bone health during weight loss
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 15px 20px; border-bottom: 1px solid #e5e5e5;">
                                        <strong>Whey Protein</strong> &#8212; Helps meet protein goals, protects muscle
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 15px 20px; border-bottom: 1px solid #e5e5e5; background-color: #fafafa;">
                                        <strong>Probiotics</strong> &#8212; Supports digestive health, may reduce GI symptoms
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 15px 20px; border-bottom: 1px solid #e5e5e5;">
                                        <strong>Ginger</strong> &#8212; Natural nausea relief
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 15px 20px; background-color: #fafafa;">
                                        <strong>Creatine</strong> &#8212; Helps preserve muscle strength
                                    </td>
                                </tr>
                            </table>

                            <!-- Final CTA -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 40px 0 20px;">
                                <tr>
                                    <td style="background-color: #000000; padding: 30px; text-align: center;">
                                        <h3 style="margin: 0 0 15px; color: #ffffff; font-size: 18px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">You're Not Alone</h3>
                                        <p style="margin: 0 0 20px; color: #e5e5e5; font-size: 15px; line-height: 1.7;">With the right support&#8212;medication, nutrition, exercise, and supplements&#8212;you can feel your best as you work toward your goals.</p>
                                        <p style="margin: 0; color: #ffffff; font-size: 15px; font-weight: 600;">Questions? Need a personalized plan? Reach out anytime.</p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Full Guide Link -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0;">
                                <tr>
                                    <td style="text-align: center; padding: 20px;">
                                        <p style="margin: 0 0 15px; color: #404040; font-size: 14px;">Want all this info in one place?</p>
                                        <a href="https://www.range-medical.com/weight-loss-medication-guide-page" style="display: inline-block; background-color: #000000; color: #ffffff; padding: 15px 30px; text-decoration: none; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">View Full Guide</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #fafafa; padding: 30px; text-align: center; border-top: 2px solid #e5e5e5;">
                            <p style="margin: 0 0 10px; color: #737373; font-size: 13px;">Questions? We're here to help.</p>
                            <p style="margin: 0; color: #000000; font-size: 15px; font-weight: 600;">(949) 997-3988</p>
                            <p style="margin: 15px 0 0; color: #a3a3a3; font-size: 12px;">Range Medical &#8226; Newport Beach, CA</p>
                            <p style="margin: 10px 0 0; color: #a3a3a3; font-size: 11px;">This guide is for education only and does not replace medical advice.</p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

const WL_DRIP_EMAILS = [
  {
    emailNumber: 1,
    day: 0,
    subject: 'Your Weight Loss Journey Starts Here',
    html: EMAIL_1_HTML
  },
  {
    emailNumber: 2,
    day: 1,
    subject: 'Fuel Your Weight Loss: What to Eat',
    html: EMAIL_2_HTML
  },
  {
    emailNumber: 3,
    day: 2,
    subject: 'Feeling Nauseous? Here\'s What Helps',
    html: EMAIL_3_HTML
  },
  {
    emailNumber: 4,
    day: 3,
    subject: 'The Final Piece: Exercise & Supplements',
    html: EMAIL_4_HTML
  }
];

function personalizeEmail(html, firstName) {
  return html.replace(/\{\{contact\.first_name\}\}/g, firstName || 'there');
}

module.exports = { WL_DRIP_EMAILS, personalizeEmail };
