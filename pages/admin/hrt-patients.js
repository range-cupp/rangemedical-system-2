// /pages/admin/hrt-patients.js
// Redirect to unified Protocols page — HRT tab
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function HRTPatients() {
  const router = useRouter();
  useEffect(() => { router.replace('/admin/protocols?tab=hrt'); }, []);
  return <div />;
}
