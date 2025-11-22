-- Migration to rename private_key_encrypted column to private_key
-- The column contains unencrypted private keys, so the name should reflect that

ALTER TABLE wallets 
CHANGE COLUMN private_key_encrypted private_key TEXT NOT NULL;