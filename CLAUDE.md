# upctl-web 工单管理 Web 端

## 构建与部署

**构建命令**（必填环境变量）：
```
VITE_HOST=ticket.moicen.com VITE_WX_APP=wx4c6a0a85d5fc6107 VITE_WX_REDIRECT_HOST=teacher.moicen.com npx vite build
```

- `VITE_UC_SERVER` 和 `VITE_TS_SERVER` 不设置时默认为空（同域请求），生产环境不应设置
- **禁止** 不带环境变量直接运行 `npx vite build`，否则 API 请求会指向错误的地址

**部署**：`rsync -avz dist/ weli@moicen.com:/usr/local/openresty/nginx/html/ticket/`

**版本号**：每次部署前递增 `src/App.vue` 中的 `deploy_ver=YYYYMMDD.NNN`

## Nginx 代理

- `/api/v1/uc/` → `127.0.0.1:3000` (AuthCore)
- `/api/v2/ts/` → `127.0.0.1:3003` (htyts)
- `/api/v2/upctl/api/` → `127.0.0.1:3005` (upctl-svc)

## 路由

- `/` → TicketList
- `/tickets/:number` → TicketDetail
- `/tickets/new` → CreateTicket
- `/login` → LoginView (微信扫码 / unionid 开发模式)
- `/wx-login` → WxLoginView (微信回调)
