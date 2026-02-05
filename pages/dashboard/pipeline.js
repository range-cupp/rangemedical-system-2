// /pages/dashboard/pipeline.js
// Redirect to unified admin pipeline
// Range Medical - 2026-02-04

import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function DashboardPipelineRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/pipeline');
  }, [router]);

  return (
    <div style={{ padding: '48px', textAlign: 'center', color: '#666' }}>
      Redirecting to Protocol Pipeline...
    </div>
  );
}
