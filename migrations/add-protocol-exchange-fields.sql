-- Add protocol exchange tracking fields
-- Allows staff to exchange one protocol for another (e.g., adverse reaction to GLP-1, switch to BPC-157/TB4)

ALTER TABLE protocols ADD COLUMN IF NOT EXISTS exchanged_from uuid REFERENCES protocols(id);
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS exchanged_to uuid REFERENCES protocols(id);
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS exchange_reason text;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS exchange_date date;

-- Index for quick lookup of exchange chains
CREATE INDEX IF NOT EXISTS idx_protocols_exchanged_from ON protocols(exchanged_from) WHERE exchanged_from IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_protocols_exchanged_to ON protocols(exchanged_to) WHERE exchanged_to IS NOT NULL;

COMMENT ON COLUMN protocols.exchanged_from IS 'ID of the protocol this was created from via exchange';
COMMENT ON COLUMN protocols.exchanged_to IS 'ID of the new protocol this was exchanged into';
COMMENT ON COLUMN protocols.exchange_reason IS 'Reason for the exchange (adverse_reaction, patient_preference, provider_recommendation, other)';
COMMENT ON COLUMN protocols.exchange_date IS 'Date the exchange was performed';
