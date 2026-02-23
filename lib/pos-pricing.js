// POS Service Catalog — Range Medical
// Prices in cents for Stripe, display in dollars

export const POS_CATEGORIES = [
  { id: 'lab_panels', name: 'Lab Panels' },
  { id: 'iv_therapy', name: 'IV Therapy' },
  { id: 'regenerative', name: 'Regenerative' },
  { id: 'weight_loss', name: 'Weight Loss' },
  { id: 'hrt', name: 'HRT' },
  { id: 'custom', name: 'Custom' },
];

export const POS_ITEMS = [
  // Lab Panels
  { id: 'lab_mens_essential', name: "Men's Essential Panel", price: 35000, category: 'lab_panels', recurring: false },
  { id: 'lab_mens_elite', name: "Men's Elite Panel", price: 75000, category: 'lab_panels', recurring: false },
  { id: 'lab_womens_essential', name: "Women's Essential Panel", price: 35000, category: 'lab_panels', recurring: false },
  { id: 'lab_womens_elite', name: "Women's Elite Panel", price: 75000, category: 'lab_panels', recurring: false },

  // IV Therapy
  { id: 'iv_nad_500', name: 'NAD+ 500mg', price: 65000, category: 'iv_therapy', recurring: false },
  { id: 'iv_nad_250', name: 'NAD+ 250mg', price: 45000, category: 'iv_therapy', recurring: false },
  { id: 'iv_myers', name: 'Myers Cocktail', price: 27500, category: 'iv_therapy', recurring: false },
  { id: 'iv_recovery', name: 'Recovery IV', price: 27500, category: 'iv_therapy', recurring: false },
  { id: 'iv_immunity', name: 'Immunity IV', price: 27500, category: 'iv_therapy', recurring: false },
  { id: 'iv_performance', name: 'Performance IV', price: 27500, category: 'iv_therapy', recurring: false },
  { id: 'iv_beauty', name: 'Inner Beauty IV', price: 27500, category: 'iv_therapy', recurring: false },
  { id: 'iv_b12', name: 'B12 Shot', price: 3500, category: 'iv_therapy', recurring: false },

  // Regenerative
  { id: 'regen_hbot_single', name: 'HBOT Session', price: 15000, category: 'regenerative', recurring: false },
  { id: 'regen_hbot_10', name: 'HBOT 10-Pack', price: 120000, category: 'regenerative', recurring: false },
  { id: 'regen_rlt_single', name: 'Red Light Therapy', price: 7500, category: 'regenerative', recurring: false },
  { id: 'regen_rlt_10', name: 'RLT 10-Pack', price: 60000, category: 'regenerative', recurring: false },

  // Weight Loss (Monthly)
  { id: 'wl_semaglutide', name: 'Semaglutide', price: 35000, category: 'weight_loss', recurring: true, interval: 'month' },
  { id: 'wl_tirzepatide', name: 'Tirzepatide', price: 45000, category: 'weight_loss', recurring: true, interval: 'month' },

  // HRT (Monthly)
  { id: 'hrt_test_cyp', name: 'Testosterone Cypionate', price: 20000, category: 'hrt', recurring: true, interval: 'month' },
];

export function formatPrice(cents) {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export function getItemsByCategory(categoryId) {
  return POS_ITEMS.filter(item => item.category === categoryId);
}
