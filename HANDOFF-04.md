# 交接文档 #04 — 管理端真实登录与角色权限控制

> 生成时间：2026-07-17  
> 上次操作人：AI Assistant  
> 项目路径：`C:\Users\剑桥折刀\Desktop\健衡项目\运动康复馆`  
> 前序文档：HANDOFF-03.md

---

## 一、本次完成了什么

### 1. 管理端（admin）接入真实登录系统

**问题**：管理端原来用 `x-role` / `x-user-id` 请求头模拟身份（开发模式），任何人可以伪造角色，没有真正的登录认证。

**方案**：基于已有 JWT token + scrypt 密码哈希基础设施，新增 staff 账号体系。

**改动**：
- `auth.ts` 的 `actorFromRequest` **移除** x-role/x-user-id header 回退，只接受 Bearer token
- 新增 `POST /api/auth/staff/login` — 邮箱+密码登录，返回 JWT token
- 新增 `GET /api/auth/staff/me` — 获取当前登录 staff 信息
- 管理端前端改为 `Authorization: Bearer <token>` 请求头

### 2. 数据库新增 staff_accounts 表

通过 Node.js 脚本直连 Supabase PostgreSQL 创建：

```sql
CREATE TABLE IF NOT EXISTS staff_accounts (
  id text PRIMARY KEY,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin','sales','consultant')),
  title text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

索引：`idx_staff_accounts_email`、`idx_staff_accounts_role`

**注意**：此表已通过脚本在 Supabase 远程数据库中创建。SQL 文件 `003_staff_accounts.sql` 仅作文档留存。

### 3. 管理端前端重构：登录页 + 角色权限控制

- **新建 `LoginPage.tsx`**：邮箱+密码表单，调用 `/auth/staff/login`
- **重写 `api.ts`**：移除 x-role 逻辑，改用 `Authorization: Bearer` token
- **重写 `App.tsx`**：
  - 未登录 → 显示 LoginPage
  - 登录后 → 调用 `/auth/staff/me` 获取 staff 信息和角色
  - 角色选择器下拉框**移除**（角色由账号决定，不可手动切换）
  - 侧边栏菜单根据角色动态显隐
  - 按钮级操作根据角色控制（如"分配顾问"仅 admin 可见）
  - 退出按钮清除 token 并返回登录页

### 4. 三个角色的权限矩阵

| 功能 | admin | consultant | sales |
|------|:-----:|:----------:|:-----:|
| 查看全部项目 | ✅ | ❌ 仅自己 | ❌ 仅自己 |
| 分配顾问 | ✅ | - | - |
| 编辑方案 | ✅ | ✅ | ❌ |
| 退回修改 | ✅ | - | - |
| 审核发布 | ✅ | - | - |
| 查看全部线索 | ✅ | - | ✅ |
| 分配销售 | ✅ | - | - |
| 添加跟进 | ✅ | - | ✅ |
| 管理产品价格 | ✅ | 只读 | ❌ |
| 管理运营原型 | ✅ | ❌ | ❌ |
| 下载 Excel | ✅ | ✅ | ✅ |

---

## 二、关键决策记录

| 决策 | 原因 |
|------|------|
| 新建独立 staff_accounts 表，不复用 user_accounts | 客户和内部员工是完全不同的实体，字段和权限模型不同 |
| auth.ts 移除 x-role/x-user-id 回退 | 生产环境必须真实登录，不能靠 header 模拟身份 |
| 登录只支持邮箱+密码，不支持手机号 | 内部员工账号由管理员分配，不需要手机号注册流程 |
| api.ts 不用泛型 `api<T>`，改用 `as any` 类断言 | SWC/Vite 在 .tsx 文件中会把 `<T>` 解析为 JSX 标签，导致编译错误 |
| seed 数据的密码统一为 `123456` | 开发/演示环境使用简单密码，生产环境需强制修改 |

---

## 三、测试账号

| 邮箱 | 密码 | 角色 | 说明 |
|------|------|------|------|
| admin@jianheng.com | 123456 | admin | 全部功能 |
| sales@jianheng.com | 123456 | sales | 销售线索 + 自己的项目 |
| consultant@jianheng.com | 123456 | consultant | 自己的项目 + 产品只读 |

密码使用 `auth.ts` 中的 `hashPassword('123456')` 生成的 scrypt 哈希存储。

---

## 四、当前环境配置

### 启动命令
```bash
# 必须先构建 shared
npm run build -w @opening/shared

# 启动全部（API 3000 + Web 5174 + Admin 5173）
npm run dev

# 单独启动
npm run dev -w @opening/api
npm run dev -w @opening/admin
npm run dev -w @opening/web
```

### `.env` 文件
`apps/api/.env` — 当前已配置：
- `DATABASE_URL`（Supabase PostgreSQL）
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS`（阿里云 DirectMail）
- `AUTH_SECRET` 未配置，使用默认值 `opening-assistant-local-secret`

### 数据库连接
```
postgresql://postgres.xrrbkkblmwhlzfjqrznb:jianheng001@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
```

### 验证 API
```bash
# 健康检查
curl http://localhost:3000/api/health

# 登录
curl -X POST http://localhost:3000/api/auth/staff/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@jianheng.com","password":"123456"}'

# 获取 staff 信息（用返回的 token）
curl http://localhost:3000/api/auth/staff/me \
  -H "Authorization: Bearer <token>"
```

---

## 五、相关文件索引

| 文件 | 说明 | 本次改动 |
|------|------|----------|
| `packages/shared/src/index.ts` | 共享类型 | ✅ 新增 `StaffAccount` 接口 |
| `apps/api/sql/003_staff_accounts.sql` | 建表 SQL（文档留存） | ✅ 新建 |
| `apps/api/src/seed.ts` | 初始数据 | ✅ 新增 `demoStaff`（3 个 staff 账号） |
| `apps/api/src/auth.ts` | Token 生成/解析、密码哈希、角色守卫 | ✅ 移除 x-role 回退 |
| `apps/api/src/store.service.ts` | 核心业务逻辑 | ✅ 新增 staff 数组、staffLogin、staffMe、persistStaff |
| `apps/api/src/app.controller.ts` | API 路由定义 | ✅ 新增 staff login/me 接口 |
| `apps/admin/src/LoginPage.tsx` | 登录页组件 | ✅ 新建 |
| `apps/admin/src/api.ts` | API 调用层 | ✅ 重写：Bearer token + authHeaders |
| `apps/admin/src/App.tsx` | 管理端主组件 | ✅ 重写：登录状态 + 角色权限控制 |

---

## 六、已知问题 & 下一步

### 待处理

1. **SWC 泛型兼容问题**：Vite 的 SWC 在 `.tsx` 文件中会把 `api<T>` 的 `<T>` 解析为 JSX 标签，导致编译错误。当前用 `as any` 规避，后续可考虑将 `api` 函数的类型通过单独的 `.ts` 文件导出，或在 `tsconfig.json` 中配置 `isolatedModules: true` + `verbatimModuleSyntax`
2. **LoginPage.tsx 第 15 行仍有 `api<{staff:StaffAccount;token:string}>`**：这个文件是纯 TSX（不混用 JSX 表达式），目前未报错，但如果后续出问题需改为 `as any` 规避
3. **密码修改功能**：staff 不能在前端修改自己的密码
4. **忘记密码**：目前没有实现
5. **staff 管理界面**：管理员不能在前端增删改 staff 账号，只能通过数据库直接操作
6. **登录失败锁定**：没有密码错误次数限制，没有账号锁定机制
7. **token 过期处理**：token 30 天过期，但前端没有自动处理过期跳转（仅在 API 返回 401 时 catch 错误）

### 建议下一步

- 增加 401 响应拦截：前端收到 401 时自动清除 token 跳转登录页
- 增加管理员对 staff 的 CRUD 管理页面
- 增加密码修改/重置功能
- 增加登录日志审计
- 测试完整流程：管理员登录 → 分配顾问 → 顾问编辑方案 → 提交审核 → 管理员发布
- 验证数据库中 staff_accounts 表的数据持久化是否正常

---

## 七、技术备忘

### 踩坑记录

1. **SWC 在 .tsx 中解析泛型**：`api<StaffAccount>` 会被 SWC 当作 JSX 标签解析，报 `Unexpected token`。解决方案：不要在 `.tsx` 文件的函数调用中使用泛型参数，改用 `as any` 类型断言或单独的 `.ts` 文件定义泛型函数
2. **PowerShell 不支持 `||` 和 `&`**：Windows PowerShell 5.1 不支持 `||`（OR）和 `&`（后台执行）操作符，需用 `; if ($?) { ... }` 或 `Start-Process` 代替
3. **psql 未安装**：Windows 环境没有 psql 客户端，直连 Supabase 需要用 Node.js + `pg` 包
4. **seed.ts 循环依赖**：`store.service.ts` 导入 `seed.ts` 的 `demoStaff`，而 `seed.ts` 导入 `auth.ts` 的 `hashPassword`，`auth.ts` 不依赖 `store.service.ts`，所以不存在循环依赖
