// /components/AdminVoiceManager.js
// Persistent voice manager that lives in _app.js — survives page navigations.
// Without this, the Twilio Device would be destroyed every time the user
// clicks between admin pages, dropping any active call.

import { useRouter } from 'next/router';
import { useAuth } from './AuthProvider';
import useVoiceCall, { CALL_STATE } from '../hooks/useVoiceCall';
import { VoiceProvider } from './VoiceContext';
import AdminCallBar from './AdminCallBar';

export default function AdminVoiceManager({ children }) {
  const router = useRouter();
  const { employee } = useAuth();
  const isAdmin = router.pathname.startsWith('/admin');

  // Always pass employeeId so the device stays alive across all navigations.
  // The hook only registers if the employee has voice_browser_enabled = true.
  const voice = useVoiceCall({ employeeId: employee?.id });

  const showCallBar = isAdmin
    || voice.callState === CALL_STATE.IN_CALL
    || voice.callState === CALL_STATE.CALLING
    || voice.callState === CALL_STATE.INCOMING
    || voice.callState === CALL_STATE.ENDED;

  return (
    <VoiceProvider value={voice}>
      {children}
      {showCallBar && (
        <AdminCallBar
          callState={voice.callState}
          callInfo={voice.callInfo}
          muted={voice.muted}
          onHangUp={voice.hangUp}
          onToggleMute={voice.toggleMute}
          formatDuration={voice.formatDuration}
          onAnswer={voice.answer}
          onReject={voice.reject}
        />
      )}
    </VoiceProvider>
  );
}
