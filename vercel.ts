import { routes, type VercelConfig } from '@vercel/config/v1';

/**
 * 对外后端入口 `api.autional.com` 的唯一源站。
 *
 * 值 **不写入本仓**，取自 Vercel 项目环境变量 `API_ORIGIN`
 * （Project -> Settings -> Environment Variables）。
 * 未设置时 **故意抛错**（fail-closed），避免静默产出坏路由。
 *
 * 与 `api.autional.cn`（Vercel 项目 `cn-api`）同构；`.com` 为境外，不涉及 ICP。
 * 过渡期内部源站在 Vercel 里配置（示例见 README）。
 */
const rawOrigin = process.env.API_ORIGIN;

if (!rawOrigin) {
  throw new Error(
    '[api] 缺少环境变量 API_ORIGIN（Vercel 项目设置里配置后重新部署）',
  );
}

const ORIGIN = rawOrigin.replace(/\/+$/, '');

/** 区域 issuer：边缘注入 X-Autional-Issuer（方案③）。 */
const ISSUER = 'https://api.autional.com';
const withIssuer = () => ({ requestHeaders: { 'X-Autional-Issuer': ISSUER } });

/** 4 条 rewrite：把对外入口的路径原样转发到源站（无路径前缀）。 */
export const config: VercelConfig = {
  rewrites: [
    routes.rewrite('/bff/:path*', `${ORIGIN}/bff/:path*`, withIssuer),
    routes.rewrite('/api/v1/:path*', `${ORIGIN}/api/v1/:path*`, withIssuer),
    routes.rewrite('/oauth/:path*', `${ORIGIN}/oauth/:path*`, withIssuer),
    routes.rewrite('/.well-known/:path*', `${ORIGIN}/.well-known/:path*`, withIssuer),
  ],
};
