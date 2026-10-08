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
const withIssuer = () => ({ requestHeaders: { 'X-Autional-Issuer': ISSUER } });

/**
 * 6 条 rewrite：把对外入口的路径原样转发到源站（无路径前缀）。
 * `/ready`：status 站网关健康聚合探针（站点侧 rewrite 指到本区域 api 入口 `/ready`，
 * 缺此条则打回 Vercel 404 —— status 内容审计 V-01 的代理断点）。
 */
export const config: VercelConfig = {
  rewrites: [
    routes.rewrite('/bff/:path*', `${ORIGIN}/bff/:path*`, withIssuer),
    routes.rewrite('/api/v1/:path*', `${ORIGIN}/api/v1/:path*`, withIssuer),
    routes.rewrite('/oauth/:path*', `${ORIGIN}/oauth/:path*`, withIssuer),
    routes.rewrite('/ready', `${ORIGIN}/ready`, withIssuer),
    routes.rewrite('/.well-known/:path*', `${ORIGIN}/.well-known/:path*`, withIssuer),
    routes.rewrite('^/([^/]+)/[.]well-known/(.*)$', `${ORIGIN}/$1/.well-known/$2`),
  ],
};
