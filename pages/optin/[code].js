// /pages/optin/[code].js
// Short URL redirect for peptide check-in opt-in
// Maps short code (first 8 chars of access_token) to the full opt-in form
// Range Medical

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function getServerSideProps(context) {
  const { code } = context.params;

  if (!code || code.length < 6) {
    return { redirect: { destination: '/', permanent: false } };
  }

  try {
    // Look up protocol by access_token prefix
    const { data: protocol, error } = await supabase
      .from('protocols')
      .select('id, ghl_contact_id, patient_id')
      .ilike('access_token', `${code}%`)
      .limit(1)
      .single();

    if (error || !protocol) {
      return { redirect: { destination: '/', permanent: false } };
    }

    // Get the GHL contact ID — either from protocol or from patient record
    let contactId = protocol.ghl_contact_id;
    if (!contactId && protocol.patient_id) {
      const { data: patient } = await supabase
        .from('patients')
        .select('ghl_contact_id')
        .eq('id', protocol.patient_id)
        .single();
      contactId = patient?.ghl_contact_id;
    }

    if (!contactId) {
      return { redirect: { destination: '/', permanent: false } };
    }

    // Redirect to the static opt-in form with the right params
    return {
      redirect: {
        destination: `/peptide-checkin-optin.html?contact_id=${contactId}&protocol_id=${protocol.id}`,
        permanent: false
      }
    };
  } catch (err) {
    console.error('Optin redirect error:', err);
    return { redirect: { destination: '/', permanent: false } };
  }
}

// This page only redirects, never renders
export default function OptinRedirect() {
  return null;
}
