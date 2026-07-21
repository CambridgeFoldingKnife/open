CREATE INDEX IF NOT EXISTS idx_user_accounts_email ON user_accounts((payload->>'email'));
