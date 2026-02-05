// /pages/api/dashboard/pipeline.js
// Dashboard Pipeline API - Redirects to /api/admin/pipeline
// Range Medical - 2026-02-04
// This file is kept for backward compatibility

export default async function handler(req, res) {
  // Proxy to the main admin pipeline API
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
    (req.headers.host?.includes('localhost') ? `http://${req.headers.host}` : `https://${req.headers.host}`);

  try {
    const response = await fetch(`${baseUrl}/api/admin/pipeline`, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Dashboard pipeline proxy error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
