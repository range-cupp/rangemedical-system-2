// /pages/admin/patients/[id].js
// Redirect to new unified patient profile at /patients/[id]
// Keeps old bookmarked links working

import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function OldPatientsRedirect() {
  const router = useRouter();
  const { id } = router.query;

  useEffect(() => {
    if (id) {
      router.replace(`/patients/${id}`);
    }
  }, [id, router]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <p>Redirecting to patient profile...</p>
    </div>
  );
}
