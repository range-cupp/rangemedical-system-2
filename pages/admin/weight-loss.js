// /pages/admin/weight-loss.js
// Redirect to unified Protocols page — Weight Loss tab
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function WeightLoss() {
  const router = useRouter();
  useEffect(() => { router.replace('/admin/protocols?tab=weight_loss'); }, []);
  return <div />;
}
