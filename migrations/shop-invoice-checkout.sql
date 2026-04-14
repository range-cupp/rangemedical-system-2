-- Add notes column and pending_invoice status support to shop_orders
-- Part of the invoice-based checkout flow (no Stripe payment at checkout)

ALTER TABLE shop_orders ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update status comment: pending, pending_invoice, paid, shipped, delivered, cancelled
COMMENT ON COLUMN shop_orders.status IS 'Order status: pending, pending_invoice, paid, shipped, delivered, cancelled';
