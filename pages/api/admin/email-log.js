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
      if (response.error) {
        return res.status(404).json({ error: response.error.message || 'Email not found' });
      }
      return res.status(200).json(response.data);
    }

    // List emails
    const params = {};
    if (limit) params.limit = Math.min(parseInt(limit) || 20, 100);
    if (after) params.after = after;
    if (before) params.before = before;

    const response = await resend.emails.list(params);
    if (response.error) {
      return res.status(500).json({ error: response.error.message || 'Failed to fetch emails' });
    }

    return res.status(200).json(response.data);
  } catch (err) {
    console.error('Email log API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
