// Mark Apr 4 / Apr 11 as fulfillment_method='overnight' (take-home),
// since those were the doses the patient took home Mar 28 and self-
// administered while in Japan. Notes already document the context.

import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  'https://teivfptpozltpqwahgdl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlaXZmcHRwb3psdHBxd2FoZ2RsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcxMzE0OSwiZXhwIjoyMDgwMjg5MTQ5fQ.7P_jrgUmF34lPEJOYgmAogDLwEKplEOtyOazIaXmqHA'
);

for (const id of ['20c3e881-f112-4d95-9a98-62ba37f3413a', '391e3881-76d7-4ab3-8115-6e748291de6b']) {
  await supabase
    .from('service_logs')
    .update({ fulfillment_method: 'overnight', updated_at: new Date().toISOString() })
    .eq('id', id);
  console.log(`✓ ${id.substring(0,8)} → fulfillment_method=overnight (take-home)`);
}
