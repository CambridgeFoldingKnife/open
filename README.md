# 运动康复馆开馆助手

面向运动康复与精品训练场馆的微信开馆方案生成器，包含客户小程序、顾问管理后台、规则引擎、审核发布和 Excel 交付。

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

数据库为空时，可手动注入测试账号和演示项目：

```bash
npm run seed -w @opening/api
```

执行后会创建管理员、顾问账号和一条演示项目/线索数据。本地短信验证码固定为 `246810`。

### 角色变更迁移

若从旧版本升级，`sales` 角色已与 `consultant` 合并。管理员在完成代码更新后，需在 PostgreSQL 中执行迁移脚本：

```bash
psql "$DATABASE_URL" -f apps/api/sql/004_unify_sales_consultant.sql
```

或在 Supabase SQL Editor 中直接执行 `apps/api/sql/004_unify_sales_consultant.sql` 的内容。

## 登录与权限

### 管理端（Admin）

管理端使用真实登录系统，基于 JWT token 认证。

**测试账号：**

执行 `npm run seed -w @opening/api` 后会生成以下账号：

| 邮箱 | 密码 | 角色 | 权限说明 |
|---|---|---|---|
| admin@jianheng.com | 123456 | admin | 全部功能 |
| consultant@jianheng.com | 123456 | consultant | 自己的项目 + 销售线索 + 产品只读 |

**角色权限矩阵：**

| 功能 | admin | consultant |
|---|:---:|:---:|
| 查看全部项目 | ✅ | ❌ 仅自己 |
| 分配顾问 | ✅ | - |
| 编辑方案 | ✅ | ✅ |
| 审核发布 | ✅ | - |
| 查看全部线索 | ✅ | ❌ 仅自己 |
| 分配线索 | ✅ | - |
| 添加跟进 | ✅ | ✅ |
| 管理产品价格 | ✅ | 只读 |
| 管理运营原型 | ✅ | ❌ |
| 下载 Excel | ✅ | ✅ |

### 用户端（Web）

用户端支持邮箱注册/登录，本地短信验证码固定为 `246810`。

## 微信小程序

```bash
npm run dev:mini
```

微信开发者工具导入 `apps/mini`，构建目录为 `dist`。

## 构建与部署

```bash
# 完整构建
npm run build

# 仅构建 shared 包
npm run build -w @opening/shared

# 类型检查
npm run typecheck
```

## 生产环境注意事项

- 替换 JWT 密钥（`apps/api/src/auth.ts` 中的 `AUTH_SECRET`）
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
| role | text | 角色：admin/consultant |

| title | text | 职位 |
| phone | text | 手机号 |
| active | boolean | 是否启用 |
| created_at | timestamptz | 创建时间 |

SQL 文件位于 `apps/api/sql/` 目录：

- `003_staff_accounts.sql`：员工账号表初始化
- `004_unify_sales_consultant.sql`：销售与顾问角色合并迁移

## 项目结构

```
运动康复馆/
├── packages/shared/        # 共享类型与工具
├── apps/
│   ├── api/                # NestJS 后端
│   │   ├── src/
│   │   │   ├── auth.ts     # JWT 认证与密码哈希
│   │   │   ├── store.service.ts  # 核心业务逻辑
│   │   │   └── app.controller.ts # API 路由
│   │   └── sql/            # 数据库迁移文件
│   ├── web/                # 客户端
│   ├── admin/              # 管理后台
│   └── mini/               # 微信小程序
├── docker-compose.yml      # PostgreSQL 容器配置
└── package.json            # 根配置
```

## 已知问题

- SWC 在 `.tsx` 文件中解析泛型时可能报错，使用 `as any` 规避
- Windows PowerShell 不支持 `||` 和 `&` 操作符
- 需要先构建 `@opening/shared` 包，否则 API 启动会报 TypeScript 错误
