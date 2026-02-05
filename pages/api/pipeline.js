// pages/api/pipeline.js
// Legacy Pipeline API - Redirects to /api/admin/pipeline
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

    // Transform response to match legacy format for backward compatibility
    if (data.success && data.protocols) {
      return res.status(200).json({
        activeProtocols: [
          ...(data.protocols.ending_soon || []),
          ...(data.protocols.active || []),
          ...(data.protocols.just_started || [])
        ],
        completedProtocols: data.protocols.completed || [],
        needsProtocol: data.purchases?.needs_protocol || []
      });
    }

    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Pipeline proxy error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
