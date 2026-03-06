// /pages/admin/labs.js
// Labs Pipeline — 5-stage Kanban board for tracking lab workflows
// Range Medical System V2

import AdminLayout from '../../components/AdminLayout';
import LabsPipelineTab from '../../components/LabsPipelineTab';

export default function LabsPage() {
  return (
    <AdminLayout title="Labs">
      <LabsPipelineTab />
    </AdminLayout>
  );
}
