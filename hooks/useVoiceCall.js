// hooks/useVoiceCall.js
// Manages Twilio Voice Device lifecycle for the Range Medical Staff App.
// Handles: token fetch, device init, outbound calls, inbound calls, presence
// heartbeat, and cleanup.
//
// Identity = employee.id (UUID). The device only registers if the employee
// has opted in via the "Ring this computer" toggle (voice_browser_enabled).
// While registered, the hook heartbeats /api/app/voice-presence every 30s so
// the inbound TwiML router knows this browser is online and should be rung.
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
  DISABLED:    'disabled',     // User has opted out of browser calling
};

const HEARTBEAT_INTERVAL_MS = 30 * 1000;

export default function useVoiceCall({ employeeId } = {}) {
  const [callState, setCallState]   = useState(CALL_STATE.IDLE);
  const [activeCall, setActiveCall] = useState(null);   // Twilio Call object
  const [callInfo, setCallInfo]     = useState(null);   // { to, name, duration, direction }
  const [error, setError]           = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);

  const deviceRef     = useRef(null);
  const timerRef      = useRef(null);
  const durationRef   = useRef(0);
  const heartbeatRef  = useRef(null);

  // ── Heartbeat (tells inbound TwiML router we're still online) ────────────────
  const startHeartbeat = useCallback(() => {
    if (!employeeId || heartbeatRef.current) return;
    const beat = () => {
      fetch('/api/app/voice-presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: employeeId }),
      }).catch(() => {});
    };
    beat(); // immediate first beat
    heartbeatRef.current = setInterval(beat, HEARTBEAT_INTERVAL_MS);
  }, [employeeId]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  // ── Initialize Twilio Device ─────────────────────────────────────────────────
  const initDevice = useCallback(async () => {
    if (typeof window === 'undefined') return;
    if (deviceRef.current) return; // Already initialized
    if (!employeeId) {
      setError('Not signed in');
      setCallState(CALL_STATE.ERROR);
      return;
    }

    setCallState(CALL_STATE.CONNECTING);
    setError(null);

    try {
      const res = await fetch(`/api/app/voice-token?employee_id=${encodeURIComponent(employeeId)}`);
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 503) {
          setCallState(CALL_STATE.UNAVAILABLE);
          setError(data.error || 'Voice calling not configured');
          return;
        }
        if (res.status === 403 && data.enabled === false) {
          setCallState(CALL_STATE.DISABLED);
          setError(null);
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

      // Twilio Voice SDK v2 renamed 'ready' → 'registered' and 'offline' → 'unregistered'
      device.on('registered', () => {
        setCallState(CALL_STATE.READY);
        setError(null);
        startHeartbeat();
      });

      device.on('unregistered', () => {
        stopHeartbeat();
        // Only flip state to IDLE if we're not mid-call (registered event may fire
        // again shortly if this was just a reconnect)
        setCallState((prev) => (
          prev === CALL_STATE.IN_CALL || prev === CALL_STATE.CALLING || prev === CALL_STATE.INCOMING
            ? prev
            : CALL_STATE.IDLE
        ));
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

        // Pre-accept lifecycle: if another endpoint (e.g. a desk phone) answers
        // first, or the caller hangs up, Twilio cancels this leg. Without this
        // listener the ring UI stays on screen forever. `cancel` only fires
        // before the call is accepted — once accepted, `disconnect` takes over
        // via attachCallListeners().
        const clearIncoming = () => {
          setIncomingCall(null);
          setCallInfo(null);
          setCallState(CALL_STATE.READY);
        };
        call.on('cancel', clearIncoming);
        call.on('disconnect', clearIncoming);
        call.on('reject', clearIncoming);
        call.on('error', (err) => {
          console.error('[Voice] Incoming call error:', err);
          clearIncoming();
        });
      });

      device.on('tokenWillExpire', async () => {
        // Refresh token before it expires
        try {
          const r = await fetch(`/api/app/voice-token?employee_id=${encodeURIComponent(employeeId)}`);
          const d = await r.json();
          if (r.ok) {
            device.updateToken(d.token);
          } else if (r.status === 403 && d.enabled === false) {
            // User disabled browser phone mid-session — tear down
            device.destroy();
            deviceRef.current = null;
            stopHeartbeat();
            setCallState(CALL_STATE.DISABLED);
          }
        } catch {}
      });

      await device.register();
      deviceRef.current = device;
      startHeartbeat();
    } catch (err) {
      console.error('[Voice] Init error:', err);
      setError(err.message || 'Failed to initialize voice');
      setCallState(CALL_STATE.ERROR);
    }
  }, [employeeId, startHeartbeat, stopHeartbeat]);

  // ── Tear down device (e.g. when user toggles off) ────────────────────────────
  const teardown = useCallback(() => {
    stopHeartbeat();
    if (deviceRef.current) {
      try { deviceRef.current.destroy(); } catch {}
      deviceRef.current = null;
    }
    setCallState(CALL_STATE.IDLE);
    setActiveCall(null);
    setCallInfo(null);
    setIncomingCall(null);
    setError(null);
  }, [stopHeartbeat]);

  // ── Auto-init on mount if the employee has opted in ──────────────────────────
  // Fetches settings, then registers only if voice_browser_enabled = true.
  useEffect(() => {
    if (!employeeId) return;
    let cancelled = false;

    (async () => {
      try {
        const r = await fetch(`/api/app/voice-settings?employee_id=${encodeURIComponent(employeeId)}`);
        if (!r.ok) return;
        const d = await r.json();
        if (cancelled) return;
        if (d.voice_browser_enabled) {
          initDevice();
        } else {
          setCallState(CALL_STATE.DISABLED);
        }
      } catch {
        // Silent — leave device IDLE, user can retry manually
      }
    })();

    return () => { cancelled = true; };
  }, [employeeId, initDevice]);

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
    if (callState === CALL_STATE.DISABLED) {
      setError('Browser phone is off. Enable it in More → Browser Phone.');
      return;
    }
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
      stopHeartbeat();
      if (deviceRef.current) {
        try { deviceRef.current.destroy(); } catch {}
        deviceRef.current = null;
      }
    };
  }, [stopTimer, stopHeartbeat]);

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
    teardown,
    call,
    hangUp,
    answer,
    reject,
    toggleMute,
    formatDuration,
    isActive: callState === CALL_STATE.IN_CALL || callState === CALL_STATE.CALLING,
    isIdle:   callState === CALL_STATE.IDLE || callState === CALL_STATE.READY,
    isDisabled: callState === CALL_STATE.DISABLED,
  };
}
