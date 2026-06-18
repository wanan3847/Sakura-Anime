# 部署攻略 — 樱花动漫到服务器

本文档指导你将樱花动漫部署到自己的服务器，并通过 Cloudflare 配置域名和 HTTPS。

---

## 目录

1. [服务器要求](#1-服务器要求)
2. [环境准备](#2-环境准备)
3. [部署项目](#3-部署项目)
4. [配置数据库](#4-配置数据库)
5. [Nginx 反向代理](#5-nginx-反向代理)
6. [Cloudflare 配置](#6-cloudflare-配置)
7. [启动服务（PM2）](#7-启动服务pm2)
8. [每日自动同步](#8-每日自动同步)
9. [更新项目](#9-更新项目)
10. [故障排查](#10-故障排查)

---

## 1. 服务器要求

| 项目 | 最低配置 | 推荐配置 |
|------|---------|---------|
| CPU | 1 核 | 2 核 |
| 内存 | 1 GB | 2 GB |
| 硬盘 | 10 GB | 20 GB |
| 系统 | Ubuntu 20.04+ / Debian 11+ | Ubuntu 22.04 |
| Node.js | 18.x | 20.x LTS |
| 域名 | 已备案或海外 | 已接入 Cloudflare |

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

### 2.2 安装 Nginx

```bash
sudo apt-get update
sudo apt-get install -y nginx

# 验证
nginx -v
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 2.3 安装 PM2（进程管理）

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
```

### 3.5 首次爬取数据

启动临时服务来爬取数据：

```bash
# 先启动服务
node .next/standalone/server.js &
sleep 5

# 执行全量爬取
curl -X POST http://localhost:3000/api/admin/crawl \
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

## 5. Nginx 反向代理

创建 Nginx 配置文件：

```bash
sudo nano /etc/nginx/sites-available/sakura-anime
```

写入：

```nginx
server {
    listen 80;
    server_name 你的域名.com www.你的域名.com;

    # 重定向到 HTTPS（Cloudflare 会自动处理 SSL）
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name 你的域名.com www.你的域名.com;

    # SSL 证书由 Cloudflare 管理（见下一节）
    # 如果使用 Cloudflare Full SSL，可以不用本地证书
    # 这里用 self-signed 让 Nginx 能启动
    ssl_certificate /etc/nginx/ssl/self-signed.crt;
    ssl_certificate_key /etc/nginx/ssl/self-signed.key;

    # 如果使用 Cloudflare Full (Strict)，去掉上面两行，用下面：
    # ssl_certificate /etc/ssl/cf-cert.pem;
    # ssl_certificate_key /etc/ssl/cf-key.pem;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 超时设置（视频流需要较长时间）
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
    }

    # 静态资源缓存
    location /_next/static {
        proxy_pass http://127.0.0.1:3000;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    location /uploads {
        proxy_pass http://127.0.0.1:3000;
        expires 30d;
    }
}
```

生成自签名证书（用于 Cloudflare Full 模式，见下一节）：

```bash
sudo mkdir -p /etc/nginx/ssl
sudo openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/self-signed.key \
  -out /etc/nginx/ssl/self-signed.crt \
  -subj "/CN=your-domain.com"
```

启用配置：

```bash
sudo ln -sf /etc/nginx/sites-available/sakura-anime /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 6. Cloudflare 配置

### 6.1 添加域名到 Cloudflare

1. 在 Cloudflare 添加你的域名
2. 将域名的 NS 记录改为 Cloudflare 提供的 DNS 服务器
3. 等待生效（通常几分钟到 48 小时）

### 6.2 配置 DNS 记录

在 Cloudflare DNS 设置中添加：

| 类型 | 名称 | 内容 | 代理 |
|------|------|------|------|
| A | @ | 你的服务器 IP | 开启（橙色云） |
| A | www | 你的服务器 IP | 开启（橙色云） |

> **重要**：必须开启代理（橙色云），这样 Cloudflare 才能提供 SSL 和缓存加速。

### 6.3 SSL/TLS 设置

在 Cloudflare SSL/TLS 面板中：

- **SSL/TLS encryption mode**：选择 **Full**（不需要上传证书到服务器）
- **Always Use HTTPS**：开启
- **Automatic HTTPS Rewrites**：开启
- **Minimum TLS Version**：TLS 1.2

> 如果 Nginx 配置了自签名证书，Cloudflare Full 模式可以接受。如果选 Full (Strict) 则需要上传真实证书。

### 6.4 可选：缓存优化

在 Cloudflare 的 Caching 面板：

- **Caching Level**：Standard
- **Browser Cache TTL**：4 hours
- 添加 Page Rule：
  - URL: `你的域名.com/_next/static/*`
  - Cache Level: Cache Everything
  - Edge Cache TTL: 30 days

---

## 7. 启动服务（PM2）

### 7.1 启动

```bash
cd /var/www/sakura-anime

# 方式 A：直接启动 Next.js standalone 模式（推荐）
pm2 start .next/standalone/server.js --name sakura-anime

# 方式 B：或者使用 npm start
# pm2 start npm --name sakura-anime -- start

# 保存 PM2 配置（重启后自动恢复）
pm2 save
pm2 startup  # 按提示执行命令
```

### 7.2 查看状态

```bash
pm2 status              # 查看状态
pm2 logs sakura-anime   # 查看日志
pm2 monit               # 实时监控
```

### 7.3 重启

```bash
pm2 restart sakura-anime
```

---

## 8. 每日自动同步

### 8.1 Hermes Cron（如果使用 Hermes）

如果你在服务器上也运行 Hermes Agent，直接用之前配置的 cron（每天 5AM）：

```
名称: Sakura Anime 每日同步
定时: 0 5 * * *
执行: curl -X POST http://localhost:3000/api/admin/crawl?quick=true -H "Content-Type: application/json" -d '{"key":"$CRAWL_API_KEY"}'
```

### 8.2 Linux Cron（不依赖 Hermes）

如果不用 Hermes，直接在服务器上配 cron：

```bash
crontab -e
# 添加：
0 5 * * * curl -s -X POST http://localhost:3000/api/admin/crawl?quick=true -H "Content-Type: application/json" -d '{"key":"$CRAWL_API_KEY"}' >> /var/log/sakura-crawl.log 2>&1
```

---

## 9. 更新项目

```bash
cd /var/www/sakura-anime

# 拉取最新代码
git pull

# 安装依赖
npm install

# 同步数据库
npx prisma db push

# 重新构建
npm run build

# 重启服务
pm2 restart sakura-anime
```

---

## 10. 故障排查

### 502 Bad Gateway

Nginx 连不上 Next.js 服务：

```bash
# 检查 Next.js 是否运行
pm2 status

# 查看日志
pm2 logs sakura-anime --lines 50

# 重启
pm2 restart sakura-anime
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

3. 检查 Cloudflare 没有代理视频流（如果 CDN 拦截了流媒体，在 Cloudflare 关掉代理或配置规则）

### 内存不足

```bash
# 查看内存使用
free -h

# 限制 PM2 内存
pm2 restart sakura-anime --max-memory-restart 500M
```

### 域名无法访问

1. 检查 DNS 是否生效：`dig 你的域名.com`
2. 检查服务器防火墙：`sudo ufw status`
3. 确保 80/443 端口开放：`sudo ufw allow 80/tcp && sudo ufw allow 443/tcp`
4. 检查 Nginx 状态：`sudo systemctl status nginx`
