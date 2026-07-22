# 运动康复馆开馆助手

面向运动康复与精品训练场馆的开馆方案生成器，包含客户前端、顾问管理后台、规则引擎和 PDF 交付。

## 快速启动

```bash
npm install
npm run build -w @opening/shared
npm run dev
```

- 用户网页：`http://localhost:5174`
- 管理后台：`http://localhost:5173`
- API 服务：`http://localhost:3000`

## 架构概览

Monorepo 结构（npm workspaces）：

| 包 | 路径 | 说明 |
|---|---|---|
| `@opening/shared` | `packages/shared` | 共享类型定义与工具函数 |
| `@opening/api` | `apps/api` | NestJS 后端 API |
| `@opening/web` | `apps/web` | Vite 客户端（React） |
| `@opening/admin` | `apps/admin` | Vite 管理后台（React） |
| `@opening/mini` | `apps/mini` | 微信小程序（Taro） |

## 开发环境

### 端口占用

| 服务 | 默认端口 |
|---|---|
| API | 3000 |
| Web | 5174 |
| Admin | 5173 |

端口被占用时 Vite 会自动选择下一个可用端口。

### 独立启动前后端

支持独立启动前后端服务，便于开发调试：

**启动后端（API）：**

```bash
npm run dev -w @opening/api
# 或进入目录
cd apps/api && npm run dev
```

**启动用户端（Web）：**

```bash
npm run dev -w @opening/web
# 或进入目录
cd apps/web && npm run dev
```

**启动管理端（Admin）：**

```bash
npm run dev -w @opening/admin
# 或进入目录
cd apps/admin && npm run dev
```

**组合启动：**

```bash
# 同时启动 API 和 Web
npm run dev -w @opening/api & npm run dev -w @opening/web

# 同时启动 API 和 Admin
npm run dev -w @opening/api & npm run dev -w @opening/admin

# 全部启动
npm run dev
```

> **注意**：前端依赖后端 API，需要先启动后端，或确保 `http://localhost:3000` 可访问。

### 数据库

项目启动必须配置 PostgreSQL 数据库连接。

**1. 配置连接**

数据库连接信息见 `apps/api/.env`：

```env
DATABASE_URL=postgresql://user:password@host:port/database
```

**2. PostgreSQL 本地模式**

```bash
docker compose up -d
cp .env.example .env
npm run dev
```

**3. 初始化测试数据**

数据库为空时，可手动注入测试账号和演示项目/线索数据：

```bash
npm run seed -w @opening/api
```

执行后会创建管理员、顾问账号和一条演示项目/线索数据。本地短信验证码固定为 `246810`。

**4. 数据库迁移脚本**

迁移脚本位于 `apps/api/sql/`，升级时请按顺序执行：

| 脚本 | 说明 |
|---|---|
| `003_staff_accounts.sql` | 员工账号表初始化 |
| `004_unify_sales_consultant.sql` | `sales` 角色合并为 `consultant` |
| `005_add_referral.sql` | 为员工生成唯一 `referral_code` |
| `006_simplify_project_status.sql` | 项目状态简化为 3 态 |

推荐使用项目内置的迁移工具执行：

```bash
npx tsx apps/api/src/run-migration.ts apps/api/sql/004_unify_sales_consultant.sql
npx tsx apps/api/src/run-migration.ts apps/api/sql/005_add_referral.sql
npx tsx apps/api/src/run-migration.ts apps/api/sql/006_simplify_project_status.sql
```

或在 Supabase SQL Editor 中直接执行对应 SQL 文件内容。

## 登录与权限

### 管理端（Admin）

管理端使用真实登录系统，基于 JWT token 认证。

**测试账号（Supabase 数据库）：**

| 邮箱 | 密码 | 角色 | 权限说明 |
|---|---|---|---|
| test@test.com | 123456 | customer | 用户端功能 |
| admin@jianheng.com | admin123 | admin | 全部功能 |
| consultant@jianheng.com | consultant123 | consultant | 自己的项目 + 销售线索 + 产品只读 |

**角色权限矩阵：**

| 功能 | admin | consultant |
|---|:---:|:---:|
| 查看全部项目 | ✅ | ❌ 仅自己 |
| 编辑方案 | ✅ | ✅ |
| 修改项目状态 | ✅ | ✅ |
| 查看全部线索 | ✅ | ❌ 仅自己 |
| 添加跟进 | ✅ | ✅ |
| 管理产品价格 | ✅ | 只读 |
| 管理运营原型 | ✅ | ❌ |
| 下载 Excel | ✅ | ✅ |
| 导出 PDF 报告 | ✅ | ✅ |
| 复制邀请链接 | ✅ | ✅ |

### 用户端（Web）

用户端支持邮箱注册/登录，验证码通过邮箱发送（SMTP: `smtpdm.aliyun.com:465`，发件人：`no-reply@mail.camknife.me`）。
开发环境本地短信验证码固定为 `246810`。

### 顾问邀请与客户归属

顾问可在管理后台顶部复制专属邀请链接，格式为：

```
https://<域名>/?ref=<顾问推荐码>
```

用户通过该链接进入注册页并注册后，`user_accounts.referred_by_consultant_id` 会自动记录归属顾问。后续该用户首次创建项目时，项目会自动分配给对应顾问跟进。

> 老顾问需要在执行 `005_add_referral.sql` 迁移后才会显示邀请链接。

## 项目状态

项目生命周期已简化为 3 种状态：

| 状态 | 含义 | 操作 |
|---|---|---|
| `pending` / 待处理 | 用户已提交，等待顾问处理 | 顾问点击「开始跟进」 |
| `processing` / 处理中 | 顾问正在联系用户 | 顾问点击「标记已完成」 |
| `completed` / 已完成 | 双方已联系并成交 | 不可再修改 |

用户端删除的项目不会出现在销售端列表中。

## PDF 导出

管理端已支持前端直接生成 PDF，复用用户端的 `html2canvas + jsPDF` 方案：

- **设备产品明细表**：进入项目详情页 →「产品报价单」Tab → 点击「导出 PDF」
- **数据统计表**：进入「数据看板」页面 → 点击右上角「导出 PDF」

项目详情页顶部的旧版导出下拉框暂时仅保留 PDF 格式。

## 微信小程序

```bash
npm run dev:mini
```

微信开发者工具导入 `apps/mini`，构建目录为 `dist`。

## 构建与部署

```bash
# 完整构建（shared → api → web → admin）
npm run build

# 仅构建 shared 包
npm run build -w @opening/shared

# 类型检查
npm run typecheck
```

微信小程序排除在 Vercel 部署之外，通过 `vercel.json` 的 `installCommand` 中 `--ignore` 参数排除。

## 线上部署

| 服务 | 平台 | 地址 |
|---|---|---|
| API 后端 | Railway | https://open-production-4d6b.up.railway.app |
| 用户前端 | Vercel | https://rehab-web.vercel.app |
| 管理后台 | Vercel | https://rehab-admin.vercel.app |

### 部署流程

1. 推送代码到 GitHub，Vercel / Railway 自动触发重新部署
2. `packages/shared` 必须先构建，否则 API 启动报错
3. Railway 构建命令：`npm run build -w @opening/shared && npm run build -w @opening/api`
4. Railway 启动命令：`npm run start -w @opening/api`

### 环境变量

Railway 环境变量（在 Railway Dashboard 设置）：

```env
DATABASE_URL=postgresql://postgres.xrrbkkblmwhlzfjqrznb:jianheng001@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres
NODE_TLS_REJECT_UNAUTHORIZED=0   # 跳过 Supabase pooler 自签证书验证
AUTH_SECRET=your-production-secret
PORT=8080
```

Vercel 环境变量（在 Vercel Dashboard 设置）：

```env
VITE_API_URL=https://open-production-4d6b.up.railway.app
```

### 生产环境注意事项

- 替换 `AUTH_SECRET` 为强随机值
- 接入微信 `code2Session` 和手机号解密服务
- 替换文件下载适配器为对象存储签名 URL
- 配置 CORS 允许的域名白名单

## 数据库表结构

### staff_accounts（员工账号）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | text | 主键 |
| email | text | 登录邮箱（唯一） |
| password_hash | text | 密码哈希（scrypt） |
| name | text | 姓名 |
| role | text | 角色：admin / consultant |
| title | text | 职位 |
| phone | text | 手机号 |
| referral_code | text | 唯一推荐码，用于邀请客户 |
| active | boolean | 是否启用 |
| created_at | timestamptz | 创建时间 |

### user_accounts（用户账号）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | text | 主键 |
| phone | text | 手机号 |
| email | text | 邮箱 |
| name | text | 姓名 |
| city | text | 城市 |
| identity | text | 身份：investor / therapist / partner / other |
| stage | text | 创业阶段 |
| referred_by_consultant_id | text | 归属顾问 ID（通过邀请链接注册） |
| created_at | timestamptz | 创建时间 |

### projects（开馆项目）

| 字段 | 类型 | 说明 |
|---|---|---|
| id | text | 主键 |
| customer_id | text | 关联用户 |
| consultant_id | text | 归属顾问 |
| status | text | 项目状态：pending / processing / completed |
| deleted_at | timestamptz | 用户删除时间，非空则不显示在销售端 |

SQL 文件位于 `apps/api/sql/` 目录：

- `003_staff_accounts.sql`：员工账号表初始化
- `004_unify_sales_consultant.sql`：销售与顾问角色合并迁移
- `005_add_referral.sql`：生成顾问推荐码
- `006_simplify_project_status.sql`：项目状态简化为 3 态

## 项目结构

```
运动康复馆/
├── packages/shared/        # 共享类型与工具
├── apps/
│   ├── api/                # NestJS 后端
│   │   ├── src/
│   │   │   ├── auth.ts     # JWT 认证与密码哈希
│   │   │   ├── store.service.ts  # 核心业务逻辑
│   │   │   ├── app.controller.ts # API 路由
│   │   │   └── run-migration.ts  # 迁移脚本执行工具
│   │   └── sql/            # 数据库迁移文件
│   ├── web/                # 客户端（Vercel 部署）
│   ├── admin/              # 管理后台（Vercel 部署）
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   ├── utils/status.ts   # 状态标签与颜色
│   │   │   └── components/
│   │   │       ├── UserProjectsPage.tsx
│   │   │       └── ProjectDetailPage.tsx
│   │   └── dist/           # 构建产物
│   └── mini/               # 微信小程序（排除在 Vercel 部署外）
├── vercel.json             # Vercel 部署配置
├── docker-compose.yml      # PostgreSQL 容器配置
└── package.json            # 根配置
```

## 已知问题

- SWC 在 `.tsx` 文件中解析泛型时可能报错，使用 `as any` 规避
- Windows PowerShell 不支持 `||` 和 `&` 操作符
- 需要先构建 `@opening/shared` 包，否则 API 启动会报 TypeScript 错误
- Vercel 构建已跳过 TypeScript 严格检查（`tsc -b`），仅执行 `vite build`
