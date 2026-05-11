// lib/recount-protocol-sessions.js
// Single source of truth for protocol session counting.
// Counts actual service_logs entries to derive sessions_used.
// All code paths that affect session counts must call this after their writes.

export async function recountProtocolSessions(supabase, protocolId) {
  if (!protocolId) return null;

  const { count } = await supabase
    .from('service_logs')
    .select('*', { count: 'exact', head: true })
    .eq('protocol_id', protocolId)
    .in('entry_type', ['injection', 'session']);

  const sessionsUsed = count || 0;

  const { data: latest } = await supabase
    .from('service_logs')
    .select('entry_date')
    .eq('protocol_id', protocolId)
    .in('entry_type', ['injection', 'session'])
    .order('entry_date', { ascending: false })
    .limit(1);

  const lastDate = latest?.[0]?.entry_date || null;

  const updateData = {
    sessions_used: sessionsUsed,
    updated_at: new Date().toISOString(),
  };

  if (lastDate) {
    updateData.last_visit_date = lastDate;
  }

  await supabase
    .from('protocols')
    .update(updateData)
    .eq('id', protocolId);

  return { sessions_used: sessionsUsed, last_visit_date: lastDate };
}
