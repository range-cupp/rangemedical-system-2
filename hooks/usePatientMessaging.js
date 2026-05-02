// /hooks/usePatientMessaging.js
// Patient SMS conversations for the StaffMessagingPanel.
// Mirrors useStaffMessaging but operates on comms_log instead of staff_messages.
// Range Medical

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

function playInboundSmsSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.25);
  } catch (_) {}
}

function patientKey(c) {
  return c.patient_id || (c.ghl_contact_id ? `ghl_${c.ghl_contact_id}` : (c.recipient ? `phone_${c.recipient}` : null));
}

export default function usePatientMessaging(employee) {
  const [conversations, setConversations] = useState([]);
  const [activePatient, setActivePatient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const [totalNeedsResponse, setTotalNeedsResponse] = useState(0);
  const subscriptionRef = useRef(null);
  const activePatientRef = useRef(null);

  useEffect(() => { activePatientRef.current = activePatient; }, [activePatient]);

  const fetchConversations = useCallback(async () => {
    setLoadingConversations(true);
    try {
      const res = await fetch('/api/admin/conversations?days=60&limit=100');
      const data = await res.json();
      const convos = data.conversations || [];
      setConversations(convos);
      const unread = convos.reduce((sum, c) => sum + (c.unread_count || 0), 0);
      const needs = convos.filter(c => (c.needs_response_count || 0) > 0).length;
      setTotalUnread(unread);
      setTotalNeedsResponse(needs);
    } catch (err) {
      console.error('Fetch conversations error:', err);
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  const fetchMessages = useCallback(async (patient) => {
    if (!patient) return;
    setLoadingMessages(true);
    try {
      const params = new URLSearchParams({ channel: 'sms', limit: '100' });
      if (patient.recipient) params.set('phone', patient.recipient);
      const id = patient.patient_id || '_';
      const res = await fetch(`/api/patients/${id}/comms?${params.toString()}`);
      const data = await res.json();
      // API returns most-recent first; reverse to chronological for display
      const msgs = (data.comms || []).slice().reverse();
      setMessages(msgs);
    } catch (err) {
      console.error('Fetch messages error:', err);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const openPatient = useCallback(async (patient) => {
    setActivePatient(patient);
    await fetchMessages(patient);

    // Mark patient's inbound messages as read
    if (patient.patient_id && (patient.unread_count || 0) > 0) {
      fetch('/api/admin/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: patient.patient_id }),
      }).catch(() => {});

      setConversations(prev => prev.map(c => {
        if (c.patient_id === patient.patient_id) return { ...c, unread_count: 0 };
        return c;
      }));
      setTotalUnread(prev => Math.max(0, prev - (patient.unread_count || 0)));
    }
  }, [fetchMessages]);

  const closePatient = useCallback(() => {
    setActivePatient(null);
    setMessages([]);
  }, []);

  const sendMessage = useCallback(async (patient, text) => {
    if (!text?.trim()) return null;
    const tempId = 'temp-' + Date.now();
    const optimistic = {
      id: tempId,
      channel: 'sms',
      direction: 'outbound',
      message: text,
      created_at: new Date().toISOString(),
      status: 'sending',
      message_type: 'direct_sms',
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      const res = await fetch('/api/twilio/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patient.patient_id || null,
          patient_name: patient.patient_name || null,
          to: patient.recipient,
          message: text,
          message_type: 'direct_sms',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error', error_message: data.error || 'Send failed' } : m));
        return { success: false, error: data.error || 'Send failed' };
      }
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'sent' } : m));

      // Clear needs_response indicator on the conversation card
      setConversations(prev => prev.map(c => {
        if (c.patient_id === patient.patient_id) return { ...c, needs_response_count: 0 };
        return c;
      }));
      setTotalNeedsResponse(prev => Math.max(0, prev - (patient.needs_response_count > 0 ? 1 : 0)));

      return { success: true, sid: data.messageSid };
    } catch (err) {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error', error_message: err.message } : m));
      return { success: false, error: err.message };
    }
  }, []);

  const dismissNeedsResponse = useCallback(async (patient) => {
    try {
      await fetch('/api/admin/clear-needs-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient.patient_id || null,
          phone: patient.recipient || null,
        }),
      });
      setConversations(prev => prev.map(c => {
        if (patientKey(c) === patientKey(patient)) return { ...c, needs_response_count: 0 };
        return c;
      }));
      setTotalNeedsResponse(prev => Math.max(0, prev - 1));
    } catch (_) { /* silent */ }
  }, []);

  // Realtime: listen for new inbound SMS in comms_log so the panel updates
  // without a refresh. Outbound messages from other staff also re-sort the list.
  useEffect(() => {
    if (!employee?.id) return;

    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
    }

    const channel = supabase
      .channel('patient-sms-' + employee.id)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comms_log' },
        (payload) => {
          const row = payload.new;
          if (!row || row.channel !== 'sms') return;

          // Only react to real inbound patient messages — skip staff bot pings,
          // auto-replies, etc.
          if (row.direction === 'inbound' && row.message_type === 'inbound_sms') {
            // If viewing this patient, append to thread
            const active = activePatientRef.current;
            const matchesActive =
              active &&
              ((active.patient_id && active.patient_id === row.patient_id) ||
               (!active.patient_id && active.recipient && row.recipient === active.recipient));

            if (matchesActive) {
              setMessages(prev => {
                if (prev.some(m => m.id === row.id)) return prev;
                return [...prev, row];
              });
              // Mark as read since we're viewing it
              if (row.patient_id) {
                fetch('/api/admin/mark-read', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ patientId: row.patient_id }),
                }).catch(() => {});
              }
            } else {
              setTotalUnread(prev => prev + 1);
            }

            // Play sound + refresh list to update preview/unread/needs_response
            playInboundSmsSound();
            fetchConversations();
          } else if (row.direction === 'outbound') {
            // Another tab/staff member sent — refresh list ordering
            fetchConversations();
            const active = activePatientRef.current;
            const matchesActive =
              active &&
              ((active.patient_id && active.patient_id === row.patient_id) ||
               (!active.patient_id && active.recipient && row.recipient === active.recipient));
            if (matchesActive) {
              setMessages(prev => {
                if (prev.some(m => m.id === row.id)) return prev;
                return [...prev, row];
              });
            }
          }
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [employee?.id, fetchConversations]);

  // Initial fetch
  useEffect(() => {
    if (employee?.id) fetchConversations();
  }, [employee?.id, fetchConversations]);

  return {
    conversations,
    activePatient,
    messages,
    loadingConversations,
    loadingMessages,
    totalUnread,
    totalNeedsResponse,
    fetchConversations,
    openPatient,
    closePatient,
    sendMessage,
    dismissNeedsResponse,
    setMessages,
  };
}
