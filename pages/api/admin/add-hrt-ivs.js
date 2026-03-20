// /pages/api/admin/add-hrt-ivs.js
// DEPRECATED — Range IV is now tracked directly within HRT protocols
// via service_logs. No separate IV protocols are created anymore.
// See: /api/protocols/[id]/range-iv-status and /api/protocols/[id]/redeem-range-iv

export default async function handler(req, res) {
  return res.status(410).json({
    error: 'This endpoint is deprecated.',
    message: 'Range IV is now tracked within HRT protocols via service_logs. Use /api/protocols/[id]/redeem-range-iv instead.',
  });
}
