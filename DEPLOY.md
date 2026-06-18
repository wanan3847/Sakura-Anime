# 部署攻略 — 樱花动漫到服务器

本文档指导你将樱花动漫部署到自己的服务器，并通过 Cloudflare 配置域名和 HTTPS。

---

## 目录

1. [服务器要求](#1-服务器要求)
2. [环境准备](#2-环境准备)
3. [部署项目](#3-部署项目)
4. [配置数据库](#4-配置数据库)
5. [Cloudflare Tunnel](#5-cloudflare-tunnel推荐无需开放端口)
6. [启动服务（PM2）](#6-启动服务pm2)
7. [每日自动同步](#7-每日自动同步)
8. [更新项目](#8-更新项目)
9. [故障排查](#9-故障排查)

---

## 1. 服务器要求

| 项目 | 最低配置 | 推荐配置 |
|------|---------|---------|
| CPU | 1 核 | 2 核 |
| 内存 | 1 GB | 2 GB |
| 硬盘 | 10 GB | 20 GB |
| 系统 | Ubuntu 20.04+ / Debian 11+ | Ubuntu 22.04 |
| Node.js | 18.x | 20.x LTS |
| 域名 | 海外服务器 | 已接入 Cloudflare |

---

## 2. 环境准备

### 2.1 安装 Node.js

```bash
# 安装 Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt-get install -y nodejs

# 验证
node -v    # 应输出 v20.x
npm -v     # 应输出 10.x
```

### 2.2 安装 PM2（进程管理）

```bash
sudo apt-get update
sudo apt-get install -y nginx

# 验证
nginx -v
sudo systemctl enable nginx
sudo systemctl start nginx
```

> **注意**：如果用 Cloudflare Tunnel 则不需要 Nginx，跳过此步。

### 2.3 安装 Cloudflare Tunnel（推荐）

```bash
# 安装 cloudflared
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
chmod +x /usr/local/bin/cloudflared

# 验证
cloudflared version
```

### 2.4 安装 PM2（进程管理）

```bash
sudo npm install -g pm2

# 验证
pm2 -v
```

---

## 3. 部署项目

### 3.1 上传或克隆项目

```bash
# 方式 A：从 GitHub 克隆（推荐）
git clone https://github.com/your-username/sakura-anime.git /var/www/sakura-anime
cd /var/www/sakura-anime

# 方式 B：从本地打包上传
# 本地执行：tar czf sakura-anime.tar.gz sakura-anime-main
# scp sakura-anime.tar.gz root@你的服务器IP:/var/www/
# ssh 到服务器后：cd /var/www && tar xzf sakura-anime.tar.gz
```

### 3.2 安装依赖

```bash
cd /var/www/sakura-anime
npm install --production
# 如果构建需要 devDependencies：
npm install
```

### 3.3 配置环境变量

```bash
cd /var/www/sakura-anime
cp .env.example .env   # 如果没有示例文件则手动创建
nano .env
```

写入以下内容（按实际情况修改）：

```env
# 数据库 - 使用绝对路径
DATABASE_URL="file:/var/www/sakura-anime/prisma/dev.db"

# 认证密钥（改为随机字符串）
NEXTAUTH_SECRET="your-random-secret-here-change-me"
NEXTAUTH_URL="https://你的域名.com"

# CMS 采集源
ANIME_API_URL="https://bfzyapi.com/api.php/provide/vod/"
ANIME_API_BACKUP_URL="https://api.zuidapi.com/api.php/provide/vod/"
ANIME_API_WUJIN_URL="https://api.wujinapi.me/api.php/provide/vod/"
ANIME_API_LZI_URL="https://cj.lziapi.com/api.php/provide/vod/"
ANIME_API_FFZY_URL="https://cj.ffzyapi.com/api.php/provide/vod/"

# 管理员账号
ADMIN_EMAIL="admin@sakura-anime.com"
ADMIN_PASSWORD="设置一个强密码"

# 爬虫 API key（用于免登录触发数据同步）
CRAWL_API_KEY="your-crawl-api-key"

# 生产模式
NODE_ENV="production"
```

> **重要**：`NEXTAUTH_SECRET` 必须改为随机字符串，可以用 `openssl rand -base64 32` 生成。
> `ADMIN_PASSWORD` 请设置强密码。

### 3.4 构建项目

```bash
cd /var/www/sakura-anime

# 同步数据库
npx prisma db push

# 初始化种子数据（管理员账号 + 默认视频源）
npx tsx prisma/seed.ts

# 构建
npm run build

# 复制静态文件到 standalone 目录（重要：Next.js standalone 模式必需，否则 JS/CSS 返回 404）
cp -r .next/static .next/standalone/.next/
```

### 3.5 首次爬取数据

启动临时服务来爬取数据：

```bash
# 先启动服务
node .next/standalone/server.js &
sleep 5

# 执行全量爬取
curl -X POST http://localhost:3001/api/admin/crawl \
  -H "Content-Type: application/json" \
  -d '{"key":"'"$CRAWL_API_KEY"'"}'

# 等待爬取完成（大概 3-5 分钟），然后杀掉临时进程
kill %1
```

---

## 4. 配置数据库

本项目使用 SQLite，无需额外安装数据库服务。数据库文件位于 `prisma/dev.db`。

### 数据备份（重要）

```bash
# 手动备份
cp /var/www/sakura-anime/prisma/dev.db /var/www/sakura-anime/prisma/dev.db.backup

# 定时备份（每天凌晨 3 点）
crontab -e
# 添加一行：
0 3 * * * cp /var/www/sakura-anime/prisma/dev.db /var/www/sakura-anime/backups/dev.db.$(date +\%Y\%m\%d)
```

---

## 5. Cloudflare Tunnel（推荐，无需开放端口）

使用 Cloudflare Tunnel 代替 Nginx 反代，不需要开放 80/443 端口，更安全。

### 5.1 登录 Cloudflare

```bash
cloudflared tunnel login
```

按提示在浏览器登录你的 Cloudflare 账号，选择你的域名（`你的域名.com`）。

### 5.2 创建 Tunnel

```bash
cloudflared tunnel create sakura-anime
```

会生成一个 Tunnel ID，记住它。同时会在 `~/.cloudflared/` 下生成一个 JSON 凭证文件。

### 5.3 配置 Tunnel

```bash
nano ~/.cloudflared/config.yml
```

写入：

```yaml
tunnel: 你的TunnelID
credentials-file: /root/.cloudflared/你的TunnelID.json

ingress:
  - hostname: 你的域名.com
    service: http://localhost:3001
  - service: http_status:404
```

### 5.4 配置 DNS

```bash
cloudflared tunnel route dns sakura-anime 你的域名.com
```

### 5.5 启动 Tunnel（作为系统服务）

```bash
cloudflared tunnel install sakura-anime
systemctl start cloudflared
systemctl enable cloudflared

# 查看状态
systemctl status cloudflared
```

### 5.6 验证

```bash
curl -s http://localhost:3001/ | head -c 100
curl -s https://你的域名.com/ | head -c 100
```

两个都应该返回 HTML 内容。

---

## 6. 启动服务（PM2）

### 6.1 启动

```bash
cd /var/www/sakura-anime

# 启动（必须设置环境变量）
NEXTAUTH_URL="https://你的域名.com" \
CRAWL_API_KEY="your-crawl-api-key" \
pm2 start .next/standalone/server.js --name sakura-anime --env "PORT=3001" --env "HOSTNAME=0.0.0.0"

# 或一行版：
NEXTAUTH_URL="https://你的域名.com" CRAWL_API_KEY="your-crawl-api-key" pm2 start .next/standalone/server.js --name sakura-anime --env "PORT=3001" --env "HOSTNAME=0.0.0.0"

# 保存 PM2 配置（重启后自动恢复）
pm2 save
pm2 startup  # 按提示执行命令
```

> **注意**：如果不设置 `HOSTNAME=0.0.0.0`，服务器可能会尝试解析主机名失败导致启动报错。

查看状态：

```bash
pm2 status              # 查看状态
pm2 logs sakura-anime   # 查看日志
pm2 monit               # 实时监控
```

### 6.3 重启

```bash
pm2 restart sakura-anime
```

---

## 7. 每日自动同步

### 7.1 Hermes Cron（如果使用 Hermes）

如果你在服务器上也运行 Hermes Agent，直接用之前配置的 cron（每天 5AM）：

```
名称: Sakura Anime 每日同步
定时: 0 5 * * *
执行: curl -X POST http://localhost:3001/api/admin/crawl?quick=true -H "Content-Type: application/json" -d '{"key":"$CRAWL_API_KEY"}'
```

### 7.2 Linux Cron（不依赖 Hermes）

如果不用 Hermes，直接在服务器上配 cron：

```bash
crontab -e
# 添加：
0 5 * * * curl -s -X POST http://localhost:3001/api/admin/crawl?quick=true -H "Content-Type: application/json" -d '{"key":"$CRAWL_API_KEY"}' >> /var/log/sakura-crawl.log 2>&1
```

---

## 8. 更新项目

```bash
cd /var/www/sakura-anime

# 拉取最新代码（国内服务器建议用 SSH 或加超时）
git pull --timeout=120
# 或用 SSH：git remote set-url origin git@github.com:你的用户名/sakura-anime.git

# 安装依赖
npm install

# 同步数据库
npx prisma db push

# 构建
npm run build

# 复制静态文件到 standalone 目录（重要：Next.js standalone 模式必需，否则 JS/CSS 返回 404）
cp -r .next/static .next/standalone/.next/

# 重启服务
pm2 restart sakura-anime
```

---

## 9. 故障排查

### 502 Bad Gateway / 网站无法访问

1. 检查 Next.js 服务是否正常运行：

   ```bash
   pm2 status
   pm2 logs sakura-anime --lines 50
   ```

2. 检查 Cloudflare Tunnel 状态：

   ```bash
   systemctl status cloudflared
   journalctl -u cloudflared --no-pager -n 20
   ```

3. 确认 Tunnel 配置正确（`~/.cloudflared/config.yml`）：
   - `service: http://localhost:3001`（注意是 `http` 不是 `https`）
   - hostname 写对了域名

4. 重启 Tunnel：

   ```bash
   systemctl restart cloudflared
   ```

### 数据库被锁定

```bash
# 检查是否有其他进程占用
lsof prisma/dev.db

# 重启服务释放锁
pm2 restart sakura-anime
```

### 视频无法播放

1. 检查 CMS API 是否可达：

   ```bash
   curl -s --max-time 5 "https://bfzyapi.com/api.php/provide/vod/?ac=list&t=41&pg=1&pagesize=1"
   ```

2. 检查 `/api/proxy` 是否正确配置了 Referer

3. 如果 Tunnel 代理了视频流，检查 Cloudflare Zero Trust 面板中是否开启了 **HTTP/2** 和 **WebSocket**（播放器需要 WebSocket 支持）

### 内存不足

```bash
# 查看内存使用
free -h

# 限制 PM2 内存
pm2 restart sakura-anime --max-memory-restart 500M
```

### 域名无法访问

1. 检查 Tunnel 是否运行：`systemctl status cloudflared`
2. 检查 DNS 是否生效：`dig 你的域名.com`
3. 检查 Tunnel 日志：`journalctl -u cloudflared --no-pager -n 30`
