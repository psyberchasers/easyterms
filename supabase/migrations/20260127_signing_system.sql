ALTER TABLE contract_shares ADD COLUMN IF NOT EXISTS signing_token TEXT UNIQUE;
ALTER TABLE contract_shares ADD COLUMN IF NOT EXISTS signature_data TEXT;
ALTER TABLE contract_shares ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ;
