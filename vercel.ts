import { routes, type VercelConfig } from '@vercel/config/v1';

/**
 * 对外后端入口 `api.autional.com` / `api.autional.cn` 的唯一源站（同源双区，同一份代码）。
 *
 * 区域相关值 **不写入本仓**，取自 Vercel 项目环境变量
 * （Project -> Settings -> Environment Variables）：
 *   `API_ORIGIN` —— 内部源站
 *   `API_ISSUER` —— 区域 issuer（边缘注入 X-Autional-Issuer）
 * 未设置时 **故意抛错**（fail-closed），避免静默产出坏路由。
 */
const rawOrigin = process.env.API_ORIGIN;

if (!rawOrigin) {
  throw new Error(
    '[api] 缺少环境变量 API_ORIGIN（Vercel 项目设置里配置后重新部署）',
  );
}

const ORIGIN = rawOrigin.replace(/\/+$/, '');

/** 区域 issuer：边缘注入 X-Autional-Issuer（方案③）。 */
const rawIssuer = process.env.API_ISSUER;

if (!rawIssuer) {
  throw new Error(
    '[api] 缺少环境变量 API_ISSUER（Vercel 项目设置里配置后重新部署）',
  );
}

const ISSUER = rawIssuer.replace(/\/+$/, '');

/** 边缘共享密钥（2026-10-27）：用于让香港入口区分「Vercel 回源」与「公网直连」。 */
const rawEdgeToken = process.env.EDGE_TOKEN;

if (!rawEdgeToken) {
  throw new Error(
    '[api] 缺少环境变量 EDGE_TOKEN（Vercel 项目设置里配置后重新部署）',
  );
}

const EDGE_TOKEN = rawEdgeToken.trim();

/**
 * 区域 issuer + 边缘密钥：香港入口仅在 X-Edge-Token 匹配时才采信 XFF 与 issuer，
 * 不匹配的一律剥掉（防公网直连伪造来源 IP / 伪造 issuer）。
 */
const edgeHeaders = () => ({
  requestHeaders: { 'X-Autional-Issuer': ISSUER, 'X-Edge-Token': EDGE_TOKEN },
});

// 注：per-tenant discovery（正则 rewrite）目前不支持附带 requestHeaders（实测加上即 404），
// 故该条不带 X-Edge-Token；香港入口对它按「直连」处理（不采信 XFF / 不注入 issuer）。

/**
 * 7 条 rewrite：把对外入口的路径原样转发到源站（无路径前缀）。
 * `/ready`：status 站网关健康聚合探针（站点侧 rewrite 指到本区域 api 入口 `/ready`，
 * 缺此条则打回 Vercel 404 —— status 内容审计 V-01 的代理断点）。
 * `/health`：liveness 探针。与 `api.autional.cn` 香港入口的白名单对齐——
 * 两区对外契约必须同名同语义，不接受「一边有一边没有」的不对称。
 */
export const config: VercelConfig = {
  rewrites: [
    routes.rewrite('/bff/:path*', `${ORIGIN}/bff/:path*`, edgeHeaders),
    routes.rewrite('/api/v1/:path*', `${ORIGIN}/api/v1/:path*`, edgeHeaders),
    routes.rewrite('/oauth/:path*', `${ORIGIN}/oauth/:path*`, edgeHeaders),
    routes.rewrite('/ready', `${ORIGIN}/ready`, edgeHeaders),
    routes.rewrite('/health', `${ORIGIN}/health`, edgeHeaders),
    routes.rewrite('/.well-known/:path*', `${ORIGIN}/.well-known/:path*`, edgeHeaders),
    routes.rewrite('^/([^/]+)/[.]well-known/(.*)$', `${ORIGIN}/$1/.well-known/$2`),
  ],
};
