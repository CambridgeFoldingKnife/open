# 交接文档 #2 — 邮箱认证系统

> 生成时间：2026-07-16 | 基于 opencode/mimo-v2-free 会话

---

## 一、本次完成的工作

### 1. Supabase 数据库配置

**问题**：项目使用内存存储，重启丢失数据

**解决方案**：配置 Supabase PostgreSQL 连接

**配置文件**：`apps/api/.env`
```bash
DATABASE_URL=postgresql://postgres.xrrbkkblmwhlzfjqrznb:jianheng001@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
```

**注意事项**：
- 必须使用 **Pooler 连接**（端口 6543），不能用 Direct 连接（端口 5432，IPv6 不兼容）
- Supabase SQL Editor 已执行 `apps/api/sql/001_init.sql` 创建表结构
- 密码：`jianheng001`

**验证**：`GET /api/health` 返回 `{"ok":true,"mode":"postgres"}`

### 2. 修复 dotenv 加载

**问题**：NestJS 未加载 `.env` 文件，`DATABASE_URL` 未生效

**解决方案**：在 `apps/api/src/main.ts` 顶部添加 `import 'dotenv/config'`

### 3. 修复登录时"请输入有效邮箱"错误

**问题**：Login 组件复用 `/api/auth/register` 接口，但未传 `email` 字段

**解决方案**：修改 `store.service.ts` 的 `register()` 方法，已注册用户（登录场景）跳过 email/name/city 必填验证

### 4. 导航栏退出按钮

**改动文件**：
- `apps/web/src/App.tsx` — 新增 `logout` 函数 + 按钮（包裹在 `.nav-right` 容器中）
- `apps/web/src/styles.css` — 新增 `.nav-right` 和 `.logout-btn` 样式

**退出逻辑**：清除 `localStorage` 中的 `opening-token`，重置所有状态

### 5. 邮箱验证码认证系统（本次核心工作）

#### 5.1 新增文件

| 文件 | 说明 |
|------|------|
| `apps/api/src/mail.service.ts` | 阿里云 SMTP 邮件发送服务，使用 nodemailer |

**依赖安装**：`npm install nodemailer --save`（在 `apps/api` 目录）

#### 5.2 修改的后端文件

| 文件 | 改动 |
|------|------|
| `apps/api/src/auth.ts` | 新增 `hashPassword()` 和 `verifyPassword()` 工具函数（使用 Node.js 内置 `crypto.scrypt`） |
| `apps/api/src/store.service.ts` | 新增 `emailCodes` Map 存储邮箱验证码；新增 `sendEmailCode()`、`registerByEmail()`、`loginByEmailCode()`、`loginByEmailPassword()`、`setEmailPassword()` 方法 |
| `apps/api/src/app.controller.ts` | 新增 5 个接口（见下方） |
| `apps/api/src/app.module.ts` | 在 providers 中注册 `MailService` |
| `apps/api/src/main.ts` | 添加 `import 'dotenv/config'` |

#### 5.3 新增后端接口

| 接口 | 方法 | 入参 | 返回 | 说明 |
|------|------|------|------|------|
| `/api/auth/send-email-code` | POST | `{email}` | `{ok, expiresIn, demoCode?}` | 发送邮箱验证码 |
| `/api/auth/register-email` | POST | `{email, code, phone, password, name, city, identity}` | `{user, token}` | 邮箱验证码注册 |
| `/api/auth/login-email-code` | POST | `{email, code}` | `{user, token}` | 邮箱验证码登录 |
| `/api/auth/login-email-password` | POST | `{email, password}` | `{user, token}` | 邮箱密码登录 |
| `/api/auth/set-password` | POST | `{password}` (需登录) | `{ok:true}` | 设置/修改密码 |

**保留的旧接口**（向后兼容）：
- `POST /api/auth/send-code` — 手机验证码
- `POST /api/auth/register` — 手机注册

#### 5.4 修改的前端文件

| 文件 | 改动 |
|------|------|
| `apps/web/src/App.tsx` | Register 组件重写（邮箱验证码流程）；Login 组件重写（邮箱验证码/密码双模式） |
| `apps/web/src/styles.css` | 新增 `.login-tabs` 样式（验证码/密码切换标签页） |

#### 5.5 注册流程变更

```
旧：输入手机号 → 收短信验证码 → 填资料 → 注册
新：输入邮箱 → 收邮箱验证码 → 填写：验证码 + 手机号 + 密码 + 姓名 + 城市 + 身份 → 注册
```

#### 5.6 登录流程变更

```
旧：手机号 + 短信验证码
新：
├─ 邮箱验证码登录：输入邮箱 → 发送验证码 → 输入验证码 → 登录
└─ 邮箱密码登录：输入邮箱 + 密码 → 登录
```

#### 5.7 密码存储

使用 Node.js 内置 `crypto.scrypt` + 随机盐值，格式：`$scrypt$<salt>$<hash>`

---

## 二、新增环境变量（需在 .env 中配置）

```bash
# 阿里云邮件推送 SMTP（用户已配置阿里云，需填入以下值）
SMTP_HOST=smtpdm.aliyun.com
SMTP_PORT=465
SMTP_USER=          # ← 填你的发件邮箱
SMTP_PASS=          # ← 填 SMTP 授权码
SMTP_FROM=          # ← 填发件人邮箱（可与 SMTP_USER 相同）
```

**开发环境行为**：
- 未配置 `SMTP_USER` 时，验证码通过 `demoCode` 返回（前端显示"本地演示验证码：246810"）
- 未配置 `SMTP_USER` 时，注册/登录验证码固定为 `246810`

---

## 三、已知问题与待办

### 高优先级

- [ ] **填写 .env 中的 SMTP 配置** — 用户需在 `apps/api/.env` 中填入阿里云 SMTP 信息
- [ ] **测试邮件发送** — 配置 SMTP 后测试真实邮件发送
- [ ] **测试完整注册/登录流程** — 清除 localStorage 后测试新流程
- [ ] **清理脚本文件** — `scripts/patch-register.js` 和 `scripts/patch-login.js` 是临时补丁脚本，可删除

### 中优先级

- [ ] **拆分 App.tsx** — 所有组件在一个 77 行压缩文件里，可读性差
- [ ] **添加独立 login API 端点** — 目前登录复用注册端点，已部分分离但仍需优化
- [ ] **手机号验证码集成** — 当前只用邮箱验证，后续可能加入阿里云短信

### 低优先级

- [ ] **引入 Recharts** — 替换手写 SVG 图表
- [ ] **添加 Framer Motion** — 页面切换动画

---

## 四、关键文件索引

### 后端

| 文件 | 说明 |
|------|------|
| `apps/api/src/main.ts` | NestJS 启动入口（已添加 dotenv） |
| `apps/api/src/app.module.ts` | 模块配置（已注册 MailService） |
| `apps/api/src/app.controller.ts` | 路由控制器（已添加邮箱认证接口） |
| `apps/api/src/store.service.ts` | 数据存储/业务逻辑（已添加邮箱验证码、密码验证） |
| `apps/api/src/auth.ts` | JWT 认证 + 密码哈希工具 |
| `apps/api/src/mail.service.ts` | **新增** 阿里云 SMTP 邮件发送 |
| `apps/api/.env` | 环境变量（数据库 + SMTP） |

### 前端

| 文件 | 说明 |
|------|------|
| `apps/web/src/App.tsx` | 所有 React 组件（Register、Login 已重写） |
| `apps/web/src/styles.css` | 全局样式（已添加 .login-tabs、.logout-btn） |

### 临时文件（可删除）

| 文件 | 说明 |
|------|------|
| `scripts/patch-register.js` | Register 组件补丁脚本 |
| `scripts/patch-login.js` | Login 组件补丁脚本 |

---

## 五、测试指南

### 启动服务

```bash
# 清理残留进程
taskkill /F /IM node.exe 2>$null

# 构建 shared
npm run build -w @opening/shared

# 启动（api + web）
cd apps/api && npm run dev
cd apps/web && npm run dev
```

### 注册流程测试

1. 打开 `http://localhost:5174`
2. 点击"注册"
3. 输入邮箱 → 点击"获取验证码"
4. 输入验证码 `246810`（开发环境固定值）
5. 填写手机号、密码、姓名、城市、身份
6. 点击"完成注册"

### 登录流程测试

1. 点击"登录"
2. **验证码登录**：输入邮箱 → 发送验证码 → 输入 `246810` → 登录
3. **密码登录**：切换到"密码登录" → 输入邮箱 + 密码 → 登录

### API 直接测试

```powershell
# 发送邮箱验证码
Invoke-WebRequest -Uri "http://localhost:3000/api/auth/send-email-code" -Method POST -Body '{"email":"test@example.com"}' -ContentType "application/json"

# 邮箱注册
Invoke-WebRequest -Uri "http://localhost:3000/api/auth/register-email" -Method POST -Body '{"email":"test@example.com","code":"246810","phone":"13800138000","password":"123456","name":"测试","city":"杭州","identity":"investor"}' -ContentType "application/json"

# 邮箱验证码登录
Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login-email-code" -Method POST -Body '{"email":"test@example.com","code":"246810"}' -ContentType "application/json"

# 邮箱密码登录
Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login-email-password" -Method POST -Body '{"email":"test@example.com","password":"123456"}' -ContentType "application/json"
```

---

## 六、设计决策记录

1. **使用 nodemailer 而非直接调用阿里云 API** — nodemailer 是 Node.js 生态最成熟的邮件库，阿里云 SMTP 兼容标准 SMTP 协议
2. **密码使用 scrypt 而非 bcrypt** — bcrypt 需要原生编译（node-gyp），scrypt 是 Node.js 内置函数，零依赖
3. **保留旧手机注册接口** — 向后兼容，避免破坏现有用户
4. **验证码存内存而非数据库** — 开发环境简单够用，生产环境建议改为 Redis 或数据库存储
5. **登录复用注册端点** — 历史原因，已通过新增独立登录接口逐步分离
