# upctl-web

工单管理 Web 端 — 基于 Vue 3 + TypeScript + Vite 的开源工单管理系统。

## 功能

- 微信扫码登录 / unionid 登录
- 工单列表（待处理 / 已关闭 / 全部筛选）
- 工单详情（评论展示、回复、图片上传）

## 技术栈

- Vue 3 + TypeScript + Vue Router
- Vite (构建工具)
- Axios (HTTP 客户端)
- Dayjs (日期处理)

## 开发

```bash
pnpm install
pnpm run dev:moicen  # 开发模式 (moicen 测试环境)
```

## 构建

```bash
pnpm run build:moicen  # moicen 测试环境构建
```

## 部署

构建产物在 `dist/` 目录，部署到 Web 服务器（如 Nginx / OpenResty）。

Nginx 配置要点：
- `/` → 静态文件
- `/api/v1/uc/` → 反代到 AuthCore 服务
- `/api/v2/ts/` → 反代到 htyts 服务

## License

MIT
