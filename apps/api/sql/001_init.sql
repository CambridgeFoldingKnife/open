CREATE TABLE IF NOT EXISTS venue_types (
  id text PRIMARY KEY, payload jsonb NOT NULL, active boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS catalog_items (
  id text PRIMARY KEY, kind text NOT NULL CHECK (kind IN ('equipment','course','role','marketing','service')),
  payload jsonb NOT NULL, active boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS projects (
  id text PRIMARY KEY, customer_id text NOT NULL, payload jsonb NOT NULL, status text NOT NULL,
  consultant_id text, version integer NOT NULL DEFAULT 1, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS project_versions (
  id text PRIMARY KEY, project_id text REFERENCES projects(id), version integer NOT NULL, snapshot jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS audit_events (
  id text PRIMARY KEY, project_id text REFERENCES projects(id), actor_id text NOT NULL, actor_role text NOT NULL,
  action text NOT NULL, detail text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS user_accounts (
  id text PRIMARY KEY, phone text UNIQUE NOT NULL, payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS leads (
  id text PRIMARY KEY, user_id text NOT NULL, project_id text, payload jsonb NOT NULL, status text NOT NULL,
  assigned_sales_id text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_projects_customer ON projects(customer_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_audit_project ON audit_events(project_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_sales ON leads(assigned_sales_id);
