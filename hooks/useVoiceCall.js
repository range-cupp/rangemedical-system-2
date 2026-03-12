// hooks/useVoiceCall.js
// Manages Twilio Voice Device lifecycle for the Range Medical Staff App
// Handles: token fetch, device init, outbound calls, inbound calls, cleanup
// Range Medical

import { useState, useEffect, useRef, useCallback } from 'react';

export const CALL_STATE = {
  IDLE:        'idle',
  CONNECTING:  'connecting',   // Device initializing
  READY:       'ready',        // Device ready, no active call
  CALLING:     'calling',      // Outbound call ringing
  IN_CALL:     'in_call',      // Call connected
  INCOMING:    'incoming',     // Inbound call ringing
  ENDED:       'ended',        // Call just ended
  ERROR:       'error',        // Device or call error
  UNAVAILABLE: 'unavailable',  // Voice not configured on server
};

export default function useVoiceCall({ staffName } = {}) {
  const [callState, setCallState]   = useState(CALL_STATE.IDLE);
  const [activeCall, setActiveCall] = useState(null);   // Twilio Call object
  const [callInfo, setCallInfo]     = useState(null);   // { to, name, duration, direction }
  const [error, setError]           = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);

  const deviceRef    = useRef(null);
  const timerRef     = useRef(null);
  const durationRef  = useRef(0);

  // ── Initialize Twilio Device ─────────────────────────────────────────────────
  const initDevice = useCallback(async () => {
    if (typeof window === 'undefined') return;
    if (deviceRef.current) return; // Already initialized

    setCallState(CALL_STATE.CONNECTING);
    setError(null);

    try {
      const identity = staffName
        ? staffName.toLowerCase().replace(/[^a-z0-9]/g, '_')
        : 'staff';
      const res = await fetch(`/api/app/voice-token?identity=${encodeURIComponent(identity)}`);
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 503) {
          setCallState(CALL_STATE.UNAVAILABLE);
          setError(data.error || 'Voice calling not configured');
          return;
        }
        throw new Error(data.error || 'Failed to get voice token');
      }

      // Dynamically import @twilio/voice-sdk (browser-only)
      const { Device } = await import('@twilio/voice-sdk');

      const device = new Device(data.token, {
        logLevel: 1,
        codecPreferences: ['opus', 'pcmu'],
        enableIceRestart: true,
      });

      device.on('ready', () => {
        setCallState(CALL_STATE.READY);
        setError(null);
      });

      device.on('error', (twilioError) => {
        console.error('[Voice] Device error:', twilioError);
        setError(twilioError.message || 'Voice device error');
        setCallState(CALL_STATE.ERROR);
      });

      device.on('incoming', (call) => {
        setIncomingCall(call);
        setCallState(CALL_STATE.INCOMING);
        setCallInfo({
          from: call.parameters?.From || 'Unknown',
          name: call.parameters?.CallerName || null,
          direction: 'inbound',
        });
      });

      device.on('tokenWillExpire', async () => {
        // Refresh token before it expires
        try {
          const r = await fetch(`/api/app/voice-token?identity=${encodeURIComponent(identity)}`);
          const d = await r.json();
          if (r.ok) device.updateToken(d.token);
        } catch {}
      });

      await device.register();
      deviceRef.current = device;
    } catch (err) {
      console.error('[Voice] Init error:', err);
      setError(err.message || 'Failed to initialize voice');
      setCallState(CALL_STATE.ERROR);
    }
  }, [staffName]);

  // ── Start duration timer ─────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    durationRef.current = 0;
    timerRef.current = setInterval(() => {
      durationRef.current += 1;
      setCallInfo(prev => prev ? { ...prev, duration: durationRef.current } : prev);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  // ── Attach call event listeners ──────────────────────────────────────────────
  const attachCallListeners = useCallback((call, info) => {
    setActiveCall(call);
    setCallInfo({ ...info, duration: 0 });
    setCallState(CALL_STATE.CALLING);

    call.on('accept', () => {
      setCallState(CALL_STATE.IN_CALL);
      startTimer();
    });

    call.on('disconnect', () => {
      stopTimer();
      setCallState(CALL_STATE.ENDED);
      setActiveCall(null);
      // Auto-reset to READY after 3s
      setTimeout(() => setCallState(CALL_STATE.READY), 3000);
    });

    call.on('cancel', () => {
      stopTimer();
      setCallState(CALL_STATE.READY);
      setActiveCall(null);
      setCallInfo(null);
    });

    call.on('reject', () => {
      stopTimer();
      setCallState(CALL_STATE.READY);
      setActiveCall(null);
      setCallInfo(null);
    });

    call.on('error', (err) => {
      stopTimer();
      console.error('[Voice] Call error:', err);
      setError(err.message || 'Call error');
      setCallState(CALL_STATE.ERROR);
      setActiveCall(null);
    });
  }, [startTimer, stopTimer]);

  // ── Make outbound call ───────────────────────────────────────────────────────
  const call = useCallback(async ({ to, name }) => {
    if (!deviceRef.current) {
      await initDevice();
      // Wait for ready
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    if (!deviceRef.current) {
      setError('Voice device not ready. Please try again.');
      return;
    }
    if (callState === CALL_STATE.IN_CALL || callState === CALL_STATE.CALLING) {
      return;
    }

    setError(null);
    try {
      const outgoingCall = await deviceRef.current.connect({
        params: { To: to },
      });
      attachCallListeners(outgoingCall, { to, name, direction: 'outbound' });
    } catch (err) {
      console.error('[Voice] Connect error:', err);
      setError(err.message || 'Failed to start call');
      setCallState(CALL_STATE.ERROR);
    }
  }, [callState, initDevice, attachCallListeners]);

  // ── Answer inbound call ──────────────────────────────────────────────────────
  const answer = useCallback(() => {
    if (!incomingCall) return;
    attachCallListeners(incomingCall, {
      from: incomingCall.parameters?.From || 'Unknown',
      name: incomingCall.parameters?.CallerName || null,
      direction: 'inbound',
    });
    incomingCall.accept();
    setIncomingCall(null);
  }, [incomingCall, attachCallListeners]);

  // ── Reject inbound call ──────────────────────────────────────────────────────
  const reject = useCallback(() => {
    if (!incomingCall) return;
    incomingCall.reject();
    setIncomingCall(null);
    setCallState(CALL_STATE.READY);
    setCallInfo(null);
  }, [incomingCall]);

  // ── Hang up ──────────────────────────────────────────────────────────────────
  const hangUp = useCallback(() => {
    if (activeCall) {
      activeCall.disconnect();
    } else if (deviceRef.current) {
      deviceRef.current.disconnectAll();
    }
    stopTimer();
  }, [activeCall, stopTimer]);

  // ── Mute toggle ──────────────────────────────────────────────────────────────
  const [muted, setMuted] = useState(false);
  const toggleMute = useCallback(() => {
    if (!activeCall) return;
    const newMuted = !muted;
    activeCall.mute(newMuted);
    setMuted(newMuted);
  }, [activeCall, muted]);

  // ── Cleanup on unmount ───────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopTimer();
      if (deviceRef.current) {
        deviceRef.current.destroy();
        deviceRef.current = null;
      }
    };
  }, [stopTimer]);

  // ── Format duration as MM:SS ─────────────────────────────────────────────────
  const formatDuration = useCallback((secs) => {
    if (!secs) return '0:00';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }, []);

  return {
    callState,
    callInfo,
    error,
    muted,
    incomingCall,
    initDevice,
    call,
    hangUp,
    answer,
    reject,
    toggleMute,
    formatDuration,
    isActive: callState === CALL_STATE.IN_CALL || callState === CALL_STATE.CALLING,
    isIdle:   callState === CALL_STATE.IDLE || callState === CALL_STATE.READY,
  };
}
