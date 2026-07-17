# Agent Instructions

## Project Overview

运动康复馆开馆助手 - 微信开馆方案生成器，包含客户小程序、顾问管理后台、规则引擎。

## Quick Start

```bash
# 必须先构建 shared 包，否则 API 启动会报 TypeScript 错误
npm run build -w @opening/shared

# 启动开发服务器（api + web + admin）
npm run dev
```

## Architecture

Monorepo 结构（npm workspaces）：

- `packages/shared` - 共享类型和工具函数，**必须先构建**
- `apps/api` - NestJS 后端，默认端口 3000
- `apps/web` - Vite 客户端，默认端口 5174
- `apps/admin` - Vite 管理后台，默认端口 5173
- `apps/mini` - 微信小程序（Taro）

## Development Ports

| Service | Default | Fallback |
|---------|---------|----------|
| API     | 3000    | -        |
| Web     | 5174    | 5175+    |
| Admin   | 5173    | 5175+    |

端口被占用时 Vite 会自动选择下一个可用端口。

## Demo Authentication

开发环境使用请求头模拟身份：

- 管理员：`x-role: admin`
- 顾问：`x-role: consultant`
- 客户：`x-role: customer` + `x-user-id: customer-1`

本地短信验证码固定为 `246810`。

## PostgreSQL Mode

```bash
docker compose up -d
cp .env.example .env
npm run dev
```

## Build

```bash
# 完整构建（shared → api → web → admin → mini）
npm run build

# 仅构建 shared 包
npm run build -w @opening/shared
```

## Type Check

```bash
npm run typecheck
```

## Key Gotchas

1. **必须先构建 `@opening/shared`** - API 启动依赖其类型定义
2. **端口冲突** - API 端口 3000 被占用会导致启动失败
3. **微信小程序** - 需要微信开发者工具导入 `apps/mini`，构建目录为 `dist`
4. **生产环境** - 应替换 JWT 密钥、接入微信 `code2Session`、替换文件下载适配器
