-- Add description column to purchases for richer receipt itemization
-- description holds detailed item info shown on receipts (vs item_name which is the short label)
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS description TEXT;
COMMENT ON COLUMN purchases.description IS 'Detailed item description for receipts — richer than item_name';
