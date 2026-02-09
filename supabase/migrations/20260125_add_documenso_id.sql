-- Add documenso_document_id column to contract_shares table
ALTER TABLE contract_shares ADD COLUMN IF NOT EXISTS documenso_document_id INTEGER;
