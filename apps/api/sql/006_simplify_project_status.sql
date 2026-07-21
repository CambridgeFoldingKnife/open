-- 项目状态从 7 种简化为 3 种（pending / processing / completed）
-- 执行前请确保已备份数据库

-- 1. 旧状态映射到新状态
UPDATE projects
SET status = CASE status
  WHEN 'draft' THEN 'pending'
  WHEN 'submitted' THEN 'pending'
  WHEN 'assigned' THEN 'processing'
  WHEN 'planning' THEN 'processing'
  WHEN 'published' THEN 'processing'
  WHEN 'foundation_confirmed' THEN 'completed'
  WHEN 'growth_active' THEN 'completed'
  ELSE status
END
WHERE status IN ('draft','submitted','assigned','planning','published','foundation_confirmed','growth_active');

-- 2. 已完成项目对应的线索统一标记为成交
UPDATE leads
SET status = 'won', updated_at = NOW()
WHERE project_id IN (SELECT id FROM projects WHERE status = 'completed')
  AND status != 'won';
