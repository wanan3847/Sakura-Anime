<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Sakura Anime 项目约定

## 核心数据流
CMS API (bfzyapi/ffzyapi/zuidapi/wujin/lzi)
  → 爬虫 (crawlAll/crawlQuick) → 本地 SQLite (AnimeCatalog)
    → 目录/排行榜/排期选番 从本地读
  → 播放时 /api/anime/{id} 实时查所有 CMS API (多源并发聚合)

## 关键文件
- `src/lib/api.ts` — CMS 聚合：5 个源，按名称搜索合并播放线路
- `src/lib/play-source.ts` — 纯函数播放源解析（不含 Prisma 导入，可安全用于客户端组件）
- `src/lib/crawler.ts` — 采集器：只爬日本动漫（area=日本），存 vodTime
- `src/app/api/catalog/route.ts` — 本地目录查询
- `src/app/api/admin/crawl/route.ts` — 爬虫触发
- `src/app/api/auth/password/route.ts` — 修改密码

## 构建注意事项
- **macOS Apple Silicon**：`npm run dev` 已默认配置 `--webpack`，Turbopack 不支持 arm64
- **Standalone 构建**：`npm run build` 后必须执行 `cp -r .next/static .next/standalone/.next/`，否则 JS/CSS 返回 404
- **Turbopack 构建失败**：如果报 `node:module` 相关错误，检查客户端组件是否直接或间接导入了 Prisma。纯函数应放在 `play-source.ts` 等不含服务端导入的文件中
- **服务器启动**：必须设置 `HOSTNAME=0.0.0.0`，否则报 `getaddrinfo ENOTFOUND`
- **端口**：默认 3001（非 3000）
- **权限校验**：爬虫 API key 通过 `CRAWL_API_KEY` 环境变量配置，管理员登录后通过 session 验证

## 运营相关
- **每日同步**：服务器 crontab 每天凌晨 5:00 执行 quick crawl
- **数据库备份**：服务器 crontab 每天凌晨 3:00 备份 SQLite 到 backups/ 目录
- **deploy**：参考 DEPLOY.md，使用 Cloudflare Tunnel 不需要开放端口
