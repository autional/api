# api

`api.autional.com` / `api.autional.cn` 的**对外后端入口**（Vercel 项目 `api` / `cn-api`；同源双区：同一份代码、两个项目按环境变量分区域）。

本仓**不含任何业务代码**，只承载一个反向代理配置。

## 职责

```
浏览器 -> <portal>.autional.<tld>/bff        （各 app 同域代理）
       -> api.autional.<tld>/bff             （本仓：Vercel rewrite）
       -> ${API_ORIGIN}/bff                  （内部源站，原样转发、无路径前缀）
       -> 后端实例
```

- 对外唯一后端域名 = **`api.autional.com`**（项目 `api`）/ **`api.autional.cn`**（项目 `cn-api`）
- 内部源站 = 环境变量 `API_ORIGIN`；环境区分由源站域名承担
- 区域 issuer = 环境变量 `API_ISSUER`（边缘注入 `X-Autional-Issuer`）
- 门户身份由前端 `X-Entry-Plane` 头携带

## 内容

| 文件 | 说明 |
|---|---|
| `vercel.ts` | 6 条 rewrite：`/bff`、`/api/v1`、`/oauth`、`/ready`、`/.well-known` -> `${API_ORIGIN}/...` |
| `package.json` | 仅依赖 `@vercel/config` |
| `public/index.html` | 根路径占位页（`noindex`） |
| `LICENSE` | AGPL-3.0 |

## 配置

**区域相关值不入仓**，由各项目环境变量提供：

| 变量 | 作用域 | 示例值 |
|---|---|---|
| `API_ORIGIN` | Production / Preview / Development | `https://<origin-host>`（内部源站） |
| `API_ISSUER` | Production / Preview / Development | `https://api.autional.com` / `https://api.autional.cn`（区域 issuer） |

未设置时 `vercel.ts` **故意抛错**（fail-closed），构建失败。

> ⚠️ `vercel.json` 不支持环境变量插值，故用 Vercel 官方 `vercel.ts`（build-time 动态配置）。二者只能存在一个。

## 约定

- `/ready`：status 站网关健康聚合探针入口（站点侧 rewrite 指向本区域 api 入口的 `/ready`；缺此条则打回 Vercel 404 —— status 内容审计 V-01 的代理断点）。
- 改动本仓 = 改本区域 `api.autional.<tld>` 的代理行为；改完 push 即自动部署（两区域项目各自监听本仓 main）。

## per-tenant discovery rewrite 约定（2026-10-06）

- 形如 `/<slug>/.well-known/<path>` 的转发，**不要**用 path-to-regexp 的「首段动态参数 + `:path*`」写法
  （`routes.rewrite('/:slug/.well-known/:path*', ...)`）——**本环境实测 Vercel 不匹配**，一律 404。
- **正确写法 = 正则源 + 反向引用**：
  `routes.rewrite('^/([^/]+)/[.]well-known/(.*)$', `${ORIGIN}/$1/.well-known/$2`)`
- 根级协议坐标仍用普通前缀匹配：`routes.rewrite('/.well-known/:path*', ...)`。
