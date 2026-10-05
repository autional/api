# api

`api.autional.com` 的**对外后端入口**（Vercel 项目 `api`）。与 `api.autional.cn`（项目 `cn-api`）同构。

本仓**不含任何业务代码**，只承载一个反向代理配置。

## 职责

```
浏览器 -> <portal>.autional.com/bff        （各 app 同域代理）
       -> api.autional.com/bff             （本仓：Vercel rewrite）
       -> ${API_ORIGIN}/bff                （内部源站，原样转发、无路径前缀）
       -> 后端实例
```

- 对外唯一后端域名 = **`api.autional.com`**（Vercel，境外）
- 内部源站 = 环境变量 `API_ORIGIN`；环境区分由源站域名承担
- 门户身份由前端 `X-Entry-Plane` 头携带

## 内容

| 文件 | 说明 |
|---|---|
| `vercel.ts` | 4 条 rewrite：`/bff`、`/api/v1`、`/oauth`、`/.well-known` -> `${API_ORIGIN}/...` |
| `package.json` | 仅依赖 `@vercel/config` |
| `public/index.html` | 根路径占位页（`noindex`） |
| `LICENSE` | AGPL-3.0 |

## 配置

**源站地址不入仓**，由环境变量提供：

| 变量 | 作用域 | 示例值 |
|---|---|---|
| `API_ORIGIN` | Production / Preview / Development | `https://<origin-host>`（内部源站） |

未设置时 `vercel.ts` **故意抛错**（fail-closed），构建失败。

> ⚠️ `vercel.json` 不支持环境变量插值，故用 Vercel 官方 `vercel.ts`（build-time 动态配置）。二者只能存在一个。
