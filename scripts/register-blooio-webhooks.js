// scripts/register-blooio-webhooks.js
// One-time script to register Blooio webhook URL
// Run: BLOOIO_API_KEY=your_key node scripts/register-blooio-webhooks.js
// Range Medical

const BASE_URL = 'https://app.range-medical.com';
const BLOOIO_BASE = 'https://backend.blooio.com/v2/api';

async function register() {
  const apiKey = process.env.BLOOIO_API_KEY;
  if (!apiKey) {
    console.error('ERROR: BLOOIO_API_KEY environment variable is required');
    console.error('Usage: BLOOIO_API_KEY=your_key node scripts/register-blooio-webhooks.js');
    process.exit(1);
  }

  const webhookUrl = `${BASE_URL}/api/blooio/webhook`;

  console.log(`Registering Blooio webhook: ${webhookUrl}`);
  console.log('Webhook type: all (inbound messages + delivery status)');
  console.log('');

  try {
    const res = await fetch(`${BLOOIO_BASE}/webhooks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        webhook_url: webhookUrl,
        webhook_type: 'all',
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Registration failed:', data);
      process.exit(1);
    }

    console.log('✅ Webhook registered successfully!');
    console.log('');
    console.log('Webhook ID:', data.webhook_id);
    console.log('');
    console.log('⚠️  IMPORTANT: Save this signing secret as BLOOIO_WEBHOOK_SECRET in Vercel:');
    console.log('');
    console.log(`   ${data.signing_secret}`);
    console.log('');
    console.log('This secret will NOT be shown again!');

  } catch (err) {
    console.error('Registration error:', err.message);
    process.exit(1);
  }
}

register();
