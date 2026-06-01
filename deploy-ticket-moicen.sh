#!/bin/bash
# upctl-web 部署到 ticket.moicen.com（测试服）
# 用法：./deploy-ticket-moicen.sh
# 必须：moicen.com 可 SSH 免密登录，本地已安装 Node.js 20+

set -euo pipefail

TARGET_HOST="weli@moicen.com"
REMOTE_DIR="/usr/local/openresty/nginx/html/ticket"

# ---- 1. 环境变量（固定，防止微信登录回退） ----
export VITE_HOST="ticket.moicen.com"
export VITE_WX_APP="wx4c6a0a85d5fc6107"
export VITE_WX_REDIRECT_HOST="teacher.moicen.com"

echo "=== 1. 构建 upctl-web ==="
cd "$(dirname "$0")"
npx vite build

echo ""
echo "=== 2. 验证产物 ==="
# 确认微信 appid 已注入
if ! grep -q "wx4c6a0a85d5fc6107" dist/assets/LoginView-*.js; then
  echo "❌ 错误：VITE_WX_APP 未注入！产物中找不到微信 appid。"
  echo "   请检查环境变量是否在构建前设置了。"
  exit 1
fi
echo "✅ 微信 appid 已注入"

# 确认产物是 upctl-web（不是 htyts-web 误部署）
if ! grep -q "工单\|ticket\|ticket" dist/index.html; then
  echo "❌ 错误：dist/index.html 不像是 upctl-web 产物（缺少 'ticket' 关键字）"
  echo "   可能是其他前端项目被误构建到此目录。"
  exit 1
fi
echo "✅ 产物归属确认（upctl-web）"

echo ""
echo "=== 3. 部署到 moicen ==="
rsync -avz --delete dist/ "$TARGET_HOST:$REMOTE_DIR/"

echo ""
echo "=== 4. 重载 nginx ==="
ssh "$TARGET_HOST" 'sudo openresty -t && sudo openresty -s reload && echo "NGINX OK"'

echo ""
echo "=== 5. Smoke test ==="
sleep 2
STATUS=$(curl -sI --noproxy '*' --connect-timeout 5 "https://ticket.moicen.com/login" 2>&1 | head -1)
echo "  HTTP: $STATUS"
HTML=$(curl -s --noproxy '*' --connect-timeout 5 "https://ticket.moicen.com/" 2>&1 | grep -c "wx4c6a0a85d5fc6107" || true)
if [ "$HTML" -gt 0 ]; then
  echo "  ✅ 微信 appid 可在页面中找到"
else
  echo "  ⚠️  微信 appid 未在 HTML 中直接可见（可能 minified 嵌入 JS 中，LoginView-*.js 已确认包含）"
fi

echo ""
echo "=== 部署完成 ✅ ==="
