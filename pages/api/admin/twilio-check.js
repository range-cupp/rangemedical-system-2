// /pages/api/admin/twilio-check.js
// Check Twilio account status, number capabilities, and recent message delivery
// Range Medical — diagnostic endpoint

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'GET only' });
  }

  const accountSid = (process.env.TWILIO_ACCOUNT_SID || '').trim();
  const authToken = (process.env.TWILIO_AUTH_TOKEN || '').trim();
  const fromNumber = (process.env.TWILIO_PHONE_NUMBER || '').trim();

  if (!accountSid || !authToken) {
    return res.status(400).json({ error: 'Twilio not configured' });
  }

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  const results = {};

  try {
    // 1. Check account info
    const acctRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`,
      { headers: { 'Authorization': `Basic ${auth}` } }
    );
    const acct = await acctRes.json();
    results.account = {
      friendlyName: acct.friendly_name,
      status: acct.status,
      type: acct.type,
      ownerAccountSid: acct.owner_account_sid,
    };

    // 2. Check phone number capabilities
    if (fromNumber) {
      const encodedNumber = encodeURIComponent(fromNumber);
      const numRes = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/IncomingPhoneNumbers.json?PhoneNumber=${encodedNumber}`,
        { headers: { 'Authorization': `Basic ${auth}` } }
      );
      const numData = await numRes.json();
      if (numData.incoming_phone_numbers && numData.incoming_phone_numbers.length > 0) {
        const num = numData.incoming_phone_numbers[0];
        results.phoneNumber = {
          number: num.phone_number,
          friendlyName: num.friendly_name,
          smsEnabled: num.capabilities?.sms,
          mmsEnabled: num.capabilities?.mms,
          voiceEnabled: num.capabilities?.voice,
          status: num.status,
          smsUrl: num.sms_url,
          statusCallback: num.status_callback,
        };
      } else {
        results.phoneNumber = { error: 'Number not found in account', number: fromNumber };
      }
    }

    // 3. Get last 5 outbound messages with delivery status
    const msgRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json?PageSize=10&From=${encodeURIComponent(fromNumber)}`,
      { headers: { 'Authorization': `Basic ${auth}` } }
    );
    const msgData = await msgRes.json();
    results.recentMessages = (msgData.messages || []).map(m => ({
      sid: m.sid,
      to: m.to,
      status: m.status,
      errorCode: m.error_code,
      errorMessage: m.error_message,
      dateSent: m.date_sent,
      dateUpdated: m.date_updated,
      price: m.price,
    }));

    // 4. Check for messaging service (A2P)
    try {
      const svcRes = await fetch(
        `https://messaging.twilio.com/v1/Services?PageSize=5`,
        { headers: { 'Authorization': `Basic ${auth}` } }
      );
      const svcData = await svcRes.json();
      results.messagingServices = (svcData.services || []).map(s => ({
        sid: s.sid,
        friendlyName: s.friendly_name,
        usecase: s.usecase,
        a2pCampaignStatus: s.us_app_to_person_registered,
      }));
    } catch (e) {
      results.messagingServices = { error: e.message };
    }

    return res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ error: error.message, partial: results });
  }
}
