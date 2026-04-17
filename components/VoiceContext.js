// /components/VoiceContext.js
// Shares the single AdminLayout-owned useVoiceCall hook with any admin page
// that needs to trigger calls (Settings test dialer, patient profile
// click-to-call, etc.) without each page spawning its own Twilio Device.
// Range Medical System

import { createContext, useContext } from 'react';

const VoiceContext = createContext(null);

export function VoiceProvider({ value, children }) {
  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
}

/**
 * Returns the voice hook (callState, call, hangUp, isActive, ...) or null
 * when rendered outside of AdminLayout (e.g. public pages). Callers should
 * check for null and degrade gracefully (e.g. render a tel: link instead).
 */
export function useVoice() {
  return useContext(VoiceContext);
}
