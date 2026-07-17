# 交接文档 — 运动康复馆开馆助手

> 生成时间：2026-07-16 | 基于 opencode/mimo-v2.5-free 会话

---

## 一、项目概览

**运动康复馆开馆助手**（rehab-opening-assistant）是一个 monorepo 项目，为运动康复领域创业者提供开馆评估、设备报价、盈亏分析和落地执行方案。

### 技术栈

| 包 | 技术 | 端口 | 说明 |
|---|---|---|---|
| `apps/api` | NestJS + TypeScript | 3000 | 后端 API，含规则引擎 |
| `apps/web` | Vite + React + 原生 CSS | 5174 | 客户端（问卷 + 报告） |
| `apps/admin` | Vite + React + Ant Design | 5173 | 管理后台 |
| `apps/mini` | Taro (React) | 微信开发者工具 | 微信小程序 |
| `packages/shared` | TypeScript | — | 共享类型、评分函数 |

### 启动命令

```bash
# 必须先构建 shared 包
npm run build -w @opening/shared

# 启动开发服务器
npm run dev
```

### 关键注意事项

- `@opening/shared` **必须先构建**，否则 API 启动报 TS 错误
- API 端口 3000 被占用会导致启动失败
- 开发环境验证码固定为 `246810`
- Vite 端口被占用时自动选择下一个可用端口

---

## 二、本次完成的工作

### 1. 创建 AGENTS.md

**文件**: `AGENTS.md`（项目根目录）

为未来 AI agent session 提供项目上下文，包含：
- 项目概述和架构
- 启动命令和端口配置
- 演示身份认证方式
- PostgreSQL 模式配置
- 4 个关键注意事项

### 2. 项目启动与端口问题解决

**问题**: `npm run dev` 启动后被 OpenCode bash 工具超时终止，子进程成为孤儿占用端口。

**解决方案**: 使用 `Start-Process` 后台启动各服务，进程独立于 OpenCode 会话。

**当前运行的服务**:
- API: `localhost:3000` (PID 动态)
- Web: `localhost:5174`
- Admin: `localhost:5173`

**清理残留进程命令**: `taskkill /F /IM node.exe`

### 3. UI/UX 全面重设计

基于 `ui-ux-pro-max` skill 的数据库推荐，完成了三个 CSS 文件的重写。

#### 3.1 配色系统（深绿 → 青蓝健康色）

| 变量 | 旧值 | 新值 |
|------|------|------|
| `--ink` | `#173630` | `#164e63` |
| `--green` | `#1d7664` | `#059669` |
| `--orange` | `#e66f3e` | `#0891b2` |
| `--blue` | `#315c83` | `#0e7490` |
| `--paper` | `#fbfcf8` | `#ffffff` |
| `--line` | `#cdd8d2` | `#e2e8f0` |
| 背景 | `#eef2ef` | `#ecfeff` |

新增 CSS 变量:
- `--shadow-sm: 0 1px 3px rgba(0,0,0,.06)`
- `--shadow-md: 0 4px 12px rgba(0,0,0,.07)`
- `--shadow-lg: 0 8px 24px rgba(0,0,0,.09)`
- `--radius-sm: 10px`
- `--radius-md: 14px`
- `--radius-lg: 20px`

#### 3.2 字体

- 引入 Google Fonts: `Plus Jakarta Sans`
- 标题: `STSong 宋体` → `Plus Jakarta Sans 700`
- 数字: `Arial Narrow` → `Plus Jakarta Sans 700`

#### 3.3 圆角 + 阴影 + 间距

- 卡片: `0px` → `14px` (radius-md)
- 大容器: `0px` → `20px` (radius-lg)
- 按钮/输入框: `0px` → `10px` (radius-sm)
- 按钮硬阴影 → 柔和投影
- Grid gap: `14px` → `16-20px`
- Section 间距: `70px` → `80px`

#### 3.4 导航栏

- 实色背景 → `rgba(255,255,255,.85)` 毛玻璃效果
- 高度: `78px` → `68px`

#### 3.5 Hero 区域

- 纯色背景 → 渐变 + 径向光效

**修改的文件**:
- `apps/web/src/styles.css` — 完整重写
- `apps/web/src/onboarding.css` — 完整重写
- `apps/web/src/dashboard.css` — 完整重写

### 4. 首页登录/注册流程改造

**问题**: 开发模式下"开始测算"按钮直接跳过登录，没有明显的登录/注册入口。

**解决方案**: 重写 Welcome 页面，新增 Login 组件。

#### 4.1 新增组件: `Login`

```tsx
function Login({onDone, onBack}) {
  // 两步流程: 输入手机号 → 输入验证码
  // 调用 POST /api/auth/send-code 和 POST /api/auth/register
}
```

#### 4.2 改造 Welcome 页面

新增:
- 顶部导航栏（Logo + 登录/注册按钮）
- 双 CTA 按钮（"注册并开始测算" + "已有账号，直接登录"）
- 四个功能特性卡片（定位/报价/测算/执行）

#### 4.3 路由状态变更

旧:
```tsx
const [showRegister, setShowRegister] = useState(false);
// showRegister ? <Register/> : <Welcome/>
```

新:
```tsx
const [authPage, setAuthPage] = useState<'none'|'login'|'register'>('none');
// authPage === 'register' ? <Register/> : authPage === 'login' ? <Login/> : <Welcome/>
```

**修改的文件**:
- `apps/web/src/App.tsx` — Welcome 组件重写 + 新增 Login 组件 + 路由逻辑更新
- `apps/web/src/onboarding.css` — 新增导航栏、功能卡片、双按钮布局样式

### 5. Skill 设计文档

**文件**: `skill-design.md`（项目根目录）

为"运动康复馆开馆顾问" skill 的设计文档，包含:
- 产品定位与核心目的分析
- 用户价值分析
- 评估体系详解（10 维能力 + 5 维准备度）
- 象限分类和原型推荐逻辑
- 15 道评估题目设计
- 评分权重公式
- 输出报告模板
- 四个象限的差异化建议

---

## 三、关键文件索引

### 前端

| 文件 | 说明 |
|------|------|
| `apps/web/src/App.tsx` | 所有 React 组件（单文件，~75 行压缩代码） |
| `apps/web/src/styles.css` | 全局样式 + 导航 + 认证 + 首页 + 向导 + 报告 |
| `apps/web/src/onboarding.css` | 欢迎页 + 选择题 + 身份网格 + 多选 |
| `apps/web/src/dashboard.css` | 服务看板 + 盈亏分析 + 甘特图 + 装修 + 证照 + 岗位 |
| `apps/web/src/api.ts` | API 请求工具函数 |
| `apps/web/src/main.tsx` | 入口文件 |

### 后端

| 文件 | 说明 |
|------|------|
| `apps/api/src/main.ts` | NestJS 启动入口 |
| `apps/api/src/app.controller.ts` | 所有 API 路由 |
| `apps/api/src/auth.ts` | JWT token 生成和验证 |
| `apps/api/src/rules.service.ts` | 核心规则引擎（评分、推荐、盈亏） |
| `apps/api/src/store.service.ts` | 数据存储层 |
| `apps/api/src/excel.service.ts` | Excel 导出（9 页） |
| `apps/api/src/seed.ts` | 演示数据 |

### 共享

| 文件 | 说明 |
|------|------|
| `packages/shared/src/index.ts` | 共享类型、评分函数、状态标签、象限/原型元数据 |

### 文档

| 文件 | 说明 |
|------|------|
| `AGENTS.md` | AI agent 指令文件 |
| `README.md` | 项目说明 |
| `skill-design.md` | 开馆顾问 skill 设计文档 |

---

## 四、设计决策记录

1. **配色选择青蓝而非继续用绿**: 基于 ui-ux-pro-max skill 数据库推荐，青蓝更符合医疗/健康场景
2. **字体用 Plus Jakarta Sans 而非保留宋体**: 现代感更强，中英混排友好，Google Fonts 免费
3. **保留原有信息架构**: 只改视觉风格，不改组件结构和业务逻辑
4. **Login 组件复用 Register 端点**: 因为后端没有独立的 login 端点，未注册手机号会自动创建账号
5. **Welcome 页面从 place-items:center 改为 flexbox column**: 为了容纳导航栏和功能卡片

---

## 五、已知问题

1. **App.tsx 是单文件压缩格式**: 所有组件在一个 75 行的压缩文件里，可读性差，修改需小心
2. **Login 组件无独立后端端点**: 复用 `/api/auth/register`，未注册手机号会自动注册
3. **开发模式 testMode 仍存在**: `import.meta.env.DEV` 为 true 时，`preview` 函数仍可跳过登录（但 Welcome 页面不再直接暴露该入口）
4. **CSS 变量名与 admin 不统一**: web 用 `--ink/--green/--orange`，admin 用 Ant Design tokens

---

## 六、下一步建议

### 高优先级

- [ ] **拆分 App.tsx**: 将 75 行压缩的单文件拆分为独立组件文件（Login.tsx, Register.tsx, Welcome.tsx, Home.tsx, Wizard.tsx, Report.tsx 等）
- [ ] **添加独立 login API 端点**: 在后端 `app.controller.ts` 中新增 `POST /api/auth/login`，区分注册和登录
- [ ] **修复 testMode 跳过登录**: 确保生产环境下所有路径都经过认证

### 中优先级

- [ ] **引入 Recharts**: 替换手写 SVG 象限图和盈亏分析
- [ ] **统一设计 token**: 在 `packages/shared` 中定义统一的设计变量
- [ ] **添加 Framer Motion**: 页面切换和卡片进入动画

### 低优先级

- [ ] **Admin 后台样式同步**: 将 admin 的配色从金色改为青蓝色系
- [ ] **添加暗黑模式**: 使用 `prefers-color-scheme` 媒体查询
- [ ] **完善响应式**: 450px 以下的移动端适配

---

## 七、测试指南

### 启动服务

```bash
# 清理残留进程
taskkill /F /IM node.exe 2>$null

# 构建 shared
npm run build -w @opening/shared

# 启动
npm run dev
```

### 认证流程测试

1. 打开 `http://localhost:5174`
2. 点击"注册" → 输入任意 11 位手机号 → 验证码 `246810` → 填写信息 → 注册
3. 或点击"登录" → 输入手机号 → 验证码 `246810` → 登录

### API 直接测试

```powershell
# 发送验证码
Invoke-WebRequest -Uri "http://localhost:3000/api/auth/send-code" -Method POST -Body '{"phone":"13800138000"}' -ContentType "application/json"

# 注册
Invoke-WebRequest -Uri "http://localhost:3000/api/auth/register" -Method POST -Body '{"phone":"13800138000","code":"246810","name":"测试","city":"杭州","identity":"investor"}' -ContentType "application/json"
```
