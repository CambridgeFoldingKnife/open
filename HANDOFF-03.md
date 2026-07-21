# 交接文档 #03 — 运动康复馆开馆助手

> 生成时间：2026-07-17  
> 上次操作人：AI Assistant  
> 项目路径：`C:\Users\剑桥折刀\Desktop\健衡项目\运动康复馆`

---

## 一、本次完成了什么

### 1. 修复前端 TypeScript 解析错误
- **问题**：`apps/web/src/App.tsx` 的 Register 和 Login 组件中，`const t=setInterval(()=>{...})` 嵌套箭头函数导致 TS1005 `';' expected` 错误
- **方案**：提取 `tick` 函数 + 将 `setInterval` 回调改为 `function` 关键字声明
- **涉及文件**：`apps/web/src/App.tsx`（Register 和 Login 各一处）

### 2. 去除所有模拟/演示环境，切换为真实模式
- **后端 `store.service.ts`**：
  - `sendCode`（手机号）：去除硬编码 `246810`，始终生成随机 6 位码；移除 `demoCode` 返回
  - `sendEmailCode`（邮箱）：同上
- **后端 `auth.ts`**：
  - `actorFromRequest` 移除 `x-role` / `x-user-id` header 回退，无有效 token 时抛出 `ForbiddenException('请先登录')`
- **前端 `App.tsx`**：
  - 移除 `testMode` 变量、`preview` 函数、Welcome 的 `onPreview` prop
  - 移除两处 `<small className="demo">本地演示验证码：246810</small>` 文案

### 3. 修复 API 启动失败（TypeScript 严格模式报错）
- 安装 `@types/nodemailer`（`npm i -D @types/nodemailer -w @opening/api`）
- `apps/api/src/mail.service.ts`：`catch(error)` → `catch(error: any)`
- `apps/api/src/store.service.ts`：`registerByEmail` 中 `let user` 改为 `const existing` + 显式类型声明，解决 `user is possibly undefined`

### 4. SMTP 邮件发送调试与优化
- **SMTP 配置**：`.env` 中的变量名必须是 `SMTP_HOST`、`SMTP_PORT`、`SMTP_USER`、`SMTP_PASS`（不是 `MAIL_*`）
- **超时问题**：阿里云 SMTP 响应慢，添加 `connectionTimeout/greetingTimeout/socketTimeout: 30000` 到 `mail.service.ts`
- **异步发送**：`sendEmailCode` 不再 `await` 邮件发送，改为 fire-and-forget，前端立即返回，避免用户等待

### 5. 修复注册流程跳转 Bug
- **问题**：点击「获取验证码」后页面没有切换到输入验证码的步骤
- **原因**：`sendCode` 函数只调用了 `startCooldown()` 但没有 `setStep('profile')`
- **修复**：发送成功后调用 `setStep('profile')`

### 6. 重新设计注册表单（两步紧凑流程）

**新流程：先填信息，后验邮箱**

**第一步 — 填写基本信息：**
- 姓名 / 称呼
- 所在城市
- 手机号（11位）
- 设置密码 + 确认密码（新增）
- 你的身份（投资人 / 康复师创业者 / 合伙人 / 其他）
- 创业阶段（新增：刚开始了解 / 已有选址 / 马上要开业）
- 营销同意勾选
- → 点击「下一步：验证邮箱 →」（含前端校验）

**第二步 — 验证邮箱（仅3个字段）：**
- 邮箱 + 获取验证码按钮（60s 倒计时）
- 6位验证码
- → 点击「完成注册」

---

## 二、关键决策记录

| 决策 | 原因 |
|------|------|
| 注册表单拆为两步，信息在前邮箱在后 | 降低用户填写焦虑，先完成有意义的信息采集 |
| 去除 `preferredContact` / `contactWindow` | 注册阶段太早，顾问跟进时再采集 |
| 新增「创业阶段」字段 | 区分用户意向成熟度，影响后续运营策略 |
| 邮件发送改为异步 fire-and-forget | 阿里云 SMTP 响应慢（10-30s），不能阻塞用户操作 |
| auth 去除 header 回退 | 生产环境必须真实登录，不能靠 header 模拟身份 |
| 密码使用 scrypt + salt 哈希 | `auth.ts` 中已有实现，安全性达标 |

---

## 三、当前环境配置

### 启动命令
```bash
# 必须先构建 shared
npm run build -w @opening/shared

# API（端口 3000，watch 模式）
cd apps/api && npx nest start --watch

# Web 客户端（端口 5174）
npm run dev -w apps/web

# Admin 管理后台（端口 5173）
npm run dev -w apps/admin
```

### `.env` 文件位置
`apps/api/.env` — 当前已配置：
- `DATABASE_URL`（Supabase PostgreSQL）
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS`（阿里云 DirectMail）
- `AUTH_SECRET` 未配置，使用默认值 `opening-assistant-local-secret`

### 类型检查
```bash
npm run typecheck          # 全量
cd apps/web && npx tsc --noEmit   # 仅前端
cd apps/api && npx tsc --noEmit   # 仅后端
```

---

## 四、相关文件索引

| 文件 | 说明 | 本次改动 |
|------|------|----------|
| `apps/web/src/App.tsx` | 前端主组件（Welcome/Register/Login/Wizard/Report） | ✅ 修复 TS 错误、重写 Register、去除 demo |
| `apps/api/src/store.service.ts` | 核心业务逻辑（验证码、注册、登录、项目管理） | ✅ 去除硬编码码、修复类型错误、异步发邮件 |
| `apps/api/src/auth.ts` | Token 生成/解析、密码哈希、角色守卫 | ✅ 移除 header 回退 |
| `apps/api/src/mail.service.ts` | SMTP 邮件发送服务 | ✅ 添加超时配置、安装 @types/nodemailer |
| `apps/api/src/app.controller.ts` | API 路由定义 | 未改动（已有 register-email 等路由） |
| `apps/api/.env` | 环境变量 | 用户已填写 SMTP 配置 |
| `packages/shared/src/index.ts` | 共享类型（UserAccount 等） | 未改动（identity 类型有 `operator` 但前端用 `partner`，后续对齐） |

---

## 五、已知问题 & 下一步

### 待处理
1. **`UserAccount.identity` 类型不一致**：shared 定义为 `'investor' | 'therapist' | 'operator'`，前端使用 `'investor' | 'therapist' | 'partner' | 'other'`，需要对齐
2. **注册表单缺少 CSS 样式适配**：两步流程的布局可能需要微调 `.auth-form` 样式以适应不同屏幕
3. **`stage` 字段未存入数据库**：注册时传了 `stage` 字段，但 `persistUser` 只存 `payload` JSONB，需要确认是否被序列化保存
4. **忘记密码 / 重置密码功能**：目前没有实现
5. **登录页面**：Login 组件也使用了相同的 `tick` + `startCooldown` 模式，已修复 TS 错误，但登录流程本身未测试

### 建议下一步
- 测试完整注册 → 登录 → 创建项目流程
- 补充 `stage` 字段在 `UserAccount` 类型和数据库 schema 中的定义
- 对齐 `identity` 枚举值
- 增加忘记密码功能
- Admin 后端管理页面功能验证
