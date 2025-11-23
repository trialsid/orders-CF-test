-- Add token_version to users for revocation support
ALTER TABLE users ADD COLUMN token_version INTEGER DEFAULT 1;
