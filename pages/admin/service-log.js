// /pages/admin/service-log.js
// Service Log page — wraps ServiceLogContent with AdminLayout

import AdminLayout from '../../components/AdminLayout';
import ServiceLogContent from '../../components/ServiceLogContent';
import VoiceAssistant from '../../components/VoiceAssistant';

export default function ServiceLog() {
  return (
    <AdminLayout title="Service Log">
      <VoiceAssistant
        context="service_log"
        data={{}}
        onAction={(action, args) => { console.log('Voice action:', action, args); }}
      />
      <ServiceLogContent />
    </AdminLayout>
  );
}
