// /pages/admin/injection-logs.js
// Redirects to the new unified Service Log
// Range Medical - 2026-02-09

import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function InjectionLogsRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;

    const { patient_id, tab } = router.query;
    const params = new URLSearchParams();
    if (patient_id) params.set('patient_id', patient_id);
    if (tab) params.set('tab', tab);

    const queryString = params.toString();
    router.replace(`/admin/service-log${queryString ? '?' + queryString : ''}`);
  }, [router.isReady, router.query]);

  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'system-ui' }}>
      <p>Redirecting to Service Log...</p>
    </div>
  );
}
