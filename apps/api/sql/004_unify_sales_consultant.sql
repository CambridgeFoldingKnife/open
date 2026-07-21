-- 将销售与顾问角色统一为顾问

-- 1. 线索表字段重命名（仅当旧列存在时执行）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'assigned_sales_id'
  ) THEN
    ALTER TABLE leads RENAME COLUMN assigned_sales_id TO assigned_consultant_id;
  END IF;
END $$;

DROP INDEX IF EXISTS idx_leads_sales;
CREATE INDEX IF NOT EXISTS idx_leads_consultant ON leads(assigned_consultant_id);

-- 2. 先将现有销售账号转为顾问
UPDATE staff_accounts SET role = 'consultant' WHERE role = 'sales';

-- 3. 再更新员工账号角色约束
ALTER TABLE staff_accounts DROP CONSTRAINT IF EXISTS staff_accounts_role_check;
ALTER TABLE staff_accounts ADD CONSTRAINT staff_accounts_role_check CHECK (role IN ('admin','consultant'));

-- 4. 迁移线索 payload 中的 assignedSalesId -> assignedConsultantId
UPDATE leads
SET payload = jsonb_set(payload, '{assignedConsultantId}', payload->'assignedSalesId', true) - 'assignedSalesId'
WHERE payload ? 'assignedSalesId';

-- 5. 移除项目 payload 中的 assignedSalesId（项目统一使用 consultantId）
UPDATE projects
SET payload = payload - 'assignedSalesId'
WHERE payload ? 'assignedSalesId';
