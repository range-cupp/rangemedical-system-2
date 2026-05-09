// pages/api/mothers-day/check-promo.js
// Validates a Mother's Day promo code

const VALID_CODES = {
  'RANGETEST': { discount: 100, description: 'Internal test — 100% off' },
};

export default function handler(req, res) {
  const code = (req.query.code || '').toUpperCase().trim();

  if (!code) {
    return res.status(400).json({ valid: false, error: 'No code provided.' });
  }

  const promo = VALID_CODES[code];
  if (!promo) {
    return res.status(200).json({ valid: false, error: 'Invalid promo code.' });
  }

  return res.status(200).json({
    valid: true,
    discount: promo.discount,
    description: promo.description,
  });
}
