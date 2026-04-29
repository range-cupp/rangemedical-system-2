// /hooks/useStaffMessaging.js
// Realtime hook for staff messaging — handles channels, messages, subscriptions, and notifications
// Range Medical

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// Notification sound — single short pop at 660Hz (E5)
function playStaffMessageSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 660;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  } catch (e) {
    // Silent fail — user hasn't interacted yet or no audio support
  }
}

export default function useStaffMessaging(employee, session) {
  const [channels, setChannels] = useState([]);
  const [activeChannelId, setActiveChannelId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const subscriptionRef = useRef(null);
  const channelIdsRef = useRef([]);
  const channelsRef = useRef([]);
  const activeChannelIdRef = useRef(null);
  const headers = session?.access_token
    ? { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }
    : {};

  // Keep refs in sync so the realtime callback can read fresh values
  useEffect(() => {
    activeChannelIdRef.current = activeChannelId;
  }, [activeChannelId]);

  useEffect(() => {
    channelsRef.current = channels;
  }, [channels]);

  // Fetch channel list
  const fetchChannels = useCallback(async () => {
    if (!session?.access_token) return;
    setLoadingChannels(true);
    try {
      const res = await fetch('/api/staff-messaging/channels', { headers });
      const data = await res.json();
      if (data.channels) {
        setChannels(data.channels);
        const ids = data.channels.map((c) => c.id);
        channelIdsRef.current = ids;
        const unread = data.channels.reduce((sum, c) => sum + (c.unread_count || 0), 0);
        setTotalUnread(unread);
      }
    } catch (err) {
      console.error('Fetch channels error:', err);
    } finally {
      setLoadingChannels(false);
    }
  }, [session?.access_token]);

  // Fetch messages for a channel
  const fetchMessages = useCallback(async (channelId, before) => {
    if (!session?.access_token) return;
    setLoadingMessages(true);
    try {
      const url = before
        ? `/api/staff-messaging/channels/${channelId}/messages?before=${before}`
        : `/api/staff-messaging/channels/${channelId}/messages`;
      const res = await fetch(url, { headers });
      const data = await res.json();
      if (data.messages) {
        if (before) {
          setMessages((prev) => [...data.messages, ...prev]);
        } else {
          setMessages(data.messages);
        }
        setHasMore(data.has_more);
      }
    } catch (err) {
      console.error('Fetch messages error:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, [session?.access_token]);

  // Open a channel
  const openChannel = useCallback(async (channelId) => {
    setActiveChannelId(channelId);
    await fetchMessages(channelId);
    // Mark as read
    try {
      await fetch(`/api/staff-messaging/channels/${channelId}/read`, {
        method: 'POST',
        headers,
      });
      // Update local unread count
      setChannels((prev) =>
        prev.map((c) => c.id === channelId ? { ...c, unread_count: 0 } : c)
      );
      setTotalUnread((prev) => {
        const ch = channels.find((c) => c.id === channelId);
        return Math.max(0, prev - (ch?.unread_count || 0));
      });
    } catch (e) {
      // Non-critical
    }
  }, [fetchMessages, channels, session?.access_token]);

  // Load older messages
  const loadMore = useCallback(() => {
    if (!activeChannelId || !messages.length || loadingMessages) return;
    const oldest = messages[0]?.created_at;
    if (oldest) fetchMessages(activeChannelId, oldest);
  }, [activeChannelId, messages, loadingMessages, fetchMessages]);

  // Send a message
  const sendMessage = useCallback(async (channelId, content, attachment) => {
    if (!session?.access_token) return null;
    try {
      const body = { content };
      if (attachment) {
        body.attachment_url = attachment.url;
        body.attachment_name = attachment.filename;
        body.attachment_type = attachment.type;
      }
      const res = await fetch(`/api/staff-messaging/channels/${channelId}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      const data = await res.json();
      return data.message;
    } catch (err) {
      console.error('Send message error:', err);
      return null;
    }
  }, [session?.access_token]);

  // Upload a file
  const uploadFile = useCallback(async (file) => {
    if (!session?.access_token) return null;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/staff-messaging/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) return data;
      console.error('Upload failed:', data.error);
      return null;
    } catch (err) {
      console.error('Upload error:', err);
      return null;
    }
  }, [session?.access_token]);

  // Create a channel
  const createChannel = useCallback(async (memberIds, name) => {
    if (!session?.access_token) return null;
    try {
      const res = await fetch('/api/staff-messaging/channels', {
        method: 'POST',
        headers,
        body: JSON.stringify({ member_ids: memberIds, name: name || undefined }),
      });
      const data = await res.json();
      if (data.channel_id) {
        await fetchChannels();
        return data.channel_id;
      }
      return null;
    } catch (err) {
      console.error('Create channel error:', err);
      return null;
    }
  }, [session?.access_token, fetchChannels]);

  // Create or find a DM
  const openDm = useCallback(async (employeeId) => {
    if (!session?.access_token) return null;
    try {
      const res = await fetch('/api/staff-messaging/dm', {
        method: 'POST',
        headers,
        body: JSON.stringify({ employee_id: employeeId }),
      });
      const data = await res.json();
      if (data.channel_id) {
        if (!data.existing) await fetchChannels();
        return data.channel_id;
      }
      return null;
    } catch (err) {
      console.error('Open DM error:', err);
      return null;
    }
  }, [session?.access_token, fetchChannels]);

  // Close active channel (go back to list)
  const closeChannel = useCallback(() => {
    setActiveChannelId(null);
    setMessages([]);
    setHasMore(false);
  }, []);

  // Realtime subscription
  useEffect(() => {
    if (!employee?.id || channelIdsRef.current.length === 0) return;

    // Clean up previous subscription
    if (subscriptionRef.current) {
      supabase.removeChannel(subscriptionRef.current);
    }

    const channel = supabase
      .channel('staff-messages-' + employee.id)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'staff_messages',
        },
        (payload) => {
          const newMsg = payload.new;

          // Ignore if not in one of our channels
          if (!channelIdsRef.current.includes(newMsg.channel_id)) return;

          // Ignore our own messages (we already added them optimistically)
          if (newMsg.sender_id === employee.id) return;

          // Resolve the sender from the cached channel members list. Falls back to
          // a one-shot fetch from `employees` if the sender was just added to the
          // channel and isn't in our cached members yet.
          const cachedChannel = channelsRef.current.find((c) => c.id === newMsg.channel_id);
          const cachedSender = cachedChannel?.members?.find((m) => m.id === newMsg.sender_id);
          const initialSender = cachedSender
            ? { id: cachedSender.id, name: cachedSender.name, title: cachedSender.title }
            : { id: newMsg.sender_id, name: '' };

          const enrichSenderLater = !cachedSender;

          // If viewing this channel, append the message
          if (activeChannelIdRef.current === newMsg.channel_id) {
            setMessages((prev) => {
              // Avoid duplicates
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, { ...newMsg, sender: initialSender }];
            });

            // Sender wasn't in our cache — fetch their record and patch the message.
            if (enrichSenderLater) {
              supabase
                .from('employees')
                .select('id, name, title')
                .eq('id', newMsg.sender_id)
                .maybeSingle()
                .then(({ data }) => {
                  if (!data) return;
                  setMessages((prev) =>
                    prev.map((m) => (m.id === newMsg.id ? { ...m, sender: data } : m))
                  );
                });
            }

            // Mark as read since we're viewing it
            fetch(`/api/staff-messaging/channels/${newMsg.channel_id}/read`, {
              method: 'POST',
              headers,
            }).catch(() => {});
          } else {
            // Not viewing this channel — increment unread
            setTotalUnread((prev) => prev + 1);
            setChannels((prev) =>
              prev.map((c) =>
                c.id === newMsg.channel_id
                  ? { ...c, unread_count: (c.unread_count || 0) + 1 }
                  : c
              )
            );
          }

          // Update last message in channel list — use the resolved sender name
          // so the conversation list doesn't render "Unknown:" or ":<msg>".
          setChannels((prev) => {
            const updated = prev.map((c) => {
              if (c.id !== newMsg.channel_id) return c;
              return {
                ...c,
                last_message: {
                  content: newMsg.attachment_name && !newMsg.content
                    ? `Sent ${newMsg.attachment_name}`
                    : newMsg.content,
                  sender_name: initialSender.name || '',
                  created_at: newMsg.created_at,
                },
              };
            });
            // Re-sort by most recent
            updated.sort((a, b) => {
              const aTime = a.last_message?.created_at || a.created_at;
              const bTime = b.last_message?.created_at || b.created_at;
              return new Date(bTime) - new Date(aTime);
            });
            return updated;
          });

          // Play sound
          playStaffMessageSound();

          // Browser notification — match the title format the server push uses
          // so the user sees the same thing whether the app is open or not:
          //   DM         → "Damon"
          //   named group → "Damon in Front Desk"
          //   anon group → "Damon (group)"
          if (Notification.permission === 'granted') {
            const senderFirst = (initialSender.name || 'Someone').split(' ')[0];
            let notifTitle;
            if (cachedChannel?.type === 'dm') {
              notifTitle = senderFirst;
            } else if (cachedChannel?.name) {
              notifTitle = `${senderFirst} in ${cachedChannel.name}`;
            } else {
              notifTitle = `${senderFirst} (group)`;
            }
            const preview = newMsg.content
              ? newMsg.content.slice(0, 140)
              : (newMsg.attachment_name ? `📎 ${newMsg.attachment_name}` : 'Sent an attachment');
            const notif = new Notification(notifTitle, {
              body: preview,
              icon: '/android-chrome-192x192.png',
              tag: 'chat-' + newMsg.channel_id,
            });
            notif.onclick = () => {
              window.focus();
            };
            setTimeout(() => notif.close(), 8000);
          }
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [employee?.id, channels.length]); // Re-subscribe when channel count changes

  // Initial fetch
  useEffect(() => {
    if (employee?.id && session?.access_token) {
      fetchChannels();
    }
  }, [employee?.id, session?.access_token]);

  return {
    channels,
    activeChannelId,
    messages,
    loadingChannels,
    loadingMessages,
    hasMore,
    totalUnread,
    fetchChannels,
    openChannel,
    closeChannel,
    loadMore,
    sendMessage,
    uploadFile,
    createChannel,
    openDm,
    setMessages,
  };
}
