// /pages/api/admin/email-log.js
// Proxies Resend API to list emails and retrieve individual email details
// including full HTML body for preview.

import { Resend } from 'resend';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { id, limit, after, before } = req.query;

  try {
    // Single email detail — includes HTML body
    if (id) {
      const response = await resend.emails.get(id);
      console.log('Email detail response:', JSON.stringify(response).slice(0, 500));
      if (response.error) {
        return res.status(404).json({ error: response.error.message || 'Email not found' });
      }
      return res.status(200).json(response.data);
    }

    // List emails — use fetch directly for reliability
    const apiUrl = new URL('https://api.resend.com/emails');
    apiUrl.searchParams.set('limit', Math.min(parseInt(limit) || 50, 100).toString());
    if (after) apiUrl.searchParams.set('after', after);
    if (before) apiUrl.searchParams.set('before', before);

    const response = await fetch(apiUrl.toString(), {
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    });
    const data = await response.json();
    console.log('Email list status:', response.status, 'keys:', Object.keys(data));

    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || 'Failed to fetch emails' });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('Email log API error:', err.message, err.stack);
    return res.status(500).json({ error: err.message });
  }
}
