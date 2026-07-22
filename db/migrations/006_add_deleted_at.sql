-- 006: 项目逻辑删除 + 性能索引优化
-- 配合阶段性更新：用户端删除项目、管理端/销售端分类查询

-- 1. 项目表增加逻辑删除时间戳
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- 2. 为已删除项目创建部分索引（查询量小，部分索引即可）
CREATE INDEX IF NOT EXISTS idx_projects_deleted ON projects(deleted_at) WHERE deleted_at IS NOT NULL;

-- 3. 用户表 payload 字段 GIN 索引（加速姓名/城市/邮箱搜索）
CREATE INDEX IF NOT EXISTS idx_user_accounts_payload ON user_accounts USING GIN (payload);

-- 4. 线索表状态索引（已存在，此处仅作确认；001_init.sql 已创建）
-- idx_leads_status 已在 001_init.sql 中创建
