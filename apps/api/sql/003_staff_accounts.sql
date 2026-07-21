CREATE TABLE IF NOT EXISTS staff_accounts (
  id text PRIMARY KEY,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin','consultant')),
  title text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_staff_accounts_email ON staff_accounts(email);
CREATE INDEX IF NOT EXISTS idx_staff_accounts_role ON staff_accounts(role);
