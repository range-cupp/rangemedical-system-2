// /pages/admin/service-log.js
// Service Log page — wraps ServiceLogContent with AdminLayout

import AdminLayout from '../../components/AdminLayout';
import ServiceLogContent from '../../components/ServiceLogContent';

export default function ServiceLog() {
  return (
    <AdminLayout title="Service Log">
      <ServiceLogContent />
    </AdminLayout>
  );
}
