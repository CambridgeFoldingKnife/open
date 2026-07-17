# 开馆助手

面向运动康复与精品训练场馆的微信开馆方案生成器，包含客户小程序、顾问管理后台、规则引擎、审核发布和 Excel 交付。

## 快速启动

```bash
npm install
npm run dev
```

用户网页：`http://localhost:5174`；管理后台：`http://localhost:5173`。未配置数据库时 API 使用内置演示数据；本地短信验证码固定为 `246810`。

微信端：`npm run dev:mini` 后，用微信开发者工具导入 `apps/mini`，构建目录为 `dist`。

## PostgreSQL 模式

数据库密码：jianheng001

```bash
docker compose up -d
cp .env.example .env
npm run dev
```

生产环境应替换 JWT 密钥、接入微信 `code2Session` 和手机号解密服务，并将下载文件适配器替换为对象存储签名 URL。

## 演示身份

- 管理员：`x-role: admin`
- 顾问：`x-role: consultant`
- 客户：`x-role: customer`，并传 `x-user-id: customer-1`

后台开发环境通过身份切换器自动添加请求头。所有服务端权限均独立校验，界面隐藏不作为权限控制。

我新建了一个线上supabase数据库。想要存储用户账号密码手机号用户登录功能是否和个人建馆项目信息。
