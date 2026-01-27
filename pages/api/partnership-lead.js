// pages/api/partnership-lead.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      services,
      goals,
      referral,
      partner = 'Society OC',
      discount = '10%'
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!services || services.length === 0) {
      return res.status(400).json({ error: 'Please select at least one service' });
    }

    // Insert into Supabase
    const { data, error } = await supabase
      .from('partnership_leads')
      .insert({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        services_interested: services,
        health_goals: goals?.trim() || null,
        referral_source: referral || null,
        partner_name: partner,
        discount_code: discount,
        status: 'new'
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to save lead' });
    }

    // Optionally: Create/update GHL contact here
    // You can add GHL integration later if needed

    console.log(`New ${partner} lead:`, data.id, `${firstName} ${lastName}`);

    return res.status(200).json({ 
      success: true, 
      message: 'Lead captured successfully',
      id: data.id 
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
