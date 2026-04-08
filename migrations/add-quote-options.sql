-- Comparison quotes: up to 3 named options per quote.
-- When null, the quote is a single-option quote (use top-level items/totals).
-- When set, each entry: { name, items: [...], discount_cents, subtotal_cents, total_cents }
alter table quotes add column if not exists options jsonb;
