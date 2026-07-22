# 数据库（Supabase PostgreSQL）

## 连接方式

- **Pooler**（项目使用）：端口 6543，IPv4 兼容
- **Direct**：端口 5432，需 IPv6
- 连接串在 `apps/api/.env` 的 `DATABASE_URL`

## 表结构总览

| 表名 | 主键 | 说明 | 关键列 |
|------|------|------|--------|
| `venue_types` | id | 场馆类型 | payload(jsonb), active |
| `catalog_items` | id | 产品目录 | kind, payload(jsonb), active |
| `projects` | id | 开馆项目 | customer_id, payload(jsonb), status, consultant_id, version, **deleted_at** |
| `project_versions` | id | 项目版本快照 | project_id, version, snapshot(jsonb) |
| `audit_events` | id | 操作审计日志 | project_id, actor_id, actor_role, action, detail |
| `user_accounts` | id | 用户账号 | phone(unique), payload(jsonb) |
| `leads` | id | 销售线索 | user_id, project_id, payload(jsonb), status, assigned_consultant_id |
| `staff_accounts` | id | 员工账号 | email(unique), password_hash, role(admin/consultant), referral_code(unique), active |

## 迁移脚本

按序号执行：

| 文件 | 说明 | 状态 |
|------|------|------|
| `apps/api/sql/001_init.sql` | 初始建表 + 索引 | ✅ 已执行 |
| `apps/api/sql/002_add_email_index.sql` | user_accounts 邮箱索引 | ✅ 已执行 |
| `apps/api/sql/003_staff_accounts.sql` | 员工账号表 | ✅ 已执行 |
| `apps/api/sql/004_unify_sales_consultant.sql` | sales→consultant 统一 | ✅ 已执行 |
| `apps/api/sql/005_add_referral.sql` | 推荐码 | ✅ 已执行 |
| `db/migrations/006_add_deleted_at.sql` | 项目逻辑删除 + 用户索引 | 🆕 待执行 |

## 执行迁移

在 Supabase SQL Editor 中打开对应 `.sql` 文件内容执行，或通过 `psql`：

```bash
psql "$DATABASE_URL" -f db/migrations/006_add_deleted_at.sql
```

## 数据模式

- 业务数据以 `jsonb` 存储在 `payload` 列
- 部分高频查询字段（status, consultant_id, email 等）提升为独立列以支持索引
- 应用启动时全量加载到内存，运行时操作内存 + 异步写回数据库
