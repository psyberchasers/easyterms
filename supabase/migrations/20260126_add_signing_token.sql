-- Add documenso_signing_token column to contract_shares table
ALTER TABLE contract_shares ADD COLUMN IF NOT EXISTS documenso_signing_token TEXT;
