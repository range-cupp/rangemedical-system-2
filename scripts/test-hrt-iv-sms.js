const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://teivfptpozltpqwahgdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzE0OSwiZXhwIjoyMDgwMjg5MTQ5fQ.7P_jrgUmF34lPEJOYgmAogDLwEKplEOtyOazIaXmqHA'
);

const BLOOIO_API_KEY = 'api_sC1NUN41DhahwqbAdX1Jx';
const BLOOIO_PHONE_NUMBER = '+19495395023';
const BLOOIO_BASE_URL = 'https://backend.blooio.com/v2/api';

async function sendBlooio(to, message) {
  const chatId = encodeURIComponent(to);
  const url = `${BLOOIO_BASE_URL}/chats/${chatId}/messages`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${BLOOIO_API_KEY}`,
      'Content-Type': 'application/json',
      'X-From-Number': BLOOIO_PHONE_NUMBER,
      'Idempotency-Key': `rm-${to}-${Date.now()}`,
    },
    body: JSON.stringify({ text: message }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.message || `Blooio error ${response.status}`);
  }
  return { messageSid: data.message_id || data.message_ids?.[0] || null };
}

async function main() {
  const patientId = '950224e9-5fef-4820-ac64-bef6971a2a23';
  const patientName = 'Chris Cupp';
  const patientPhone = '+19496900339';
  const firstName = 'Chris';

  // Mark any old prompts as replied so we get a clean test
  console.log('=== Clearing old prompts ===');
  const { data: oldPrompts } = await supabase
    .from('comms_log')
    .select('id')
    .eq('patient_id', patientId)
    .eq('message_type', 'hrt_iv_schedule_prompt')
    .neq('status', 'replied');

  if (oldPrompts && oldPrompts.length > 0) {
    for (const old of oldPrompts) {
      await supabase.from('comms_log').update({ status: 'replied' }).eq('id', old.id);
    }
    console.log('Marked', oldPrompts.length, 'old prompt(s) as replied');
  }

  // Send scheduling prompt SMS via Blooio
  console.log('\n=== Sending Scheduling Prompt via Blooio ===');
  const monthName = new Date().toLocaleDateString('en-US', { month: 'long' , timeZone: 'America/Los_Angeles' });
  const schedulePrompt = `Hi ${firstName}! Your complimentary Range IV for ${monthName} is ready 💉 Want to schedule? Reply YES and we'll send you a link to pick a time! — Range Medical`;

  console.log('To:', patientPhone);
  console.log('Provider: Blooio (iMessage/RCS/SMS)');

  const result = await sendBlooio(patientPhone, schedulePrompt);
  console.log('Sent! Message ID:', result.messageSid);

  // Log fresh prompt to comms_log
  const { error: logErr } = await supabase
    .from('comms_log')
    .insert({
      patient_id: patientId,
      patient_name: patientName,
      channel: 'sms',
      message_type: 'hrt_iv_schedule_prompt',
      message: schedulePrompt,
      source: 'stripe-webhook',
      recipient: patientPhone,
      status: 'sent',
      direction: 'outbound',
      provider: 'blooio',
    });

  if (logErr) console.error('Error logging prompt:', logErr.message);
  else console.log('Logged to comms_log');

  console.log('\n=== TEST READY ===');
  console.log('1. Chris should receive via iMessage/Blooio now');
  console.log('2. Reply "yes"');
  console.log('3. Once deployed, Twilio webhook detects YES → sends booking link');
}
main().catch(console.error);
