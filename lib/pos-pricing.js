// POS Pricing Utility — Range Medical
// Service catalog is now stored in the pos_services Supabase table.
// This file only exports the formatPrice helper.

export function formatPrice(cents) {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}
